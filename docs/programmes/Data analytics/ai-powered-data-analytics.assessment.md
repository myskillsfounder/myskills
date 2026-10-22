# AI powered Data Analytics: assessment blueprint

**File:** `docs/programmes/Data analytics/ai-powered-data-analytics.json`. This is an engine programme, a draft that hasn't been published.
**Run:** review only, on 21 October 2026, by the Assessment Architect. The programme file was not edited.
**Earlier review:** `ai-powered-data-analytics-review.md`. Those fixes are in place and are not repeated here: the longest-option clue, the hours, the rubric, the DPDP wording and the pandas "can" wording.

Ids are written without the `da-` prefix in the tables below (`m03-q4` means `da-m03-q4`).

---

## ASSESSMENT

| Part | Purpose and skills | Format | Count | Est. time | Scoring | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| Starting self-check (`aptitude`) | The learner's own view of where they start, for each of the 9 skills. It is not demonstrated readiness. | First-person statements rated Never / Sometimes / Often / Always. One statement per skill is reversed. | 27 (3 per skill) | 5 min | Scored per skill on the server. The reversed item is inverted. No pass or fail. | None. It is not a gate. |
| Module quizzes (`modules[].quiz`) | Whether the learner can apply that module's outcome. One skill per module. | Multiple choice, 4 options, one right answer | 4 per module, 40 in all | 4–6 min each | Percentage = marks earned ÷ marks available × 100. Marks come from difficulty, set by code (Beginner 5, Intermediate 10, Advanced 15, Expert 20). No negative marking. The engine won't accept a submission until every question is answered. | 60% (fixed in SQL). A module is done when its tasks and reflection are written and its quiz is passed. Retake after 24 hours. |
| Final (`final`) | All 5 outcomes and all 9 skills, combined across modules | Multiple choice, 4 options | 15 | 30 min (`minutes`). About 20 min of reading and thinking, with extra time for second-language readers. | As for quizzes. The draft's total is 140 marks; after the corrections below it is 155. | 60% (`pass_percent`). Once passed, it is done. A failed final can be retaken after 7 days. Tell learners this before they start; the final page already does. |
| Project (`project.rubric`) | Practical competence: the real evidence of job-ready skill | Mentor-graded portfolio project with 5 deliverables | 5 criteria, 0–5 each | About 20 h of work, then a 3-min walkthrough | Mentor scores each criterion 0–5 against the descriptors in Practical evidence. Proposed weights are below; the engine doesn't store weights yet. | Not set: engine programmes have no project or certificate step yet (step 3). The proposal is under For the team. |

A high quiz or final score shows understanding, not job-ready skill. The project is the evidence of practical competence. New engine programmes earn a badge only (no Global Readiness points) until score v8 is decided.

---

## Question map

**Columns.**
- **Diff:** the current label, and the honest one where they differ (shown as `current→proposed`).
- **Sec:** the estimated seconds to answer.
- **Pre:** the earlier modules the question relies on.

**Outcomes** (from `overview.outcomes`):
- O1: frame the question.
- O2: clean, combine and summarise.
- O3: build a dashboard.
- O4: use AI and verify it.
- O5: present a recommendation.
- "St": statistics, which no overview outcome covers (gap G1).

**Types:** Concept, Applied, Code (code, formula or query), Interp (interpreting data), Scenario (a decision in a scenario).

### Module quizzes

| Id | Module | Skill | Outcome | Tests | Type | Diff | Sec | Pre |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m01-q1 | M1 | data-literacy | O1 | Agree on the decision and measure first | Scenario | B | 60 | – |
| m01-q2 | M1 | data-literacy | O1 | Numbers that are labels (PIN code) | Concept | B | 30 | – |
| m01-q3 | M1 | data-literacy | O1 | Median, not mean, with outliers | Interp | I | 60 | – |
| m01-q4 | M1 | data-literacy | O1 | Correlation isn't causation | Scenario | I | 75 | **M6 content** (gap T1) |
| m02-q1 | M2 | spreadsheets | O2 | Why use an Excel Table | Concept | B | 45 | – |
| m02-q2 | M2 | spreadsheets | O2 | XLOOKUP with a not-found value | Code | I | 75 | – |
| m02-q3 | M2 | spreadsheets | O2 | Average of a 1/0 column gives a rate | Applied | I | 75 | – |
| m02-q4 | M2 | spreadsheets | O2 | Absolute reference `$F$1` | Code | B | 45 | **not taught** (T2) |
| m03-q1 | M3 | data-cleaning | O2 | Remove true duplicates, log it | Scenario | B | 60 | – |
| m03-q2 | M3 | data-cleaning | O2 | Infer date format from impossible values | Interp | B | 45 | – |
| m03-q3 | M3 | data-cleaning | O2 | Map category variants, then verify | Applied | I | 60 | M2 |
| m03-q4 | M3 | data-cleaning | O2, O5 | Missing not at random biases the average | Interp | A→I | 75 | – |
| m04-q1 | M4 | sql | O2 | GROUP BY + COUNT | Code | B | 60 | – |
| m04-q2 | M4 | sql | O2 | HAVING filters totals | Code | I | 60 | – |
| m04-q3 | M4 | sql | O2 | `IS NULL`, not `= NULL` | Code | I | 75 | **not taught** (T3) |
| m04-q4 | M4 | sql | O2 | AVG skips NULLs | Interp | A→I | 75 | **not taught** (T3), M3 |
| m05-q1 | M5 | sql | O2 | LEFT JOIN + IS NULL for "never ordered" | Code | I | 90 | M4 |
| m05-q2 | M5 | sql | O2 | Join fan-out inflates revenue | Interp | I | 75 | M4 |
| m05-q3 | M5 | sql | O2 | ROW_NUMBER with PARTITION BY | Code | A→I | 75 | M4 |
| m05-q4 | M5 | sql | O2 | AVG() OVER keeps every row | Code | A | 90 | M4 |
| m06-q1 | M6 | statistics | St | Why randomise | Concept | B | 45 | – |
| m06-q2 | M6 | statistics | St | Small samples are uncertain | Interp | I | 60 | M1 |
| m06-q3 | M6 | statistics | St | Peeking and stopping early | Scenario | A | 75 | – |
| m06-q4 | M6 | statistics | St | Selection bias (renewers only) | Scenario | I | 75 | – |
| m07-q1 | M7 | python | O2 | `groupby` + sum | Code | B | 45 | M4 |
| m07-q2 | M7 | python | O2 | `dayfirst=True` | Code | I | 75 | M3 |
| m07-q3 | M7 | python | O2 | Left merge keeps rows, NaN | Code | I | 60 | M5 |
| m07-q4 | M7 | python | O2 | `&` with brackets | Code | A→I | 75 | **not taught** (T4) |
| m08-q1 | M8 | visualisation | O3 | Line chart for a trend | Concept | B | 30 | – |
| m08-q2 | M8 | visualisation | O3 | Truncated axis exaggerates | Interp | I | 60 | – |
| m08-q3 | M8 | visualisation | O3 | Dashboard top = decision metric vs target | Scenario | I | 75 | M1 |
| m08-q4 | M8 | visualisation | O3, O4 | Reconcile a Copilot measure with SQL | Scenario | A | 90 | M5 |
| m09-q1 | M9 | ai-analytics | O4 | Prompt with schema, definition, dialect | Applied | B | 75 | M4, M5 |
| m09-q2 | M9 | ai-analytics | O4 | Verify independently | Scenario | I | 60 | M2, M7 |
| m09-q3 | M9 | ai-analytics | O4 | Personal data and approved tools | Scenario | I | 60 | – |
| m09-q4 | M9 | ai-analytics | O4 | An invented column means re-check all | Scenario | A→I | 60 | M4 |
| m10-q1 | M10 | storytelling | O5 | Lead with the recommendation | Applied | B | 45 | – |
| m10-q2 | M10 | storytelling | O5 | Finding vs insight with action | Applied | I | 60 | – |
| m10-q3 | M10 | storytelling | O5 | State data limits | Scenario | I | 60 | M6 |
| m10-q4 | M10 | storytelling | O5, St | Net impact against a matched group | Scenario | A | 90 | M6 |

### Final

The rows for f02, f03, f04, f11 and f15 describe the **proposed replacements** (QUALITY REVIEW, MJ-1). The current versions are noted in brackets.

| Id | Skills | Outcome | Tests | Type | Diff | Sec | Pre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| f01 | data-literacy | O1 | Answerable version of "is marketing working?" | Applied | B | 60 | M1 |
| f02 | visualisation, statistics | O3, St | Alert rule against normal variation (now: category vs quantity, which duplicates m01-q2) | Scenario | I (now B) | 90 | M6, M8 |
| f03 | spreadsheets, data-cleaning | O2 | Lookup fails on spaces or text vs number (now: SUMIFS, which isn't taught) | Scenario | I | 90 | M2, M3 |
| f04 | data-cleaning, python, ai-analytics | O2, O4 | AI-suggested drop_duplicates removes real students (now: true duplicate, which duplicates m03-q1) | Scenario | A (now B) | 100 | M3, M7, M9 |
| f05 | data-cleaning, storytelling | O2, O5 | Report what is missing, and whether it differs | Applied | I | 60 | M3, M10 |
| f06 | sql | O2 | Read WHERE + GROUP BY + COUNT | Code | I→B | 45 | M4 |
| f07 | sql | O2 | What an INNER JOIN returns | Concept | I→B | 45 | M5 |
| f08 | sql | O2 | LAG gives the previous row | Code | A | 75 | M5 (**LAG not taught**, T5) |
| f09 | data-literacy, statistics | O1 | Mean far above median means right skew | Interp | I | 60 | M1 |
| f10 | statistics | St | A tiny gap may be chance; planned length | Interp | A | 90 | M6 |
| f11 | statistics, storytelling | St, O5 | Act on the overall result; small subgroup is uncertain (now: `df.shape`) | Scenario | E (now B) | 120 | M6, M10 |
| f12 | python, sql | O2 | One-to-many merge repeats rows | Code | A→I | 75 | M5, M7 |
| f13 | visualisation | O3 | Sorted bar for 9 categories | Concept | I→B | 45 | M8 |
| f14 | ai-analytics | O4 | Reproduce an AI figure before use | Scenario | I | 60 | M9 |
| f15 | storytelling, ai-analytics | O5, O4 | Choose an AI-drafted opening that leads and states the evidence exactly (now: "memo opens with", which duplicates m10-q1) | Scenario | I (now B) | 90 | M6, M9, M10 |

**Difficulty mix:**

| | Beginner | Intermediate | Advanced | Expert | Mean marks per question |
| --- | --- | --- | --- | --- | --- |
| Final now | 5 | 7 | 3 | 0 | 9.33 |
| Final after the corrections | 4 | 7 | 3 | 1 | 10.33 |
| Quizzes now | 12 | 19 | 9 | 0 | 9.63 |
| Quizzes after the relabels | 12 | 24 | 4 | 0 | 9.00 |

`finalPrompt()` asks for about 4/6/4/1, harder on average than the quizzes. The draft's final is *easier* than the quizzes; after the corrections it is harder.

---

## Coverage map

### Outcomes

| Outcome | Module quizzes | Final (after the corrections) | Project criterion | Gaps |
| --- | --- | --- | --- | --- |
| O1 Frame a vague question | m01-q1, q3, q4, m08-q3 | f01, f09 | framing | None. O1 has light coverage in the final, which suits its weight. |
| O2 Clean, combine, summarise (Excel, SQL, pandas) | M2–M5, M7 (20 questions) | f03, f04, f05, f06, f07, f08, f12 | data, analysis | None |
| O3 Dashboard that tracks and flags | m08-q1–q4 | f02, f13 | dashboard | The draft's final tests chart choice only (f13); f02-new adds "flags problems early" |
| O4 Use AI and verify it | m08-q4, m09-q1–q4 | f04, f14, f15 | analysis (proposed wording) | Draft: 1 final question and no rubric line. Personal data appears only in m09-q3 (accepted). |
| O5 Recommend, with limits | m10-q1–q4, m03-q4 | f05, f11, f15 | recommendation | None |
| Statistics (no outcome) | m06-q1–q4, m10-q4 | f02, f09, f10, f11 | analysis ("sound statistics") | **G1:** overview.outcomes has no statistics outcome (Course Architect) |

### Skills

| Skill | Self-check items | Quiz questions | Final now | Final after the corrections | Project |
| --- | --- | --- | --- | --- | --- |
| data-literacy | a01–a03 | 4 | f01, f02, f09 | f01, f09 | framing |
| spreadsheets | a04–a06 | 4 | f03 | f03 | analysis, dashboard |
| data-cleaning | a07–a09 | 4 | f04, f05 | f03, f04, f05 | data |
| sql | a10–a12 | 8 | f06, f07, f08 | f06, f07, f08, (f12) | analysis |
| statistics | a13–a15 | 4 (+m10-q4) | f10, (f09) | f02, f09, f10, f11 | analysis |
| python | a16–a18 | 4 | f11, f12 | f04, f12 | analysis |
| visualisation | a19–a21 | 4 | f13 | f02, f13 | dashboard |
| ai-analytics | a22–a24 | 4 (+m08-q4) | f14 | f04, f14, f15 | analysis (proposed) |
| storytelling | a25–a27 | 4 | f15 | f05, f11, f15 | recommendation |

SQL has two modules and 8 quiz questions, in proportion to what employers ask for. Every skill appears in the final.

---

## Practical evidence

The engine stores task answers but doesn't grade them. A mentor, or a later AI check that a person confirms, should look for the following. Judge the output and the reasoning, never self-rated ability.

### Module tasks

| Task | Expected output | A competent result shows | Errors to look for |
| --- | --- | --- | --- |
| M1 t1 Sharpen a vague question | 2–3 specific questions about the café, each with its data and decision | Defines "lost" in the data (e.g. no visit in 60 days), a period and the customers meant; each question links to an action | Restates the vague question; no definition of "losing"; no decision |
| M1 t2 Spot the wrong type | 5 columns, each with a type and a mistake | Correctly separates quantities, label-numbers (order ID, PIN, phone), categories, dates and text; the mistake is realistic | Calls order ID or PIN a number; dates as text not mentioned |
| M2 t1 Plan a PivotTable | Rows = payment method; Values = Count of orders, plus the returned count or the Average of a 1/0 column | The rate = returned ÷ all orders per method. Explains the denominator. | Uses Sum of returned alone, or % of column total (each method's share of returns, not its rate) |
| M2 t2 Write the lookup | `=XLOOKUP([@SKU], Prices[SKU], Prices[Category], "Not found")` or the cell-reference equivalent | Exact match; the not-found text explained; notes that missing SKUs need adding to the price list | VLOOKUP with approximate match; no not-found value |
| M3 t1 Cleaning plan | Step-by-step, per column | Resolves 03/04/2026 by finding values above 12; maps department variants after trimming and case-folding; strips "₹" and converts the fee to a number; keeps the raw file; logs each step | Assumes the date format without checking; deletes inconsistent rows |
| M3 t2 Blanks | 2 options and their effect on the average | Exclude-and-state, or flag; reasons about *who* is missing (slow or cancelled) and the direction of the bias | Fills with 0, or with the mean, without comment |
| M4 t1 Query | `SELECT method, COUNT(*) AS payments, SUM(amount) AS total FROM payments WHERE paid_at >= '2026-04-01' AND paid_at < '2026-05-01' GROUP BY method ORDER BY total DESC;` | Correct filter, group and sort. A half-open date range, so payments late on 30 April are kept. | `BETWEEN '2026-04-01' AND '2026-04-30'` drops payments made after midnight on 30 April when paid_at holds a time. This was checked in SQLite. |
| M4 t2 Explain a query | A plain-English paragraph | Average delivery minutes per city, delivered orders only, only cities with ≥ 50 deliveries (so small samples don't mislead), fastest first | Says HAVING filters rows; misses the reason for the ≥ 50 |
| M5 t1 Silent customers | `SELECT c.customer_id, c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE c.signed_up >= '2026-01-01' AND c.signed_up < '2027-01-01' AND o.order_id IS NULL;` | LEFT JOIN + IS NULL on the order side; filter on sign-up date | INNER JOIN; putting a filter on an `o.` column in WHERE, which empties the result (checked) |
| M5 t2 First or repeat | ROW_NUMBER over each customer's **whole history**, then filter April and take the repeat share of revenue | Numbers orders before filtering April. In the test data, the right method gives 63% and numbering only April gives 42% (checked). | Numbers only April orders, so a customer's first April order looks like a first-ever order |
| M6 t1 Design a test | A plan: who, split, measure, length and decision rule | Random split at the same time, in all cities; one primary measure (paid sign-ups); a fixed length that covers full weeks; decided before the start | Splits by city or week; stops when it looks good |
| M6 t2 Noise or signal | A message to the owner, and checks | ₹54,000 is just above a 60-day range of ₹38,000–52,000: promising, not proof. Checks the weekday or salary day and watches 2–3 more weeks, ideally comparing with stores that didn't change. | "The layout worked" |
| M7 t1 Plan the notebook | Steps or code | Filter `status == "success"`; parse `txn_time`; filter May 2026; `groupby("merchant_category")["amount"].sum().nlargest(5)`; a shape and total check | Sums all statuses; counts transactions instead of value |
| M7 t2 Read the code | A line-by-line explanation and one risk | Dropping on phone alone can merge different people (family phones); also blank phones and formatting differences ("+91") | Explains the syntax only |
| M8 t1 Sketch the dashboard | One page described | 3–4 KPIs against target (sales, stock-outs, expiry, footfall); a breakdown by store; a trend; filters (week, region); each part tied to a call to a store manager | A list of charts with no targets or decisions |
| M8 t2 Fix a bad chart | Diagnosis and redraw | Names the distortion (3D, truncated axis, too many colours) and the better form (sorted bar, zero baseline) | A taste-only critique |
| M9 t1 Prompt and checks | A prompt and 3 checks | The prompt gives the schema, a defined "repeat customer", the month logic and the SQL dialect. The checks are a hand-checked month, the row counts, and a total against the source. | No definition; checks like "ask the AI again" |
| M9 t2 Catch the error | A verification plan | Recomputes Q2 vs Q1 from raw data with stated date bounds; checks Chennai's contribution to the change | Accepts it, or checks only one part |
| M10 t1 First paragraph | A memo opening | Recommendation first, the 2.3× with n and period, and one honest caveat: trial-kit buyers may differ (self-selection), so suggest a test | Method first; claims trial kits *cause* loyalty |
| M10 t2 Findings to actions | 3 insights and 3 actions | Each action is specific and doable within a week (pre-order counter, second till, menu pre-pack) and tied to its finding | Restates the findings |

### Project rubric

The engine stores `id`, `name` and a one-line `description`, and the mentor grades each criterion 0–5. The weights are a **proposal**: the engine has no weights yet, so until it does every criterion counts equally (For the team).

| Criterion | Weight (proposed) | Evidence required |
| --- | --- | --- |
| framing: Problem framing | 15% | Problem statement (deliverable 1); the mentor's notes from choosing the question |
| data: Data quality | 20% | Raw file kept, cleaned file, data dictionary, cleaning log with rows affected per step (deliverable 2) |
| analysis: Analysis | 25% | Queries or notebook with comments (deliverable 3); one key figure reproduced a second way; any AI-drafted code disclosed |
| dashboard: Dashboard | 20% | One-page dashboard (deliverable 4) |
| recommendation: Recommendation | 20% | Memo and 3-minute walkthrough (deliverable 5); the learner's answers to the mentor's questions about their own work |

| Criterion | Beginning (0–1) | Developing (2) | Competent (3) | Proficient (4) | Advanced (5) |
| --- | --- | --- | --- | --- | --- |
| framing | No decision named, or the question is "analyse sales" | Names a topic and a decision-maker, but no measure or period | One decision, its owner, a success measure and a period | As 3, plus what result would change the decision, agreed with the business or mentor | As 4, plus scope limits and the next question it leads to, crisply stated |
| data | Raw data changed in place; no log | Some cleaning; the log is partial; row counts not checked | Every step logged with rows affected; duplicates, types, categories and blanks handled; gaps stated | As 3, plus totals reconciled before and after, and missing data checked for pattern | Fully repeatable (Power Query or script); the dictionary defines every field; the cleaning's effect on results is quantified |
| analysis | Code fails, or answers a different question | Runs, but has an unchecked join or wrong grouping; no cross-check | Correct SQL or pandas for the question; joins checked for double counting; one key number reproduced another way; any AI help disclosed and checked | As 3, plus variation or sample size considered before claiming a change | As 4, plus a fair comparison (a control group, or before/after with a seasonality check) and clear, reusable code |
| dashboard | A collection of charts with no purpose | Right chart types, but no target or decision; cluttered | Built around the decision: key numbers against targets, the problem breakdown and a trend; honest axes; readable on one screen | As 3, plus problems flagged by colour or alert against the normal range, and filters that matter | As 4, plus a user tested it and the design changed because of that |
| recommendation | No recommendation, or it doesn't follow from the analysis | A recommendation buried after the method; no number | Opens with the decision and its ₹ impact, gives the evidence and states limits; in the walkthrough the learner explains their own steps | As 3, plus the risks, what to monitor and a next step with an owner | As 4, plus it would persuade a sceptical manager: alternatives weighed, and the uncertainty in numbers |

**Proposed one-line descriptions** (Competent level; replace the current ones when the file is next revised):

| id | description |
| --- | --- |
| framing | One decision, who makes it, how success is measured, and the period, agreed with the mentor |
| data | Raw file kept; every cleaning step logged with rows affected; gaps in the data stated |
| analysis | Correct SQL or Python, joins checked, a key number reproduced; AI help disclosed and checked |
| dashboard | Built around the decision: key numbers against target, honest axes, readable at a glance |
| recommendation | Leads with the decision and its ₹ impact, states its limits, and the learner can explain every step |

---

## QUALITY REVIEW

### How it was checked

- I solved all 55 questions before looking at `correct_index`. **All 55 keys match my answers.**
- I ran the code, formula and query answers:
  - pandas 3.0.6 in a scratch virtual environment;
  - SQLite 3.50.4;
  - SciPy, for the A/B arithmetic.

  Confirmed:
  - `dayfirst=True` reads 05/04/2026 as 5 April. `errors="coerce"`, `astype` and `%m/%d/%Y` all give 4 May (or an error).
  - Python `and` on Series raises a ValueError. `df.filter("success", 5000)` raises a TypeError. `df.pivot("city","value")` raises a TypeError.
  - A left merge gives NaN. A merge on int vs str keys raises an error.
  - `= NULL` counts 0 and `IS NULL` counts the blanks. AVG skips NULLs; COUNT(*) does not.
  - LAG returns the previous row.
  - In m01-q3 the mean is ₹3,680–4,150 and the median ₹2,000–2,500.
  - f10: z = 0.80, p ≈ 0.42.
  - The M6 card's margins are right: ±12 points at n = 50, ±2 at n = 2,000.
  - m08-q2: an axis starting at ₹99 lakh makes the bar 3×, not 5×.
- **Clue check, by script:** the right answer is strictly the longest option in 10 of 55 (18%; target ≤ about 25%) and the shortest in 7. The ratio is outside 0.7–1.3× in only 2 questions. This passes.
- **Facts:**
  - XLOOKUP defaults to exact match and can return to the left ([Microsoft](https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929)).
  - SUMIF's order is range, criteria, [sum_range] ([Microsoft](https://support.microsoft.com/en-us/office/sumif-function-169b8c99-c05c-4483-a712-1697a653039b)).
  - Copilot in Power BI drafts DAX, but needs Fabric F2+ or Premium capacity ([Power BI blog tag page](https://powerbi.microsoft.com/en-us/blog/tag/fabric-copilot/), [Fabric community](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Deep-dive-into-DAX-query-view-with-Copilot/ba-p/5174496)). m08-q4 needs judgement only, not access, so it stays fair.

### Verdicts

| Dimension | Verdict | Basis |
| --- | --- | --- |
| Accuracy | **Good, with 3 minor errors** | Every key is right and every code answer behaves as claimed. Three explanation or scenario details are imprecise (MN-1 to MN-3). |
| Alignment with outcomes | **Partly** | Quizzes match their modules' outcomes. 6 questions test content no module teaches yet (MJ-3). Statistics has no overview outcome (G1). |
| Coverage | **Partly** | Every skill appears in the final. O3 and O4 are thin in the final, and nothing combines modules (MJ-1). |
| Difficulty | **Not met** | The final is easier than the quizzes (9.33 vs 9.63 marks per question). 6 labels are inflated (MJ-5). |
| Fairness and clarity | **Good** | Indian contexts, no paid tool needed to answer, plain English. One question has a second defensible answer (MJ-4) and one option has a copy error (MJ-6). |
| Scoring validity | **Not met** | Answer positions follow a fixed pattern (CR-1). In M3, 3 of 4 right can fail (MJ-5). |
| Integrity | **Not met until CR-1 is fixed** | The pattern lets a learner score 100% without knowing anything. The project relies on a mentor walkthrough, which is the right defence against AI-written work. |

### Critical errors

**CR-1. Every quiz and the final have the same answer pattern.**
- **The problem.**
  - Every module quiz is keyed **C, A, D, B**.
  - The final is keyed **C A D B C A D B C A D B C A D**.
  - The student pages show options in stored order (`src/components/programme/shared.tsx`), and every quiz review shows the right answers.
  - A learner who notices the pattern after module 1 can score 100% on the other nine quizzes and the final.
- **The cause.** `balancePositions()` in `agents/lib/content.mjs` places right answers on a fixed cycle (`CYCLE = [2, 0, 3, 1]`), and every quiz has exactly 4 questions.
- **Fixed on 2026-10-21.** `balancePositions()` now spots patterns, as well as bunching, and gives every right answer a new place. It uses an even share of A to D, shuffled with a seed and checked until no pattern is left. `check.mjs` now reports a pattern as must-fix. The file was re-tidied:
  - **Module keys:** AADD DDCC BCDB BBBC DCBD DCAD ABAA AADD BACB ABCC.
  - **Final key:** AABACDCADCBCBBC.
  - **Totals:** A 14, B 14, C 14, D 13.
  - **What stayed the same:** the right answer and its options in every question. Only their order changed.
  - **What this replaces:** the hand-made key table that was here.
- **Option letters below.** Where a finding names an option by letter, the letter refers to the order before this re-tidy. The quoted wording identifies the option.

### Major issues

**MJ-1. The final doesn't do what a final must.**
- **The problem.**
  - None of its 15 questions combines modules.
  - All 15 have no scenario.
  - It is easier than the quizzes.
  - Four questions repeat a quiz point or are pure recall:
    - f02 (category vs quantity) repeats m01-q2;
    - f04 (identical rows with the same ID) repeats m03-q1;
    - f11 asks what `df.shape` returns;
    - f15 (open with the recommendation) repeats m10-q1.
  - f03 tests SUMIFS, which is never taught.
- **The fix.** Replace those five with the questions below, keeping their ids, and relabel f06, f07 and f13 as Beginner and f12 as Intermediate. The final then mixes 4 Beginner, 7 Intermediate, 3 Advanced and 1 Expert, for 155 marks. The option lengths were checked by script: no new right answer is strictly the longest option.

> **f02**: title "The red stores" · Intermediate · topic "Alerts and variation"
> scenario: A pharmacy chain's dashboard turns a store red on any day its sales are below ₹45,000. Store 12's daily sales have been between ₹38,000 and ₹52,000 for 60 days, so it turns red on many ordinary days, and managers now ignore the colour.
> question: Which change would make the red flag most useful?
> options: (a) "Flag a store when its 7-day average falls below its own usual range, not on one low day" ✔ · (b) "Lower the red line to ₹35,000 for every store, so that the flag appears much less often" · (c) "Drop the colour and show every store's daily sales in a table, so managers judge for themselves" · (d) "Turn a store red whenever today's sales are below yesterday's, to catch every drop early"
> explanation: Store 12's sales normally swing between ₹38,000 and ₹52,000, so one low day is noise. Comparing a 7-day average with the store's own usual range flags a real fall and keeps red meaningful.
> why_wrong: One lower line for every store ignores that each store has its own normal level, so a big store could fall a long way before turning red; a table removes the at-a-glance signal the dashboard exists for; comparing with yesterday turns ordinary daily swings red even more often.
> learning_outcome: Set alerts against normal variation, not single values.

> **f03**: title "The SKUs that won't match" · Intermediate · topic "Lookup mismatches"
> scenario: A wholesaler in Nagpur uses =XLOOKUP(B2, Master[SKU], Master[Category], "New SKU"). It shows "New SKU" on 300 of 4,000 invoice lines, but when you search the master by eye, those SKUs are there.
> question: What is the most likely cause?
> options: (a) "Some SKUs differ by hidden spaces, or are text in one sheet and numbers in the other" ✔ · (b) "The master isn't sorted A to Z, and XLOOKUP needs sorted data to find an exact match" · (c) "XLOOKUP is doing an approximate match, because the fourth argument wasn't set to exact" · (d) "Those 300 SKUs really are new, so add them to the master and run the lookup again"
> explanation: A lookup matches only identical values. A trailing space, or a SKU stored as text in one sheet and as a number in the other, looks the same on screen but doesn't match. Trim and convert both columns, then look up again.
> why_wrong: XLOOKUP's default exact match doesn't need sorted data; the fourth argument is the not-found value, and the default match is already exact; the SKUs are already in the master, so adding them again creates duplicates and leaves the real cause in place.
> learning_outcome: When a lookup fails on values that look equal, check spaces and data types.

> **f04**: title "The AI's cleaning step" · Advanced · topic "Verifying AI cleaning"
> scenario: A coaching centre in Kota has 9,400 enquiry rows (student_name, phone, course, enquiry_date). An AI assistant suggests df = df.drop_duplicates(subset="student_name") to remove repeat enquiries. After it runs, 7,100 rows are left.
> question: What should you do before keeping the result?
> options: (a) "Check some removed rows: students can share a name, so match on name and phone" ✔ · (b) "Keep it, because the code ran without errors and repeat enquiries are very common" · (c) "Ask the assistant whether 7,100 is the right count, and keep the result if it agrees" · (d) "Run drop_duplicates() with no subset instead, so it catches every kind of repeated row"
> explanation: Dropping duplicates on name alone treats every student with the same name as one person, so real students disappear. Looking at the removed rows shows the problem; matching on name and phone together keeps different people apart.
> why_wrong: Code that runs can still remove the wrong rows; the assistant checking its own number isn't an independent check; with no subset only rows identical in every column go, so repeat enquiries on different dates stay.
> learning_outcome: Check what an AI-written cleaning step removed before you trust it.

> **f11**: title "The checkout test, city by city" · Expert · topic "Subgroups in A/B tests"
> scenario: A D2C brand tested a new checkout for its planned 3 weeks, with 120,000 visitors in each group. Conversion rose from 3.0% to 3.6%, far beyond normal variation. In Tier-3 cities alone (3,000 visitors per group), conversion fell from 2.8% to 2.5%.
> question: What should your memo recommend?
> options: (a) "Roll it out, and keep watching Tier-3 cities: 3,000 visitors a group is too few to judge" ✔ · (b) "Roll it out only in metro and Tier-2 cities, since the Tier-3 result proves it fails there" · (c) "Hold the roll-out everywhere until Tier-3 cities also show a rise, so that no group loses out" · (d) "Roll it out everywhere, and report a 20% rise in conversion for every city, Tier-3 included"
> explanation: Across 120,000 visitors a group, 3.0% to 3.6% is far beyond chance, and the test ran its planned length. In Tier-3 cities the fall is 84 against 75 sales out of 3,000 each, well within chance, so roll out and keep watching there.
> why_wrong: 9 sales out of 3,000 a group can't prove the design fails in Tier-3 cities; holding everyone back gives up a clear, tested gain because of a result that may be chance; the 20% rise is for all visitors together, and Tier-3 cities didn't show it.
> learning_outcome: Act on the overall result, and treat a small subgroup's result as uncertain.
> *(Checked: overall z = 8.2; Tier-3 z = −0.72, p = 0.47.)*

> **f15**: title "The memo's first line" · Intermediate · topic "Memo openings"
> scenario: A randomised test in 8 of a Tamil Nadu clinic chain's 30 clinics (4,200 appointments over 6 weeks) found that SMS reminders sent the day before cut missed appointments from 18% to 11%. An AI assistant drafted four opening lines for your memo to the operations head.
> question: Which opening line should you use?
> options: (a) "Recommendation: send day-before SMS reminders in all 30 clinics; in an 8-clinic test, no-shows fell from 18% to 11%." ✔ · (b) "SMS reminders end missed appointments, as our test across the whole chain of clinics clearly proved." · (c) "We ran a 6-week randomised test in 8 clinics, covering 4,200 appointments; the method is described below." · (d) "Recommendation: send SMS reminders in every clinic; patients prefer them, and the test was a big success."
> explanation: It leads with a decision the reader can act on and the number behind it, and it describes the evidence exactly: a test in 8 clinics, not proof for the whole chain.
> why_wrong: "End" and "across the whole chain" overstate a test that cut no-shows to 11% in 8 clinics; starting with the method makes the reader hunt for the answer; nobody measured whether patients prefer SMS, and "a big success" replaces the number.
> learning_outcome: Choose the opening that leads with the action and states the evidence exactly.

**MJ-2. The final gives almost no feedback.**
- 14 of 15 final questions have no `why_wrong`, and none has a `learning_outcome`. The live grader returns both to students (`programme_grade` in `docs/supabase-builtin-programmes.sql`).
- `check.mjs` reports this as its 2 should-fix findings.
- **The fix.** Add these lines. The replaced questions have theirs in MJ-1.

| Id | why_wrong | learning_outcome |
| --- | --- | --- |
| f01 | Likes, clicks and reach measure attention, not whether marketing pays; every number by month answers no particular question; whether customers like or remember ads needs a survey and points to no decision. | A question becomes answerable when it names a measure, a period and a decision. |
| f05 | Filling blanks with 0 invents zero incomes and drags the average down; filling with the average hides the gap and makes the result look more certain; staying silent about 30% missing hides a limit the reader needs. | Report who is missing from an average, and whether they differ. |
| f06 | COUNT(*) counts payments, it doesn't add amounts; the 1,000 is a filter on each amount, not on the number of payments; COUNT isn't AVG. | Read WHERE as a row filter and COUNT(*) as a count per group. |
| f07 | Keeping every customer with blanks is a LEFT JOIN; orders whose customer_id isn't in customers have no match, so an inner join drops them; every possible pair is a CROSS JOIN. *(with MN-4's new option)* | An inner join keeps only matching rows, once per match. |
| f08 | Looking forward one row is LEAD, not LAG; a running total needs SUM() OVER; the lowest earlier value needs MIN() OVER. | Use LAG to put the previous period beside the current one. |
| f09 | Even spending would put the mean and median close together; a gap between them is normal in skewed data, not a sign of errors; if most spent more than ₹31,000, the median would be above ₹31,000. | A mean well above the median signals a few very large values. |
| f10 | A large sample can still show a gap that chance explains, and 0.1 points is tiny; one city shrinks the sample and makes chance bigger; adding version C changes the test without checking A against B. | A small gap needs checking against chance before you name a winner. |
| f12 | A merge without how= is inner, so it never adds blank rows; keeping rows only in items needs an outer merge; text and number keys make pandas raise an error, not double rows. | A one-to-many merge repeats each order once per matching item. |
| f13 | Nine slices are hard to compare by angle; a line implies an order between brands that doesn't exist; 3D distorts slice sizes, and a legend makes readers look back and forth. | Use a sorted bar chart to compare many categories. |
| f14 | AI tools can calculate wrongly or use a different definition; asking again checks consistency, not correctness; rounding down a number you can't explain doesn't make it safe. | Reproduce an AI's figure before you use it. |

**MJ-3. Six questions test content no module teaches.** These are for the Course Architect, because the questions themselves are sound.

| Gap | Question | What the module must teach |
| --- | --- | --- |
| T1 | m01-q4 (correlation vs causation) | M1, card 3 or a new paragraph: two things moving together may share a cause (who chooses dark mode). Only a fair comparison or a test shows cause. At present only M6 teaches randomisation. |
| T2 | m02-q4 (`$F$1`) | M2: relative vs absolute references, with one example (a GST rate in one cell, filled down). |
| T3 | m04-q3, m04-q4 | M4: NULL means unknown; test it with `IS NULL`; AVG, SUM and COUNT(column) skip NULLs, and COUNT(*) does not. |
| T4 | m07-q4 | M7, card 2: combining conditions, `df[(df["a"] == x) & (df["b"] > y)]`, with brackets, `&` and `\|`. |
| T5 | f08 | M5, card 3: `LAG(revenue) OVER (ORDER BY month)` for last period's value. The card mentions "last month's value" but not the function. |
| (idea) | (f03 is replaced) | M2 could still teach SUMIFS, which employers expect, but no question now depends on it. |

**MJ-4. m03-q4 has a second defensible answer.**
- **The problem.** "If you drop those rows and report the average delivery time, what happens?" Option (a), "Nothing changes, because rows with no delivery time are simply left out of every average", is literally true: an average skips blanks whether or not you drop them. A strong student could defend it.
- **The rewrite:**
  - **question:** "If you drop those rows, how does the average delivery time you report compare with what customers actually experienced?"
  - **options:** "It matches, because orders with no delivery time would be left out of the average anyway" · "It looks better than reality, because the slowest cases are the ones left out" ✔ · "It looks worse than reality, because the cancelled orders were the slowest" · "It can't be compared at all, so no delivery figure should be reported"
  - **why_wrong:** "Leaving those orders out, by dropping them or by letting the average skip them, removes the customers who waited longest; leaving out the slowest cases makes the average shorter, not longer; the average can still be reported if you say what it leaves out and report cancellations beside it."
  - **difficulty:** Intermediate (see MJ-5).

**MJ-5. Inflated difficulty labels distort scoring.**
- **The problem.** In M3 (marks 5, 5, 10, 15), a learner who gets q1–q3 right and misses q4 scores 20/35 = 57% and **fails with 3 of 4 right**. No other module does this.
- **The relabels.** These are honest judgements of what each question demands:

| Id | Current | Proposed | Why |
| --- | --- | --- | --- |
| m03-q4 | Advanced | Intermediate | Card 3 teaches it directly. Afterwards 3 of 4 right always passes in M3. |
| m04-q4 | Advanced | Intermediate | One fact (AVG skips NULLs) |
| m05-q3 | Advanced | Intermediate | The answer repeats card 3's wording (see MN-6) |
| m07-q4 | Advanced | Intermediate | A standard everyday pandas pattern, once taught |
| m09-q4 | Advanced | Intermediate | The judgement is straightforward |
| f12 | Advanced | Intermediate | The point was already tested in m05-q2 |
| f06, f07, f13 | Intermediate | Beginner | Single-concept reading |

**MJ-6. f05 has a copy error.** Option (a) says "…included in the average **satisfaction score**", but the question is about income. The error makes the option look absurd for the wrong reason. **Rewrite:** "Fill the blanks with 0, so that every respondent is included in the average income".

### Minor improvements

| # | Where | Problem | Exact fix |
| --- | --- | --- | --- |
| MN-1 | m08-q2 scenario | An axis starting near ₹99 lakh makes the bar 3× taller, not 5× (checked) | Scenario: "…but the new bar looks **three** times taller." |
| MN-2 | m01-q3 explanation | The median is between ₹2,000 and ₹2,500, not "roughly ₹2,200–2,500" | "…The median stays at what the middle student pays, between ₹2,000 and ₹2,500." |
| MN-3 | m04-q4 explanation | "Summary functions skip NULLs" is untrue for COUNT(*) | "AVG, like SUM and COUNT(stars), skips NULLs (only COUNT(*) counts every row), so 4.2 is the average among the 600 rated orders. A report should say so: '4.2 stars among the 60% of orders that were rated.'" |
| MN-4 | Weak wrong options | Nobody who has read the module would pick these | m01-q4 (d) → "Agree, but switch it on first for the lowest scorers, since they have the most to gain from it" (and its why_wrong part → "targeting it at low scorers still assumes the setting causes the scores"). · m01-q3 (c) → "The midpoint of the lowest and highest fees" (why_wrong → "the midpoint, ₹16,000, is set by the extremes"). · m08-q1 (d), which repeats the pie's mistake as a donut → "A bar chart sorted by revenue" (why_wrong → "sorting by revenue breaks the time order"). · f07 (b) → "Every order, including those whose customer_id isn't in customers". · m09-q3 (c) → "Replace names with initials, keep the phones and diagnoses, and paste it into a free chatbot" (why_wrong → "initials don't hide anyone when phone numbers and diagnoses stay"). |
| MN-5 | f10 explanation | Uses "significance check", which is never taught | "4.0% and 4.1% of 50,000 are about 2,000 and 2,050 conversions, a gap well within chance. Check it against normal variation (a significance test does this) and let the test run its planned length before naming a winner." |
| MN-6 | m05-q3 | The right answer is the Learn card's line with the names changed, so it tests recall | title "Latest visit only"; scenario "A clinic's visits table has visit_id, patient_id, visit_date and doctor. You need one row per patient: their most recent visit."; question "Which expression, kept where it equals 1, picks each patient's latest visit?"; options `ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY visit_date DESC)` ✔ · `ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY visit_date)` · `ROW_NUMBER() OVER (PARTITION BY patient_id, visit_date ORDER BY visit_date DESC)` · `RANK() OVER (PARTITION BY visit_date ORDER BY patient_id)`; explanation "PARTITION BY patient_id restarts the numbering for each patient, and ORDER BY visit_date DESC puts the newest visit first, so row 1 is the latest."; why_wrong "Ascending order makes row 1 the first visit, not the latest; partitioning by patient and date restarts the count for every visit date, so nearly every row is 1; RANK partitioned by date ranks patients within each day." (Option lengths 68 ✔ / 63 / 80 / 57.); learning_outcome "Choose the partition and the sort direction to pick one row per group."; Intermediate. |
| MN-7 | Self-check | a05, a10, a11, a14 and a16 rate ability, liking or knowledge rather than behaviour. a12 and a18 are near-twins across two skills. a05 overlaps a04. | a05 → "I sort or filter a spreadsheet to find the rows I need, instead of scrolling through it." · a10 → "When I need one number from a long list, I write down the steps (which rows, which groups, which total) before I start." · a11 → "I look up the exact syntax of a formula or command instead of guessing it." · a12 (reversed) → "When I need figures from a large table, I ask someone else to pull them for me." · a14 → "When I see an average, I look at the highest and lowest values behind it." · a16 → "When I repeat the same steps on a file every week, I look for a way to automate them." |
| MN-8 | Rubric descriptions | No line covers outcome O4 (AI verification), and nothing makes the learner explain their own work | Use the proposed one-line descriptions in Practical evidence. |
| MN-9 | 17 quiz questions | No scenario (house style: scenario-based). Acceptable for short code items, but m02-q1, m06-q1, m08-q1 and m10-q2 would test judgement better inside a case. | Optional. Add a 1–2 sentence case when next revised. |

### Duplicate or weak questions

| Pair | Verdict |
| --- | --- |
| f02 / m01-q2; f04 / m03-q1; f15 / m10-q1 | Same point, same way. Replaced (MJ-1). |
| f11 (`df.shape`) | Pure recall of a Learn line. Replaced (MJ-1). |
| f09 / m01-q3 | Same idea (skew) but reversed: m01-q3 picks the statistic, f09 interprets the gap. Keep. |
| f12 / m05-q2 | Fan-out in pandas vs SQL. Keep, relabelled Intermediate. |
| f14 / m09-q2 | Both say verify independently; different triggers. Keep. |
| f06 / m04-q1, f13 / m08-q1 | Related but distinct. Keep. |

**Wrong answers or explanations:** no key is wrong. The explanation defects are MN-2, MN-3, MN-5 and MJ-4's why_wrong.

### Teaching notes (for the Course Architect, not test changes)

- **G1.** Add a statistics outcome to `overview.outcomes`, for example "Tell a real change from noise using samples, spread and simple experiments". At present M6, five quiz questions and four final questions map to no outcome.
- **M5 card 3.** "`ROW_NUMBER() … = 1` marks their first payment" can't be used directly in WHERE. Add "(filter on it in an outer query or CTE)".
- **T1–T5,** as in MJ-3.

### Defects that remain known

- There is no objective baseline: the self-check is self-report only (For the team).
- The project has no pass rule in the engine yet, so practical competence can't yet gate a certificate.
- Personal data is tested once (m09-q3). It is accepted, but should appear in the project rubric's "professional standards" if a sixth criterion is ever allowed.

---

## RESULT

**Ready after specified corrections.** All are in parts the assessment owns, except T1–T5 and G1:

1. CR-1: re-key every quiz and the final as tabled.
2. MJ-1: replace f02, f03, f04, f11 and f15; relabel f06, f07, f13 and f12.
3. MJ-2: add why_wrong and learning_outcome to the final.
4. MJ-3: the Course Architect teaches T1–T5, or the five affected questions are rewritten to taught content.
5. MJ-4, MJ-5 and MJ-6, as written.
6. MN-1 to MN-8. MN-9 is optional.
7. Then run `node agents/check.mjs "docs/programmes/Data analytics/ai-powered-data-analytics.json" --tidy` (weights follow the new labels), and confirm must_fix 0, should_fix 0, rightIsLongest ≤ 14, and no repeated module key pattern.

**Counts:** 1 critical, 6 major, 9 minor.

`check.mjs` on the file as reviewed: ready_to_publish true, must_fix 0, should_fix 2 (final why_wrong and learning_outcome), rightIsLongest 10, positions 14/13/14/14, difficulty B 17 / I 26 / A 12.

---

## For the team (only Paul can decide)

1. **Answer positions.**
   - The seeded shuffle that avoids patterns is done (2026-10-21).
   - Still open: shuffle the option order per student on the page and map the answer back on the server, so even an unlucky key can't be shared between learners.

2. **The final's timer isn't enforced.** The 30-minute countdown is client-side only. When time is up the page asks the learner to submit, and `submit_programme_final` doesn't check elapsed time. Decide whether the limit should be enforced on the server or presented as a guide.
3. **Project pass rule** for engine programmes (step 3). The proposal:
   - a total of at least 15 of 25;
   - no criterion below 2;
   - Data quality and Analysis each at least 3;
   - up to 2 resubmissions, as in the built-in programmes.

   Also decide whether the engine should store rubric weights (proposed: 15/20/25/20/20). Until it does, the criteria count equally.
4. **Pass marks.** Keep 60% for the quizzes (fixed in SQL) and the final, and 30 minutes. The draft isn't published, so these can still change; I propose no change.
5. **Objective diagnostic (optional).** 9 short scenario questions, one per skill at Beginner level, taken with the self-check. They would show a real starting point and let the Learner Coach compare self-rating with performance. The engine doesn't store this yet.
6. **Written answers graded by AI.** The 20 Practise tasks could be checked by an AI against the "competent result" column above, with a mentor confirming. Don't use AI-detection tools. The defence against outsourced work is the walkthrough and the mentor asking the learner to explain their own steps.
7. **DPDP Rules.** The DPDP Rules, 2025 were notified on 13 November 2025. Consent Manager duties start after 12 months; most operational duties (notice, security safeguards, breach reporting) start after 18 months, around 13 May 2027. These dates come from law-firm summaries ([AZB & Partners](https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/), [Mondaq](https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified)); check them against the official Gazette notification before the M9 card mentions dates. No question tests the dates.
8. **Global Readiness Score.** Unchanged. This programme earns a badge only until score v8 is decided.
