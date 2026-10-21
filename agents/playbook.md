# The course team's playbook

Rules the Assessment Agent has learned from reviews. The Course Architect
and the Assessment Architect follow every one; a broken rule is a finding. This copy is for the agents
that run in Claude Code on Paul's PC (`/course-team`). The server's agents
keep theirs in the database (Admin → Agents' work). When a review teaches a
new general lesson, add it at the end with the date and why.

1. The right answer must not be the longest option more often than chance would make it (about one question in four). Write wrong options of similar length and detail, each a real mistake learners make. *Why:* in the first Data Analytics draft the right answer was the longest in 45 of 55 questions.
2. Code, formula and query questions need wrong options that look just as complete as the right one: the same function with a wrong argument, a missing clause, a wrong default. *Why:* short, obviously broken code options give the answer away.
3. Overview hours must equal the module minutes plus the project and final test. A module with two hands-on tasks takes 60 to 120 minutes, not 40. *Why:* the first draft said 50 hours while its modules added up to 9.
4. Write the project rubric for the field: 4 or 5 criteria that say what good work looks like there, never the generic relevance/quality/presentation set. *Why:* a generic rubric lets every mentor grade differently.
5. State laws and regulations exactly: what they allow as well as what they forbid (India's DPDP Act, 2023 allows processing with consent or for certain legitimate uses). If unsure of a detail, say less rather than guess.
6. "Why the others are wrong" must say briefly why each wrong option is wrong, and must not start with "The others" (the page already labels it).
7. Every task that mentions a paid tool (Copilot, Power BI Pro, paid AI plans) must also be possible with a free one, and say so. *Why:* most MySkills students have no paid licences.
8. When software behaviour depends on the data or settings (for example how pandas reads 05/04/2026), say "can" or name the condition. Never state a default that is not always true.
