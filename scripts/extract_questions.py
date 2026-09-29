"""
Extract all mock-test questions from the TET 2A practice-bank PDF into JSON.

Reproducible conversion script (Phase 1). Run:
    python scripts/extract_questions.py

Outputs:
    public/data/index.json               section metadata + counts
    public/data/cdp.json ... etc         one file per section (lazy-load)
    scripts/reports/validation.txt       validation report
    scripts/reports/flagged.json         questions needing manual review

How it works:
- Each PDF page is split into a left and a right column.
- Text lines are merged back into *visual rows* (PyMuPDF emits the option
  marker "(1)" and its text as separate line objects on the same row).
- A per-column state machine walks the rows: section title rows switch the
  active section (question numbers restart at 1), rows starting with the
  expected question number open a question, rows starting with the expected
  option marker "(N)" / "N." open an option, everything else appends to the
  open container (English + Telugu runs are separated by script).
- Tick marks (glyph \\x13 + digit) attach to the open question and are used
  only as a cross-check; answer_keys.json is authoritative.
- The PDF's Telugu text layer uses legacy fonts. For CDP/Maths/Physics/Biology
  the extracted Telugu is kept as an APPROXIMATION; the Telugu section's layer
  is badly corrupted (Latin/Cyrillic garbage) so te is set to null there and
  every question is flagged for review.

Only dependency: PyMuPDF  (pip install pymupdf)
"""

import io
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "ALL 2A MATHS PHYS IN ONE PDF STU PEDAKURAPADU.pdf"
KEYS_PATH = ROOT / "answer_keys.json"
OUT_DIR = ROOT / "data"
REPORT_DIR = ROOT / "scripts" / "reports"

SECTION_IDS = ["cdp", "telugu", "english", "maths", "physics", "biology"]
transitions = []  # (page, col, sid) section start events
SECTION_TITLES = {
    "CDP": "cdp", "TELUGU": "telugu", "ENGLISH": "english",
    "MATHEMATICS": "maths", "MATHS": "maths", "MATH": "maths",
    "PHYSICAL SCIENCE": "physics", "PHYSICAL": "physics", "PHYSICS": "physics",
    "BIOLOGY": "biology", "BIO": "biology",
}
EXPECTED_COUNTS = {"cdp": 630, "telugu": 630, "english": 720,
                   "maths": 240, "physics": 240, "biology": 240}
BILINGUAL = {"cdp", "maths", "physics", "biology"}

TE_CHARS = re.compile(r"[\u0C00-\u0C7F]")
GARBLED_CHARS = re.compile(r"[\u00C0-\u00FF\u0100-\u024F\u0370-\u03FF\u0400-\u04FF]")

# legacy-font private-use glyphs that appear in the text layer
PUA_MAP = {
    "\uf02e": ".", "\uf020": " ", "\uf02d": "-", "\uf02b": "+", "\uf03d": "=",
    "\uf028": "(", "\uf029": ")", "\uf05c": "?", "\uf0b4": "\u00d7", "\uf0f7": "\u00f7",
    "\uf0b1": "\u00b1", "\uf0d7": "\u2022", "\uf0e0": "\u2192", "\uf0a3": "\u2264",
    "\uf0b3": "\u2265", "\uf0b0": "\u00b0", "\uf0a5": "\u2248", "\uf0b9": "\u2260",
    "\uf0ae": "\u2192", "\uf0ac": "\u2212", "\uf02f": "/", "\uf05e": "\u2261",
}
PUA_ANY = re.compile(r"[\uf000-\uf0ff]")

TICK_RE = re.compile(r"^[\u0013\u00b7\u2022]?\s*([1-4])\s*$")
TITLE_RES = [
    re.compile(r"^SUBJECT\s*[\u2013-]\s*2A\s*[\u2013-]\s*([A-Z &]+)\s*$"),
    re.compile(r"^TET\s*PRACTICE\s*BITS\s*[-\u2013]\s*2A\s+([A-Z &]+)\s*$", re.I),
]
HEADER_RES = [
    re.compile(r"TET\s*[-\u2013]?\s*PRACTICE", re.I),
    re.compile(r"^STU\s+Pedakurapadu\s*$", re.I),
    re.compile(r"^SUBJECT\s*[\u2013-]"),
    re.compile(r"^SUBJECT\s*:"),
    re.compile(r"^PAPER\s*:"),
    re.compile(r"^SL\.?\s*NO\b"),
    re.compile(r"^ANS\b"),
    re.compile(r"^\s*(T\.?E\.?T\.?|PRACTICE|QUESTION[ ]?BANK)\s*$", re.I),
    re.compile(r"^[A-Z][A-Z &]{2,}\s*[\u2013-]\s*(II\s*A?|2A)\s*$"),
]
KEYROW_RE = re.compile(r"^(?:\d{1,3}[\s]+){3,}\d{1,3}$")


def normalize_pua(text: str):
    out, dropped = [], 0
    for ch in text:
        if "\uf000" <= ch <= "\uf0ff":
            out.append(PUA_MAP.get(ch, ""))
            if ch not in PUA_MAP:
                dropped += 1
        else:
            out.append(ch)
    return "".join(out), dropped


def is_header(line: str) -> bool:
    return any(rx.search(line) for rx in HEADER_RES)


def split_runs(text: str, section: str):
    """Split a row into ('en'|'te', text) runs by script."""
    if section == "english":
        return [("en", text)] if text.strip() else []
    if section == "telugu":
        return [("te", text)] if text.strip() else []
    runs, cur, cur_te = [], [], None
    for ch in text:
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


OMARK_RE = re.compile(r"(?<![\d.])([1-4])\s*[).](?![\d.])|\(([1-4])\)(?![\d.])")


def omarker_at(text: str, expected: int):
    for m in OMARK_RE.finditer(text):
        k = int(m.group(1) or m.group(2))
        if k == expected:
            return m.start(), m.end()
    return None


def qmarker_at(text: str, expected: int, dot_style: bool):
    # try both styles for every section: title pages mix formats
    rx = re.compile(rf"(?<![\d.])(?<!\w){expected}\s*[\uf02e.](?!\d)")
    m = rx.search(text)
    if m:
        return m.start(), m.end()
    rx2 = re.compile(rf"(?<![\d.\w]){expected}\s+(?=[A-Za-z\u201c\"'(_\u2013-\u2015?_])")
    m = rx2.search(text)
    if m:
        return m.start(), m.end()
    if re.fullmatch(rf"\s*{expected}[\s.\uf02e]*", text):
        return 0, len(text)
    return None


def try_qstart(text, state, dot_style):
    """Find the next question start tolerating source numbering defects.
    The source occasionally skips or repeats a printed number (its answer-key
    tables are positional), so accept the expected number or a small offset;
    returns ((start, end), printed_number, offset_used) or (None, None, None).
    Pure: does not touch state - the caller applies `offset_used` only when it
    really opens the question."""
    exp = state["qnum"]
    off = state.get("numoffset", 0)
    for cand in dict.fromkeys([off, 0, 1, 2]):
        hit = qmarker_at(text, exp + cand, dot_style)
        if hit:
            return hit, exp + cand, cand
    return None, None, None


def repeated_start(text, state, dot_style):
    """True when a row starts with the *current* expected-1 number (the source
    sometimes repeats the previous printed number for the next question)."""
    n = state["qnum"] - 1
    if n < 1:
        return False
    if dot_style:
        return bool(re.match(rf"^\s*{n}\s*[\uf02e.](?!\d)", text))
    return bool(re.match(rf"^\s*{n}\s+(?=[A-Za-z\u201c\"'(_])", text))


class Question:
    __slots__ = ("number", "printed", "en", "te", "options", "page", "y", "col",
                 "tick", "pua_dropped", "open_opt", "renumber", "no_number", "repeated")

    def __init__(self, number, printed, page, y, col):
        self.number = number
        self.printed = printed
        self.en, self.te = [], []
        self.options = None          # None until first option marker
        self.open_opt = False        # a marker was seen but no text yet
        self.page, self.y, self.col = page, y, col
        self.tick = None
        self.pua_dropped = 0
        self.renumber = False
        self.no_number = False
        self.repeated = False

    def opt(self):
        return self.options[-1]

    def finish(self):
        q = {
            "question": {"en": " ".join(self.en).strip() or None,
                         "te": " ".join(self.te).strip() or None},
            "options": [],
            "page": self.page,
            "tick": self.tick,
        }
        for oen, ote in (self.options or []):
            q["options"].append({"en": " ".join(oen).strip() or None,
                                 "te": " ".join(ote).strip() or None})
        return q


def get_page_rows(page):
    """Return (rows, ticks) for one page.
    rows: visual rows in content-stream (reading) order -> (y, minx, text).
    ticks: tick marks -> (y, minx, value)."""
    d = page.get_text("dict")
    rows, ticks = [], []
    for block in d["blocks"]:
        if block.get("type") != 0:
            continue
        for ln in block["lines"]:
            spans = sorted(ln.get("spans", []), key=lambda s: s["bbox"][0])
            text = "".join(s["text"] for s in spans)
            x0, y0 = ln["bbox"][0], ln["bbox"][1]
            t = text.strip()
            if not t:
                continue
            if re.fullmatch(r"STU\s*Pedakurapadu(?:\s+\d+)?", t, re.I):
                continue
            tm = TICK_RE.match(t)
            if tm and t[0] in "\u0013\u00b7\u2022":
                # explicit tick glyph (\x13 or middle dot) + digit
                if tm.group(1):
                    ticks.append((y0, x0, int(tm.group(1))))
                continue
            if tm and tm.group(1) and x0 > 270:
                # bare single digit at the column edge = telugu-style tick
                ticks.append((y0, x0, int(tm.group(1))))
                continue
            if rows and abs(y0 - rows[-1][0]) <= 2.5:
                rows[-1][1].append((x0, text))
            else:
                rows.append((y0, [(x0, text)]))
    out = []
    for y, parts in rows:
        parts.sort(key=lambda p: p[0])
        out.append((y, parts[0][0], "  ".join(t for _, t in parts).strip()))
    return out, ticks


def feed(rows, state, page, sections, stats):
    for y, minx, text in rows:
        # section title rows switch the active section
        sid = None
        for rx in TITLE_RES:
            tm = rx.match(text)
            if tm:
                name = " ".join(tm.group(1).upper().split())
                sid = SECTION_TITLES.get(name)
                break
        if sid:
            if state["section"] != sid:
                state["section"], state["qnum"], state["cur"] = sid, 1, None
                state["keymode"] = False
                transitions.append((page, 0 if minx < 306 else 1, sid))
            continue
        feed_row(text, state, page, y, 0 if minx < 306 else 1, sections, stats)


def feed_row(text, state, page, y, col, sections, stats):
    section = state["section"]
    if section is None:
        return
    text, dropped = normalize_pua(text)
    if not text.strip() or is_header(text):
        return
    tm = TICK_RE.match(text.strip())
    if tm:
        # ticks are attached later by geometry (their stream position lies at
        # the end of a group, not inside their own question)
        return
    if KEYROW_RE.match(text.strip()):
        state["keymode"] = True
        return
    if state.get("keymode"):
        # inside an answer-key table: leave only on a real question row
        hit, _, _ = try_qstart(text, state, section != "english")
        if not hit:
            return
        state["keymode"] = False

    dot_style = section != "english"
    runs = split_runs(text, section)
    for lang, run in runs:
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
                hit, printed, off_used = try_qstart(rest, state, dot_style)
                if not hit:
                    # numberless question: the source sometimes fails to print
                    # the number (row starts with the bare dot)
                    if re.match(r"^\.\s+\S", rest) and (
                        cur is None or (cur.options is not None and len(cur.options) >= 4 and not cur.open_opt)
                    ):
                        cur = Question(state["qnum"], None, page, y, col)
                        cur.no_number = True
                        cur.pua_dropped = dropped
                        sections[section].append(cur)
                        state["cur"] = cur
                        state["qnum"] += 1
                        rest = re.sub(r"^\.\s+", "", rest)
                        continue
                    # repeated printed number (misprint): previous number again
                    if repeated_start(rest, state, dot_style) and (
                        cur is None or (cur.options is not None and len(cur.options) >= 2 and not cur.open_opt)
                    ):
                        cur = Question(state["qnum"], state["qnum"] - 1, page, y, col)
                        cur.repeated = True
                        cur.pua_dropped = dropped
                        sections[section].append(cur)
                        state["cur"] = cur
                        state["qnum"] += 1
                        rest = re.sub(rf"^\s*{state['qnum'] - 2}\s*[\uf02e.]\s*", "", rest)
                        continue
                    # keep multi-row text of a completed 4th option; otherwise drop
                    if cur is None or cur.options is None or len(cur.options) < 4:
                        break
                else:
                    s, e = hit
                    state["numoffset"] = off_used
                    cur = Question(state["qnum"], printed, page, y, col)
                    if off_used != 0 and off_used != state.get("flagged_off"):
                        cur.renumber = True
                        state["flagged_off"] = off_used
                    if off_used == 0:
                        state["flagged_off"] = None
                    cur.pua_dropped = dropped
                    sections[section].append(cur)
                    state["cur"] = cur
                    state["qnum"] += 1
                    rest = rest[e:]
                    continue

            hit_o = omarker_at(rest, int(want[1])) if want != "q" else None
            hit_q, printed, off_used = (None, None, None) if want == "q" else try_qstart(rest, state, dot_style)
            if hit_q and (not hit_o or hit_q[0] <= hit_o[0]):
                s, e = hit_q
                state["numoffset"] = off_used
                cur = Question(state["qnum"], printed, page, y, col)
                if off_used != 0 and off_used != state.get("flagged_off"):
                    cur.renumber = True
                    state["flagged_off"] = off_used
                if off_used == 0:
                    state["flagged_off"] = None
                cur.pua_dropped = dropped
                sections[section].append(cur)
                state["cur"] = cur
                state["qnum"] += 1
                rest = rest[e:]
                continue
            if hit_o:
                s, e = hit_o
                if cur.options is None:
                    cur.options = []
                cur.options.append([[], []])
                cur.open_opt = True
                rest = rest[e:]
                continue

            # plain continuation text
            if lang == "te":
                if cur.options is None:
                    cur.te.append(rest)
                else:
                    cur.opt()[1].append(rest)
            else:
                stripped = rest.strip()
                pure_num = stripped.isdigit()
                if cur.options is None:
                    if not pure_num:
                        cur.en.append(stripped)
                else:
                    # numeric continuation only if the option has no text yet
                    if not (pure_num and (cur.opt()[0] or not cur.open_opt)):
                        cur.opt()[0].append(stripped)
                        cur.open_opt = False
            break
    return None


def main():
    keys = json.loads(KEYS_PATH.read_text(encoding="utf-8"))["sections"]
    doc = pymupdf.open(PDF_PATH)

    sections = {sid: [] for sid in SECTION_IDS}
    stats = {"ticks_attached": 0}
    state = {"section": None, "qnum": 1, "cur": None, "keymode": False,
             "numoffset": 0, "flagged_off": None}
    all_ticks = []

    for pno in range(len(doc)):
        page = doc[pno]
        rows, ticks = get_page_rows(page)
        all_ticks.extend((pno + 1, t[0], t[1], t[2]) for t in ticks)
        feed(rows, state, pno + 1, sections, stats)

    # attach ticks by geometry: last question starting above the tick in the
    # same page column (tolerance 8px for font-metric offsets)
    from collections import defaultdict
    qindex = defaultdict(list)
    for sid in SECTION_IDS:
        for q in sections[sid]:
            qindex[(q.page, q.col)].append(q)
    for k in qindex:
        qindex[k].sort(key=lambda q: q.y)
    import bisect
    for pno, ty, tx, val in all_ticks:
        col = 0 if tx < 306 else 1
        cands = qindex.get((pno, col))
        if not cands:
            continue
        ys = [q.y for q in cands]
        i = bisect.bisect_right(ys, ty + 8) - 1
        if i >= 0 and cands[i].tick is None:
            cands[i].tick = val
            stats["ticks_attached"] += 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    flagged, index, report = [], {"_note": None, "sections": {}}, ["VALIDATION REPORT", "=" * 60]

    agree = disagree = 0
    for sid in SECTION_IDS:
        qs = []
        for q in sections[sid]:
            qd = q.finish()
            opts = qd["options"][:4]
            while len(opts) < 4:
                opts.append({"en": None, "te": None})
            ans = keys[sid]["answers"].get(str(q.number))
            if qd["tick"] is not None:
                if ans is not None and qd["tick"] != ans:
                    disagree += 1
                else:
                    agree += 1
            item = {
                "id": f"{sid}-{q.number:04d}", "section": sid, "number": q.number,
                "question": qd["question"], "options": opts, "answer": ans,
                "image": None, "sourcePage": qd["page"], "needsReview": False,
            }
            qs.append([item, qd["tick"], q.pua_dropped, q.printed, q.renumber, q.no_number, q.repeated])

        expected = EXPECTED_COUNTS[sid]
        numbers = [it[0]["number"] for it in qs]
        dupes = sorted(k for k, v in Counter(numbers).items() if v > 1)
        missing = sorted(set(range(1, expected + 1)) - set(numbers))
        sec_flag = 0
        items = []
        for item, tick, pua, printed, ren, no_num, rep in qs:
            q, reasons = item, []
            if no_num:
                reasons.append("question number missing in print (bare-dot row); position inferred from sequence")
            if rep:
                reasons.append("source repeats the previous printed number; position inferred from sequence")
            if tick is not None and q["answer"] is not None and tick != q["answer"]:
                reasons.append(f"tick mark says {tick} but key says {q['answer']}")
            if q["answer"] is None:
                if sid == "english" and q["number"] == 311 and tick:
                    q["answer"] = tick
                    q["needsReview"] = True
                    reasons.append(f"key table prints 74; answer {tick} taken from tick mark - verify manually")
                else:
                    reasons.append("no answer in answer_keys.json")
            if q["question"]["en"] is None and q["question"]["te"] is None:
                reasons.append("empty question text")
            elif sid != "telugu" and (q["question"]["en"] or "") and len(q["question"]["en"]) < 8:
                reasons.append("very short question text")
            for i, o in enumerate(q["options"], 1):
                if o["en"] is None and o["te"] is None:
                    reasons.append(f"option {i} empty")
            if pua:
                reasons.append("unmapped symbol-font glyphs were dropped (possible formula loss)")
            if ren:
                reasons.append(f"source prints this question as #{printed}; renumbered positionally to match the key")
            if sid == "telugu":
                raw_te = q["question"]["te"]
                for o in q["options"]:
                    raw_te += " | " + (o["te"] or "")
                q["question"]["te"] = None
                for o in q["options"]:
                    o["te"] = None
                q["needsReview"] = True
                reasons.append("telugu section: legacy-font text layer corrupted; recover text from source page")
                flagged.append({"id": q["id"], "page": q["sourcePage"], "reasons": reasons,
                                "rawTelugu": raw_te.strip(" |") or None})
                sec_flag += 1
                items.append(q)
                continue
            blobs = [q["question"]["te"] or ""] + [o["te"] or "" for o in q["options"]]
            if any(GARBLED_CHARS.search(b) for b in blobs):
                q["needsReview"] = True
                reasons.append("suspicious characters in Telugu (legacy font)")
            if reasons:
                q["needsReview"] = True
                flagged.append({"id": q["id"], "page": q["sourcePage"], "reasons": reasons})
                sec_flag += 1
            items.append(q)

        (OUT_DIR / f"{sid}.json").write_text(
            json.dumps({"section": sid, "name": keys[sid]["name"], "count": len(items),
                        "questions": items}, ensure_ascii=False, indent=1), encoding="utf-8")
        index["sections"][sid] = {"name": keys[sid]["name"], "count": len(items)}
        report.append(f"{sid:8s}: parsed {len(items):4d} / expected {expected:4d} | duplicates {len(dupes)}"
                      f" | missing {len(missing)} | flagged {sec_flag}")
        if missing:
            report.append(f"          missing numbers: {missing[:50]}{' ...' if len(missing) > 50 else ''}")
        if dupes:
            report.append(f"          duplicate numbers: {dupes[:50]}")

    report.append(f"tick-vs-key: {agree} agree, {disagree} disagree, {stats['ticks_attached']} ticks attached")
    report.append(f"section transitions (page, col, section): {transitions}")

    index["_note"] = ("Telugu text for cdp/maths/physics/biology is auto-extracted from legacy fonts "
                      "and may contain glyph errors; telugu-section Telugu is unavailable (corrupted "
                      "text layer) - read it from the source PDF page shown in review mode.")
    (OUT_DIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    (REPORT_DIR / "flagged.json").write_text(json.dumps(flagged, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT_DIR / "flagged.json").write_text(json.dumps(flagged, ensure_ascii=False, indent=1), encoding="utf-8")
    (REPORT_DIR / "validation.txt").write_text("\n".join(report), encoding="utf-8")
    print("\n".join(report))
    print(f"flagged: {len(flagged)}")


if __name__ == "__main__":
    main()
