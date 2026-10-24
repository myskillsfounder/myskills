# The course team's playbook

Rules the Assessment Agent has learned from reviews. The Course Architect
and the Assessment Architect follow every one; a broken rule is a finding. This copy is for the agents
that run in Claude Code on Paul's PC (`/course-team`). The server's agents
keep theirs in the database (Admin → Agents' work). When a review teaches a
new general lesson, add it at the end with the date and why.

How the rules learn (the feedback loop, see `node agents/track.mjs report`):
- A rule's number never changes; reviews cite it in each finding's `rule`.
  New rules go at the end and end with "(added YYYY-MM-DD)".
- A rule broken again after it was written isn't working. After one repeat,
  sharpen its wording with a worked example. After two, make it an automatic
  check in `agents/lib/checks.mjs` if a script can see it, and end the rule
  with "(checked by check.mjs)".
- Rules 1 to 8 were written on 2026-10-21.

1. The right answer must not be the longest option more often than chance would make it (about one question in four). Write wrong options of similar length and detail, each a real mistake learners make. *Why:* in the first Data Analytics draft the right answer was the longest in 45 of 55 questions.
2. Code, formula and query questions need wrong options that look just as complete as the right one: the same function with a wrong argument, a missing clause, a wrong default. *Why:* short, obviously broken code options give the answer away.
3. Overview hours must equal the module minutes plus the project and final test. A module with two hands-on tasks takes 60 to 120 minutes, not 40. *Why:* the first draft said 50 hours while its modules added up to 9.
4. Write the project rubric for the field: 4 or 5 criteria that say what good work looks like there, never the generic relevance/quality/presentation set. *Why:* a generic rubric lets every mentor grade differently.
5. State laws and regulations exactly: what they allow as well as what they forbid (India's DPDP Act, 2023 allows processing with consent or for certain legitimate uses). If unsure of a detail, say less rather than guess.
6. "Why the others are wrong" must say briefly why each wrong option is wrong, and must not start with "The others" (the page already labels it).
7. Every task that mentions a paid tool (Copilot, Power BI Pro, paid AI plans) must also be possible with a free one, and say so. *Why:* most MySkills students have no paid licences.
8. When software behaviour depends on the data or settings (for example how pandas reads 05/04/2026), say "can" or name the condition. Never state a default that is not always true.
9. Before saving a question, cover the question and read only its four options. If one is the only careful, checking, hedging or professional-sounding choice, rewrite the others as named beginner mistakes made with the same care, until none stands out. *Why:* in Data Analytics a cheap model picked the right answer from the options alone in 50 of 55 questions after rule 1 was met: the tone of the options gave it away. (added 2026-10-22)
10. In a judgement question, write the fact that decides it into the scenario first, and make each wrong option what would be right under a different, plausible fact (another goal, data shape, audience, deadline or constraint). Test it: change that one fact and a different option should become right. The right answer must never be a wrong option plus one more good step (a re-check, a caveat); give the wrong option that step too. *Why:* with every wrong option a real mistake, a prober who knew the field still picked 46 of 55 from the options alone, because the right answer was the textbook practice whatever the case said. (added 2026-10-22)
11. When a wrong option is a sensible extra step (ask first, check whether the missing rows differ, pilot first), the scenario must state the fact that makes it pointless here. If the module's own Learn cards recommend that step, say in the scenario why it doesn't apply, or it is a second right answer. *Why:* m01-q1, f05 and m10-q1 each kept such a step, recommended by M1, M3 and M10's cards, and the clue tests chose it. A step that is only unnecessary is not wrong. (added 2026-10-22)
12. Never name an option by its letter or position ("option B", "(c)", "the third option") in an explanation, why_wrong or blueprint; quote its words. `--tidy` reorders options. *Why:* m02-q2 pointed students at the wrong option after a re-tidy. (checked by check.mjs) (added 2026-10-22)
13. Every quiz question must be taught by its own module's Learn cards: be able to point to the sentence. If there isn't one, add it to a card (80 to 160 words) before keeping the question. *Why:* six Data Analytics questions tested what no card taught, and all 30 cards were under 80 words. (added 2026-10-22)
14. To judge whether something paid for itself, use profit (extra sales × margin, or cost saved) against a fair comparison, minus its cost. Never subtract the cost from extra revenue. *Why:* m10-q4's answer and M10 card 2 both did. (added 2026-10-22)
15. Every question has a title and a scenario; a bare code or recall question in the final becomes an applied case with numbers. *Why:* m03-q2, f06 and f07 had neither while the blueprint claimed they did. (added 2026-10-22)
16. In a module that teaches a tool (spreadsheets, SQL, Python, dashboards, AI assistants), at least one task must have the learner do the work in a free tool, on data given in the task (6 to 12 rows inline, or a CREATE/INSERT script), and hand in the result. Put the expected answer in the hint. "Describe", "plan" and "explain" tasks don't count as practice for the tool. *Why:* in Data Analytics seven of ten modules had only describe-or-plan tasks, so the learner never opened Sheets, a SQL playground or Colab, and 90 to 120 minutes promised work that wasn't there. (added 2026-10-23)
17. A Learn card introduces at most two new ideas, and shows a command or formula together with the result it gives on a few rows, not the code alone. *Why:* M5 card 3 (four window-function ideas) and M7 card 2 (six pandas commands) showed code but no output, though the quiz asked what the output would be. (added 2026-10-23)
18. After you change a task to run on a small table, run it as written (with the verification Python) and check that every filter, threshold and condition still has rows to act on, and that each filter has a row only it removes. Write the hint from the real output, not the reason you expect. *Why:* M4's `HAVING COUNT(*) >= 50` on six rows returned nothing, and M5's hint blamed the wrong filter for excluding a row. (added 2026-10-23)
