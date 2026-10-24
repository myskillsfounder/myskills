# Assessment tables: ai-powered-data-analytics.json

*Written by `node agents/blueprint.mjs` on 2026-10-22. Don't edit by hand; run it again after any change.*

## What each test holds
| Part | Questions | Marks | Difficulty (B / I / A / E) | Average difficulty | Right answer longest |
| --- | --- | --- | --- | --- | --- |
| da-m01 Thinking like an analyst | 4 | 30 | 2 / 2 / 0 / 0 | 7.5 | 0 |
| da-m02 Spreadsheets that answer questions | 4 | 35 | 1 / 3 / 0 / 0 | 8.8 | 0 |
| da-m03 Cleaning messy data | 4 | 35 | 1 / 3 / 0 / 0 | 8.8 | 1 |
| da-m04 SQL foundations: asking a database questions | 4 | 35 | 1 / 3 / 0 / 0 | 8.8 | 1 |
| da-m05 SQL for real questions: joins and windows | 4 | 45 | 0 / 3 / 1 / 0 | 11.3 | 0 |
| da-m06 Statistics that change decisions | 4 | 45 | 0 / 3 / 1 / 0 | 11.3 | 1 |
| da-m07 Python and pandas for analysis | 4 | 35 | 1 / 3 / 0 / 0 | 8.8 | 0 |
| da-m08 Dashboards people use | 4 | 40 | 1 / 2 / 1 / 0 | 10.0 | 0 |
| da-m09 AI as your analysis partner | 4 | 40 | 0 / 4 / 0 / 0 | 10.0 | 0 |
| da-m10 From numbers to decisions | 4 | 40 | 1 / 2 / 1 / 0 | 10.0 | 0 |
| **Final** (30 min, pass 60%) | 15 | 165 | 2 / 9 / 3 / 1 | 11.0 | 3 |
| **All** | 55 | 545 | 10 / 37 / 7 / 1 | 9.9 | 6 (11%; chance is about 25%) |

## Skills: self-check, teaching and tests
| Skill | Self-check statements (reversed) | Modules | Quiz questions | Learn cards |
| --- | --- | --- | --- | --- |
| Data Literacy & Analytical Thinking | 3 (1) | da-m01 | 4 | 3 |
| Data Cleaning & Preparation | 3 (1) | da-m03 | 4 | 3 |
| SQL & Database Analytics | 3 (1) | da-m04, da-m05 | 8 | 7 |
| Python for Data Analytics | 3 (1) | da-m07 | 4 | 4 |
| Spreadsheet Analysis with Excel | 3 (1) | da-m02 | 4 | 3 |
| Statistics for Decisions | 3 (1) | da-m06 | 4 | 4 |
| Data Visualisation & Dashboards | 3 (1) | da-m08 | 4 | 3 |
| AI-Assisted Analysis | 3 (1) | da-m09 | 4 | 3 |
| Data Storytelling & Business Communication | 3 (1) | da-m10 | 4 | 3 |

The final's questions carry no skill in the file: the Assessment Architect maps them in the blueprint.

## Question map
| Id | Part | Skill | Module level | Difficulty | Marks | Topic | Key | Longest? | What it teaches |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| da-m01-q1 | da-m01 | Data Literacy & Analytical Thinking | foundation | Beginner | 5 | Problem framing | A |  | Once a request names the decision, the measure and the period, answer it; ask questions when it doesn’t. |
| da-m01-q2 | da-m01 | Data Literacy & Analytical Thinking | foundation | Beginner | 5 | Data types | A |  | Check a column’s type before you summarise it: labels are counted, not averaged. |
| da-m01-q3 | da-m01 | Data Literacy & Analytical Thinking | foundation | Intermediate | 10 | Summary statistics | D |  | Use the mean when you need a total, and the median when you need the typical case. |
| da-m01-q4 | da-m01 | Data Literacy & Analytical Thinking | foundation | Intermediate | 10 | Correlation and causation | D |  | When the groups were assigned at random, a clear gap shows cause, and you can act on it. |
| da-m02-q1 | da-m02 | Spreadsheet Analysis with Excel | foundation | Beginner | 5 | Excel tables | D |  | Use an Excel Table so analysis keeps up as the data grows. |
| da-m02-q2 | da-m02 | Spreadsheet Analysis with Excel | foundation | Intermediate | 10 | Lookups | D |  | Use an exact-match lookup with a clear “not found” value, and know each argument’s place. |
| da-m02-q3 | da-m02 | Spreadsheet Analysis with Excel | foundation | Intermediate | 10 | PivotTables | C |  | Averaging a 1/0 column gives a rate. |
| da-m02-q4 | da-m02 | Spreadsheet Analysis with Excel | foundation | Intermediate | 10 | Cell references | C |  | Use $ to fix a reference every row must share, and know which part each $ fixes. |
| da-m03-q1 | da-m03 | Data Cleaning & Preparation | foundation | Intermediate | 10 | Duplicates | B |  | Remove only rows that match in every column; check near-duplicates against another source first. |
| da-m03-q2 | da-m03 | Data Cleaning & Preparation | foundation | Beginner | 5 | Dates | C |  | Use impossible values to work out an ambiguous date format. |
| da-m03-q3 | da-m03 | Data Cleaning & Preparation | foundation | Intermediate | 10 | Standardising categories | D | yes | Standardise categories with a reusable mapping, then check nothing is left. |
| da-m03-q4 | da-m03 | Data Cleaning & Preparation | foundation | Intermediate | 10 | Missing data | B |  | Ask why data is missing before you drop it, and which way it moves the result. |
| da-m04-q1 | da-m04 | SQL & Database Analytics | foundation | Beginner | 5 | GROUP BY | B |  | GROUP BY the thing you say “for each” about, then count or sum within it. |
| da-m04-q2 | da-m04 | SQL & Database Analytics | foundation | Intermediate | 10 | HAVING | B |  | Filter rows with WHERE and groups with HAVING. |
| da-m04-q3 | da-m04 | SQL & Database Analytics | foundation | Intermediate | 10 | NULLs | B | yes | Test for missing values with IS NULL, never “= NULL”. |
| da-m04-q4 | da-m04 | SQL & Database Analytics | foundation | Intermediate | 10 | Aggregates and NULLs | C |  | Know who is in an average before you report it: AVG skips NULLs. |
| da-m05-q1 | da-m05 | SQL & Database Analytics | intermediate | Intermediate | 10 | Joins | D |  | LEFT JOIN from the table you want to keep, then IS NULL, finds what’s missing. |
| da-m05-q2 | da-m05 | SQL & Database Analytics | intermediate | Intermediate | 10 | Join fan-out | C |  | Check the row count and a trusted total after every join to catch double counting. |
| da-m05-q3 | da-m05 | SQL & Database Analytics | intermediate | Intermediate | 10 | Window functions | B |  | Choose the partition and the sort direction to pick one row per group. |
| da-m05-q4 | da-m05 | SQL & Database Analytics | intermediate | Advanced | 15 | Window functions | D |  | Window functions add group context to every row; the partition decides the group. |
| da-m06-q1 | da-m06 | Statistics for Decisions | intermediate | Intermediate | 10 | Experiments | D |  | Random assignment is what lets a test credit a difference to the change. |
| da-m06-q2 | da-m06 | Statistics for Decisions | intermediate | Intermediate | 10 | Sampling | C |  | Small samples give uncertain results: ask how many answers sit behind a figure. |
| da-m06-q3 | da-m06 | Statistics for Decisions | intermediate | Advanced | 15 | Experiments | A | yes | Fix a test’s measure and length before it starts, and judge it at the end. |
| da-m06-q4 | da-m06 | Statistics for Decisions | intermediate | Intermediate | 10 | Bias | D |  | Check who was asked, who replied and who is missing; the flaw is wherever the facts point. |
| da-m07-q1 | da-m07 | Python for Data Analytics | intermediate | Beginner | 5 | groupby | A |  | groupby the category, select the number, then pick the right aggregate. |
| da-m07-q2 | da-m07 | Python for Data Analytics | intermediate | Intermediate | 10 | Dates | B |  | Tell pandas the dates are day-first (dayfirst=True), or give the exact format (format="%d/%m/%Y"), which is strict. |
| da-m07-q3 | da-m07 | Python for Data Analytics | intermediate | Intermediate | 10 | Joins in pandas | A |  | Choose the merge type for the rows you must keep, and expect NaN where nothing matches. |
| da-m07-q4 | da-m07 | Python for Data Analytics | intermediate | Intermediate | 10 | Filtering | A |  | Combine pandas conditions with & or \|, each condition in its own brackets. |
| da-m08-q1 | da-m08 | Data Visualisation & Dashboards | intermediate | Beginner | 5 | Chart choice | A |  | Pick the chart for the question: sorted bars to rank, a line for a trend. |
| da-m08-q2 | da-m08 | Data Visualisation & Dashboards | intermediate | Intermediate | 10 | Misleading charts | A |  | Start a bar chart’s axis at zero. |
| da-m08-q3 | da-m08 | Data Visualisation & Dashboards | intermediate | Intermediate | 10 | Dashboard design | D |  | Build the top of a dashboard around its user’s decision: the target’s own measure, by group. |
| da-m08-q4 | da-m08 | Data Visualisation & Dashboards | intermediate | Advanced | 15 | AI-assisted BI | D |  | Reconcile an AI-drafted measure with the business’s own definition, then check it. |
| da-m09-q1 | da-m09 | AI-Assisted Analysis | intermediate | Intermediate | 10 | Prompting | B |  | Give an AI assistant the schema, the definition, the period and the tool. |
| da-m09-q2 | da-m09 | AI-Assisted Analysis | intermediate | Intermediate | 10 | Verifying AI output | A |  | A check is only independent if it uses the right definition, at the right level of the data. |
| da-m09-q3 | da-m09 | AI-Assisted Analysis | intermediate | Intermediate | 10 | Data privacy | C |  | Keep personal data out of unapproved AI tools; share structure, not people. |
| da-m09-q4 | da-m09 | AI-Assisted Analysis | intermediate | Intermediate | 10 | Verifying AI output | B |  | An invented detail means re-checking the whole AI answer, with the real schema. |
| da-m10-q1 | da-m10 | Data Storytelling & Business Communication | advanced | Intermediate | 10 | Executive summaries | A |  | Lead with the specific action the facts support, with its scope and its ₹ impact. |
| da-m10-q2 | da-m10 | Data Storytelling & Business Communication | advanced | Beginner | 5 | Insights | B |  | Tie the insight and its action to where the numbers show the biggest problem. |
| da-m10-q3 | da-m10 | Data Storytelling & Business Communication | advanced | Intermediate | 10 | Uncertainty | C |  | Whether data is typical depends on the decision it supports. |
| da-m10-q4 | da-m10 | Data Storytelling & Business Communication | advanced | Advanced | 15 | Business impact | C |  | Net impact = extra gross profit against a fair comparison, minus the cost. |
| da-f01 | final | | | Intermediate | 10 | Problem framing | A |  | A question becomes answerable when it names a measure, a period and a decision. |
| da-f02 | final | | | Intermediate | 10 | Alerts and variation | A |  | Set alerts against each measure’s own normal variation, at the speed the decision needs. |
| da-f03 | final | | | Intermediate | 10 | Lookup mismatches | B |  | When a lookup fails on values that look equal, check spaces and data types. |
| da-f04 | final | | | Advanced | 15 | Duplicate keys | A |  | Choose the columns that define a duplicate from what one record means to the business. |
| da-f05 | final | | | Intermediate | 10 | Missing data | C | yes | Why data is missing decides what to report: a random gap needs stating, not correcting. |
| da-f06 | final | | | Beginner | 5 | GROUP BY | D |  | Read WHERE as a row filter and COUNT(*) as a count per group. |
| da-f07 | final | | | Intermediate | 10 | Joins | C |  | An inner join keeps only matching rows, once per match: count rows from the matches. |
| da-f08 | final | | | Advanced | 15 | Window functions | A |  | Use LAG for the previous period, and expect NULL where there is none. |
| da-f09 | final | | | Intermediate | 10 | Summary statistics | D | yes | A mean well above the median signals a few very large values. |
| da-f10 | final | | | Advanced | 15 | Experiments | C |  | When a finished test shows no clear difference, decide on cost or simplicity, not on the tiny gap. |
| da-f11 | final | | | Expert | 20 | Subgroups in A/B tests | B |  | Act on the overall result, and treat a small subgroup’s result as uncertain. |
| da-f12 | final | | | Intermediate | 10 | Joins in pandas | C | yes | After a one-to-many merge, sum at the level where each value appears once. |
| da-f13 | final | | | Beginner | 5 | Chart choice | B |  | Use a sorted bar chart to compare many categories. |
| da-f14 | final | | | Intermediate | 10 | Verifying AI output | B |  | Check an AI’s working against the definition your audience uses, then recompute. |
| da-f15 | final | | | Intermediate | 10 | Memo openings | C |  | Lead with the action and state the evidence exactly, neither more nor less than it shows. |

## Answer keys
- da-m01: AADD
- da-m02: DDCC
- da-m03: BCDB
- da-m04: BBBC
- da-m05: DCBD
- da-m06: DCAD
- da-m07: ABAA
- da-m08: AADD
- da-m09: BACB
- da-m10: ABCC
- final: AABACDCADCBCBBC

## Project rubric (as stored)
- **Problem framing** (`framing`): One decision, who makes it, how success is measured, and the period, agreed with the mentor
- **Data quality** (`data`): Raw file kept; every cleaning step logged with rows affected; gaps in the data stated
- **Analysis** (`analysis`): Correct SQL or Python, joins checked, a key number reproduced; AI help disclosed and checked
- **Dashboard** (`dashboard`): Built around the decision: key numbers against target, honest axes, readable at a glance
- **Recommendation** (`recommendation`): Leads with the decision and its ₹ impact, states its limits, and the learner can explain every step
