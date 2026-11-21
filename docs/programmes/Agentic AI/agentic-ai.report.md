# Agentic AI: course team report, 21 November 2026

**Verdict: ready.** The closing review (review 4) left four small, exact fixes. They have been applied and checked. `check.mjs --tidy`: ready_to_publish true, must-fix 0, should-fix 0.

File to load: `docs/programmes/Agentic AI/agentic-ai.json` (web address `agentic-ai`).

## What it is
How to work well with AI assistants and agents. Decide what to hand over, brief the AI clearly, break the work into checked steps, check everything, and own the result. It's vendor-neutral, works with free Gemini, ChatGPT or Claude, and uses Indian workplace cases.

| Part | Count |
|---|---|
| Skills | 8 |
| Modules | 11 (1–5 foundation, 6–9 intermediate, 10–11 advanced), each with an interactive workbook chapter |
| Workbook check-ins | 3 per module |
| Self-check statements | 24 |
| Quiz questions | 44 |
| Foundation assessment | 15 questions, tagged by skill |
| Project rubric | 5 criteria |
| Time | 24 hours: about 15.7 h of modules, 8 h of project, 30 min for the Foundation assessment |

## How it was built
1. **Research**, with sources. The key findings:
   - the skill employers want most is quality control of AI output;
   - agent products change too fast to teach by name;
   - prompt injection is unsolved;
   - DPDP duties start in May 2027;
   - the IT Rules label AI-made audio and video only (rule 2(1)(wa)).
2. **Draft.** The Course Architect wrote the teaching and the workbooks. The Assessment Architect wrote the tests.
3. **Four review rounds and three revisions**, with clue tests before each review. The clue tests are a small model answering the questions the way a student would.

| Round | Answerable from options alone | Must-fix / should-fix per 10 questions | Lowest module score |
|---|---|---|---|
| Draft (review 1) | 88% | 0.8 / 3.2 | 3 |
| Review 2 | 73% | 0.5 / 2.2 | 3 |
| Review 3 | 61% | 0.7 / 2.7 | 4 |
| Closing (review 4) | 58% (final: 6 of 15) | 0.3 / 0.3, fixes applied | 4 |

**What changed most:**
- The tests now make the case decide the answer. Each kind of wrong option is used at most 4 times. There are no odd-one-out sets. Two-part options use a 2×2 design, and in about a quarter of the questions the quicker answer is right.
- Module 9 now states the IT Rules exactly.
- The children's-dose question now follows the Health Ministry's (DGHS) October 2025 advisory.
- Module 7 builds on Module 3 instead of repeating it.
- The workbooks have fair hints, check-ins that don't rehearse the quiz, and two "Try it" cards in most modules.

The examiner judged the remaining 58% acceptable. Those questions test a module's main habit, which knowing the principle rightly answers. The Foundation assessment is within its target.

## Module Standard (review 4)
| Module | Outcome | Explanation | Practice | Feedback | Relevance | Time | Progression | Inclusion |
|---|---|---|---|---|---|---|---|---|
| 1. Assistants, workflows and agents | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 4 |
| 2. Briefing an AI well | 5 | 4 | 5 | 4 | 4 | 4 | 5 | 4 |
| 3. Checking AI output | 4 | 4 | 5 | 5 | 5 | 4 | 5 | 4 |
| 4. Privacy and confidential data at work | 4 | 4 | 4 | 4 | 4 | 4 | 5 | 4 |
| 5. What to hand to AI, and when not to | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 4 |
| 6. Breaking work into steps | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 7. Research with AI: sources you can trust | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 8. Files, tools and connectors | 4 | 4 | 4 | 4 | 4 | 4 | 3→4* | 4 |
| 9. Honest work: disclosure, copyright and AI labels | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 |
| 10. Agents that act: approvals and prompt injection | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 11. Build a no-code AI workflow with a human check | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 4 |

\* M8 progression was 3 because m08-q4 tested something card 3 didn't teach. The examiner's fix is applied: card 3, t2's model answer and the "least privilege" term now teach disconnecting when a repeating approval ends. The examiner said this brings it to 4.

## Needs a person (you)
- **Read it through before publishing**, especially Module 4 (privacy and DPDP), Module 9 (disclosure, copyright, AI labels) and Module 10 (agents).
- **DPDP date:** the course says "May 2027". Sources split between 13 and 14 May; the gazette text wasn't readable.
- **Foundation rules:** one attempt for the certificate against the engine's 7-day retake. The blueprint flags this; it follows your 23 Oct decision.
- **M10:** no step where learners watch a real agent act. That needs a page MySkills doesn't host. It's an idea for later.

## Sources worth checking
They're in `agentic-ai.research.md`. Above all:
- MeitY's IT Rules amendment (rule 2(1)(wa));
- the DPDP Rules 2025 and the October 2026 Removal of Difficulties Order;
- DGHS's 3 Oct 2025 cough-syrup advisory;
- OWASP on prompt injection;
- Microsoft's Work Trend Index 2026.

## What the team learned
Playbook rules 28–41 were added today. Most are about stopping the right answer giving itself away:
- each kind of wrong option is used at most 4 times;
- no odd-one-out sets;
- 2×2 option sets;
- the quicker answer is right in a quarter of questions;
- neutral question stems;
- invented facts fit their place;
- check-ins don't rehearse the quiz.

Rule 30 (check-ins) was broken in all three programmes' first workbooks, so it now has a worked procedure. In the track record, rule 5 (state laws exactly) is still broken again after it was written, in Entrepreneurship and Agentic AI. It needs a stronger fix next: a required primary-source line for every legal claim.

## Load it
In the admin: Course engine → New programme `agentic-ai` (title "Agentic AI") → Check & publish → **Replace the draft…** → paste the file → **Use this file** → **Save draft** → read it → **Publish**. The workbook steps need the app update in the PR below to show.
