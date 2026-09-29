// Local persistence helpers
const PREFIX = "tet2a.";

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

export function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}

// settings: language, etc.
export const settings = {
  get lang() { return load("lang", "both"); },
  set lang(v) { save("lang", v); },
};

export function getCurrentTest() { return load("currentTest", null); }
export function setCurrentTest(t) { t ? save("currentTest", t) : remove("currentTest"); }

export function getHistory() { return load("history", []); }
export function setHistory(h) { save("history", h); }

export function getUser() { return load("user", null); }
export function setUser(u) { save("user", u); }

const ADMIN_KEY = "tet2a-admin-session";

export function isAdmin() {
  try { return sessionStorage.getItem(ADMIN_KEY) === "1"; } catch { return false; }
}

export function setAdmin(on) {
  try {
    if (on) sessionStorage.setItem(ADMIN_KEY, "1");
    else sessionStorage.removeItem(ADMIN_KEY);
  } catch {}
}

export function getUsedIds() { return load("usedIds", {}); }
export function setUsedIds(u) { save("usedIds", u); }
