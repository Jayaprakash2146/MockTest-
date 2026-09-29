# TET Paper 2A — Mock Test Website

A fully static, dependency-free mock-test platform for AP/TS **TET Paper 2A**:
2,700 bilingual questions (CDP, Telugu, English, Maths, Physical Science,
Biology) with full mock exams (150 Q / 150 marks / 3 h), subject practice,
question palette, timer, mark-for-review, instant analysis and review mode.
Deployable on Vercel as a plain static site.

```
├── public/                     ← THE DEPLOYABLE SITE (this is all Vercel needs)
│   ├── index.html              app shell (vanilla ES modules, no build step)
│   ├── styles.css              warm-paper theme
│   ├── manifest.webmanifest    PWA manifest
│   ├── js/                     router, exam, results, review, admin, storage
│   ├── data/                   question bank (lazy-loaded per section) + flagged.json
│   └── img/                    figures for image-based questions
├── vercel.json                 output dir + cache headers
├── .vercelignore               keeps source files out of deploys
├── scripts/                    how data/*.json is produced (see below)
│   ├── fetch_pyqs.py           download + decode tet.pyqs.in subject files
│   ├── fetch_images.py         download + decrypt question figures
│   ├── convert_pyqs.py         convert into public/data/*.json
│   ├── extract_questions*.py   older PDF/TXT converters (provenance)
│   ├── pyqs/ , reports/        pipeline cache + validation reports
│   └── dev/                    reverse-engineering notes & debug tools
├── selftest.html               12 in-browser checks (dev; run from repo root)
├── exam_preview.html           dev harness for the exam screen
├── answer_keys.json            original keysheet (cross-check source)
├── T.E.T.txt , *.pdf           original source material
└── KILOCODE_PROMPT.md          the original brief
```

## Features

- **Full mock (150 Q / 150 marks / 3 h)** with the real exam interface:
  countdown timer (auto-submit, survives refresh), section-wise question
  palette with sequential numbering and the standard colour legend,
  Save & Next / Previous / Skip / Mark for Review / Clear Response,
  keyboard shortcuts (`1-4`, `←`/`→`, `M`, `C`), double-confirm submit,
  warn-on-tab-close.
- **Bilingual display** — `English + Telugu / English / Telugu` toggle;
  the Telugu subject is fully in Telugu.
- **Figure-based questions** rendered from decrypted PNGs with numeric options.
- **Practice mode** — any section, any count, optional timer.
- **Results & review** — score, section bars, wrong/skipped filters, answers.
- **My tests** — attempt history, export/import JSON.
- **Welcome gate** — name, designation and school are recorded with each
  attempt.
- **Hidden admin** (hold `A`, press `D`) — attempts dashboard with CSV
  export and question-flag review.

## Run locally

Any static file server pointed at `public/`:

```
cd "mock test/public"
python -m http.server 8000
# open http://localhost:8000
```

Or from the repo root, the dev harnesses:

```
python -m http.server 8000          # from "mock test"
# open http://localhost:8000/selftest.html   (12 checks)
# open http://localhost:8000/exam_preview.html
```

## Deploy to Vercel

**Option 1 — drag & drop (no tools needed):**
zip the contents of `public/` (or the folder itself) and drop it at
https://vercel.com/new — Framework Preset: *Other*.

**Option 2 — Vercel CLI from the repo root:**

```
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

`vercel.json` already sets the output directory to `public/` and adds
cache headers (`img/` is immutable, `data/` refreshes hourly).
`.vercelignore` keeps the 40 MB PDF, sources and dev scripts out of the
deployment.

## How the question bank was produced

**Primary source — tet.pyqs.in** (the same question bank, bilingual, with the
Telugu subject fully in Telugu):

```
python scripts/fetch_pyqs.py     # downloads + decodes each subject's data file
python scripts/fetch_images.py   # downloads + decrypts question figures
python scripts/convert_pyqs.py   # converts into public/data/*.json
```

The site embeds its bank in an obfuscated form; these scripts reverse the
encoding (base64+xorshift for the index, a character-shift cipher for the
subject files, xorshift for the PNG figures). Answers come from the site's
per-subject key sheets and are cross-checked against `answer_keys.json`
(1 known disagreement: english #67 — the site's key is used and flagged).

**Fallback converter — `scripts/extract_questions_txt.py`** (uses the
`T.E.T.txt` linear text export of the PDF; kept as a provenance/backup
path — the Telugu section is unrecoverable there because the PDF's Telugu
uses legacy non-Unicode fonts).

Latest import: **all six sections exact (630/630/720/240/240/240 = 2,700
questions), every question bilingual (or a decrypted figure), Telugu subject
fully in Telugu, 1 flagged item.**
