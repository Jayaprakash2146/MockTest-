// Small DOM helpers, modal and toast
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v != null && v !== false) node.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

export function toast(message, ms = 2200) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const t = el("div", { class: "toast" }, message);
  root.append(t);
  setTimeout(() => t.remove(), ms);
}

export function showModal({ title, body, actions }) {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";
  const modal = el(
    "div",
    { class: "modal", role: "dialog", "aria-modal": "true" },
    el("div", { class: "modal-head" }, title),
    el("div", { class: "modal-body" }, body),
    el("div", { class: "modal-foot" }, actions)
  );
  const backdrop = el("div", { class: "modal-backdrop" }, modal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  function close() {
    root.innerHTML = "";
  }
  root.append(backdrop);
  return close;
}

export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

export function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
