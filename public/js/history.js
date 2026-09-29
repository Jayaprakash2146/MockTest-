// My tests (history) page with export / import
import { el, fmtDate, fmtDuration } from "./ui.js";
import { getHistory, setHistory } from "./store.js";

export function mountHistory(root) {
  root.innerHTML = "";
  const hist = getHistory();

  const list = el("div", { class: "card", style: "margin-top:14px" });
  if (!hist.length) {
    list.append(el("div", { class: "card-pad muted" }, "No attempts yet. Start a mock test to see your history here."));
  }
  hist.forEach((h) => {
    list.append(
      el("div", { class: "hist-item" },
        el("div", { class: "hist-score" }, `${h.score}`, el("small", {}, ` /${h.total}`)),
        el("div", { style: "flex:1; min-width:180px" },
          el("div", { style: "font-weight:700" }, `${h.percent}% · ${h.mode === "exam" ? "Full Mock" : "Practice"}`),
          el("div", { class: "tiny" }, `${fmtDate(h.date)} · ${fmtDuration(h.timeTakenSec)} · ${h.correct}✓ ${h.wrong}✗ ${h.skipped}—`)
        ),
        el("div", { style: "display:flex; gap:8px; flex-wrap:wrap" },
          el("button", { class: "btn sm primary", onclick: () => (location.hash = `#/results/${h.id}`) }, "Results"),
          el("button", { class: "btn sm", onclick: () => (location.hash = `#/review/${h.id}`) }, "Review"),
          el("button", {
            class: "btn sm danger",
            onclick: () => {
              if (confirm("Delete this attempt?")) {
                setHistory(getHistory().filter((x) => x.id !== h.id));
                mountHistory(root);
              }
            },
          }, "Delete")
        )
      )
    );
  });

  function exportHistory() {
    const blob = new Blob([JSON.stringify(getHistory(), null, 1)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `tet2a-history-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importHistory(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("not a list");
        const existing = getHistory();
        const merged = [...data.filter((d) => d && d.id && d.byId), ...existing.filter((e) => !data.some((d) => d.id === e.id))];
        merged.sort((a, b) => b.date - a.date);
        setHistory(merged.slice(0, 20));
        mountHistory(root);
        alert("History imported.");
      } catch {
        alert("Could not import: invalid file.");
      }
    };
    reader.readAsText(file);
  }

  root.append(
    el("div", { class: "wrap" },
      el("div", { style: "display:flex; align-items:center; gap:12px; flex-wrap:wrap" },
        el("button", { class: "btn sm", onclick: () => (location.hash = "#/") }, "← Home"),
        el("h2", { style: "margin:0; font-size:20px" }, "My tests"),
        el("span", { style: "flex:1" }),
        el("button", { class: "btn sm", onclick: exportHistory }, "Export JSON"),
        el("label", { class: "btn sm", style: "cursor:pointer" }, "Import JSON",
          el("input", { type: "file", accept: "application/json", style: "display:none", onchange: (e) => e.target.files[0] && importHistory(e.target.files[0]) })
        )
      ),
      list
    )
  );
}
