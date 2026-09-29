"""
Extract all mock-test questions from T.E.T.txt (linear text export of the
question-bank PDF) into data/*.json.

Run:  python scripts/extract_questions_txt.py

This replaces the geometric PDF parser (extract_questions.py) as the primary
converter: the text export keeps every question and option on its own line,
so no text is lost to column layout. sourcePage values are carried over from
the previous PDF-based parse (data/*.json must still exist from an earlier
run of extract_questions.py).

Outputs the same files as before:
    data/index.json, data/<section>.json, data/flagged.json
    scripts/reports/validation.txt, flagged.json
"""

import io
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
TXT_PATH = ROOT / "T.E.T.txt"
KEYS_PATH = ROOT / "answer_keys.json"
OUT_DIR = ROOT / "data"
REPORT_DIR = ROOT / "scripts" / "reports"

SECTION_ORDER = ["cdp", "telugu", "english", "maths", "physics", "biology"]
SECTION_TITLES = {
    "CDP": "cdp", "TELUGU": "telugu", "ENGLISH": "english",
    "MATHEMATICS": "maths", "MATHS": "maths",
    "PHYSICAL SCIENCE": "physics", "PHYSICAL": "physics", "PHYSICS": "physics",
    "BIOLOGY": "biology", "BIO": "biology",
}
EXPECTED = {"cdp": 630, "telugu": 630, "english": 720, "maths": 240, "physics": 240, "biology": 240}
BILINGUAL = {"cdp", "maths", "physics", "biology"}

TE_CHARS = re.compile(r"[\u0C00-\u0C7F]")
GARBLED_CHARS = re.compile(r"[\u0100-\u024F\u0370-\u03FF\u0400-\u04FF]")

PUA_MAP = {"\uf02e": ".", "\uf020": " ", "\uf02d": "-", "\uf02b": "+", "\uf03d": "="}
PUA_ANY = re.compile(r"[\uf000-\uf0ff]")

TITLE_RES = [
    (re.compile(r"^SUBJECT\s*[\u2013-]\s*2A\s*[\u2013-]\s*([A-Z &]+)\s*$"), "group"),
    (re.compile(r"^SUBJECT\s*[\u2013-]\s*([A-Z &]+)\s*[\u2013-]\s*\d+\s*MARKS\s*$"), "group"),
    (re.compile(r"^TET\s*PRACTICE\s*BITS\s*[-\u2013]\s*2A\s+([A-Z &]+)\s*$", re.I), "group"),
    (re.compile(r"^TET\s*BIOLOGY\s*PRACTICE\s*BITS\s*\(2A\)\s*$", re.I), "biology"),
]


def is_title(line):
    for rx, kind in TITLE_RES:
        m = rx.match(line)
        if m:
            name = " ".join((m.group(1) if kind == "group" else kind).upper().split())
            return SECTION_TITLES.get(name)
    return None


KEY_HEADER_RES = [
    re.compile(r"^SUBJECT\s*:"),
    re.compile(r"^PAPER\s*:"),
    re.compile(r"^SL\.?\s*NO\b.*ANS\b"),
    re.compile(r"^ANS\b\s*$"),
]
TICK_RE = re.compile(r"^[\u0013\u00b7\u2022]?\s*([1-4])\s*$")
TICK_GROUP_RE = re.compile(r"^(?:[1-4]\s*){2,6}$")
WATERMARK_RE = re.compile(r"^STU\s*Pedakurapadu(?:\s+\d+)?\s*$", re.I)

QDOT = r"(?<![\d.])(?<!\w){n}\s*[\uf02e.](?!\d)"
QSPACE = r"(?<![\d.\w]){n}\s+(?=[A-Za-z\u201c\"'(_\u2013-\u2015?__])"
OMARK_RE = re.compile(r"(?<![\d.])([1-4])\s*[).](?![\d.])|\(([1-4])\)(?![\d.])")


def normalize(line: str):
    out = []
    for ch in line:
        out.append(PUA_MAP.get(ch, ch if not ("\uf000" <= ch <= "\uf0ff") else ""))
    return "".join(out)


def qmarker(text, expected, mid=False):
    for tpl in (QDOT, QSPACE):
        m = re.search(tpl.replace("{n}", str(expected)), text)
        if m:
            return m.start(), m.end()
    if not mid and re.fullmatch(rf"\s*{expected}[\s.]*", text) and len(text.strip()) <= 6:
        return 0, len(text)
    return None


def try_qstart(text, state, mid=False):
    """Find a question start. Between questions (mid=False) small printed-number
    offsets are tolerated (the source skips/repeats numbers and the key tables
    are positional). Mid-question we only accept the currently expected number
    at the start of the row, so number-like text inside a question can never
    open a phantom question."""
    exp, off = state["qnum"], state.get("numoffset", 0)
    candidates = [off] if mid else list(dict.fromkeys([off, 0, 1, 2]))
    for cand in candidates:
        hit = qmarker(text, exp + cand, mid)
        if hit:
            if mid and hit[0] != 0:
                return None, None, None
            return hit, exp + cand, cand
    return None, None, None


def repeated_start(text, state):
    n = state["qnum"] - 1
    return n >= 1 and bool(re.match(rf"^\s*{n}\s*[\uf02e.](?!\d)", text) or
                           re.match(rf"^\s*{n}\s+(?=[A-Za-z\u201c\"'(_])", text))


def omarker(text, expected):
    for m in OMARK_RE.finditer(text):
        if int(m.group(1) or m.group(2)) == expected:
            return m.start(), m.end()
    return None


def append_option_text(cur, text):
    parts = cur.opt()[0]
    stripped = text.strip()
    # stacked fraction: "77" on the marker row, "210" below
    if (parts and stripped and re.fullmatch(r"\d+", parts[-1].strip())
            and re.fullmatch(r"\d{1,6}", stripped)):
        parts[-1] = parts[-1].strip() + "/" + stripped
    else:
        parts.append(stripped)
    cur.open_opt = False


def split_runs(line, section):
    if section == "english":
        return [("en", line)] if line.strip() else []
    if section == "telugu":
        return [("te", line)] if line.strip() else []
    runs, cur, cur_te = [], [], None
    for ch in line:
        te = bool(TE_CHARS.match(ch))
        if cur_te is None or te == cur_te:
            cur.append(ch)
        else:
            runs.append(("te" if cur_te else "en", "".join(cur)))
            cur = [ch]
        cur_te = te
    if cur:
        runs.append(("te" if cur_te else "en", "".join(cur)))
    return [(lang, t.strip()) for lang, t in runs if t.strip()]


class Question:
    __slots__ = ("number", "printed", "en", "te", "options", "open_opt",
                 "renumber", "no_number", "repeated", "tick")

    def __init__(self, number, printed):
        self.number, self.printed = number, printed
        self.en, self.te = [], []
        self.options = None
        self.open_opt = False
        self.renumber = self.no_number = self.repeated = False
        self.tick = None

    def opt(self):
        return self.options[-1]


def parse(lines, keys, trace_from=None, trace_to=None):
    sections = {sid: [] for sid in SECTION_ORDER}
    ticks = []
    state = {"section": "cdp", "qnum": 1, "cur": None, "keymode": False,
             "numoffset": 0, "flagged_off": None}
    lineno = 0

    def open_question(printed, off_used=0, flag=None):
        cur = Question(state["qnum"], printed)
        if trace_from is not None and trace_from <= lineno <= trace_to:
            print(f"    OPEN #{cur.number} printed={printed} flag={flag} sec={state['section']}")
        if off_used != 0 and off_used != state.get("flagged_off"):
            cur.renumber = True
            state["flagged_off"] = off_used
        if off_used == 0:
            state["flagged_off"] = None
        if flag == "no_number":
            cur.no_number = True
        if flag == "repeated":
            cur.repeated = True
        sections[state["section"]].append(cur)
        state["cur"] = cur
        state["qnum"] += 1
        return cur

    for raw in lines:
        lineno += 1
        line = normalize(raw).strip()
        if not line or WATERMARK_RE.match(line):
            continue
        if trace_from is not None and trace_from <= lineno <= trace_to:
            print(f"TRACE {lineno}: sec={state['section']} qnum={state['qnum']} "
                  f"km={state['keymode']} off={state['numoffset']} | {line[:70]!r}")

        sid = is_title(line)
        if sid:
            if state["section"] != sid:
                state.update(section=sid, qnum=1, cur=None, keymode=False, numoffset=0)
            continue

        tm = TICK_RE.match(line)
        if tm:
            if tm.group(1):
                ticks.append((state["section"], int(tm.group(1))))
            continue
        if TICK_GROUP_RE.match(line):
            for tok in line.split():
                ticks.append((state["section"], int(tok)))
            continue
        if any(rx.match(line) for rx in KEY_HEADER_RES):
            state["keymode"] = True
            continue
        if state["keymode"]:
            if re.fullmatch(r"(?:\d{1,3}\s+)+\d{1,3}", line) or line.isdigit():
                continue
            hit, _, _ = try_qstart(line, state)
            if not hit:
                continue
            state["keymode"] = False  # real question row after a key table

        section = state["section"]
        cur = state["cur"]
        # fraction denominator right after a bare-number option (77 -> 210)
        if (cur is not None and cur.options and cur.open_opt
                and cur.opt()[0] and re.fullmatch(r"\d+", cur.opt()[0][-1])
                and re.fullmatch(r"\d{1,6}", line)):
            cur.opt()[0][-1] += "/" + line
            cur.open_opt = False
            continue
        if re.fullmatch(r"[1-4]", line) and (
            section == "telugu" or cur is None or not cur.open_opt
        ):
            ticks.append((section, int(line)))
            continue

        first_was_te = False
        run_idx = -1
        for lang, run in split_runs(line, section):
            run_idx += 1
            if run_idx == 0 and lang == "te":
                first_was_te = True
            # digits/symbols inside a Telugu sentence belong to the Telugu text
            if (section in BILINGUAL and lang == "en"
                    and (run_idx > 0 or first_was_te)
                    and not re.search(r"[A-Za-z\U0001D400-\U0001D7FF]", run)):
                lang = "te"
            rest = run
            while rest:
                cur = state["cur"]
                if cur is None or (cur.options is not None and len(cur.options) >= 4 and not cur.open_opt):
                    want = "q"
                elif cur.options is None:
                    want = "o1"
                else:
                    want = f"o{len(cur.options) + 1}"

                if want == "q":
                    hit, printed, off_used = try_qstart(rest, state)
                    if hit:
                        state["numoffset"] = off_used
                        cur = open_question(printed, off_used)
                        rest = rest[hit[1]:]
                        continue
                    if re.match(r"^\.\s+\S", rest):
                        cur = open_question(None, flag="no_number")
                        rest = re.sub(r"^\.\s+", "", rest)
                        continue
                    if repeated_start(rest, state):
                        cur = open_question(state["qnum"] - 1, flag="repeated")
                        rest = re.sub(rf"^\s*{state['qnum'] - 2}\s*[\uf02e.]\s*", "", rest)
                        continue
                    if cur is not None and cur.options is not None and len(cur.options) >= 4:
                        # trailing text of a finished 4th option
                        if lang == "te":
                            cur.opt()[1].append(rest)
                            cur.open_opt = False
                        else:
                            append_option_text(cur, rest)
                    break

                hit_o = omarker(rest, int(want[1]))
                hit_q, printed, off_used = try_qstart(rest, state, mid=True)
                # a row starting with BOTH the expected option marker and a
                # question number ("2. dreadful") is an option row: option wins
                if hit_q and hit_o and hit_q[0] == hit_o[0]:
                    hit_q = None
                if hit_q and (not hit_o or hit_q[0] < hit_o[0]):
                    state["numoffset"] = off_used
                    cur = open_question(printed, off_used)
                    rest = rest[hit_q[1]:]
                    continue
                if hit_o:
                    if cur.options is None:
                        cur.options = []
                    cur.options.append([[], []])
                    cur.open_opt = True
                    rest = rest[hit_o[1]:]
                    continue

                if lang == "te":
                    if cur.options is None:
                        cur.te.append(rest)
                    else:
                        cur.opt()[1].append(rest)
                        cur.open_opt = False
                else:
                    if cur.options is None:
                        cur.en.append(rest)
                    else:
                        append_option_text(cur, rest)
                break
    return sections, ticks


def main():
    keys = json.loads(KEYS_PATH.read_text(encoding="utf-8"))["sections"]
    lines = TXT_PATH.read_text(encoding="utf-8").split("\n")
    sections, ticks = parse(lines, keys)

    # carry sourcePage over from the previous PDF-based parse
    old_pages = {}
    for sid in SECTION_ORDER:
        p = OUT_DIR / f"{sid}.json"
        if p.exists():
            for q in json.loads(p.read_text(encoding="utf-8"))["questions"]:
                old_pages[(sid, q["number"])] = q.get("sourcePage")

    OUT_DIR.mkdir(exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    flagged, index, report = [], {"_note": None, "sections": {}}, ["VALIDATION REPORT (T.E.T.txt)", "=" * 60]

    for sid in SECTION_ORDER:
        items, sec_flagged = [], 0
        for q in sections[sid]:
            en = " ".join(q.en).strip() or None
            te = " ".join(q.te).strip() or None
            opts = []
            for oen, ote in (q.options or []):
                opts.append({"en": " ".join(oen).strip() or None, "te": " ".join(ote).strip() or None})
            while len(opts) < 4:
                opts.append({"en": None, "te": None})
            opts = opts[:4]
            ans = keys[sid]["answers"].get(str(q.number))
            reasons = []
            if q.no_number:
                reasons.append("question number missing in print; position inferred from sequence")
            if q.repeated:
                reasons.append("source repeats the previous printed number; position inferred")
            if q.printed is not None and q.printed != q.number and not q.repeated:
                reasons.append(f"source prints this question as #{q.printed}; renumbered positionally")
            if ans is None:
                reasons.append("no answer in answer_keys.json")
            if en is None and te is None:
                reasons.append("empty question text")
            elif sid != "telugu" and en and len(en) < 8:
                reasons.append("very short question text")
            for i, o in enumerate(opts, 1):
                if o["en"] is None and o["te"] is None:
                    reasons.append(f"option {i} empty")
            item = {
                "id": f"{sid}-{q.number:04d}", "section": sid, "number": q.number,
                "question": {"en": en, "te": te}, "options": opts, "answer": ans,
                "image": None,
                "sourcePage": old_pages.get((sid, q.number)),
                "needsReview": False,
            }
            if sid == "telugu":
                raw = " | ".join(x for x in [te] + [o["te"] for o in opts] if x)
                item["question"]["te"] = None
                for o in opts:
                    o["te"] = None
                item["needsReview"] = True
                reasons.append("telugu section: legacy-font text layer corrupted; recover text from source page")
                flagged.append({"id": item["id"], "page": item["sourcePage"], "reasons": reasons,
                                "rawTelugu": raw or None})
                sec_flagged += 1
                items.append(item)
                continue
            blobs = [te or ""] + [o["te"] or "" for o in opts]
            if any(GARBLED_CHARS.search(b) for b in blobs):
                item["needsReview"] = True
                reasons.append("suspicious characters in Telugu (legacy font)")
            if reasons:
                item["needsReview"] = True
                flagged.append({"id": item["id"], "page": item["sourcePage"], "reasons": reasons})
                sec_flagged += 1
            items.append(item)

        numbers = [it["number"] for it in items]
        missing = sorted(set(range(1, EXPECTED[sid] + 1)) - set(numbers))
        dupes = sorted(k for k, v in Counter(numbers).items() if v > 1)
        (OUT_DIR / f"{sid}.json").write_text(
            json.dumps({"section": sid, "name": keys[sid]["name"], "count": len(items),
                        "questions": items}, ensure_ascii=False, indent=1), encoding="utf-8")
        index["sections"][sid] = {"name": keys[sid]["name"], "count": len(items)}
        report.append(f"{sid:8s}: parsed {len(items):4d} / {EXPECTED[sid]:4d} | duplicates {len(dupes)} | missing {len(missing)} | flagged {sec_flagged}")
        if missing:
            report.append(f"          missing: {missing[:50]}")
        if dupes:
            report.append(f"          duplicates: {dupes[:50]}")

    index["_note"] = ("Question text parsed from T.E.T.txt (linear export). Telugu for "
                      "cdp/maths/physics/biology is an approximation from legacy fonts; "
                      "telugu-section Telugu is unavailable (corrupted) - see flagged.json.")
    (OUT_DIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT_DIR / "flagged.json").write_text(json.dumps(flagged, ensure_ascii=False, indent=1), encoding="utf-8")
    (REPORT_DIR / "flagged.json").write_text(json.dumps(flagged, ensure_ascii=False, indent=1), encoding="utf-8")
    (REPORT_DIR / "validation.txt").write_text("\n".join(report), encoding="utf-8")
    print("\n".join(report))


if __name__ == "__main__":
    main()
