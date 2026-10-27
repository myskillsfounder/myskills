# AI-Powered Data Analytics: assessment blueprint

**File:** `docs/programmes/Data analytics/ai-powered-data-analytics.json`. This is a course-engine programme (web address `data-analytics`), not built in, and not yet published.
**This run:** 27 October 2026, `/course-team improve` round 2. The Assessment Architect fixed the three must-fix and should-fix findings owned by `assessment` in `ai-powered-data-analytics.review-2.json` (f08, m05-q4, m10-q4), after the Course Architect added the card lines asked for in teaching notes T2 to T4. Round 1 fixed every `assessment` finding in `review-1.json`.
**Earlier records:** the 21 October version of this blueprint (its MJ-1 to MN-9 fixes are now applied, below), and `ai-powered-data-analytics-review.md` (now marked superseded).

Ids are written without the `da-` prefix (`m03-q4` means `da-m03-q4`). B, I, A and E stand for Beginner, Intermediate, Advanced and Expert.

---

## ASSESSMENT

| Part | Purpose and skills | Format | Count | Est. time | Scoring | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| Starting self-check (`aptitude`) | The learner's own view of where they start, for each of the 9 skills. It shows what they believe, not what they can do. | First-person statements about behaviour, rated Never / Sometimes / Often / Always. One per skill is reversed. | 27 (3 per skill) | 5 min | Scored per skill on the server, with the reversed item inverted. No right answers. | None. It is not a gate. |
| Module quizzes (`modules[].quiz`) | Whether the learner can apply that module's outcome. One skill per module. | Multiple choice, 4 options, one right answer. 54 of 55 questions now have a scenario (m01-q1 uses `context`). | 4 per module, 40 in all | 5–6 min each | Percentage = marks earned ÷ marks available × 100. Marks come from difficulty, set by code: B 5, I 10, A 15, E 20. No negative marking; an unanswered question earns 0. | 60%. With the new labels, 3 of 4 right passes every module (worst case 63%). A module is done when its tasks and reflection are written and its quiz is passed. |
| Final (`final`) | The Foundation assessment. It covers all 6 outcomes and all 9 skills, and every question names its `skill`, so students are placed skill by skill. Questions combine modules. | Multiple choice, 4 options, every question in a scenario | 15 | 30 min (`minutes`). About 22 min of reading and thinking, so second-language readers have room. | As for quizzes. 155 marks: 4 B, 7 I, 3 A, 1 E, a mean of 10.3 marks a question against 9.25 in the quizzes. | 60% (`pass_percent`). A failed final can be retaken after 7 days. Tell learners both before they start. |
| Project (`project.rubric`) | Practical competence: the real evidence of job-ready skill | A mentor-graded portfolio project with 6 deliverables | 5 criteria, 0–5 each | About 20 h of work, then a 3-min walkthrough | The mentor scores each criterion 0–5 against the descriptors in Practical evidence. The proposed weights are below; the engine doesn't store weights yet. | Not set in the engine yet (For the team). |

A high quiz or final score shows understanding, not job-ready skill. The project is the evidence of practical competence. New engine programmes earn a badge and certificate only (no Global Readiness points) until score v8 is decided.

---

## Question map

**Outcomes** (from `overview.outcomes`):
- O1: turn a vague question into an analysis plan.
- O2: clean, combine and summarise in spreadsheets, SQL and pandas.
- O3: tell a real change from noise.
- O4: build a dashboard that flags problems.
- O5: use AI and check it.
- O6: present a recommendation.

**Types:** Concept, Applied, Code (code, formula or query), Interp (reading data), Scenario (a decision in a case).

**Card:** the card sentence each question depends on (`m02c3` means module 2, card 3). Pre: the earlier modules it relies on.

### Module quizzes

| Id | Skill | Out. | Tests | Type | Diff | Sec | Pre | Card sentence it depends on |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m01-q1 | data-literacy | O1 | Agree on the decision and the measure first | Scenario | B | 60 | – | m01c1 "before you open a spreadsheet, answer four questions" |
| m01-q2 | data-literacy | O1 | A store code is a label, not a quantity | Applied | B | 40 | – | m01c2 "Numbers that are really labels: order ID, phone number, PIN code." |
| m01-q3 | data-literacy | O1 | Median, not mean, with outliers | Interp | I | 60 | – | m01c3 "look at the spread too: the minimum, the maximum and the median" |
| m01-q4 | data-literacy | O1, O3 | Correlation isn't cause; test it | Scenario | I | 75 | – | m01c3 "Only a fair comparison shows cause … picked at random" |
| m02-q1 | spreadsheets | O2 | A table picks up new rows | Scenario | B | 50 | – | m02c1 "A table grows with new rows, so formulas and pivot tables keep working." |
| m02-q2 | spreadsheets | O2 | XLOOKUP with a not-found value | Code | I | 75 | – | m02c2 "what to find, where to look, what to bring back, and what to show if it is missing" |
| m02-q3 | spreadsheets | O2 | The average of a 1/0 column is a rate | Applied | I | 60 | – | m02c3 "The average of 1s and 0s is the share returned" |
| m02-q4 | spreadsheets | O2 | `$H$1` versus `$H1`, `$B2`, `$B$2` | Code | I | 60 | – | m02c1 "The $ before F fixes the column, and the $ before 1 fixes the row." |
| m03-q1 | data-cleaning | O2 | Remove true duplicates, log it | Scenario | B | 60 | – | m03c2 "removed exact duplicate rows … 1,200 → 1,163 rows" |
| m03-q2 | data-cleaning | O2 | Work out a date format from values above 12 | Interp | B | 45 | – | m03c1 "enquiry_date: some as 03/04/2026" (and the reasoning that months run 1 to 12) |
| m03-q3 | data-cleaning | O2 | Trim, map variants, then verify | Scenario | I | 60 | M2 | m03c2 "trimmed spaces … mapped "jaipur" and "JAIPUR" to "Jaipur" with a two-column mapping tab" |
| m03-q4 | data-cleaning | O2, O6 | Missing not at random flatters the average | Interp | I | 75 | – | m03c3 "leaving the blanks out makes deliveries look a little faster than they are" |
| m04-q1 | sql | O2 | GROUP BY + COUNT | Code | B | 50 | – | m04c2 "Every column in SELECT must be in the GROUP BY or inside a summary function." |
| m04-q2 | sql | O2 | HAVING filters totals | Code | I | 50 | – | m04c3 "WHERE filters rows before grouping. HAVING filters groups after it." |
| m04-q3 | sql | O2 | `IS NULL`, not `= NULL` | Code | I | 60 | – | m04c3 "Writing = NULL never finds a row, because nothing equals unknown." |
| m04-q4 | sql | O2 | AVG skips NULLs; who is in the average | Interp | I | 60 | M3 | m04c3 "AVG, SUM and COUNT(column) skip NULLs. COUNT(*) counts every row." |
| m05-q1 | sql | O2 | LEFT JOIN: date test in ON, not WHERE | Code | A | 100 | M4 | m05c1 "a WHERE condition on an orders column … drops C … Put that condition in the ON clause instead." |
| m05-q2 | sql | O2 | Join fan-out inflates revenue | Interp | I | 75 | M4 | m05c2 "A join can multiply rows. This is called fan-out." |
| m05-q3 | sql | O2 | ROW_NUMBER with DESC for the latest row | Code | I | 75 | M4 | m05c3 "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) numbers each customer's orders" |
| m05-q4 | sql | O2 | Each city's own average on every order: PARTITION BY, not ORDER BY | Code | A | 75 | M4 | m05c3 "AVG(order_value) OVER (PARTITION BY city) puts each city's average on every order row" |
| m06-q1 | statistics | O3 | Why randomise instead of opt-in | Scenario | B | 50 | M1 | m06c3 "Random assignment balances everything else" |
| m06-q2 | statistics | O3 | Small samples are uncertain | Interp | I | 60 | – | m06c2 "Bigger samples give narrower ranges." |
| m06-q3 | statistics | O3 | Peeking and stopping early | Scenario | A | 75 | – | m06c3 "checking every day and stopping the moment it "looks good"" |
| m06-q4 | statistics | O3 | Selection bias (renewers only) | Scenario | I | 75 | – | m06c2 "Then ask who answered." |
| m07-q1 | python | O2 | `groupby` + sum | Code | B | 45 | M4 | m07c2 `ok.groupby("customer")["amount"].sum()` |
| m07-q2 | python | O2 | `format=` is strict; `dayfirst` only prefers | Code | I | 75 | M3 | m07c2 "format= … stops with an error if a row doesn't fit. dayfirst=True only prefers day-first; it is not strict." |
| m07-q3 | python | O2 | A left merge keeps rows, with NaN | Code | I | 60 | M5 | m07c2 "how=\"left\" keeps every order, like a LEFT JOIN. Where no product matches, the new columns are NaN" |
| m07-q4 | python | O2 | `&` with brackets | Code | I | 60 | – | m07c3 "Put brackets round each condition … Leaving out the brackets gives an error too." |
| m08-q1 | visualisation | O4 | A line chart for a trend | Scenario | B | 40 | – | m08c1 "Change over time: a line chart." |
| m08-q2 | visualisation | O4 | A truncated axis exaggerates | Interp | I | 60 | – | m08c1 "a bar chart whose axis doesn't start at zero" |
| m08-q3 | visualisation | O4 | The top of a dashboard = the measure against target | Scenario | I | 75 | M1 | m08c2 "Are we on track? Key numbers against their targets." |
| m08-q4 | visualisation | O4, O5 | Reconcile a Copilot measure with SQL | Scenario | A | 90 | M5 | m08c3 "check it against a total you trust before you share it" |
| m09-q1 | ai-analytics | O5 | A prompt with tool, schema, measure, period | Applied | B | 75 | M4 | m09c1 "It names the tool, the table, the columns, what they mean, and the output wanted." |
| m09-q2 | ai-analytics | O5 | Verify independently | Scenario | I | 60 | M2, M7 | m09c2 "Compare a total with a source you trust." |
| m09-q3 | ai-analytics | O5 | Personal data and approved tools | Scenario | I | 60 | – | m09c3 "share only the column names and a made-up row" |
| m09-q4 | ai-analytics | O5 | An invented column means re-check it all | Scenario | I | 60 | M4 | m09c2 "It can invent column names" |
| m10-q1 | storytelling | O6 | Lead with the recommendation | Scenario | B | 50 | – | m10c1 "start with the recommendation and the number behind it" |
| m10-q2 | storytelling | O6 | Finding versus insight with an action | Applied | I | 60 | – | m10c2 "A finding says what the data shows. An insight says why it matters. An action says what to do next." |
| m10-q3 | storytelling | O6 | State the limits of the data | Scenario | I | 60 | M6 | m10c3 "State the period, the data source, the sample size and what you couldn't check." |
| m10-q4 | storytelling | O6, O3 | Net impact in money, against similar shoppers who didn't join | Scenario | A | 90 | M6 | m10c3 "Customers chose the trial kit themselves, so keen buyers may have picked it."; m10c2 "Write job titles and terms in full the first time" |

### Final (Foundation assessment)

| Id | `skill` | Also uses | Out. | Tests | Type | Diff | Sec | Pre | Card sentence it depends on |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| f01 | data-literacy | – | O1 | The answerable version of "is marketing working?" | Scenario | B | 60 | M1 | m01c1 the four questions |
| f02 | visualisation | statistics | O4, O3 | Alert rule against normal variation | Scenario | I | 90 | M6, M8 | m06c1 "Numbers move around even when nothing has changed"; m08c2 "Use colour only to point at what needs action." |
| f03 | spreadsheets | data-cleaning | O2 | A lookup fails on hidden spaces | Scenario | I | 75 | M2, M3 | m02c2 ""N-202 " with a trailing space won't match "N-202""; m03c2 trim whitespace |
| f04 | data-cleaning | python, ai-analytics | O2, O5 | AI-suggested `drop_duplicates(subset=…)` removes real students | Scenario | A | 100 | M3, M7, M9 | m09c2 "AI can write code that runs but answers a different question."; m07c3 "subset=\"customer_id\" compares only that column, so it would also delete every repeat order." |
| f05 | data-cleaning | storytelling | O2, O6 | Report who is missing from an average | Scenario | I | 60 | M3, M10 | m03c3 "A blank is unknown, not zero." |
| f06 | sql | – | O2 | Read WHERE + GROUP BY + COUNT | Code | B | 50 | M4 | m04c2 GROUP BY example |
| f07 | spreadsheets | data-cleaning | O2 | A pivot table can't add text ("Rs 1,250/-") | Scenario | I | 75 | M1, M2, M3 | m01c2 "a SUM skips text"; m02c3 pivot table |
| f08 | sql | – | O2, O3 | LAG in a WITH step, then filter | Code | A | 100 | M4, M5 | m05c3 "LAG(x) OVER (ORDER BY …) brings in the value from the row before … You can't use a window function in WHERE. Work it out in a WITH step" |
| f09 | data-literacy | statistics | O1, O3 | A mean far above the median | Interp | I | 60 | M1 | m01c3 "An average can hide what is going on." |
| f10 | statistics | – | O3 | A 0.1-point gap on day 5 of 14 | Scenario | A | 90 | M6 | m06c3 "A free online A/B test calculator compares the two groups … Early gaps are often noise." |
| f11 | statistics | storytelling | O3, O6 | Act on the overall result; a small subgroup is uncertain | Scenario | E | 120 | M6, M10 | m06c2 "From 50 answers … anywhere from about 60% to 85%"; m10c3 |
| f12 | python | sql | O2 | A one-to-many merge repeats rows | Interp | I | 75 | M5, M7 | m07c3 "If either grows after a merge, rows were duplicated, like a fan-out in SQL."; m07c2 "Leave how= out and only matching rows stay." |
| f13 | visualisation | – | O4 | Sorted bars for 11 categories | Scenario | B | 45 | M8 | m08c1 "a sorted bar chart shows the order at once" |
| f14 | ai-analytics | – | O5 | Reproduce an AI figure before it goes to the board | Scenario | B | 60 | M9 | m09c2 "Asking the same AI "is this right?" is not a check." |
| f15 | storytelling | ai-analytics, statistics | O6, O5 | Pick the AI-drafted opening that leads and states the evidence exactly | Scenario | I | 90 | M6, M9, M10 | m10c1 "start with the recommendation and the number behind it"; m10c3 |

**Difficulty mix:**

| | B | I | A | E | Mean marks a question |
| --- | --- | --- | --- | --- | --- |
| Final, 21 October | 5 | 7 | 3 | 0 | 9.33 |
| Final now | 4 | 7 | 3 | 1 | 10.33 |
| Quizzes now | 11 | 24 | 5 | 0 | 9.25 |

`finalPrompt()` asks for about 4/6/4/1. The final is 4/7/3/1: f12 is labelled Intermediate because the fan-out point was met in m05-q2, and the label is honest rather than chosen to hit the mix. The final is harder on average than the quizzes.

---

## Coverage map

### Outcomes

| Outcome | Module quizzes | Final | Project criterion | Gaps |
| --- | --- | --- | --- | --- |
| O1 Frame a vague question | m01-q1–q4, m08-q3 | f01, f09 | framing | None |
| O2 Clean, combine, summarise | M2–M5, M7 (20 questions) | f03–f08, f12 | data, analysis | None |
| O3 Real change versus noise | m06-q1–q4, m01-q4, m10-q4 | f02, f09, f10, f11 | analysis | None |
| O4 Dashboard that flags problems | m08-q1–q4 | f02, f13 | dashboard | None |
| O5 Use AI and check it | m08-q4, m09-q1–q4 | f04, f14, f15 | analysis ("AI help disclosed and checked") | Personal data is tested once (m09-q3). Accepted. |
| O6 Recommendation with limits | m10-q1–q4, m03-q4 | f05, f11, f15 | recommendation | None |

### Skills (the publish rule: each foundation skill needs 2 tagged final questions, every skill at least 1)

| Skill | Module (level) | Self-check | Quiz | Final (`skill` tag) | Count | Project |
| --- | --- | --- | --- | --- | --- | --- |
| data-literacy | m01 (foundation) | a01–a03 | 4 | f01, f09 | **2** | framing |
| spreadsheets | m02 (foundation) | a04–a06 | 4 | f03, f07 | **2** | analysis, dashboard |
| data-cleaning | m03 (foundation) | a07–a09 | 4 | f04, f05 | **2** | data |
| sql | m04 (foundation), m05 | a10–a12 | 8 | f06, f08 | **2** | analysis |
| statistics | m06 | a13–a15 | 4 | f10, f11 | 2 | analysis |
| python | m07 | a16–a18 | 4 | f12 | 1 | analysis |
| visualisation | m08 | a19–a21 | 4 | f02, f13 | 2 | dashboard |
| ai-analytics | m09 | a22–a24 | 4 | f14 | 1 | analysis |
| storytelling | m10 | a25–a27 | 4 | f15 | 1 | recommendation |

python, ai-analytics and storytelling are also exercised by f04, f12 and f15 respectively, but each final question can carry only one tag.

---

## Practical evidence

The engine stores task answers but doesn't grade them. A mentor, or a later AI check that a person confirms, should look for the following. Judge the output and the reasoning, never a self-rating. The figures below were computed on 27 October 2026 from `public/practice-data/masala-mart/` with DuckDB.

### Module tasks

| Task | Expected output | A competent result shows | Errors to look for |
| --- | --- | --- | --- |
| M1 t1 Sharpen a vague question | 2–3 questions about the Hyderabad café, each with the four parts | Defines "losing" in data (e.g. no visit in 60 days), names the customers and a period; each question leads to a decision | Restates the vague question; no definition of "losing" |
| M1 t2 Spot the wrong type | Each column typed; two broken columns named | order_value with ₹ is text, so a SUM skips it; order_date as text sorts like a word; city typed inconsistently ("bengaluru"); the average of returned is the return rate | Calls order_id or customer_id a number to add |
| M2 t1 Return rate by payment method | Pivot table and a SUMIFS/COUNTIFS check | COD 17.3%, UPI 5.3%, Card 3.9%; the formula matches the pivot | "% of column total" (each method's share of returns) |
| M2 t2 Bring in the category | XLOOKUP filled down; misses counted | 58 rows show Not found, SKUs MM-GB-04 and MM-BL-07; revenue by category | VLOOKUP with TRUE; no not-found value |
| M3 t1 Clean the raw export | A cleaning log with a row count per step | Ends with 2,030 rows, 10 cities and a total of ₹7,55,512 (matching orders.csv); dates read day first | Dates read month-first; cities fixed by deleting rows |
| M3 t2 Decide about blanks | Three averages and a note | 40 (blanks left out), 36 (filled with 0), 45 (staff estimate: (1,800 + 450) ÷ 50); reports 40 or 45 with a note that the 5 slowest are missing | Reports 36; no note |
| M4 t1 Orders by payment method in April | Query and result | UPI 101 orders ₹29,304; COD 36, ₹16,699; Card 28, ₹8,890 (165 in all); a half-open date range | BETWEEN on dates without the end of 30 April (harmless here, since order_date is a DATE, but the habit matters) |
| M4 t2 Run it, then explain it | A plain-English paragraph | 7 cities; Lucknow (57), Jaipur (85) and Kochi (93) have fewer than 100 kept orders, so HAVING leaves them out; small groups give unreliable averages | Says HAVING filters rows |
| M5 t1 Silent customers | Query and count | 259 customers signed up in 2026 with no order (325 without the 2026 condition) | INNER JOIN; a date test on the orders side in WHERE |
| M5 t2 First order or repeat? | Query and share | 75.1% of April 2026 revenue came from repeat orders, numbering over the whole history (order_date, then order_id) | Numbering only April orders, which gives a far smaller share |
| M6 t1 Design a test | A five-heading plan | Random split at the same time in every city; one primary measure (paid sign-ups); a fixed run covering full weeks; the decision rule set before the start | Splitting by city or week; stopping when it looks good |
| M6 t2 Noise or signal? | Statistics and 3–4 sentences | Mean 44.5, min 38, max 52, STDEV about 4.25; ₹54,000 is about 2.2 SDs above the mean: unusual, but one day; check the weekday, a salary day or a festival, and watch more days | "The layout worked" |
| M7 t1 Clean and summarise | df.shape after each step and a category table | Rows after drop_duplicates match orders.csv; 58 rows without a category after the left merge; April–June kept orders totalled by category | Month-first dates; `and` instead of `&` |
| M7 t2 Read the code, then run it | A line-by-line explanation | subset="customer_id" removes every repeat order of a customer, so revenue falls; plain drop_duplicates() removes only identical rows | Calls the customer_id version correct |
| M8 t1 Build the dashboard | A link or screenshot and one sentence | September: revenue ₹81,581 against ₹85,000 (miss), 195 orders against 200 (miss), return rate 4.1% against under 5% (met); revenue by city sorted (Mumbai, Bengaluru, Delhi first); a monthly line from October 2025 | Truncated axes; colour on everything |
| M8 t2 Fix a bad chart | A redraw and two sentences | Third city is Delhi (₹1,05,593); a sorted bar chart from zero makes it obvious | A taste-only critique |
| M9 t1 Prompt, then check | Prompt, query, one month's result and three checks | The prompt defines "repeat customer" and gives the columns and DuckDB; checks are a hand count of one month, a total against orders.csv, and reading the definition | "I asked the AI again" as a check |
| M9 t2 Catch the error | A corrected sentence | Q1 ₹1,40,355 → Q2 ₹1,74,780 is +24.5%, not 60%; Bengaluru did add the most (+₹10,243), so that part holds | Accepts 60% |
| M10 t1 Write the memo opening | A first paragraph | Recommendation first (e.g. a COD fee or a prepaid nudge), COD 17.3% against UPI 5.3% with the ₹90 cost, and a caveat: customers chose how to pay, so a test would confirm | Method first; claims COD *causes* returns |
| M10 t2 Turn findings into actions | 3 insights and 3 actions | Small, testable actions (pre-order counter, a second till at 12:30, pre-packed meals) tied to each finding | Restates the findings |

### Project rubric

The engine stores `id`, `name` and a one-line `description` (now the Competent level below), and the mentor grades each criterion 0–5. The weights are a **proposal**; until the engine stores weights, the criteria count equally.

| Criterion | Weight (proposed) | Evidence required |
| --- | --- | --- |
| framing: Problem framing | 15% | Problem statement (deliverable 1); the mentor's notes from choosing the question |
| data: Data quality | 20% | Raw file kept, cleaned dataset, data dictionary, cleaning log with rows affected (deliverable 2) |
| analysis: Analysis | 25% | Queries or notebook with comments (deliverable 3); one key figure reproduced a second way; the AI log (deliverable 6) |
| dashboard: Dashboard | 20% | One-page dashboard (deliverable 4) |
| recommendation: Recommendation | 20% | Memo and 3-minute walkthrough (deliverable 5); the learner's answers to the mentor's questions about their own work |

| Criterion | Beginning (0–1) | Developing (2) | Competent (3) | Proficient (4) | Advanced (5) |
| --- | --- | --- | --- | --- | --- |
| framing | No decision named, or the question is "analyse sales" | A topic and a decision-maker, but no measure or period | One decision, its owner, a success measure and a period, agreed with the mentor | As 3, plus what result would change the decision | As 4, plus scope limits and the next question it leads to |
| data | Raw data changed in place; no log | Some cleaning; partial log; row counts not checked | Raw file kept; every step logged with rows affected; duplicates, types, categories and blanks handled; gaps stated | As 3, plus totals reconciled before and after, and blanks checked for a pattern | Fully repeatable (script or Power Query); every field defined; the cleaning's effect on results measured |
| analysis | Code fails, or answers a different question | Runs, but has an unchecked join or a wrong grouping; no cross-check | Correct SQL or pandas; joins checked for double counting; a key number reproduced another way; AI help disclosed in the log and checked | As 3, plus variation or sample size considered before claiming a change | As 4, plus a fair comparison (a control group, or before/after with a seasonality check) and clear, reusable code |
| dashboard | Charts with no purpose | Right chart types, but no target or decision; cluttered | Built around the decision: key numbers against target, the breakdown and a trend; honest axes; readable on one screen | As 3, plus problems flagged against the normal range, and filters that matter | As 4, plus a user tried it and the design changed because of that |
| recommendation | None, or it doesn't follow from the analysis | Buried after the method; no number | Opens with the decision and its ₹ impact, gives the evidence, states limits; in the walkthrough the learner explains every step | As 3, plus risks, what to monitor, and a next step with an owner | As 4, plus alternatives weighed and the uncertainty given in numbers |

**Against AI-written or outsourced work:** no AI-detection tools. The defences are the AI log, the cleaning log and notebook history (intermediate work), the walkthrough, and the mentor asking the learner to explain or rerun one step live.

---

## QUALITY REVIEW

### How it was checked (27 October 2026)

- I answered every new and changed question before looking at `correct_index`, then printed every key after the tidy: all 55 keys are the intended answers.
- Code and arithmetic, run in a scratch environment (pandas 3.1.0, DuckDB 2.0.0 via Python, SQLite 3.50.4):
  - f08: the LAG-in-a-CTE query lists the falling months; LAG in WHERE raises an error (DuckDB and SQLite); LEAD lists the months before a rise (orders 100, 120, 90, 110, 80: LAG gives months 3 and 5, LEAD gives 1 and 3); PARTITION BY month returns nothing. Round 1 wrote "before a fall" here and in the `why_wrong` without running it; both are corrected.
  - m05-q4: on two cities, `AVG(value) OVER (ORDER BY city)` gives the first city its own average but the second city a running average of both (850 against its own 1,500); `SELECT DISTINCT city, AVG(value)` with no GROUP BY stops with an error in DuckDB (run in DuckDB 2.0.0, 2026-10-27: "column city must appear in the GROUP BY clause"), so its `why_wrong` now says so, matching da-m04-q1 (round 2 had said it returns one row, which is SQLite's behaviour).
  - m05-q1: the ON version lists the right students; the WHERE version and the INNER JOIN return nothing; IS NOT NULL lists those who applied.
  - m05-q3: DESC picks the latest visit; ascending picks the first; partitioning by patient and date gives 1 on nearly every row.
  - m04-q4: AVG skips NULLs, and COUNT(*) counts every row. m04-q1 without GROUP BY and m04-q2 with SUM in WHERE both raise errors.
  - m07-q4: `and` raises ValueError; no brackets raises TypeError (matches m07c3).
  - m07-q2: `format="%d/%m/%Y"` errors on a non-matching row. `dayfirst=True` with a first row of 04/13/2026 reads the whole column month-first (05/04/2026 becomes 4 May) with only a UserWarning. `%m/%d/%Y` and `errors="coerce"` read 05/04/2026 as 4 May.
  - f12: a one-to-many merge multiplies rows and the order total; int against str keys raises an error (ValueError, pandas 3.1.0).
  - m07-q3: a left merge keeps the order whose customer_id is missing, with NaN in the customer columns. f04: on three rows with one name, `drop_duplicates()` keeps 2 and `subset="student_name"` keeps 1.
  - Statistics: f10 z = 0.80, p = 0.42; f11 overall z = 8.23, Tier-3 z = −0.72, p = 0.47; m08-q2 an axis from ₹48 lakh draws 50 and 52 as 2 and 4 units (twice).
  - m01-q3: the mean is ₹3,680–4,150; the median is between ₹2,000 and ₹2,500.
- **Clue check (check.mjs):** the right answer is strictly the longest option in 8 of 55 (15%). Answer positions 14/14/14/13, with no repeated pattern.
- **Contexts:** no quiz or final scenario uses a Learn card's business or a task's scenario (searched for every card and task context the Course Architect listed).

### Verdicts

| Dimension | Verdict | Basis |
| --- | --- | --- |
| Accuracy | **Good** | Every key is right, and every code and number claim was run. The three earlier imprecisions are fixed (m01-q3 median, m04-q4 COUNT(*), m08-q2 "three times", now recast as "twice"). |
| Alignment with outcomes | **Good** | Each quiz question depends on a sentence in its own or an earlier module (table above). The overview now has a statistics outcome (O3). |
| Coverage | **Good** | All 6 outcomes and 9 skills are in the final. Every foundation skill has 2 tagged final questions. |
| Difficulty | **Good** | The final (10.33 marks a question) is harder than the quizzes (9.25). The 6 inflated labels are corrected; 3 of 4 right now passes every module. |
| Fairness and clarity | **Good** | Indian contexts across many cities and sectors; no paid tool needed to answer; nothing needs local knowledge. Sentences in stems and explanations are 23 words or fewer. |
| Scoring validity | **Good** | Weights match the labels (set by code). No module fails a learner with 3 of 4 right. |
| Integrity | **Good, with one open risk** | No answer pattern. The same option order is shown to every learner, so a shared key would still work (For the team, 1). |

### What round 2 changed

- **f08** (must-fix): `why_wrong` now says LEAD lists the months just before a rise, not the months that fell. Checked in SQLite.
- **m05-q4**: the "compare by eye" option is replaced by `AVG(value) OVER (ORDER BY city) alongside each order`, a real window mistake. Because that option also keeps every row, the stem now asks which approach puts each city's own average next to every order, so only PARTITION BY is right. The DISTINCT option reads "then sort by the average" so the right answer is not the longest.
- **m10-q4**: the scenario is now the chief financial officer (CFO) of a Pune supermarket chain, six months after launch. The right option compares members with "similar shoppers who didn't join" (taught by m10c3's self-selection caveat) instead of the untaught "matched group". Two wrong options were lengthened so the right one is not the longest.
- The four ideas in review-2 owned by `assessment` (settings for six questions, m06-q3, f03, a25) are not done this round.

### What round 1 changed (part by part)

**Self-check.** a05, a10, a11, a12, a14 and a16 now describe behaviour (MN-7). a12 stays reversed.

**Rubric.** All five descriptions replaced with the Competent lines above. The analysis line now covers AI use and checking (O5); the recommendation line requires the learner to explain every step.

**Quizzes.**
- Rule 11 clashes resolved: m02-q3 (now a Dehradun gym's trial classes), m03-q4 (a Vellore hospital's waiting log), m05-q1 (a placement cell), m09-q1 (a bus-booking app). m08-q2 no longer uses the card's ₹100/101/102 lakh numbers.
- Recall turned into application: m02-q4 (choose the right `$` placement), m05-q3 (latest visit, DESC), m07-q2 (`format=` against `dayfirst`), m05-q1 (the LEFT JOIN WHERE trap).
- Second answer removed: m03-q4 (MJ-4).
- Explanations: m04-q4 no longer says every summary function skips NULLs, and its right option is no longer the only one with a reason; m04-q2 explained in two sentences.
- `why_wrong` names each option's mistake, never by position: m02-q2, m03-q3, m09-q1, m10-q1, m10-q2, and the others rewritten.
- Weak options replaced: m01-q3 (midpoint), m01-q4 (switch on for low scorers), m07-q4 (missing brackets), m08-q1 (sorted bar instead of donut), m09-q3 (initials).
- Scenarios added to all 17 questions that had none.
- Relabels: m03-q4, m04-q4, m05-q3, m07-q4, m09-q4 to Intermediate; m02-q4 to Intermediate (four near-identical formulas); m05-q1 to Advanced (the ON/WHERE trap).

**Final.** Every question has `skill`, a scenario, `why_wrong` and `learning_outcome`.
- Replaced: f02 (the red stores), f03 (SKUs with hidden spaces), f04 (the AI's cleaning step), f07 (the pivot table that won't add up, replacing INNER JOIN recall), f08 (LAG in a WITH step, replacing its definition), f11 (the checkout test, Expert), f15 (the memo's first line).
- Fixed: f05 ("satisfaction score" to "average income"), f09 (no untaught word "skewed"), f10 (the planned length is now in the scenario, and the calculator taught in m06c3 replaces the untaught "significance check").
- Contexts moved off card examples: the blueprint's draft f02 to f04 used a pharmacy chain, Nagpur and Kota; they are now Tiruchirappalli, Vijayawada and Shillong.

### Duplicate or weak questions

| Pair | Verdict |
| --- | --- |
| f03 / f07 | Both concern values that look right but aren't stored the way a function needs. They test different tools and causes (a lookup and hidden spaces; a pivot SUM and "Rs …/-" text). Keep both. |
| f04 / M7 t2 | Same idea as the task (drop_duplicates with a subset removes real rows), different data and an AI trigger. A final may build on a task. Keep. |
| f09 / m01-q3 | Same idea, reversed: m01-q3 picks the statistic, f09 interprets the gap. Keep. |
| f12 / m05-q2 | Fan-out in pandas and in SQL. Keep, labelled Intermediate. |
| f14 / m09-q2 | Both say "verify independently", with different triggers. Keep. |
| f10 / m06-q3 | Both concern stopping early; f10 adds a tiny gap to judge against chance. Keep. |

**Wrong answers or explanations:** round 2 corrected two wrong explanations: f08 (LEAD lists the months before a rise, not a fall) and m05-q4 (DISTINCT with AVG and no GROUP BY is not one row per city); round 3 corrected m05-q4 again: in DuckDB that query stops with an error, it does not return one row. None known now.

### Teaching notes (for the Course Architect)

T2 to T4 are done: m05 card 3 now shows `AVG(order_value) OVER (PARTITION BY city)`, m07 card 2 shows `how="left"` with NaN, and m07 card 3 shows `drop_duplicates()` against `subset=`. m05-q4, m07-q3, f04 and f12 now each rest on a sentence in a card (question map). No open teaching notes.

### Defects that remain known

- There is no objective baseline: the self-check is self-report only.
- The project has no pass rule in the engine yet, so practical competence can't yet gate a certificate.
- Personal data is tested once (m09-q3), and the rubric has no separate "professional standards" criterion (the limit is 5).
- python, ai-analytics and storytelling have one tagged final question each. This meets the publish rule (they are not foundation skills), but their Foundation placement rests on one question.

---

## RESULT

**Ready.** Every assessment-owned must-fix and should-fix finding in review-1 and review-2 is fixed, and `check.mjs --tidy` reports:
- ready_to_publish **true**, must_fix **0**, should_fix **0**, publish problems 0;
- rightIsLongest **8** of 55;
- positions 14/14/14/13;
- difficulty B 15 / I 31 / A 8 / E 1.

The teaching notes T2 to T4 are done. The review-2 ideas (more settings, m06-q3, f03, a25) are optional and not done.

---

## For the team (only Paul can decide)

1. **Option order per student.** Positions are balanced and pattern-free, but every learner sees the same order. Shuffling options per student, with the answer mapped back on the server, would stop a shared key from working.
2. **The final's timer isn't enforced.** The 30-minute countdown is client-side, and `submit_programme_final` doesn't check elapsed time. Decide whether to enforce it on the server or present it as a guide.
3. **Project pass rule** for engine programmes. The proposal:
   - a total of at least 15 of 25;
   - no criterion below 2;
   - Data quality and Analysis each at least 3;
   - up to 2 resubmissions.

   Also decide whether the engine should store rubric weights (proposed 15/20/25/20/20).
4. **Pass marks.** Keep 60% and 30 minutes for the final, and 60% for the quizzes. The programme isn't published, so these can still change; I propose no change.
5. **Objective diagnostic (optional).** 9 short Beginner scenario questions, one per skill, taken with the self-check. They would give a real starting point, and let the Learner Coach compare self-rating with performance. The engine doesn't store this yet.
6. **Tasks checked by AI.** The 20 Practise tasks could be checked by an AI against the "competent result" column, with the figures above, and a mentor confirming. No AI-detection tools.
7. **A second tag.** Several final questions test two skills (f02, f04, f07, f12, f15). If the Foundation placement ever allows a secondary skill, python, ai-analytics and storytelling would each get a second data point.
8. **Global Readiness Score.** Unchanged. This programme earns a badge and certificate only until score v8 is decided.
