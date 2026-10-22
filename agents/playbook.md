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
3. Overview hours must equal the module minutes plus the project and final test. A module with two hands-on tasks takes 60 to 120 minutes, not 40. *Why:* the first draft said 50 hours while its modules added up to 9. Broken again in Digital Marketing v1 (40 hours, 4 of modules), so it is now partly checked by check.mjs (modules under a quarter of the hours).
4. Write the project rubric for the field: 4 or 5 criteria that say what good work looks like there, never the generic relevance/quality/presentation set. *Why:* a generic rubric lets every mentor grade differently.
5. State laws and regulations exactly: what they allow as well as what they forbid (India's DPDP Act, 2023 allows processing with consent or for certain legitimate uses). If unsure of a detail, say less rather than guess.
6. "Why the others are wrong" must say briefly why each wrong option is wrong, and must not start with "The others" (the page already labels it).
7. Every task that mentions a paid tool (Copilot, Power BI Pro, paid AI plans) must also be possible with a free one, and say so. *Why:* most MySkills students have no paid licences.
8. When software behaviour depends on the data or settings (for example how pandas reads 05/04/2026), say "can" or name the condition. Never state a default that is not always true.
9. Absolute words (all, every, only, always, never, whole, equally) must appear about as often in right answers as in wrong ones. When the right action really is an extreme, word it as one. *Why:* in the Digital Marketing revision they sat in 112 of 405 wrong options and 1 of 135 right answers, so a guesser who avoided them scored about 39% instead of 25%. (added 2026-10-22) (checked by check.mjs)
10. When a case states a constraint (consent, deadline, budget, team size), at least one wrong option must also respect it and be wrong for another reason. *Why:* in the Digital Marketing revision the right answer was the only option mentioning consent in META-S003, MAI-S003 and MAI-S005. (added 2026-10-22)
11. When an invented company appears in more than one question, keep one fact sheet for it (size, segments, data available) and check every case against it. *Why:* FinNest's families were "the largest group" in MF-S005 and "about the same size" in MR-S003. (added 2026-10-22)
12. When you rewrite the options of a question whose answer position is fixed, the option at correct_index must be the one the explanation defends: read each pair side by side before you finish. *Why:* in the Digital Marketing revision ANA-S002's key ended up on the wrong option after a rewrite. (added 2026-10-22)
