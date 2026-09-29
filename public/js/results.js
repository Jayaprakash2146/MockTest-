// Results + review screens
import { el, fmtDuration, fmtDate } from "./ui.js";
import { getHistory, setHistory, settings, getUser } from "./store.js";
import { scoreTest } from "./data.js";

export function saveToHistory(test) {
  const result = scoreTest(test);
  let timeTaken;
  if (test.durationSeconds) {
    const remaining = test.endsAt ? Math.max(0, (test.endsAt - Date.now()) / 1000) : 0;
    timeTaken = Math.round(test.durationSeconds - remaining);
  } else {
    timeTaken = Math.round((Date.now() - test.createdAt) / 1000);
  }
  const entry = {
    id: test.id,
    mode: test.mode,
    date: Date.now(),
    user: getUser() || null,
    score: result.score,
    total: result.total,
    percent: result.percent,
    correct: result.correct,
    wrong: result.wrong,
    skipped: result.skipped,
    timeTakenSec: Math.max(0, Math.min(timeTaken, test.durationSeconds || Infinity)),
    sections: result.sections,
    order: test.order,
    byId: test.byId,
    answers: test.answers,
    marked: test.marked,
  };
  const hist = getHistory();
  hist.unshift(entry);
  while (hist.length > 20) hist.pop();
  setHistory(hist);
  return entry;
}

export function mountResults(root, entry) {
  root.innerHTML = "";
  const secRows = entry.sections.map((s) =>
    el("tr", {},
      el("td", {}, el("span", { class: "sect-pill" }, el("span", { class: "dot", style: `background:${s.color}` }), s.short)),
      el("td", {}, `${s.correct + s.wrong}/${s.total}`),
      el("td", { class: "muted" }, `${s.correct} ✓ · ${s.wrong} ✗ · ${s.skipped} —`),
      el("td", {}, `${s.total ? Math.round(((s.correct) / s.total) * 100) : 0}%`),
      el("td", {}, el("div", { class: "bar-track" }, el("div", { class: "bar-fill", style: `width:${s.total ? (s.correct / s.total) * 100 : 0}%` })))
    )
  );

  const bars = entry.sections.map((s) =>
    el("div", { class: "bar-row" },
      el("span", { class: "name" }, s.short),
      el("div", { class: "bar-track" }, el("div", { class: "bar-fill", style: `width:${s.total ? (s.correct / s.total) * 100 : 0}%` })),
      el("span", { class: "val" }, `${s.correct}/${s.total}`)
    )
  );

  root.append(
    el("div", { class: "wrap" },
      el("div", { class: "score-hero" },
        el("div", {},
          el("div", { class: "score-ring" }, `${entry.score}/${entry.total}`),
          el("div", { class: "score-sub" }, `${entry.percent}% · ${entry.mode === "exam" ? "Full Mock" : "Practice"} · ${fmtDate(entry.date)}`)
        ),
        el("div", { class: "score-stats" },
          sstat(entry.correct, "Correct"),
          sstat(entry.wrong, "Wrong"),
          sstat(entry.skipped, "Skipped"),
          sstat(fmtDuration(entry.timeTakenSec), "Time")
        )
      ),
      el("div", { class: "grid cols-2", style: "margin-top:18px" },
        el("div", { class: "card card-pad" },
          el("h3", { style: "margin:0 0 12px" }, "Section-wise performance"),
          el("div", { class: "bar-chart" }, bars)
        ),
        el("div", { class: "card", style: "overflow:auto" },
          el("table", { class: "report" },
            el("thead", {}, el("tr", {}, el("th", {}, "Section"), el("th", {}, "Attempted"), el("th", {}, "Breakdown"), el("th", {}, "Accuracy"), el("th", {}, ""))),
            el("tbody", {}, secRows)
          )
        )
      ),
      el("div", { class: "card card-pad", style: "margin-top:18px; display:flex; gap:10px; flex-wrap:wrap" },
        el("button", { class: "btn primary", onclick: () => location.hash = `#/review/${entry.id}` }, "Review answers"),
        wrongBtn(entry),
        el("button", { class: "btn", onclick: () => location.hash = "#/" }, "Home"),
        el("button", { class: "btn ghost", onclick: () => location.hash = "#/history" }, "My tests")
      )
    )
  );

  function sstat(v, label) {
    return el("div", { class: "sstat" }, el("b", {}, String(v)), el("span", {}, label));
  }
  function wrongBtn(entry) {
    const wrongIds = entry.order.filter((qid) => {
      const a = entry.answers[qid];
      return a == null || a !== entry.byId[qid].answer;
    });
    return el("button", { class: "btn", disabled: wrongIds.length === 0, onclick: () => location.hash = `#/review/${entry.id}?filter=wrong` }, `Improve (${wrongIds.length} to review)`);
  }
}

// ---------------- review ----------------
export function mountReview(root, entry, { filter = "all", section = "all", focusId = null } = {}) {
  root.innerHTML = "";
  let curFilter = filter;
  let curSection = section;

  const listWrap = el("div", {});

  function matches(qid) {
    const a = entry.answers[qid];
    const q = entry.byId[qid];
    const marked = !!entry.marked[qid];
    if (curSection !== "all" && q.section !== curSection) return false;
    if (curFilter === "wrong") return a != null && a !== q.answer;
    if (curFilter === "skipped") return a == null;
    if (curFilter === "correct") return a === q.answer;
    if (curFilter === "marked") return marked;
    return true;
  }

  function render() {
    listWrap.innerHTML = "";
    const ids = entry.order.filter(matches);
    if (!ids.length) {
      listWrap.append(el("div", { class: "card card-pad muted", style: "margin-top:16px" }, "Nothing matches this filter."));
    }
    ids.forEach((qid, i) => {
      const q = entry.byId[qid];
      const a = entry.answers[qid];
      const marked = !!entry.marked[qid];
      const status = a == null ? ["skipped", "Skipped", "chip"] : a === q.answer ? ["correct", "Correct", "chip green"] : ["wrong", "Wrong", "chip red"];
      const optLabel = (k) => {
        const o = q.options[k - 1];
        return o && (o.en || o.te) ? `(${k}) ${o.en || o.te}` : `Option ${k}`;
      };
      const userAns = a == null ? "—" : optLabel(a);
      const correctAns = optLabel(q.answer);
      const showTe = settings.lang !== "en";
      listWrap.append(
        el("div", { class: "rq", id: "rq-" + qid },
          el("div", { class: "status-line", style: "display:flex;gap:8px;flex-wrap:wrap;align-items:center" },
            el("span", { class: "q-num" }, `Q${entry.order.indexOf(qid) + 1}`),
            el("span", { class: status[2] }, status[1]),
            marked ? el("span", { class: "chip purple" }, "★ Marked") : null,
            el("span", { class: "chip" }, q.section),
            el("span", { class: "tiny" }, q.sourcePage ? `source: ${q.section} #${q.number} · p.${q.sourcePage}` : `source: ${q.section} #${q.number}`)
          ),
          q.question.en ? el("div", { class: "q-text" }, q.question.en) : null,
          showTe && q.question.te ? el("div", { class: "q-text te-line", lang: "te" }, q.question.te) : null,
          q.image ? el("img", { class: "q-img", src: q.image, alt: `Question figure (${q.section} #${q.number})` }) : null,
          el("div", { class: "ans-line" },
            el("div", {}, "Your answer: ", a == null ? el("span", { class: "muted" }, "not answered") : el("span", { class: a === q.answer ? "right" : "wrong" }, userAns)),
            el("div", {}, "Correct answer: ", el("span", { class: "right" }, correctAns))
          ),
          i < ids.length - 1 ? el("div", { class: "tiny", style: "margin-top:10px" }, "—") : null
        )
      );
    });
  }

  const filters = [
    ["all", "All"], ["wrong", "Wrong"], ["skipped", "Skipped"], ["correct", "Correct"], ["marked", "Marked"],
  ];
  const bar = el("div", { class: "review-filters" },
    filters.map(([id, label]) =>
      el("button", {
        class: "filter-btn" + (curFilter === id ? " active" : ""),
        onclick: (e) => { curFilter = id; bar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active")); e.target.classList.add("active"); render(); },
      }, label + " (" + entry.order.filter((qid) => { const a = entry.answers[qid]; const q = entry.byId[qid]; return (id === "all") || (id === "wrong" ? a != null && a !== q.answer : id === "skipped" ? a == null : id === "correct" ? a === q.answer : !!entry.marked[qid]); }).length + ")")
    ),
    el("span", { style: "flex:1" }),
    sectionSelect()
  );

  function sectionSelect() {
    const sel = el("select", { onchange: (e) => { curSection = e.target.value; render(); } },
      el("option", { value: "all" }, "All sections"),
      entry.sections.map((s) => el("option", { value: s.id }, s.name))
    );
    sel.value = curSection;
    return sel;
  }

  root.append(
    el("div", { class: "wrap" },
      el("div", { style: "display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap" },
        el("button", { class: "btn sm", onclick: () => location.hash = `#/results/${entry.id}` }, "← Results"),
        el("h2", { style: "margin:0; font-size:20px" }, "Review"),
        el("span", { class: "muted" }, `${entry.score}/${entry.total} · ${fmtDate(entry.date)}`)
      ),
      el("div", { class: "card" }, bar, listWrap)
    )
  );

  render();
  if (focusId) {
    requestAnimationFrame(() => {
      const node = document.getElementById("rq-" + focusId);
      if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}
