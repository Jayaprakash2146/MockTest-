// Router + home + practice setup + admin review
import { el, fmtDate } from "./ui.js";
import { getCurrentTest, setCurrentTest, getUser, setUser, isAdmin, setAdmin } from "./store.js";
import { SECTIONS, BLUEPRINT, assembleTest, loadIndex, EXAM_SECONDS, scoreTest, DATA_BASE } from "./data.js";
import { mountExam, cleanupExam } from "./exam.js";
import { mountResults, mountReview, saveToHistory } from "./results.js";
import { mountHistory } from "./history.js";
import { mountAdmin } from "./admin.js";

const app = document.getElementById("app");

// ---------------- welcome / registration gate ----------------
function renderWelcome() {
  app.innerHTML = "";
  const name = el("input", { type: "text", placeholder: "Your full name", id: "w-name" });
  const desig = el("input", { type: "text", placeholder: "e.g. Teacher, D.El.Ed student", id: "w-desig" });
  const school = el("input", { type: "text", placeholder: "School / college / institution", id: "w-school" });
  const errBox = el("div", {});
  const fields = [name, desig, school];
  fields.forEach((f, i) => f.addEventListener("keydown", (e) => { if (e.key === "Enter") { (fields[i + 1] || submit).focus(); if (i === 2) submit(); } }));

  function doSubmit() {
    const vals = fields.map((f) => f.value.trim());
    if (vals.some((v) => !v)) {
      errBox.innerHTML = "";
      errBox.append(el("div", { class: "notice" }, "Please fill in your name, designation and school to continue."));
      return;
    }
    setUser({ name: vals[0], designation: vals[1], school: vals[2], ts: Date.now() });
    renderHome();
  }
  const submit = el("button", { class: "btn primary lg", style: "width:100%", onclick: doSubmit }, "Continue to mock tests");

  app.append(
    el("div", { class: "wrap", style: "max-width:520px" },
      el("div", { class: "card card-pad", style: "margin-top:6vh; padding:26px" },
        el("div", { class: "brand", style: "margin-bottom:8px" },
          el("span", { class: "brand-badge" }, "2A"),
          el("h1", { style: "margin:0; font-size:22px; font-family:var(--font-display)" }, "TET Paper 2A Mock Tests")),
        el("p", { class: "muted", style: "margin-top:0" },
          "Full-length mock exams and subject practice for AP/TS TET Paper 2A. Tell us who you are before you begin — your name appears on your score reports."),
        el("div", { class: "field", style: "margin-bottom:12px" }, el("label", { for: "w-name" }, "Name"), name),
        el("div", { class: "field", style: "margin-bottom:12px" }, el("label", { for: "w-desig" }, "Designation"), desig),
        el("div", { class: "field", style: "margin-bottom:16px" }, el("label", { for: "w-school" }, "School"), school),
        errBox,
        submit,
        el("p", { class: "tiny", style: "text-align:center; margin:16px 0 0" },
          "Developed by Jayaprakash Alur")
      )
    )
  );
  name.focus();
}

// ---------------- top bar ----------------
function topbar() {
  return el("div", { class: "topbar" },
    el("div", { class: "topbar-inner" },
      el("a", { class: "brand", href: "#/" },
        el("span", { class: "brand-badge" }, "2A"),
        "TET Paper 2A Mock Tests"
      ),
      el("div", { class: "spacer" }),
      el("a", { class: "btn ghost sm", href: "#/practice" }, "Practice"),
      el("a", { class: "btn ghost sm", href: "#/history" }, "My tests")
    )
  );
}

// ---------------- home ----------------
async function renderHome() {
  app.innerHTML = "";
  let index = null;
  try { index = await loadIndex(); } catch {}

  const user = getUser();
  const totalQ = index ? Object.values(index.sections).reduce((a, s) => a + s.count, 0) : 2700;
  const hist = JSON.parse(localStorage.getItem("tet2a.history") || "[]");
  const mine = hist.filter((h) => h.user && user && h.user.name === user.name);
  const best = mine.length ? Math.max(...mine.map((h) => h.percent)) : null;

  const blueprintPills = BLUEPRINT.map((b) =>
    el("span", { class: "sect-pill" },
      el("span", { class: "dot", style: `background:${SECTIONS[b.section].color}` }),
      `${SECTIONS[b.section].short} · ${b.count}`
    )
  );

  app.append(
    topbar(),
    el("div", { class: "wrap" },
      el("div", { class: "hero" },
        el("h1", {}, "TET Paper 2A — Full Mock Test"),
        el("p", {}, (user ? `Welcome, ${user.name}. ` : "") +
          "150 questions · 150 marks · 3 hours. Freshly drawn from a 2,700-question bilingual bank every attempt, with the real exam interface: question palette, timer, mark-for-review and instant section-wise analysis."),
        el("div", { class: "hero-actions" },
          el("button", { class: "btn lg", onclick: (e) => startExam(e) }, "Start Full Mock Test"),
          el("button", { class: "btn lg outline", onclick: () => (location.hash = "#/practice") }, "Practice by section")
        )
      ),
      el("div", { class: "grid cols-3", style: "margin-top:18px" },
        el("div", { class: "card card-pad stat-card" },
          el("span", { class: "num" }, totalQ.toLocaleString()),
          el("span", { class: "muted" }, "questions in the bank"),
          el("span", { class: "tiny" }, "CDP 630 · Telugu 630 · English 720 · Maths 240 · Physics 240 · Biology 240")
        ),
        el("div", { class: "card card-pad stat-card" },
          el("span", { class: "num" }, hist.length ? String(mine.length || 0) : "0"),
          el("span", { class: "muted" }, "attempts taken"),
          el("span", { class: "tiny" }, best != null ? `your best score ${best}%` : "take your first test")
        ),
        el("div", { class: "card card-pad stat-card" },
          el("span", { class: "num" }, "03:00"),
          el("span", { class: "muted" }, "hours per mock"),
          el("span", { class: "tiny" }, "auto-submit when time ends · progress saved on refresh")
        )
      ),
      el("div", { class: "grid cols-2", style: "margin-top:18px" },
        el("div", { class: "card card-pad mode-card" },
          el("h3", {}, "Full mock — exam interface"),
          el("div", { class: "blueprint" }, blueprintPills),
          el("p", { class: "muted", style: "margin:0" },
            "Section tabs & palette, Save & Next / Mark for Review / Clear Response, bilingual questions, keyboard shortcuts, auto-submit, and a full section-wise analysis with review mode."),
          el("div", {}, el("button", { class: "btn primary", onclick: (e) => startExam(e) }, "Start now"))
        ),
        el("div", { class: "card card-pad mode-card" },
          el("h3", {}, "Practice mode"),
          el("p", { class: "muted", style: "margin:0" }, "Pick one subject and any number of questions, with an optional timer. Great for daily drills."),
          el("div", {}, el("button", { class: "btn", onclick: () => (location.hash = "#/practice") }, "Configure practice"))
        )
      ),
      el("div", { style: "text-align:center; margin-top:26px" },
        el("p", { class: "tiny", style: "margin:0" },
          "Answers are graded with no negative marking. Question bank cross-checked against the official keysheet."),
        el("p", { style: "margin:6px 0 0; font-family:var(--font-display); font-size:14.5px; color:var(--ink-2)" },
          "Developed by ", el("b", {}, "Jayaprakash Alur"))
      )
    )
  );

  async function startExam(ev) {
    const btn = ev ? ev.target : null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Drawing questions…";
    }
    try {
      const test = await assembleTest("exam", BLUEPRINT, EXAM_SECONDS);
      setCurrentTest(test);
      location.hash = "#/exam";
    } catch (e) {
      alert("Could not load the question bank: " + e.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Start Full Mock Test";
      }
    }
  }
}

// ---------------- practice setup ----------------
function renderPractice() {
  app.innerHTML = "";
  let section = "cdp";
  let count = 20;
  let timerMin = 0;

  const countInput = el("input", { type: "number", min: "5", max: "200", value: String(count), id: "p-count" });
  countInput.addEventListener("input", () => { count = Math.max(5, Math.min(200, Number(countInput.value) || 20)); });

  const sectBtns = Object.values(SECTIONS).map((s) =>
    el("button", {
      class: "filter-btn" + (section === s.id ? " active" : ""),
      style: `border-color:${section === s.id ? s.color : ""}`,
      onclick: (e) => {
        section = s.id;
        e.currentTarget.parentElement.querySelectorAll(".filter-btn").forEach((b) => { b.classList.remove("active"); b.style.borderColor = ""; });
        e.currentTarget.classList.add("active");
        e.currentTarget.style.borderColor = s.color;
      },
    }, s.name)
  );

  const timerSel = el("select", {},
    el("option", { value: "0" }, "No timer"),
    ...[10, 15, 30, 60, 90, 120, 150, 180].map((m) => el("option", { value: String(m) }, `${m} minutes`))
  );
  timerSel.addEventListener("change", () => (timerMin = Number(timerSel.value)));

  app.append(
    topbar(),
    el("div", { class: "wrap", style: "max-width:760px" },
      el("button", { class: "btn sm", onclick: () => (location.hash = "#/") }, "← Home"),
      el("div", { class: "card card-pad", style: "margin-top:14px" },
        el("h2", { style: "margin:0 0 4px" }, "Practice mode"),
        el("p", { class: "muted", style: "margin-top:0" }, "One section, your choice of length, optional countdown."),
        el("div", { class: "field", style: "margin-bottom:16px" },
          el("label", {}, "Subject"),
          el("div", { style: "display:flex; gap:8px; flex-wrap:wrap" }, sectBtns)
        ),
        el("div", { class: "row" },
          el("div", { class: "field" }, el("label", { for: "p-count" }, "Number of questions"), countInput),
          el("div", { class: "field" }, el("label", {}, "Timer"), timerSel),
          el("div", { class: "field" },
            el("label", {}, " "),
            el("button", {
              class: "btn primary lg",
              onclick: async () => {
                try {
                  const test = await assembleTest("practice", [{ section, count }], timerMin > 0 ? timerMin * 60 : null);
                  setCurrentTest(test);
                  location.hash = "#/exam";
                } catch (e) {
                  alert("Could not load questions: " + e.message);
                }
              },
            }, "Start practice")
          )
        )
      )
    )
  );
}

// ---------------- exam ----------------
function renderExam() {
  const test = getCurrentTest();
  if (!test || test.submitted) {
    location.hash = "#/";
    return;
  }
  app.innerHTML = "";
  mountExam(app, test, {
    onSubmit(t) {
      const entry = saveToHistory(t);
      location.hash = `#/results/${entry.id}`;
    },
  });
}

// ---------------- results / review ----------------
function findEntry(id) {
  return JSON.parse(localStorage.getItem("tet2a.history") || "[]").find((h) => h.id === id);
}

function renderResults(id) {
  const entry = findEntry(id);
  if (!entry) { location.hash = "#/"; return; }
  app.innerHTML = "";
  app.append(topbar());
  const wrap = el("div", {});
  app.append(wrap);
  mountResults(wrap, entry);
}

function renderReview(id, params) {
  const entry = findEntry(id);
  if (!entry) { location.hash = "#/"; return; }
  app.innerHTML = "";
  app.append(topbar());
  const wrap = el("div", {});
  app.append(wrap);
  mountReview(wrap, entry, params);
}

// ---------------- admin review ----------------
async function renderAdmin() {
  app.innerHTML = "";
  app.append(topbar());
  const wrap = el("div", { class: "wrap" });
  app.append(wrap);
  wrap.append(el("button", { class: "btn sm", onclick: () => (location.hash = "#/") }, "← Home"),
    el("h2", { style: "margin:12px 0 4px; font-size:20px" }, "Admin — questions flagged for review"),
    el("p", { class: "muted" }, "Items the extractor could not fully verify. Check them against the source PDF page and correct the section JSON files."));
  try {
    const flagged = await (await fetch(`${DATA_BASE}flagged.json`)).json();
    const byId = {};
    for (const sid of Object.keys(SECTIONS)) {
      const qs = await (await fetch(`${DATA_BASE}${sid}.json`)).json();
      qs.questions.forEach((q) => (byId[q.id] = q));
    }
    const list = el("div", { class: "card", style: "margin-top:12px" });
    let shown = 0;
    for (const f of flagged) {
      const q = byId[f.id];
      if (!q) continue;
      shown++;
      const real = q.question.en || q.question.te || "(no text extracted)";
      list.append(el("div", { class: "rq" },
        el("div", { class: "status-line", style: "display:flex;gap:8px;flex-wrap:wrap" },
          el("span", { class: "chip amber" }, `p.${f.page}`),
          el("span", { class: "chip" }, f.id),
          ...f.reasons.map((r) => el("span", { class: "tiny" }, r))
        ),
        el("div", { style: "margin-top:6px" }, real.slice(0, 220)),
        el("div", { class: "tiny", style: "margin-top:4px" }, q.question.te ? "te: " + q.question.te.slice(0, 120) : null)
      ));
    }
    if (!shown) list.append(el("div", { class: "card-pad muted" }, "Nothing flagged — clean extraction."));
    wrap.append(el("p", { class: "tiny" }, `${flagged.length} flagged items`), list);
  } catch (e) {
    wrap.append(el("div", { class: "notice", style: "margin-top:12px" }, "Could not load flagged.json: " + e.message));
  }
}

// ---------------- router ----------------
function route() {
  cleanupExam();
  const hash = location.hash || "#/";
  const [path, query] = hash.slice(1).split("?");
  const parts = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query || ""));

  if (parts[0] === "admin") {
    if (parts[1] === "review") {
      if (!isAdmin()) { app.innerHTML = ""; return mountAdmin(app); }
      return renderAdmin();
    }
    return mountAdmin(app);
  }
  if (!getUser() && !isAdmin()) return renderWelcome();

  if (parts[0] === "" || parts[0] == null) return renderHome();
  if (parts[0] === "practice") return renderPractice();
  if (parts[0] === "exam") return renderExam();
  if (parts[0] === "results" && parts[1]) return renderResults(parts[1]);
  if (parts[0] === "review" && parts[1]) return renderReview(parts[1], { filter: params.filter || "all", focusId: params.q || null });
  if (parts[0] === "history") { app.innerHTML = ""; app.append(topbar()); const w = el("div", {}); app.append(w); return mountHistory(w); }
  return renderHome();
}

// hidden admin shortcut: hold "a", then press "d"
let aHeld = false;
window.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (e.key === "a" || e.key === "A") aHeld = true;
  if ((e.key === "d" || e.key === "D") && aHeld) {
    aHeld = false;
    location.hash = "#/admin";
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "A") aHeld = false;
});

window.addEventListener("hashchange", route);
route();
