# AI powered Data Analytics: course team report

*`/course-team improve`, 22 October 2026. Three reviews, three revisions. Paul's focus: wrong options should be real, reasonable-sounding mistakes.*

## Verdict
**Ready, after you read it through.** Review 5 (23 October) found no must-fix. `check.mjs` passes with 0 must-fix, 0 should-fix and links checked, and **every module scores at least 4 on all eight Module Standard dimensions** (lowest 4, mean 4.2). The review's last five should-fix items were then fixed and re-checked.

## Rounds 4 and 5 (Module Standard)
- **Review 4** scored the modules for the first time and found 19 dimensions below 4, mostly practice (tasks only described or planned) and time (stated minutes the content didn't fill).
- **The Course Architect** made the tasks hands-on, with 6–12 rows of data inside each task prompt, a free tool (Google Sheets, a browser SQL playground, Colab, Looker Studio) and a worked expected answer in the hint. It set honest minutes per task, split three cards (M5, M6, M7) so each shows code with its output, added phone and browser routes (M2, M7), fixed M1's outcome and added a third M7 task.
- **The Assessment Architect** rechecked every question against the new cards and changed nine whose scenarios copied a card's own worked example: m05-q3, m07-q1 to q4, m08-q2, m08-q3, m09-q3 and m10-q3. Keys and ids are unchanged.
- **Review 5** scored every module, solved the nine changed questions blind and ruled on the clue-test leads. Its five should-fix items, three task bugs (a HAVING query that returned nothing on its six-row table, a hint that blamed the wrong filter, `.dt.month` and `sort_values` not taught) and two retitles, are fixed and the queries re-run.

## What changed
| Round | Teaching (Course Architect) | Tests (Assessment Architect) |
| --- | --- | --- |
| 1 | All 30 Learn cards rewritten to 115–157 words, each with the real beginner mistakes for its topic. Filled the gaps that questions relied on: correlation vs cause, `$F$1`, `IS NULL`/`COUNT(*)`, `LAG` and filtering `ROW_NUMBER` in a CTE, `&`/`\|` with brackets, a bar axis starting at zero, NULL arithmetic. Free routes added for Copilot in Power BI and Python in Excel. A statistics outcome added. | 54 of 55 questions rewritten so every wrong option is a named beginner mistake. Five final questions replaced. The final got its feedback lines and was made harder than the quizzes. Difficulty relabelled. Self-check wording and rubric fixed. |
| 2 | Card lines on when the mean is right, a finished test with no clear difference, and typical data depending on the decision. "Profit, not revenue". M8's chart numbers fixed. | 20 judgement questions rebuilt so **the scenario decides**: each wrong option is what would be right in a different situation, and in 10 the facts point away from the textbook answer. m10-q4 put in profit terms. Titles and scenarios added to m03-q2, f06, f07 and f12. |
| 3 | M1: "if the request already names the decision, measure and period, start". | m01-q1, f05 and m10-q1: the scenario now rules out the sensible extra step (ask, re-survey, pilot again). m09-q4's key no longer simply adds a step to a wrong option. The blueprint was rebuilt. |

## The clue tests (a Haiku model, from packets with no answers)
| Run | Options only | Learn cards only | Full question, no key |
| --- | --- | --- | --- |
| Start | 50 / 55 | 40 / 40, 6 untaught | 55 / 55 |
| After round 1 | 46 / 55 | 39 / 40 | 55 / 55 |
| After round 2 | 39 / 55 (the 20 rebuilt: 11) | 38 / 40 | 53 / 55 |
| After rounds 4–5 | 39 / 55 | **40 / 40** | 52 / 55 (m01-q1, m08-q4, m10-q3: keys upheld by review 5) |

- **Options only**: the prober knows data analytics, so this measures whether the scenario decides the answer, not whether a student could guess it. 22 code and fact questions rightly test knowing a construct and stay answerable this way. Of the 20 rebuilt judgement questions, it got 11 right, close to a guess for a prober who knows the subject.
- **m01-q1** is the one disagreement left. The founder now names the decision, the measure and the period, and the right answer is to start the analysis. The prober still chose "ask the founder first", the textbook habit the question is designed to catch. Review 3 and I both judge the key correct, but **please read this question yourself.**
- The other "also defensible" leads are the ones review 3 dismissed. For each, it named the fact in the scenario that rules the option out.

## Scorecard (problems per 10 questions, automatic checks plus review)
| Stage | Must-fix | Should-fix | Right answer longest |
| --- | --- | --- | --- |
| Start (review 1) | 3.3 | 3.6 | 18% |
| Round 2 | 1.6 | 1.5 | 16% |
| Round 3 | 0.5 | 0.5 | 9% |
| Final | 0 | 0 | 11% (6 of 55) |

## Still needs a person
- **Read it through**, especially m01-q1, m10-q1 and f05 (changed last), and the 10 questions whose answers point away from the textbook (listed in the blueprint).
- **Your decisions** (blueprint, "For the team"):
  - shuffle the options for each student;
  - a pass rule and weights for the project rubric;
  - an objective starting test;
  - whether the final's 30-minute timer should be enforced.
- **Sources to check:**
  - Copilot in Power BI licensing: the card says only that it "needs a paid capacity an employer provides";
  - the DPDP Rules' commencement dates, against the Gazette: no question depends on them;
  - Indian hiring figures, which weren't confirmed from a primary source and aren't used in any question.

## Numbers from `check.mjs`
Ready to publish, 0 must-fix, 0 should-fix. 9 skills, 27 self-check statements, 10 modules, 20 tasks, 55 questions (15 in the final). Right-answer positions 14/14/14/13. Difficulty: 10 Beginner, 37 Intermediate, 7 Advanced, 1 Expert. Modules take 14.3 hours; the overview says 35.

## The playbook
Rules 9 to 18 were added from the three reviews:
- read the options alone before saving a question;
- let the scenario decide;
- rule out a sensible extra step;
- never name an option by its letter (checked by `check.mjs`);
- every question is taught by its own module's cards;
- judge "paid for itself" in profit, not revenue;
- every question has a title and a scenario;
- tool modules need a hands-on task on data given in the task;
- a card shows code with its output, and at most two new ideas;
- run a task as written on its small table before writing the hint.

## Files
These are in `docs/programmes/Data analytics/` in the worktree `.claude/worktrees/assessment-probes`:
- `ai-powered-data-analytics.json`: load this in the admin;
- `.assessment.md` and `.assessment-tables.md`: the blueprint;
- `.research.md`, `.review-1/2/3.json`, `.probes.json`, `.scorecard.json`: working files.
