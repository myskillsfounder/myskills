# AI-Powered Data Analytics: course-team report

**Verdict: ready to publish** (27 October 2026). `check.mjs` passes with 0 must-fix and 0 should-fix. Review 3
found no must-fix, and every module scores at least 4 on all eight Module Standard dimensions.

File to load: `docs/programmes/Data analytics/ai-powered-data-analytics.json`. The web address in the Course
engine is `data-analytics`.

## Before learners get it (for Paul)

1. **Deploy the practice data.** The tasks use a free fictional dataset, "Masala Mart":
   - The files are in `public/practice-data/masala-mart/`: `orders.csv`, `orders_raw.csv`, `customers.csv`,
     `products.csv` and `index.html`.
   - `scripts/make-masala-mart.mjs` generates them with a fixed seed, so every number in the task hints stays true.
   - The tasks link to `https://myskills.org.in/practice-data/masala-mart/…`. These files go out with the website PR.
2. **One nginx change for the SQL tasks.** The DuckDB browser shell can only read the files if they are served as
   `text/csv` with `Access-Control-Allow-Origin: *`. The website PR gives the exact lines.
   - Google Sheets (`IMPORTDATA`) and Colab (`pd.read_csv`) don't need this.
3. **Publish it:** Admin → Course engine → Data Analytics → Check & publish → **Replace the draft…** → paste the
   whole file → **Use this file** → **Save draft** → read it → **Publish v1**.

## What changed, round by round

| Round | Teaching (Course Architect) | Tests (Assessment Architect) |
| --- | --- | --- |
| 1 | <ul><li>Learn cards rewritten from 31–77 words to 112–150, each with a worked example and a common mistake.</li><li>Every concept the questions rely on is now taught (correlation vs cause, `$F$1`, SUMIFS, NULLs and `COUNT(*)`, the BETWEEN trap, LAG/LEAD, the LEFT JOIN WHERE trap, pandas `&`, `format=`, the truncated axis).</li><li>Every task now uses the Masala Mart data with free tools.</li><li>Paid and Windows-only tools are flagged, each with a free route.</li><li>Times fixed (m07 120 → 90 min).</li><li>Statistics outcome added.</li><li>The project gains an AI log and says about 20 hours.</li></ul> | <ul><li>All 15 final questions tagged by skill; each foundation skill has 2.</li><li>The INNER JOIN recall question is replaced by a spreadsheets question.</li><li>Every final question now has a scenario, why_wrong and learning_outcome.</li><li>Wrong explanations and a two-answer question fixed.</li><li>Quiz scenarios no longer repeat tasks or card examples.</li><li>Aptitude statements now describe behaviour.</li><li>Rubric rewritten.</li></ul> |
| 2 | <ul><li>m07 cards now show a left merge, `drop_duplicates` vs `subset=`, and turning "₹1,250" into a number.</li><li>m05 card 3 shows `AVG(...) OVER (PARTITION BY ...)`.</li><li>The m03 cleaning task works however Sheets reads "₹150".</li></ul> | <ul><li>f08: why_wrong for LEAD corrected (it lists the months before a rise).</li><li>m05-q4: the fake option replaced with a real mistake.</li><li>m10-q4: "chief financial officer (CFO)" written in full, set in Pune.</li></ul> |
| 3 | <ul><li>m07 card 2's merge line now runs on the card's own data.</li><li>m01 t2 is easier to read on a phone.</li><li>Module ids replaced by module number and title.</li></ul> | <ul><li>m05-q4: the DISTINCT why_wrong now describes DuckDB (it stops with an error), not SQLite.</li></ul> |

Every SQL and pandas answer, and every wrong option, was run against the real files in DuckDB 2.0 and pandas 3.1.

## Numbers (`check.mjs`)

| Item | Count |
| --- | --- |
| Skills | 9 |
| Aptitude statements | 27 |
| Modules | 10 |
| Tasks | 20 |
| Questions | 55, of which 15 are in the final |

- **Hours:** 13.5 of modules, 34 in all (13.5 modules + 20 project + 0.5 final).
- **Right answer is the longest option:** 8 of 55 (14.5%, chance is about 25%).
- **Answer positions:** 14 / 14 / 14 / 13.
- **Difficulty:** Beginner 15 · Intermediate 31 · Advanced 8 · Expert 1.

## Scorecard: first row against last

| Measure | Review 1 | Review 3 |
| --- | --- | --- |
| Review must-fix | 14 | 0 |
| Must-fix per 10 questions | 3.3 | 0 |
| Should-fix per 10 questions | 11.1 | 0.9 |
| Right answer is the longest | 18.2% | 14.5% |
| Questions with why_wrong | 74.5% | 100% |
| Mean module score | 3.5 | 4.6 |
| Lowest module score | 2 | 4 |
| Module dimensions below 4 | 37 | 0 |

## The Module Standard (review 3)

| Module | Outcome | Explanation | Practice | Feedback | Relevance | Time | Progression | Inclusion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Thinking like an analyst | 5 | 5 | 4 | 4 | 5 | 5 | 5 | 4 |
| 2 Spreadsheets | 5 | 4 | 5 | 5 | 5 | 4 | 5 | 4 |
| 3 Cleaning messy data | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 4 |
| 4 SQL foundations | 5 | 4 | 5 | 4 | 5 | 4 | 5 | 4 |
| 5 SQL joins and windows | 4 | 4 | 5 | 4 | 5 | 4 | 5 | 4 |
| 6 Statistics | 5 | 4 | 4 | 4 | 4 | 4 | 5 | 4 |
| 7 Python and pandas | 5 | 4 | 5 | 5 | 5 | 4 | 5 | 4 |
| 8 Dashboards | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 4 |
| 9 AI as your analysis partner | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 4 |
| 10 From numbers to decisions | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 4 |

No score is below 4. These are the 4s worth improving in a later version:
- **Time:** several modules give 90 minutes where review 3 estimates about 57.
- **Inclusion:** some tools are easier on a laptop than a phone.
- **Feedback:** a few why_wrong lines are brief.
- **Relevance:** a few quiz questions have no Indian business setting.

## Still needs a person

- **The deploy and nginx change above.**
- **Decisions for Paul,** from the blueprint's "For the team" section:
  - shuffling option order per student;
  - enforcing the final's 30-minute timer on the server;
  - a project pass rule and rubric weights;
  - an optional objective diagnostic.
- **Python, AI-assisted analysis and storytelling** have one final question each. That meets the rule, but those
  skills' Foundation placement rests on a single question.
- **DPDP:** most duties under the DPDP Rules, 2025 apply from about May 2027, and sources differ on the exact day.
  Module 9 deliberately gives no day. Check MeitY before the next review.

## Sources worth checking

These are in `ai-powered-data-analytics.research.md`:
- **India hiring evidence:** career blogs and press reports. The review couldn't confirm any skill percentages
  from Naukri or LinkedIn directly.
- **DuckDB-Wasm docs:** on reading files from another site, which is why the CORS header is needed.
- **The DPDP Rules, 2025:** notified on 13 November 2025.

## Blueprint

- **RESULT:** Ready (`ai-powered-data-analytics.assessment.md`).
- **The question map** quotes the card sentence each question depends on.
- **The rubric** has full 0–5 level descriptors.
- **Task evidence** has expected results computed from the Masala Mart files.

## Playbook

Five rules were added from this job's reviews:
- **14:** a question or task uses only what a card has shown.
- **15:** never refer to an option by its position.
- **16:** every tools task has free, genuinely live data, served as CSV with CORS where needed.
- **17:** run every code option in the learners' own tool; a card's code line must run on that card's own example.
- **18:** refer to modules by number and title.

`track.mjs report` lists rules 4–8, 10, 11 and 13 as broken in this programme. The 21 October draft predates
most of these rules and was written by hand, so these breaks don't show a written rule failing. No rule was
changed for this.
