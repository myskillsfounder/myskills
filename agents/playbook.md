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
9. On the day of review, re-check any regulatory or payment fact whose start date falls within the last 60 days or the next 90 on the regulator's own site (NPCI, RBI, a ministry). Until a start is confirmed, write "is due to start on" or "from a date NPCI will announce", never "began on". Check payment steps against current rules too: person-to-person UPI collect requests ended on 1 October 2025. *Why:* the Entrepreneurship draft said the UPI merchant fee "began on 15 October 2026" (NPCI had postponed it) and told learners to "request a payment" by UPI. (added 2026-10-26)
10. Every overview outcome must be shown by the learner's own work: a project deliverable, or a module task done on their own idea. If an outcome depends on circumstances (co-founders, a budget, existing customers), say so in the outcome and give a route for learners without them. *Why:* the Entrepreneurship overview promised "a written equity split with vesting" that a solo founder had no way to show. (added 2026-10-26)
11. Don't reuse a Practise task's scenario (same business, city and price) for a quiz question in the same module, even with the person renamed: quiz scenarios need a new context, so they test transfer, not memory. *Why:* m03-q1 copied t1's spoken-English class with Karthik renamed Karan. (added 2026-10-26)
12. After any fix that changes a person, business or number, re-read every sentence that refers to it in the same item (stem, options, explanation, why_wrong) and the sentence you edited: update pronouns and names, and split any sentence the fix pushed over 20 words. *Why:* in the Entrepreneurship round 2, the new seller Sunita was still "his", and two fixes made 28- and 32-word sentences. (added 2026-10-26)
13. Every final-assessment question names the skill it mainly tests (`skill`), and each skill a foundation-level module trains has at least 2 of them: the Foundation assessment places students skill by skill, and the database refuses to publish otherwise (checked by check.mjs). *Why:* AI-Powered Entrepreneurship passed every check, then the admin's Publish refused it: none of its 15 final questions named a skill. (added 2026-10-26)
