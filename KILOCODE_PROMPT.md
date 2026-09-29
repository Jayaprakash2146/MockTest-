# Kilo Code Prompt — TET Paper 2A Mock Test Website

You are a senior full-stack engineer. Build a deployable mock-test website from a PDF question bank.
Work in the phases below, in order. Do not skip the validation steps. Ask me only when something is truly blocked.

Inputs (in the project root):
- `ALL_2A_MATHS_PHYS_IN_ONE_PDF_STU_PEDAKURAPADU.pdf` (208 pages, the question bank)
- `answer_keys.json` (answer keys already parsed and verified; use it as the source of truth for correct answers)

---

## PHASE 1 — Analyse the PDF and convert it to `questions.json`

### What the PDF contains (already analysed)
2,700 multiple-choice questions, 4 options each, in six sections. **Question numbers restart at 1 in every section.**

| Section id | Subject | Questions | Approx. PDF pages (questions / answer key) |
|---|---|---|---|
| `cdp` | Child Development & Pedagogy | 630 | 1-55 / 56-58 |
| `telugu` | Telugu language | 630 | 59-94 / 95-96 |
| `english` | English language | 720 | 96-148 / 149-150 |
| `maths` | Mathematics | 240 | 151-165 / 166 |
| `physics` | Physical Science | 240 | 167-183 / 184-185 |
| `biology` | Biology | 240 | 186-207 / 208 |

Page ranges are approximate because a section can start mid-page. Detect real boundaries from the headers "SUBJECT – 2A – …".

### Layout facts you must handle
1. **Two columns per page.** Read each column top to bottom, left column first. Do not use plain `pdftotext -layout` line order; it interleaves the columns.
2. **Bilingual questions.** CDP, Maths, Physical Science and Biology questions have the English text with a Telugu translation directly under the question and under each option. The Telugu and English section questions are in their own language.
3. **The Telugu text layer is corrupted.** The PDF uses legacy fonts ("Priyaanka", "Mandali"), so extracted Telugu comes out as wrong characters (for example భాష becomes భ్యష). English text extracts fine. **Do not trust extracted Telugu.** Get Telugu from page images: render pages at 200-300 DPI and use a vision-capable model or a Telugu OCR (Tesseract `tel`, or Google Vision / similar). Keep the page-image approach as the reference and spot-check it.
4. **Answer marks in the layout.** A tick such as `✓2` appears beside each question and gives the correct option number. Use it as a cross-check only. The answer tables at the end of each section (in `answer_keys.json`) are authoritative. If the tick and the key disagree, use the key and log the question in `flagged.json`.
5. **Known source defect:** English Q311 has the value `74` in the PDF's own answer table. It is `null` in `answer_keys.json`. Determine the answer from the question page (the tick mark) and flag it for my manual review.
6. Some questions contain formulas, fractions, superscripts and special symbols (Maths, Physical Science). Preserve them. Prefer Unicode or KaTeX (`$...$`). If any question depends on a diagram or an image, crop it to `public/img/<section>-<n>.png` and reference it.

### Target schema — `public/data/questions.json`
```json
{
  "id": "maths-0007",
  "section": "maths",
  "number": 7,
  "question": { "en": "…", "te": "…" },
  "options": [
    { "key": 1, "en": "…", "te": "…" },
    { "key": 2, "en": "…", "te": "…" },
    { "key": 3, "en": "…", "te": "…" },
    { "key": 4, "en": "…", "te": "…" }
  ],
  "answer": 2,
  "image": null,
  "sourcePage": 152,
  "needsReview": false
}
```
- For Telugu-only or English-only sections put the text in the matching language and set the other to `null`. The UI must handle that.
- Split into one file per section as well (`cdp.json`, `telugu.json`, …) so the app can lazy-load.
- Write a reproducible script in `scripts/` (Python or Node) so the conversion can be re-run. Cache page images and OCR output in `scripts/cache/`.

### Validation (mandatory, print a report)
- Count per section must match the table above. Every question has exactly 4 options and `answer` in 1-4.
- `answer` equals `answer_keys.json` for every question. English Q311 is resolved manually.
- Report questions where the English or Telugu text is empty, suspiciously short, or has leftover garbled characters. Put them in `flagged.json` with page numbers and set `needsReview: true`.
- Produce a small **review page in the app at `/admin/review`** (dev only) that shows the source page image next to the parsed question, so I can fix bad items quickly.
- Work in batches (a section at a time). After each section, show me 5 random parsed questions next to their page images before continuing.

---

## PHASE 2 — Build the website

**Stack:** React + Vite + TypeScript + Tailwind, fully static (no backend), state in `localStorage`, deployable to Vercel or Netlify. Use the `Noto Sans Telugu` font. Mobile-first and responsive. Add a PWA manifest only if it is cheap.

### Test blueprint (150 questions, 150 marks, 3 hours)
| Section | Questions |
|---|---|
| Mathematics | 20 |
| Physical Science | 20 |
| Biology | 20 |
| Telugu | 30 |
| English | 30 |
| CDP | 30 |

- Each question is 1 mark. **No negative marking.**
- Each new test randomly draws the required number per section from the bank, without repeating questions from the user's recent tests where possible (track used ids in `localStorage`). Shuffle question order inside each section. Do **not** shuffle options, because the option numbers must match the key.
- Keep the section order fixed as listed above, with section tabs so the user can jump between sections.
- Also offer a **practice mode**: pick one section and a question count, with an optional timer.

### Exam screen
- Timer counting down from 03:00:00, always visible, saved so a refresh or closed tab resumes with the correct remaining time. Auto-submit at 0.
- The question and all four options are shown in **both English and Telugu** at the same time (Telugu directly under English). A language toggle: `English + Telugu` (default) / `English only` / `Telugu only`.
- Buttons: **Save & Next**, **Previous**, **Skip / Next**, **Mark for Review**, **Clear Response**.
- **Question palette** (grid of numbers, grouped by section) with colours and a legend: not visited, not answered (visited but skipped), answered, marked for review, answered + marked. Clicking any number jumps there. Show live counts.
- Users can leave a question and revisit any question at any time before submitting. Skipped questions stay reachable from the palette and a "Go to next skipped" button.
- Keyboard shortcuts (1-4 to pick an option, ←/→ to navigate) on desktop.
- Submit button opens a confirmation summary (answered / skipped / marked counts, time left). Ask for a second confirmation if unanswered questions remain.
- Warn on tab close during a test. No backend or cheating enforcement is needed.

### Results screen
- Total score out of 150, percentage, time taken, and attempted / correct / wrong / unattempted counts.
- **Section-wise table and bar chart:** score out of the section total, correct, wrong, unattempted, and accuracy.
- A clear list of wrong and unattempted questions grouped by section.

### Review mode
- Review every question in the test with: the question in both languages, the user's answer (red if wrong), the correct answer (green), and status (correct / wrong / skipped).
- Filters: All / Wrong / Skipped / Correct / Marked, plus a section filter.
- From the results screen, clicking a wrong question opens it in review at that question, with next/previous within the filtered list.
- Show the question's source (`section #number`) so I can check it against the PDF.

### History
- Save each finished attempt (score, section scores, date, full answers) in `localStorage`. A "My tests" page lists attempts, opens their review, and allows deleting them. Add export/import of history as a JSON file.

---

## PHASE 3 — Quality and delivery
- Unit tests for scoring, section counts, no-duplicate selection, and timer resume.
- A production build that loads quickly (lazy-load section JSON; the full bank should not block the first paint).
- `README.md` with: how to re-run the PDF conversion, how to fix a flagged question, how to run locally, and step-by-step deploy instructions for Vercel and Netlify.
- Final report listing: total questions converted per section, the number flagged for review, and anything you could not do.

## Rules
- Never invent question text or answers. If unsure, flag the question.
- Correct answers come from `answer_keys.json`, not from guesses.
- Keep the code simple and well commented; I will maintain it.
