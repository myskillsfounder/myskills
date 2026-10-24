# AI powered Data Analytics: assessment blueprint

**File:** `docs/programmes/Data analytics/ai-powered-data-analytics.json`. An engine programme, a draft that hasn't been published.
**Run:** `/course-team improve`, review-5 assessment findings (round 5), 23 October 2026, by the Assessment Architect. Two titles corrected (m07-q3, m07-q4); two review-5 ideas taken (m08-q4 scenario, m10-q3 first option); this blueprint brought up to the latest clue-test run and the hands-on tasks. Keys and ids unchanged.
**Inputs:** review `ai-powered-data-analytics.review-5.json`, reviews 1 to 4, research brief `ai-powered-data-analytics.research.md` (section 4: beginner mistakes), clue tests `ai-powered-data-analytics.probes.json` (latest run, on this exact version before the two idea edits: options 39 of 55, cards 40 of 40, blind 52 of 55, with review 5's rulings on m01-q1, m08-q4 and m10-q3 and its 11 dismissed leads).
**Counts and keys:** [`ai-powered-data-analytics.assessment-tables.md`](ai-powered-data-analytics.assessment-tables.md), written by `node agents/blueprint.mjs`. This blueprint doesn't copy them.

Ids are written without the `da-` prefix below (`m03-q4` means `da-m03-q4`).

---

## ASSESSMENT

| Part | Purpose and skills | Format | Count | Est. time | Scoring | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| Starting self-check (`aptitude`) | The learner's own view of where they start, for each of the 9 skills. Not demonstrated readiness. | First-person statements about behaviour, rated Never / Sometimes / Often / Always. One per skill is reversed. | 27 (3 per skill) | 5 min | Scored per skill on the server; the reversed item is inverted. No pass or fail. | None. Not a gate. |
| Module quizzes (`modules[].quiz`) | Whether the learner can apply that module's outcome. One skill per module. | Multiple choice, 4 options, one right answer; mostly scenario-based | 4 per module, 40 in all | 4–6 min each | Percentage = marks earned ÷ marks available × 100. Marks come from difficulty, set by code (Beginner 5, Intermediate 10, Advanced 15, Expert 20). No negative marking; an unanswered question earns 0 (the engine won't accept a submission until every question is answered). | 60% (fixed in SQL). A module is done when its tasks and reflection are written and the quiz is passed. Retake after 24 hours. In every module, 3 of 4 right now passes. |
| Final (`final`) | All 6 outcomes and all 9 skills; 9 of 15 questions combine two or more modules | Multiple choice, 4 options, every question with a title and a scenario (true from round 2) | 15 (165 marks) | 30 min (`minutes`): about 19 min of reading and thinking, with slack for second-language readers | As for quizzes | 60% (`pass_percent`). A failed final can be retaken after 7 days; the final page tells learners this before they start. |
| Project (`project.rubric`) | Practical competence: the real evidence of job-ready skill | Mentor-graded portfolio project, 5 deliverables, a 3-minute walkthrough | 5 criteria, 0–5 each | About 20 h | Mentor scores each criterion against the descriptors in Practical evidence. Proposed weights below; the engine doesn't store weights yet. | Not set: engine programmes have no project pass rule yet (For the team). |

A high quiz or final score shows understanding, not job-ready skill. The project is the evidence of practical competence. New engine programmes earn a badge only (no Global Readiness points) until score v8 is decided.

---

## Question map

**Outcomes** (`overview.outcomes`, now six):
- O1 frame the question · O2 clean, combine, summarise · O3 tell a real change from noise (statistics, added this round, closes gap G1) · O4 dashboard · O5 use AI and verify it · O6 recommend.

**Types:** Concept, Applied, Code (code, formula or query), Interp (interpreting data), Scenario (a decision). **Sec:** estimated seconds. **Pre:** earlier modules relied on.

### Module quizzes

| Id | Outcome | Tests | Type | Diff | Sec | Pre |
| --- | --- | --- | --- | --- | --- | --- |
| m01-q1 | O1 | Decision (extra riders), measure (under 90% within 30 min) and period (last four weeks) already given: answer it, don’t re-ask (flip) | Scenario | B | 60 | – |
| m01-q2 | O1 | A label in digits (PIN) can't be averaged | Interp | B | 30 | – |
| m01-q3 | O1 | Budget total: mean × 50, not the median (flip; M1 card 3) | Interp | I | 75 | – |
| m01-q4 | O1, O3 | Random assignment already done: act on it (flip) | Scenario | I | 75 | – |
| m02-q1 | O2 | What an Excel Table does (and doesn't) | Applied | B | 45 | – |
| m02-q2 | O2 | XLOOKUP argument order; VLOOKUP's approximate default | Code | I | 75 | – |
| m02-q3 | O2 | Average of a 1/0 column is a rate | Applied | I | 60 | – |
| m02-q4 | O2 | Absolute vs mixed references | Code | I (was B) | 60 | – |
| m03-q1 | O2 | 150 exact copies vs 50 pairs with different payment refs | Scenario | I (was B) | 75 | – |
| m03-q2 | O2 | Infer the date format from impossible values (clinic export; title and case added) | Interp | B | 45 | – |
| m03-q3 | O2 | Reusable mapping table beats TRIM/fuzzy/Find-Replace | Scenario | I | 75 | M2 |
| m03-q4 | O2, O6 | Missing not at random biases the average | Interp | I (was A) | 75 | – |
| m04-q1 | O2 | GROUP BY + COUNT | Code | B | 60 | – |
| m04-q2 | O2 | HAVING vs WHERE vs MAX | Code | I | 75 | – |
| m04-q3 | O2 | `IS NULL`, not `= NULL` | Code | I | 60 | – |
| m04-q4 | O2 | AVG skips NULLs; who is in the average | Interp | I (was A) | 75 | M3 |
| m05-q1 | O2 | LEFT JOIN from the right table + IS NULL | Code | I | 90 | M4 |
| m05-q2 | O2 | Join fan-out inflates revenue | Interp | I | 75 | M4 |
| m05-q3 | O2 | ROW_NUMBER partition (per doctor) and sort direction | Code | I (was A) | 75 | M4 |
| m05-q4 | O2 | Window partition decides the group | Code | A | 90 | M4 |
| m06-q1 | O3 | Random assignment: balanced on average, not sampling | Concept | I (was B) | 60 | – |
| m06-q2 | O3 | Small samples are uncertain | Interp | I | 60 | M1 |
| m06-q3 | O3 | Peeking: fix length, judge at the end | Scenario | A | 75 | – |
| m06-q4 | O3 | Fair draw, but non-response by keen members: which flaw is present | Scenario | I | 75 | M1 |
| m07-q1 | O2 | `groupby` + the right aggregate | Code | B | 45 | M4 |
| m07-q2 | O2 | `dayfirst=True` (and strict `format=`) | Code | I | 75 | M3 |
| m07-q3 | O2 | Left merge keeps rows, NaN not 0 | Code | I | 60 | M3, M5 |
| m07-q4 | O2 | `&` with brackets | Code | I (was A) | 60 | – |
| m08-q1 | O4 | Rank the top 3 months: sorted bar, not line (flip) | Concept | B | 45 | – |
| m08-q2 | O4 | Truncated axis exaggerates | Interp | I | 60 | – |
| m08-q3 | O4 | Ops head calling city managers; target is a rate (95% within 30 min) | Scenario | I | 75 | M1, M2 |
| m08-q4 | O4, O5 | Two definitions in the case; the owner’s definition decides | Scenario | A | 90 | M5 |
| m09-q1 | O5 | Prompt with schema, exact definition, period, dialect | Applied | I | 90 | M4, M5 |
| m09-q2 | O5 | Item-level file: the PivotTable check repeats the error (flip) | Scenario | I | 75 | M2, M5 |
| m09-q3 | O5 | Personal data: approved tools, not settings or initials | Scenario | I | 60 | – |
| m09-q4 | O5 | Never had the schema: give it the definitions (both remedies now re-check, so only the missing schema decides) | Scenario | I | 60 | M4 |
| m10-q1 | O6 | COD is 70% of Tier-3 sales; a random six-city Tier-3 trial already proved the fee: extend it, no further pilot | Scenario | I (was B) | 90 | M6 |
| m10-q2 | O6 | Funnel decides the step: insight + action at payment | Interp | B (was I) | 60 | – |
| m10-q3 | O6 | School-reopening data for a reopening decision is typical (flip; M10 card 3) | Scenario | I | 60 | M6 |
| m10-q4 | O6, O3 | Gross profit vs a matched group, minus cost; four comparisons | Scenario | A | 120 | M1, M6 |

### Final

Every final question has a title, a scenario, a `why_wrong` and a `learning_outcome` (f06 and f07 got theirs in round 2; f07 is now an applied count). Round-2 rebuilds: f02, f04, f05, f10, f11, f14, plus f15 and f12 wording. Round 3: f05's over-cautious option is now a re-survey that the random fault and next week's deadline rule out.

| Id | Skills | Outcome | Modules combined | Tests | Type | Diff | Sec |
| --- | --- | --- | --- | --- | --- | --- | --- |
| f01 | data-literacy, storytelling | O1 | M1, M10 | An answerable "is marketing working?" (cost per first order + decision) | Scenario | I | 75 |
| f02 | visualisation, statistics | O4, O3 | M6, M8 | Weekly cycle + next-morning action: same-weekday range | Scenario | I | 90 |
| f03 | spreadsheets, data-cleaning | O2 | M2, M3 | Lookup fails on spaces / text vs number | Scenario | I | 90 |
| f04 | data-cleaning, python, ai-analytics | O2, O5 | M3, M7, M9 | Replace the AI’s key: name + phone + course | Code | A | 90 |
| f05 | data-cleaning, statistics, storytelling | O2, O6 | M3, M6, M10 | Missing at random (screen fault), report due next week: report the gap, don’t re-survey (flip) | Scenario | I | 75 |
| f06 | sql | O2 | M4 | Read WHERE + GROUP BY + COUNT (fintech case added) | Code | B | 45 |
| f07 | sql | O2 | M4, M5 | Count an INNER JOIN’s rows and who drops out | Applied | I (was B) | 75 |
| f08 | sql | O2 | M4, M5 | LAG gives the previous row; NULL on the first | Code | A | 75 |
| f09 | data-literacy, statistics | O1, O3 | M1 | Mean far above median = right skew | Interp | I | 60 |
| f10 | statistics | O3 | M6 | Finished test, no clear gap, B costs more: keep A (flip; M6 card 3) | Scenario | A | 90 |
| f11 | statistics, storytelling | O3, O6 | M6, M10 | Act on the overall result, watching Tier-3: its fall (84 against 75 sales) is within chance | Scenario | E | 120 |
| f12 | python, sql | O2 | M5, M7 | Fix one-to-many double counting in pandas | Code | I | 75 |
| f13 | visualisation | O4 | M8 | Sorted bar for 9 categories | Concept | B | 45 |
| f14 | ai-analytics | O5 | M9 | AI’s working shown but wrong base: recompute on the board’s definition | Scenario | I | 75 |
| f15 | storytelling, statistics, ai-analytics | O6, O5 | M6, M9, M10 | Opening that states the randomised comparison exactly | Scenario | I | 90 |

**Difficulty:** quizzes 8 B / 28 I / 4 A (9.5 marks per question); final 2 B / 9 I / 3 A / 1 E (11.0). The final stays harder than the quizzes, as `finalPrompt()` asks. f07 moved to Intermediate because it now asks for a row count and who drops out. Sum of estimated seconds: about 20 minutes, inside the 30.

---

## Coverage map

### Outcomes

| Outcome | Module quizzes | Final | Project criterion | Gaps |
| --- | --- | --- | --- | --- |
| O1 Frame a vague question | m01-q1–q4 | f01, f09 | framing | None |
| O2 Clean, combine, summarise | M2–M5, M7 (20) | f03, f04, f05, f06, f07, f08, f12 | data, analysis | None |
| O3 Real change vs noise | M6 (4), m01-q4, m10-q4 | f02, f05, f09, f10, f11, f15 | analysis | None (closed by the new outcome) |
| O4 Dashboard that tracks and flags | M8 (4) | f02, f13 | dashboard | None |
| O5 Use AI and verify it | M9 (4), m08-q4 | f04, f14, f15 | analysis (now names AI checks) | None |
| O6 Recommend, with limits | M10 (4), m03-q4 | f01, f05, f11, f15 | recommendation | None |

### Skills

| Skill | Self-check | Quiz questions | Final | Project |
| --- | --- | --- | --- | --- |
| data-literacy | a01–a03 | 4 | f01, f09 | framing |
| spreadsheets | a04–a06 | 4 | f03 | analysis, dashboard |
| data-cleaning | a07–a09 | 4 | f03, f04, f05 | data |
| sql | a10–a12 | 8 | f06, f07, f08, f12 | analysis |
| statistics | a13–a15 | 4 (+m01-q4, m10-q4) | f02, f05, f09, f10, f11, f15 | analysis |
| python | a16–a18 | 4 | f04, f12 | analysis |
| visualisation | a19–a21 | 4 | f02, f13 | dashboard |
| ai-analytics | a22–a24 | 4 (+m08-q4) | f04, f14, f15 | analysis |
| storytelling | a25–a27 | 4 | f01, f05, f11, f15 | recommendation |

Every skill appears in the final; SQL and statistics carry the most weight, in line with what employers ask for (research §1).

---

## Practical evidence

The engine stores task answers but doesn't grade them. A mentor, or a later AI check that a person confirms, should look for the following. Judge the output and the reasoning, never self-rated ability.

### Module tasks

| Task | Expected output | A competent result shows | Errors to look for |
| --- | --- | --- | --- |
| M1 t1 Sharpen a vague question | 2–3 specific questions about the café, each with its data and decision | Defines "lost" in the data (e.g. no visit in 60 days), a period and the customers meant; each question links to an action | Restates the vague question; no definition of "losing"; no decision |
| M1 t2 Spot the wrong type | 5 columns, each with a type and a mistake | Correctly separates quantities, label-numbers (order ID, PIN, phone), categories, dates and text; the mistake is realistic | Calls order ID or PIN a number; dates as text not mentioned |
| M2 t1 Build a return-rate PivotTable | The 12 saree orders in Google Sheets or Excel; a PivotTable with payment in Rows and the Average of `returned` in Values; one rate checked by hand | COD 60% (3 of 5), Card 33% (1 of 3), UPI 25% (1 of 4); the hand check is returned ÷ all orders for one method. About 35 min. | Values set to Sum (counts, not rates); a share of all returns read as a rate |
| M2 t2 Write the lookup | A price tab, an SKU column for four orders, and an XLOOKUP with "Not found" as its fourth argument | SR-101 gives Silk and SR-205 gives Cotton; SR-999 and "SR-102 " say "Not found", but only SR-999 is missing: the trailing space blocks the match and TRIM fixes it. About 35 min. | Calls both "Not found" rows missing; VLOOKUP with approximate match; no not-found value |
| M3 t1 Clean a clinic export | The 8 rows on a raw tab (kept untouched), a cleaned tab, a cleaning log (step, why, rows affected) and row counts | 8 rows become 7: only the second P04 row goes. One date format (03/04/2026 resolved from 13/04 and 14/04), two department names, fees as numbers, P06's blank fee left blank and flagged, not 0. About 35 min. | Assumes the date format; removes rows that are not true duplicates; blank fee set to 0; no log |
| M3 t2 Decide about blanks | Two options and their effect on the average | Filling 300 blanks with 0 pulls 31 down to about 29 (31 × 0.94); leaving them out keeps 31 from 4,700 rows, and says so. Reasons about who is missing. About 20 min. | Fills with 0 or the mean without comment; ignores who is missing |
| M4 t1 Write and run the query | The 6 payments created in a free SQL playground; a query by method for April 2026, largest total first; the result pasted | Card 1 payment, 2300; Wallet 1 payment, 800; UPI 2 payments, 570. A half-open date range keeps payment 3 (9 pm on 30 April) and drops payments 5 and 6. About 35 min. | `BETWEEN '2026-04-01' AND '2026-04-30'` drops payments made after midnight on 30 April when paid_at holds a time (checked in SQLite); sorting the wrong way |
| M4 t2 Explain a query | A plain-English paragraph, then a six-row deliveries table of the learner's own, with 50 changed to 2 and the query run | Average delivery minutes per city, delivered orders only, fastest first; cities with fewer than 50 delivered orders are left out because their averages are shaky. On six rows with 2, a city with one delivered order is missing from the result. About 35 min. | Says HAVING filters rows; misses the reason for the threshold; runs it with 50 and gets an empty result |
| M5 t1 Find the silent customers | The two tables created and filled in the playground; a LEFT JOIN query; the result; the joined row count before filtering | The result is Ravi and Imran. Farah signed up in 2025 and Asha, Meena and Sana have orders. The joined count before filtering is 8. About 35 min. | INNER JOIN; a filter on an `o.` column in WHERE, which empties the result (checked); a wrong sign-up year filter |
| M5 t2 First order or repeat | ROW_NUMBER over each customer's whole history in a CTE, then March only in the outer query; the repeat share of March revenue | March has three orders (₹450, ₹300, ₹250); orders 102 and 104 are repeats, so ₹750 of ₹1,000 is 75%. About 35 min. | Numbers only March orders, so every customer looks new; filters before numbering |
| M6 t1 Design a test | A plan: who, split, measure, length and decision rule | Random split at the same time over the same two or more whole weeks; one primary measure (paid sign-ups per user); a winner picked only if a significance test says the gap is not chance; decided before the start. About 25 min. | Splits by city or week; stops when it looks good |
| M6 t2 Noise or signal | A message to the owner, and checks | ₹54,000 is just above the 60-day range (₹38,000–52,000): a gap of ₹2,000 on a range of ₹14,000. A hint, not proof; compares like weekdays over a week or two. About 20 min. | "The layout worked" |
| M7 t1 Run your first notebook | A Colab notebook with the 6 transactions read from text; May's successful value by category, highest first; df.shape printed after each step | Travel 5,200, Food 1,450, Grocery 450. The 30 April Travel payment and the failed Grocery one are left out; dates read day-first (`dayfirst=True`). About 40 min. | Sums all statuses; reads dates month-first; counts transactions instead of value |
| M7 t2 Read the code | A line-by-line explanation, one risk, and the code run on six leads | It drops 1 lead, Rohan, who shares a family phone with Meena and is a different person; the summary shows google 3 and instagram 2. About 30 min. | Explains the syntax only; calls the dropped lead a true duplicate |
| M7 t3 Join and check | A merchants table read from text; a left merge; shape and total before and after; the fixed merge | The shape goes from (6, 5) to (8, 6) and the total from 9,900 to 17,600 because both Travel rows repeat; keeping one row per category brings the total back to 9,900. About 30 min. | Trusts the merge without printing the total; leaves the repeat in place |
| M8 t1 Build the weekly page | One page for 8 stores: the chain total against target, a sorted bar chart of % of target with stores below 100% in red, and a line naming whom to call | Total ₹32.6 lakh against ₹32 lakh (102%). S07, S02, S04 and S05 are below target, S07 first. About 35 min. | Charts raw sales, not % of target; no named stores to call |
| M8 t2 Fix a bad chart | Diagnosis, a redraw in Google Sheets from made-up numbers, both versions shared | Names the distortion (3D, truncated axis, too many colours) and redraws as a sorted bar chart with an axis from zero, one highlight colour and a title that states the point. About 35 min. | A taste-only critique |
| M9 t1 Write a good prompt | A prompt, three checks, the SQL a free AI assistant returns (given column names and made-up rows only), run in the module 5 playground | With module 5's rows, March has three ordering customers, two of them (Asha and Meena) ordered before: 2 of 3, about 67%. The prompt defines "repeat customer"; a mismatch is traced to the definition the SQL used. About 35 min. | No definition; real customer data pasted; checks like "ask the AI again" |
| M9 t2 Catch the error | A verification plan | Recomputes Q2 vs Q1 from raw data with stated date bounds; checks Chennai's contribution to the change. About 25 min. | Accepts it, or checks only one part |
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

**One-line descriptions** (Competent level; applied to `project.rubric` in round 1):

| id | description |
| --- | --- |
| framing | One decision, who makes it, how success is measured, and the period, agreed with the mentor |
| data | Raw file kept; every cleaning step logged with rows affected; gaps in the data stated |
| analysis | Correct SQL or Python, joins checked, a key number reproduced; AI help disclosed and checked |
| dashboard | Built around the decision: key numbers against target, honest axes, readable at a glance |
| recommendation | Leads with the decision and its ₹ impact, states its limits, and the learner can explain every step |

---

## QUALITY REVIEW

### Round 4 (review-4 teaching changes)

The Course Architect made 19 teaching changes. Every quiz and final question in M1 to M10 was checked against the cards and hints as they now stand. Aptitude, final and rubric: no change. Nothing else in the quizzes needed a change; every key position is unchanged and every id kept.

| Question | Why it changed | What changed |
| --- | --- | --- |
| m05-q3 | The new window card spells out "latest payment, DESC, keep row 1", so the old patient case was the card's own example. | Now one row per doctor (latest visit); the learner must choose the partition column as well as the direction. Run in SQLite: per-doctor, DESC picks each doctor's latest visit. Key position kept. |
| m07-q1 | The new worked example prints the same groupby("city")["value"].sum() line. | Columns renamed to outlet and sales. Run in pandas. |
| m07-q2 | The card's own example is 05/04/2026 read as 5 April. | Date is now 08/02/2026 (8 February; month-first would be 2 August). Run in pandas. |
| m07-q3 | The card's guest-customer left merge with NaN is this question's case. | Now orders with a coupon_code removed from coupons; same idea, new case. Run in pandas: 12 rows kept, NaN in the coupon columns. |
| m07-q4 | The card's example is the key line (status, amount, success, 5000). | Now cab bookings: Pune with fare above 800. Run in pandas: & gives 1 row, | gives 3, "and" and the unbracketed form raise errors. |
| m08-q2 | The M8 card's axis example (₹100 to ₹103 lakh, axis from ₹99 lakh, bars 1 and 4) shared its shape and numbers. | Now ₹210 lakh against ₹200 lakh, axis near ₹198 lakh, bars 12 and 2, a 5% rise that looks sixfold (arithmetic checked). |
| m08-q3 | The card's example uses a 92% target. | Target is now 95% throughout; the key (each city's rate against the target) is unchanged. |
| m09-q3 | The new card names the initials, paid-plan and chat-history shortcuts as unsafe, which are this question's wrong options. | Two wrong options now test the same idea in new forms: names and diagnoses deleted but phones kept (a phone number alone can point to one person), and a "won't train on your data" setting. Key unchanged. |
| m10-q3 | The card now says three Diwali weeks are the right evidence for next Diwali: the question's exact case. | Now two weeks of orders from this year's school reopening, for next June's stock. Key unchanged. |

Checked and left alone: m01 to m04, m05-q1/q2/q4, m06 (the card range "about 60% to 84%" and the A/B and "Reading the result" cards quote no question; "85%" appears nowhere in the tests), m08-q1/q4, m09-q1/q2/q4, m10-q1/q2/q4 and f01 to f15. The old wording ("propose charts", "Power BI" in M9, ", so its assumptions show", the old card titles) is quoted in no explanation, why_wrong, learning outcome or this blueprint. The M7 split moved df.info() and describe() to "Check as you go"; no question tests them.

Known leans, accepted because the card must teach the answer (rule 13): m05-q4 mirrors the card's AVG ... OVER (PARTITION BY city); f10 (a finished test with no clear gap, decide on cost) follows M6's "Reading the result"; f08 (LAG, NULL for the first month) follows M5's last card; m09-q2's wrong options are each dismissed by M9 card 2, while the key still needs the item-versus-order insight. Each applies the idea to new numbers or a new case.

For the Course Architect: M5 task 2 asks for March 2026 revenue, but its hint says "filter to April only in the outer query"; it should say March.

### Round 3 (review 3)

| Finding | What was done |
| --- | --- |
| m01-q1 (must-fix) | The founder's message now gives the decision (which cities get extra riders, on Friday), the measure and threshold (fewer than 90% of orders within 30 minutes) and the period (the last four weeks). The key works out that share for each city over those four weeks; the explanation and `why_wrong` say asking is right only for a vague request. Learning outcome reworded to "decision, measure and period". M1 card 1 now says the same (Course Architect). |
| f05 (must-fix) | The old key-like option ("…and whether those who skipped differ"), which M3 card 3 recommends, is replaced by "No average yet: re-survey the 600 households first, so the figure covers all 2,000". The scenario adds "The report is due to the funder next week." `why_wrong` says a re-survey is right only if the gap were not random (for example, only rural-block tablets failed). Key, other options and explanation kept. |
| m10-q1 (must-fix) | The evidence is now Tier-3's own: a ₹49 COD fee ran eight weeks in six Tier-3 cities picked at random; COD returns fell from 31% to 19%, with orders only 2% lower than in other Tier-3 cities. The key extends the fee to every Tier-3 city; the "test in two Tier-3 cities" option is ruled out because that test has been run. Explanation and `why_wrong` updated as the review gave them. Pre is now M6 (reading a random trial). |
| m09-q4 (should-fix) | The "ask it again" option now also re-checks ("…then re-check the query it returns"), so the key no longer beats it in every situation; only the missing schema decides. `why_wrong` adds that a re-check would just find more guesses. |
| Blueprint (should-fix) | The run-together block above the title is gone; its rows are rebuilt in place in the question map, with this round's m01-q1, m09-q4, m10-q1 and f05 rows (and f11's). Header, clue-test leads, known defects and RESULT updated. |

- **Rule checks this round** (review 3's lessons and the track record's weak spots): every over-cautious option in the three rebuilt questions (ask first, check whether the missing differ, pilot first) is now ruled out by a fact in the scenario, and checked against the module's cards: M1 card 1 now says a defined request is ready; M3 card 3's "are the missing rows different?" is answered by "a random 30%"; M10 card 3's "propose a pilot" is answered by the Tier-3 trial already run. No option is named by its letter. No key dominates a wrong option (m09-q4 fixed). Keys survived `--tidy` (55 of 55 unchanged, by script); every id kept.
- **Run** (verification Python): m10-q1, 70% of ₹60 lakh = ₹42 lakh of Tier-3 COD sales at risk against ₹4 lakh of returns; f05, 30% of 2,000 = 600 missing and 1,400 answered. m01-q1 has no arithmetic to check (the learner computes a share; the 90% threshold is given).
- **Length clue (by script):** the right answer is strictly the longest in 6 of 55 (11%): m03-q3, m04-q3, m06-q3, f05, f09, f12. f05's key (89 characters) is now longest by 6 characters over the re-survey option; the gap is small and the review's rewrite was kept as given.

### How it was checked (round 2)

- **Let the scenario decide (rule 10).** For each of the 20 rebuilt judgement questions I wrote the deciding fact into the scenario first. Then I made each wrong option the right answer under a different, plausible fact, and wrote that fact into `why_wrong` ("…would be right if…"). Finally I covered the stem and read only the options: no rebuilt question has an option that is best in every situation. Two wrong options stay as plain real mistakes, as the review allowed: m03-q1's "keep the first 5,000 by time" and m09-q4's "trust sensible row counts".
- **Flips.** The facts point away from the textbook answer in 10 of the 20:
  - m01-q1: don't re-ask a brief that is already defined;
  - m01-q3: the mean for a total;
  - m01-q4: act on a random test;
  - m08-q1: a sorted bar, not a line;
  - m09-q2: the PivotTable check repeats the error;
  - m10-q1: don't pause COD;
  - m10-q3: one reopening season's data for a reopening plan;
  - f05: missing at random;
  - f10: keep A on cost;
  - f14: the working is shown, but on the wrong base.

  In the other 10, the textbook option is still a wrong option that fits another situation, so recognising good practice isn't enough.
- **Keys survived `--tidy`.** A script compared every key's text before and after (55 of 55 unchanged), and every id is kept.
- **Run, not assumed** (verification Python: pandas 3.0.6, SQLite, SciPy). New this round:
  - m01-q3: the mean is ₹3,680–4,150, and × 50 gives ₹1.84–2.08 lakh; the median × 50 gives ₹1.0–1.25 lakh; the midpoint is ₹16,000 (× 50 = ₹8 lakh).
  - m06-q4: 400 of 3,000 = 13%; the margin at n = 400, p = 0.9 is ±2.9 points.
  - m10-q1: 70% of ₹60 lakh = ₹42 lakh of Tier-3 COD sales at risk, against ₹4 lakh of returns.
  - m10-q2: the drops are 70 / 80 / 90 / 420.
  - m10-q4: at a 60% margin, ₹38 / 61 / 45 / 20 lakh of extra sales give ₹22.8 / 36.6 / 27 / 12 lakh of gross profit; the key's net is about ₹8 lakh.
  - m09-q2: on item-level rows, the item average is below the order average, and a PivotTable mean of the same column returns the item average.
  - f04: the test frame has a repeat enquiry, a second course, a sibling on the same phone, and two students with one name. The key keeps 5 rows; name + phone keeps 4 (loses the second course); phone + course keeps 4 (loses the sibling); no subset keeps 6 (keeps the repeat).
  - f07: the INNER JOIN gives 9,000 rows, a LEFT JOIN from customers 10,800, and 3,200 distinct customers (SQLite).
  - f06: COUNT(*) per method for amount > 1000 (SQLite).
  - f10: z = 0.80, p = 0.42.
  - f11: overall z = 8.2; Tier-3 z = −0.72, p = 0.47. The same fall with 30,000 a group gives p = 0.02, which is when the metro-only option would be right.
  - f14: 1,200 ÷ 10,000 = 12%; 1,200 ÷ 11,000 = 10.9%.
  - Round 1's runs still hold for the 22 code and fact questions, which weren't changed.
- **Length clue (by script).** The right answer is strictly the longest in 5 of 55 (9%; chance is about 25%). check.mjs flagged f04's key as 1.7× longer; I fixed it by giving each code option a realistic extra argument (`keep="first"`, `ignore_index=True`), checked in pandas.

### Findings fixed this round (review 2)

| Finding | What was done |
| --- | --- |
| Options clue test (programme, must-fix) | The 20 named judgement questions were rebuilt as above. The 22 code and fact questions are untouched. |
| m01 (must-fix) | q1: the brief is already defined (the 30-minute promise, by city, by Friday). q3: the owner is budgeting fee income and the sponsorships continue. Its options are the median, the mean (key), the median of the 47 regular fees and the midpoint, each "× 50". q4: the app already assigned dark mode at random. |
| m03-q1 (must-fix) | 150 pairs are identical; 50 have a different seat and payment reference. "Keep the later row" (right for a seat change with one payment reference) replaces "flag all", because it ties more closely to the deciding fact. Relabelled Intermediate. |
| m06-q4 (must-fix) | A random draw from all 20,000 members, leavers included; a balanced 4-point scale; 400 replies (13%), mostly long-time members. All four options are real survey flaws, and only non-response is present. |
| m08 (must-fix) | q1: rank the three best months for a campaign; the pie is dropped and an exact table added. q3: the target is stated as a rate (the should-fix is folded in), and each option suits a different user. q4: both definitions, and the owner's definition, are in the case. |
| m09 (must-fix) | q2: an item-level file. The key divides the total by the distinct orders, and the PivotTable option now repeats the error. q4: "never pasted the definitions" is added, and why_wrong gives each option's situation. |
| m10 (must-fix, two findings) | q1: all four options are specific and scoped, with ₹. The facts: COD is 70% of Tier-3 sales, COD returns are 10% elsewhere, and the fee is proven in metros. q2: the funnel is in the case, and every option is an insight and action at a different step. q3: stock for next Diwali. q4: in gross profit at a 60% margin, with four comparisons and four different ₹ figures (₹61 lakh for all non-members). The explanation and learning outcome say net impact = extra gross profit against a fair comparison, minus the cost. |
| Final (must-fix) | f02: a weekly cycle and next-morning action. f04: the duplicate key is decided by siblings sharing phones and students taking two courses (now a code question). f05: a random screen fault. f10: a finished test with a cost difference. f11: every option carries one number from the case, and the key no longer states the verdict. f14: the AI's working and the board's definition are in the case. |
| m09-q1 (should-fix) | The key now asks "what % of that month's customers had ordered before it". The no-columns option keeps its definition, and the other options' lengths are evened out. |
| f15 (should-fix) | The scenario and key describe the randomised comparison (11% with a reminder against 18% without), not a before-and-after fall. |
| m03-q2, f06, f07 (should-fix) | Titles and cases added. f07 is now an applied count: 9,000 rows, with the 1,800 customers who never ordered dropping out. |
| f12 (should-fix) | The scenario names items(order_id, product, item_value). |
| Answer integrity (idea) | Unchanged: For the team 1 and 3. |

### Round 5 (review 5)

| Item | What changed |
| --- | --- |
| m07-q3, m07-q4 (should-fix) | Titles now match the cases: "Removed coupon codes" and "Pune fares above ₹800". Questions, options and keys untouched. |
| Blueprint (should-fix) | Clue-test record brought to the latest run; Practical evidence rewritten for M2 to M9 around the hands-on tasks (M7 t3 added). |
| m10-q3 (idea) | The first option is now "Say the weeks may not be typical of the year, and that the numbers are only a rough guide". The review's wording ("wait for a second year of data") was not used: it would nearly repeat the second option ("Hold the memo until a full year of data is in"). The key is unchanged. |
| m08-q4 (idea) | The scenario ends "She wants one repeat-customer rate on the page." The key is unchanged and the side-by-side option is now plainly wrong. |

### Verdicts

| Dimension | Verdict | Basis |
| --- | --- | --- |
| Accuracy | **Good** | Every key re-solved; every new number and code option run; m10-q4 is now in profit. |
| Alignment with outcomes | **Good** | Each rebuilt quiz question still tests its module's outcome, and the rebuilds rest on card lines that are now in the cards. |
| Coverage | **Good** | All 6 outcomes and 9 skills are in the final; unchanged. |
| Difficulty | **Met** | The final averages 11.0 marks per question, against 9.5 for the quizzes. |
| Fairness and clarity | **Good** | Indian cases; every fact a rebuilt question turns on is in its scenario; no paid tool needed. |
| Scoring validity | **Good** | Labels re-judged (m03-q1, m10-q1 and f07 up; m10-q2 down); positions 14/14/14/13. |
| Integrity | **Acceptable** | Options-only fell from 46 to 39 of 55 on 22 October; 28 of the 39 are code and fact questions that may stay answerable, and every rebuilt judgement question turns on a stated fact (review 3). The project walkthrough remains the defence against AI-written work. |

### Clue-test leads (probes.json, latest run on this exact version, before the round-5 idea edits)

- **options (39 of 55, down from 46 in round 1):** 11 of the 20 round-2 rebuilds right, certain only on m06-q4 and m09-q4. The other 28 right answers are mostly the code and fact questions agreed to stay as they are. m06-q4 is dismissed: it passes the self-test (only current members asked, 40 replies, or a lopsided scale would each make another option right), and its certainty comes from non-response being the commonest flaw. m09-q4 is confirmed (the key added a re-check the wrong option lacked) and fixed. The certain picks on code questions (M4, m05-q1, m05-q2, m07-q4, f08, f12) and on m01-q2, m02-q2, m03-q3, m06-q1, m06-q3, m08-q2, m09-q3, f09 and f13 are dismissed: each is a fact or code item with one right answer by design.
- **cards (40 of 40):** every question answered as keyed from its card alone (38 of 40 in the earlier run; m01-q1 and m10-q1 were confirmed and fixed then).
- **blind (52 of 55):** m01-q1, m08-q4 and m10-q3 chosen differently. Review 5 ruled on all three and the key stands for each. m01-q1: the founder names the decision, measure, breakdown and period, so the request is ready and asking spends a day on answered questions. m08-q4: the owner has defined the term; the scenario now also says she wants one rate on the page. m10-q3: the decision is next June's reopening, so two reopening weeks are the right evidence; the first option's vague "September" re-check is replaced by a plain over-caveat. Review 5 dismissed 11 further leads (m01-q4, m06-q4, m09-q1, m09-q4, m10-q1, m10-q4, f01, f05, f10, f11, f15). Earlier rulings still stand: m02-q1 (a plain range can already be sorted and filtered), m03-q3 (no change of case or spacing makes "BLR" and "Bangalore" one spelling), m06-q4 (400 replies give about ±3 points; the flaw is who replied), m08-q3 (a national figure names no city to call), m08-q4 (the owner has defined the term), m09-q1 (the definition-only prompt names no columns), m09-q2 (the PivotTable averages the same item-level column), m10-q3 (reopening weeks are typical for a reopening decision; case changed in round 4 from Diwali), m10-q4 (Shillong is a tourist town with different visitors), f01 (a count ignores each channel's cost), f02 (a 7-day average hides a one-day problem managers act on next morning), f11 (84 against 75 sales is within chance), f15 (the memo goes to an operations head: recommendation first).
- The nine questions changed in round 4 (m05-q3, m07-q1 to q4, m08-q2, m08-q3, m09-q3, m10-q3) were clue-tested in this run: all answered as keyed from the cards, and in the blind run only m10-q3 was picked differently; review 5 kept its key.

### Defects that remain known

- m08-q4 and m10-q3 were edited after the last clue-test run (the scenario now says she wants one rate; m10-q3's first option no longer names September). Neither key nor its meaning changed; a rerun would confirm.
- Options-only is 39 of 55, above the aim of about half; the excess is the code and fact items, which the review accepted.
- No objective baseline: the self-check is self-report only (For the team).
- The project has no pass rule or rubric weights in the engine yet, and every student sees the options in the same order (For the team 1 and 3).

---

## RESULT

**Ready.** Round 5: review 5's two assessment findings are done (the m07-q3 and m07-q4 titles; the blueprint's clue-test record and Practical evidence), with the two low-risk ideas taken. Keys and ids are unchanged, and check.mjs reports no issues. Optional before publishing: one more clue-test run to confirm the two idea edits.

`check.mjs --tidy` on the revised file: must_fix 0, should_fix 0, rightIsLongest 6 of 55, positions 14/14/14/13, difficulty B 10 / I 37 / A 7 / E 1.

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
