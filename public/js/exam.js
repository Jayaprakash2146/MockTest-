// Exam / practice screen
import { el, fmtClock, showModal, toast } from "./ui.js";
import { settings, setCurrentTest, getCurrentTest } from "./store.js";
import { scoreTest } from "./data.js";

let timerHandle = null;
let activeStop = null;

/** Detach listeners/timer of a mounted exam screen (called by the router). */
export function cleanupExam() {
  if (activeStop) {
    activeStop();
    activeStop = null;
  }
}

export function mountExam(root, test, { onSubmit }) {
  let lang = settings.lang;
  let secondConfirm = false;

  // mark visited
  test.visited[test.order[test.current]] = true;

  function statusOf(qid) {
    const answered = test.answers[qid] != null;
    const marked = !!test.marked[qid];
    if (marked && answered) return "marked-answered";
    if (marked) return "marked";
    if (answered) return "answered";
    if (test.visited[qid]) return "unanswered";
    return "unvisited";
  }

  function counts() {
    const c = { answered: 0, unanswered: 0, marked: 0, markedAnswered: 0, unvisited: 0 };
    for (const qid of test.order) {
      const st = statusOf(qid);
      if (st === "answered") c.answered++;
      else if (st === "unanswered") c.unanswered++;
      else if (st === "marked") c.marked++;
      else if (st === "marked-answered") c.markedAnswered++;
      else c.unvisited++;
    }
    return c;
  }

  function render() {
    setCurrentTest(test);
    const prevPanel = root.querySelector(".palette-sections");
    const panelScroll = prevPanel ? prevPanel.scrollTop : 0;
    root.innerHTML = "";
    const qid = test.order[test.current];
    const q = test.byId[qid];
    const c = counts();

    // ----- top bar -----
    const remaining = test.endsAt ? Math.max(0, Math.round((test.endsAt - Date.now()) / 1000)) : null;
    const timerCls = remaining == null ? "" : remaining < 300 ? "crit" : remaining < 1800 ? "warn" : "";
    const langToggle = el(
      "div",
      { class: "lang-toggle", role: "group", "aria-label": "Language" },
      langBtn("both", "English + Telugu"),
      langBtn("en", "English"),
      langBtn("te", "Telugu")
    );
    function langBtn(value, label) {
      return el("button", { class: lang === value ? "active" : "", onclick: () => { lang = value; settings.lang = value; render(); } }, label);
    }

    const head = el(
      "div",
      { class: "exam-head" },
      el("div", { class: "timer " + timerCls }, "⏱ ", remaining != null ? fmtClock(remaining) : "Practice"),
      el("span", { class: "chip" }, test.mode === "exam" ? "Full Mock — 150 marks" : "Practice"),
      el("div", { class: "spacer", style: "flex:1" }),
      langToggle,
      el("button", { class: "btn danger sm", onclick: confirmSubmit }, "Submit")
    );

    // ----- question card -----
    const hasEn = !!q.question.en, hasTe = !!q.question.te;
    const showEn = hasEn && (lang !== "te" || !hasTe);
    const showTe = hasTe && (lang !== "en" || !hasEn);
    const isImageQ = !!q.image;
    const optTexts = q.options.some((o) => o.en || o.te);
    const qCard = el(
      "div",
      { class: "card card-pad" },
      el(
        "div",
        { class: "q-meta" },
        el("span", { class: "q-num" }, `Q${test.current + 1}`),
        el("span", { class: "chip", style: `background:${q.color || "var(--slate-soft)"}22;color:${q.color || "var(--ink-2)"}` }, sectionShort(q.section)),
        q.sourcePage ? el("span", { class: "tiny" }, `${q.section} #${q.number} · source p.${q.sourcePage}`) : el("span", { class: "tiny" }, `${q.section} #${q.number}`),
        q.needsReview ? el("span", { class: "chip amber", title: "Flagged during extraction" }, "⚠ review flag") : null
      ),
      showEn ? el("div", { class: "q-text" }, q.question.en) : null,
      showTe ? el("div", { class: "q-text te-line", lang: "te" }, q.question.te) : null,
      !hasEn && !hasTe && isImageQ ? el("div", { class: "tiny", style: "margin-top:4px" }, "Figure-based question — choose the correct option.") : null,
      isImageQ ? el("img", { class: "q-img", src: q.image, alt: `Question figure (${q.section} #${q.number})` }) : null,
      el(
        "div",
        { class: "opts" + (isImageQ || !optTexts ? " nums" : "") },
        q.options.map((opt, i) =>
          el(
            "button",
            {
              class: "opt" + (test.answers[qid] === i + 1 ? " selected" : ""),
              onclick: () => { test.answers[qid] = i + 1; render(); },
            },
            el("span", { class: "key" }, String(i + 1)),
            isImageQ || !optTexts ? null :
            el(
              "span",
              {},
              showEn && opt.en ? el("div", {}, opt.en) : null,
              showTe && opt.te ? el("div", { class: "te-line", lang: "te" }, opt.te) : null,
              !opt.en && !opt.te ? el("div", { class: "tiny" }, "(no text extracted — see source page)") : null
            )
          )
        )
      ),
      el(
        "div",
        { class: "exam-actions", style: "border-top:1px solid var(--line); margin:18px -20px -20px; padding:16px 20px;" },
        btnClear(),
        btnMark(),
        el("div", { style: "flex:1" }),
        el("button", { class: "btn", onclick: () => goto(test.current - 1) }, "← Previous"),
        el("button", { class: "btn", onclick: () => goto(nextSkipped(test.current)) , title: "Jump to next skipped question" }, "Skip ⤼"),
        el("button", { class: "btn primary", onclick: () => goto(Math.min(test.current + 1, test.order.length - 1), true) }, "Save & Next →")
      )
    );
    function btnClear() {
      return el("button", { class: "btn", onclick: () => { delete test.answers[qid]; render(); toast("Response cleared"); } }, "Clear response");
    }
    function btnMark() {
      const marked = !!test.marked[qid];
      return el(
        "button",
        { class: "btn" + (marked ? "" : ""), style: marked ? "border-color:var(--purple);color:var(--purple);background:var(--purple-soft)" : "", onclick: () => { test.marked[qid] = !marked; if (!marked) delete test.marked[qid]; render(); } },
        marked ? "★ Marked for review" : "☆ Mark for review"
      );
    }

    // ----- palette -----
    const palette = el(
      "div",
      { class: "card" },
      el(
        "div",
        { class: "palette-head" },
        el("div", { class: "palette-counts" },
          pcount(c.answered + c.markedAnswered, "Answered", "green"),
          pcount(c.unanswered, "Not answered", "red"),
          pcount(c.marked + c.markedAnswered, "Marked", "purple")
        )
      ),
      el(
        "div",
        { class: "palette-sections" },
        test.sections.map((s) =>
          el(
            "div",
            { class: "pal-sect" },
            el("h4", {},
              el("span", { class: "dot", style: `width:9px;height:9px;border-radius:50%;background:${s.color};display:inline-block` }),
              `${s.name} `,
              el("span", { class: "tiny" }, `(${s.qids.length})`)
            ),
            el(
              "div",
              { class: "pal-grid" },
              s.qids.map((id) => {
                const idx = test.order.indexOf(id);
                const st = statusOf(id);
                const cls = [
                  "pal-btn",
                  st === "answered" ? "answered" : "",
                  st === "unanswered" ? "unanswered" : "",
                  st === "marked" || st === "marked-answered" ? "marked" : "",
                  st === "marked-answered" ? "answered" : "",
                  idx === test.current ? "cur" : "",
                ].join(" ");
                return el("button", { class: cls, onclick: () => goto(idx) }, String(idx + 1));
              })
            )
          )
        )
      ),
      el(
        "div",
        { class: "legend" },
        legend("", "Not visited"),
        legend("unanswered", "Not answered"),
        legend("answered", "Answered"),
        legend("marked", "Marked"),
        legend("answered marked", "Answered + marked")
      )
    );
    function pcount(n, label, cls) {
      return el("div", { class: "pcount" }, el("b", { class: cls === "green" ? "" : "" }, String(n)), el("span", {}, label));
    }
    function legend(cls, label) {
      return el("span", {}, el("i", { class: cls }), label);
    }

    root.append(
      el("div", { class: "wrap" }, el("div", { class: "exam-grid" }, el("div", {}, head, qCard), palette))
    );

    // keep the palette panel at the same scroll position across re-renders,
    // so picking a question in a lower section doesn't jump back to the top
    const panel = root.querySelector(".palette-sections");
    if (panel) panel.scrollTop = panelScroll;

    // sectionShort helper
    function sectionShort(sid) {
      const s = test.sections.find((x) => x.id === sid);
      return s ? s.short : sid;
    }
  }

  function goto(idx, saveAndNext = false) {
    if (idx < 0 || idx >= test.order.length) return;
    test.current = idx;
    test.visited[test.order[idx]] = true;
    if (saveAndNext) toast("Response saved");
    render();
    window.scrollTo({ top: 0 });
  }

  function nextSkipped(from) {
    for (let i = 1; i <= test.order.length; i++) {
      const idx = (from + i) % test.order.length;
      if (test.answers[test.order[idx]] == null && !test.marked[test.order[idx]]) return idx;
    }
    return from;
  }

  function confirmSubmit() {
    const c = counts();
    const attempted = c.answered + c.markedAnswered;
    const unanswered = test.order.length - attempted;
    const close = showModal({
      title: "Submit test?",
      body: el(
        "div",
        {},
        el("p", {}, `You answered ${attempted} of ${test.order.length} questions.`),
        el(
          "ul",
          {},
          el("li", {}, `Answered: ${attempted}`),
          el("li", {}, `Not answered: ${unanswered}`),
          el("li", {}, `Marked for review: ${c.marked + c.markedAnswered}`),
          test.endsAt ? el("li", {}, `Time left: ${fmtClock(Math.max(0, (test.endsAt - Date.now()) / 1000))}`) : null
        ),
        unanswered > 0 && !secondConfirm
          ? el("p", { class: "notice" }, `You still have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Are you sure you want to submit?`)
          : null
      ),
      actions: [
        el("button", { class: "btn", onclick: () => close() }, "Keep working"),
        el("button",
          { class: "btn primary", onclick: () => {
              if (unanswered > 0 && !secondConfirm) {
                secondConfirm = true;
                close();
                confirmSubmit();
                return;
              }
              close();
              finish();
            } },
          unanswered > 0 && !secondConfirm ? "Submit anyway" : "Submit test"
        ),
      ],
    });
  }

  function finish() {
    stopTimer();
    test.submitted = true;
    setCurrentTest(null);
    onSubmit(test);
  }

  function tick() {
    if (!test.endsAt) return;
    const remaining = Math.round((test.endsAt - Date.now()) / 1000);
    if (remaining <= 0) {
      finish();
      toast("Time is up — test auto-submitted");
      return;
    }
    const timerEl = root.querySelector(".timer");
    if (timerEl) {
      timerEl.className = "timer " + (remaining < 300 ? "crit" : remaining < 1800 ? "warn" : "");
      timerEl.innerHTML = "";
      timerEl.append("⏱ ", fmtClock(remaining));
    }
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
    window.removeEventListener("beforeunload", warnLeave);
    window.removeEventListener("keydown", onKey);
  }

  function warnLeave(e) {
    e.preventDefault();
    e.returnValue = "";
  }

  function onKey(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
    const qid = test.order[test.current];
    if (["1", "2", "3", "4"].includes(e.key)) {
      test.answers[qid] = Number(e.key);
      render();
    } else if (e.key === "ArrowRight") {
      goto(Math.min(test.current + 1, test.order.length - 1));
    } else if (e.key === "ArrowLeft") {
      goto(test.current - 1);
    } else if (e.key.toLowerCase() === "m") {
      test.marked[qid] = !test.marked[qid];
      if (!test.marked[qid]) delete test.marked[qid];
      render();
    } else if (e.key.toLowerCase() === "c") {
      delete test.answers[qid];
      render();
    }
  }

  window.addEventListener("beforeunload", warnLeave);
  window.addEventListener("keydown", onKey);
  if (test.endsAt) timerHandle = setInterval(tick, 1000);

  render();
  activeStop = stopTimer;
  return { stop: stopTimer };
}
