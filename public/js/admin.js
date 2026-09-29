// Hidden admin area: login + all attempts dashboard
import { el, fmtDate, fmtDuration } from "./ui.js";
import { getHistory, setHistory, isAdmin, setAdmin } from "./store.js";

const ADMIN_USER = "jayaprakash";
const ADMIN_PASS = "Ajp@210406";

export function mountAdmin(root) {
  root.innerHTML = "";
  if (!isAdmin()) return mountLogin(root);
  mountDashboard(root);
}

function mountLogin(root, error = "") {
  root.innerHTML = "";
  const user = el("input", { type: "text", placeholder: "Username", autocomplete: "username", id: "ad-u" });
  const pass = el("input", { type: "password", placeholder: "Password", autocomplete: "current-password", id: "ad-p" });
  const err = error ? el("div", { class: "notice", style: "margin-top:10px" }, error) : null;

  function tryLogin() {
    if (user.value.trim() === ADMIN_USER && pass.value === ADMIN_PASS) {
      setAdmin(true);
      mountDashboard(root);
    } else {
      mountLogin(root, "Wrong username or password.");
    }
  }
  [user, pass].forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); }));

  root.append(
    el("div", { class: "wrap", style: "max-width:420px" },
      el("div", { class: "card card-pad", style: "margin-top:8vh" },
        el("div", { class: "brand", style: "margin-bottom:10px" }, el("span", { class: "brand-badge" }, "2A"), "Admin"),
        el("p", { class: "muted", style: "margin-top:0" }, "Restricted area — test attempts and question review."),
        el("div", { class: "field", style: "margin-bottom:12px" }, el("label", { for: "ad-u" }, "Username"), user),
        el("div", { class: "field", style: "margin-bottom:16px" }, el("label", { for: "ad-p" }, "Password"), pass),
        err,
        el("button", { class: "btn primary lg", style: "width:100%", onclick: tryLogin }, "Sign in"),
        el("button", { class: "btn ghost sm", style: "margin-top:10px", onclick: () => (location.hash = "#/") }, "← Back to site")
      )
    )
  );
  user.focus();
}

function mountDashboard(root) {
  const hist = getHistory().slice().sort((a, b) => b.date - a.date);
  const students = new Set(hist.filter((h) => h.user && h.user.name).map((h) => h.user.name));
  const avg = hist.length ? Math.round(hist.reduce((a, h) => a + (h.percent || 0), 0) / hist.length) : 0;
  const best = hist.length ? Math.max(...hist.map((h) => h.percent || 0)) : 0;

  const stats = el("div", { class: "grid cols-3", style: "margin:14px 0" },
    stat(String(hist.length), "total attempts"),
    stat(String(students.size), "students"),
    stat(avg + "%", "average score"),
    stat(best + "%", "best score")
  );
  function stat(num, label) {
    return el("div", { class: "card card-pad stat-card" }, el("span", { class: "num" }, num), el("span", { class: "muted" }, label));
  }

  const list = el("div", { class: "card", style: "overflow:auto" });
  if (!hist.length) {
    list.append(el("div", { class: "card-pad muted" }, "No attempts recorded yet."));
  } else {
    const head = el("div", { class: "hist-item", style: "font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-3)" },
      el("div", { style: "min-width:150px" }, "Student"),
      el("div", { style: "flex:1; min-width:200px" }, "Attempt"),
      el("div", { style: "min-width:90px; text-align:right" }, "Score"),
      el("div", { style: "min-width:120px" }, ""));
    list.append(head);
    hist.forEach((h) => {
      const u = h.user || {};
      list.append(
        el("div", { class: "hist-item" },
          el("div", { style: "min-width:150px" },
            el("div", { style: "font-weight:700" }, u.name || "—"),
            el("div", { class: "tiny" }, [u.designation, u.school].filter(Boolean).join(" · ") || "unknown user")),
          el("div", { style: "flex:1; min-width:200px" },
            el("div", {}, `${h.mode === "exam" ? "Full mock" : "Practice"} · ${h.correct}✓ ${h.wrong}✗ ${h.skipped}—`),
            el("div", { class: "tiny" }, `${fmtDate(h.date)} · ${fmtDuration(h.timeTakenSec)}`)),
          el("div", { style: "min-width:90px; text-align:right" },
            el("span", { class: "chip " + ((h.percent || 0) >= 60 ? "green" : (h.percent || 0) >= 40 ? "amber" : "red") }, `${h.score}/${h.total} · ${h.percent}%`)),
          el("div", { style: "min-width:120px; display:flex; gap:6px; justify-content:flex-end" },
            el("button", { class: "btn sm", onclick: () => (location.hash = `#/review/${h.id}`) }, "Review"),
            el("button", {
              class: "btn sm danger",
              onclick: () => { if (confirm("Delete this attempt?")) { setHistory(getHistory().filter((x) => x.id !== h.id)); mountDashboard(root); } }
            }, "Delete"))
        )
      );
    });
  }

  root.append(
    el("div", { class: "wrap" },
      el("div", { style: "display:flex; align-items:center; gap:12px; flex-wrap:wrap" },
        el("div", { class: "brand" }, el("span", { class: "brand-badge" }, "2A"), "Admin dashboard"),
        el("span", { style: "flex:1" }),
        el("button", { class: "btn sm", onclick: () => (location.hash = "#/admin/review") }, "Question review flags"),
        el("button", { class: "btn sm", onclick: exportAttempts }, "Export CSV"),
        el("button", { class: "btn sm", onclick: () => { setAdmin(false); mountLogin(root); } }, "Sign out")
      ),
      stats,
      list,
      el("p", { class: "tiny", style: "margin-top:14px; text-align:center" }, "Attempts are stored locally in each student's browser.")
    )
  );

  function exportAttempts() {
    const rows = [["date", "name", "designation", "school", "mode", "score", "total", "percent", "correct", "wrong", "skipped", "timeSec"]];
    getHistory().forEach((h) => rows.push([
      new Date(h.date).toISOString(), h.user?.name || "", h.user?.designation || "", h.user?.school || "",
      h.mode, h.score, h.total, h.percent, h.correct, h.wrong, h.skipped, h.timeTakenSec,
    ]));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `tet2a-attempts-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
