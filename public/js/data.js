// Question bank loading + test assembly
import { getUsedIds, setUsedIds } from "./store.js";

export const SECTIONS = {
  maths:   { id: "maths",   name: "Mathematics",                short: "Maths",    color: "#35618E", te: true },
  physics: { id: "physics", name: "Physical Science",           short: "Physics",  color: "#7A6248", te: true },
  biology: { id: "biology", name: "Biology",                    short: "Biology",  color: "#557A46", te: true },
  telugu:  { id: "telugu",  name: "Telugu",                     short: "Telugu",   color: "#B4632F", te: true },
  english: { id: "english", name: "English",                    short: "English",  color: "#7D5474", te: false },
  cdp:     { id: "cdp",     name: "Child Development & Pedagogy", short: "CDP",    color: "#3E7A78", te: true },
};

// Full mock blueprint (150 Q / 150 marks / 3 hours), fixed section order
export const BLUEPRINT = [
  { section: "maths", count: 20 },
  { section: "physics", count: 20 },
  { section: "biology", count: 20 },
  { section: "telugu", count: 30 },
  { section: "english", count: 30 },
  { section: "cdp", count: 30 },
];

export const EXAM_SECONDS = 3 * 60 * 60;

const cache = {};

// resolve the bank relative to this module file, so the app works no matter
// where it is served from (site root, sub-path, Vercel preview, …)
const DATA_BASE = new URL("../data/", import.meta.url).href;
export { DATA_BASE };

export async function loadSection(sectionId) {
  if (!cache[sectionId]) {
    const res = await fetch(`${DATA_BASE}${sectionId}.json`);
    if (!res.ok) throw new Error(`Failed to load ${sectionId}.json`);
    cache[sectionId] = (await res.json()).questions;
  }
  return cache[sectionId];
}

export async function loadIndex() {
  const res = await fetch(`${DATA_BASE}index.json`);
  return res.json();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draw `count` questions from a section, preferring unseen ones.
function drawQuestions(bank, count) {
  const used = new Set(getUsedIds()[bank[0]?.section] || []);
  const fresh = bank.filter((q) => !used.has(q.id));
  const pool = fresh.length >= count ? fresh : bank;
  return shuffle(pool).slice(0, count);
}

export function rememberUsed(questions) {
  const used = getUsedIds();
  for (const q of questions) {
    const list = used[q.section] || (used[q.section] = []);
    if (!list.includes(q.id)) list.push(q.id);
    // keep the most recent 500 per section so old ones become eligible again
    if (list.length > 500) used[q.section] = list.slice(-500);
  }
  setUsedIds(used);
}

// Assemble a test snapshot. sections: [{section, count}]
export async function assembleTest(mode, blueprint, withTimerSeconds) {
  const sections = [];
  const questions = [];
  for (const part of blueprint) {
    const bank = await loadSection(part.section);
    const picked = drawQuestions(bank, part.count);
    sections.push({
      id: part.section,
      name: SECTIONS[part.section].name,
      short: SECTIONS[part.section].short,
      color: SECTIONS[part.section].color,
      qids: picked.map((q) => q.id),
    });
    for (const q of picked) questions.push(q);
  }
  rememberUsed(questions);
  const byId = {};
  questions.forEach((q) => (byId[q.id] = q));
  return {
    id: `t${Date.now()}`,
    mode,
    createdAt: Date.now(),
    endsAt: withTimerSeconds ? Date.now() + withTimerSeconds * 1000 : null,
    durationSeconds: withTimerSeconds || null,
    sections,
    byId,
    order: questions.map((q) => q.id),
    answers: {},
    marked: {},
    visited: {},
    current: 0,
    submitted: false,
  };
}

export function scoreTest(test) {
  const perSection = {};
  for (const s of test.sections) {
    perSection[s.id] = { id: s.id, name: s.name, short: s.short, color: s.color, total: 0, correct: 0, wrong: 0, skipped: 0 };
  }
  let correct = 0, wrong = 0, skipped = 0;
  for (const qid of test.order) {
    const q = test.byId[qid];
    const sec = perSection[q.section] || (perSection[q.section] = { id: q.section, name: q.section, total: 0, correct: 0, wrong: 0, skipped: 0 });
    sec.total++;
    const a = test.answers[qid];
    if (a == null) { sec.skipped++; skipped++; }
    else if (a === q.answer) { sec.correct++; correct++; }
    else { sec.wrong++; wrong++; }
  }
  const total = test.order.length;
  return {
    total, correct, wrong, skipped,
    score: correct,
    percent: total ? Math.round((correct / total) * 1000) / 10 : 0,
    sections: Object.values(perSection),
  };
}
