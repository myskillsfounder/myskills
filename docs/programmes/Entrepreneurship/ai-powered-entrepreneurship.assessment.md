# AI-Powered Entrepreneurship: assessment blueprint

**File:** `docs/programmes/Entrepreneurship/ai-powered-entrepreneurship.json` (slug `ai-powered-entrepreneurship`). This is an engine programme and a new draft that hasn't been published.
**Run:** first draft of the assessment, 26 October 2026, by the Assessment Architect. It covers the aptitude statements, the 7 module quizzes, the final and the project rubric. The Course Architect's teaching was not changed: a script compared the file with a copy taken before the run.

**Revision 1 (26 October 2026):** fixes the review-1 findings owned by assessment.
- m03-q1 has a new scenario: Sunita's hampers in Nashik replace the copy of M3 task t1.
- m01-q2 now asks which note sits highest on the evidence ladder, and Mr Khan's note is a ₹400 workbook (rung 2).
- f04 is relabelled Intermediate.
- a09 no longer joins a behaviour to a reason.
- The `plan` criterion asks for the team agreement at Competent, after the Course Architect added it to deliverable 5, O5 and M7 t2.
- The UPI note under For the team is updated.

No question uses Ananya's market figures, so the change to ₹600 a month (₹2.16 lakh) in M1 card 5 affects no question. A script again confirmed the teaching was unchanged.
**Inputs:** the research brief (`ai-powered-entrepreneurship.research.md`), the playbook, the Module Standard and Paul's constraints:
- the audience is first-time founders in India;
- there are no legal or compliance questions;
- 7 modules is Paul's deliberate choice;
- the project is mentor-graded over about two weeks, with at least 5 conversations, at least one commitment and a one-page plan;
- fast-changing facts are tested as method, never as numbers.

The tables below drop the `ape-` prefix from ids, so `m03-q2` means `ape-m03-q2`.

---

## ASSESSMENT

| Part | Purpose and skills | Format | Count | Est. time | Scoring | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| Starting self-check (`aptitude`) | The learner's own view of where they start, for each of the 7 skills. It is not demonstrated readiness and says nothing about ability or potential. | First-person statements about behaviour, rated Never / Sometimes / Often / Always. Each skill has one reversed statement. | 21 (3 per skill) | 4 min | Scored per skill on the server, with the reversed item inverted. | None. It is not a gate. |
| Module quizzes (`modules[].quiz`) | Whether the learner can apply that module's outcome. Each module covers one skill. | Scenario multiple choice: 4 options, one right answer | 4 per module, 28 in all | 4–6 min each | Percentage = marks earned ÷ marks available × 100. Code sets the marks from difficulty: Beginner 5, Intermediate 10, Advanced 15, Expert 20. No negative marking; an unanswered question earns 0. | 60% (fixed in SQL). Retake after 24 hours. |
| Final (`final`) | All 6 outcomes and all 7 skills, combining ideas across modules | Scenario multiple choice: 4 options | 15 | 30 min (`minutes`). The questions take about 18 minutes; the rest is extra time for second-language readers. | As for the quizzes. The total is 155 marks: 4 B, 7 I, 3 A and 1 E. | 60% (`pass_percent`), which is 93 of 155. A failed final can be retaken after 7 days. Tell learners this before they start. |
| Project (`project.rubric`) | Practical competence: real evidence that the learner can test an idea and plan its first steps | A mentor-graded project over about two weeks: at least 5 real conversations, at least 1 commitment, an MVP test and a one-page plan | 5 criteria, scored 0–5 each | About 8 h of work, then a 10-min walkthrough with the mentor | The mentor scores each criterion against the descriptors in Practical evidence. The proposed weights are below; the engine doesn't store weights yet. | Proposed under For the team. Engine programmes have no project or certificate step yet (step 3). |

The project is the evidence of practical skill. A high quiz or final score shows understanding, not readiness to run a business. New engine programmes earn a badge only, with no Global Readiness points, until score v8 is decided.

---

## Question map

**Outcomes** (from `overview.outcomes`):
- **O1** validate an idea with real conversations and judge the evidence;
- **O2** build a no-code MVP and test it against a goal set in advance;
- **O3** win first customers through selling, UPI, marketing, networks and referrals;
- **O4** set prices, unit economics, cash flow and first funding;
- **O5** set up a team with roles, and equity with vesting;
- **O6** use AI tools and check what they produce.

**Types:**
- **Concept**;
- **Applied**: choose the right artefact or action;
- **Interp**: interpret data or numbers;
- **Scenario**: a decision under the given facts.

**Columns:** **Sec** is the estimated seconds to answer. **Pre** lists the earlier modules the question relies on.

### Module quizzes

| Id | Module | Skill | Outcome | Tests | Type | Diff | Sec | Pre |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m01-q1 | M1 | idea-validation | O1 | A past-behaviour question beats "would you", price and leading questions | Applied | B | 45 | – |
| m01-q2 | M1 | idea-validation | O1 | Place four notes on the ladder: an introduction and a meeting (rung 3) sit above a past purchase (rung 2) and a promise or praise (rung 1) | Interp | I | 60 | – |
| m01-q3 | M1 | idea-validation | O1 | Bottom-up estimate: the guessed share is what to test | Interp | I | 75 | – |
| m01-q4 | M1 | idea-validation | O1, O6 | AI synthetic users are not evidence | Scenario | B | 45 | – |
| m02-q1 | M2 | mvp-testing | O2 | Riskiest assumption: paying in advance | Scenario | B | 60 | – |
| m02-q2 | M2 | mvp-testing | O2 | A Wizard of Oz MVP with a real payment | Applied | I | 60 | M1 |
| m02-q3 | M2 | mvp-testing | O2 | Judge against the goal set in advance, and change one thing | Interp | I | 75 | – |
| m02-q4 | M2 | mvp-testing | O2 | In a user test, watch and ask; don't explain | Scenario | B | 45 | – |
| m03-q1 | M3 | first-sales | O3 | End the pitch with a specific ask and a UPI advance (a new case, not the task's class) | Applied | B | 45 | – |
| m03-q2 | M3 | first-sales | O3 | Handle a price objection with a question | Scenario | I | 45 | – |
| m03-q3 | M3 | first-sales | O3 | A warm list with personal messages, not a broadcast | Scenario | B | 60 | M1 |
| m03-q4 | M3 | first-sales | O3 | A broken pre-order promise: tell buyers and refund at once | Scenario | I | 60 | – |
| m04-q1 | M4 | lean-marketing | O3 | Positioning: one customer, one promise, a difference | Applied | B | 60 | M1 |
| m04-q2 | M4 | lean-marketing | O3 | Cost per order, not views or likes | Interp | I | 75 | – |
| m04-q3 | M4 | lean-marketing | O3, O6 | An AI caption with a false claim, false urgency and a hidden charge | Applied | I | 75 | – |
| m04-q4 | M4 | lean-marketing | O3 | One channel, chosen from the interviews | Scenario | B | 45 | M1 |
| m05-q1 | M5 | founder-networking | O3 | A forwardable introduction request | Applied | B | 75 | – |
| m05-q2 | M5 | founder-networking | O3 | Double opt-in | Applied | I | 45 | – |
| m05-q3 | M5 | founder-networking | O3, O6 | A few specific LinkedIn notes; no automation | Scenario | I | 60 | – |
| m05-q4 | M5 | founder-networking | O3 | Cost per customer: referral against Instagram | Interp | I | 60 | M4 |
| m06-q1 | M6 | startup-finance | O4 | A value price between floor and ceiling | Applied | I | 60 | M1 |
| m06-q2 | M6 | startup-finance | O4 | Contribution × repeat orders against CAC | Interp | A | 90 | – |
| m06-q3 | M6 | startup-finance | O4, O6 | A fee from the provider's own page, dated | Scenario | B | 45 | – |
| m06-q4 | M6 | startup-finance | O4 | Week-by-week cash goes below zero in a profitable month | Interp | A | 90 | – |
| m07-q1 | M7 | team-building | O5 | Vested share after 30 months | Applied | A | 75 | – |
| m07-q2 | M7 | team-building | O5 | Decision rights by area | Scenario | I | 60 | – |
| m07-q3 | M7 | team-building | O5 | Freelancer brief: deliverable, deadline, payment, files | Applied | I | 60 | – |
| m07-q4 | M7 | team-building | O5 | Test a co-founder partnership before committing | Scenario | I | 45 | M2 |

### Final

| Id | Skills | Outcome | Tests | Type | Diff | Sec | Pre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| f01 | idea-validation | O1 | Answers scatter, so narrow the segment | Interp | B | 45 | M1 |
| f02 | idea-validation | O1, O6 | An unsourced AI market figure; build a bottom-up estimate instead | Scenario | I | 60 | M1 |
| f03 | idea-validation, mvp-testing, first-sales | O1, O2 | The problem is shown, so the next test is an MVP that asks for payment | Scenario | I | 75 | M1–M3 |
| f04 | mvp-testing, idea-validation | O1, O2 | Promises against payments, judged against the goal set in advance | Interp | I | 75 | M1, M2 |
| f05 | first-sales | O3 | Follow up once or twice, then stop | Scenario | B | 40 | M3 |
| f06 | first-sales | O3 | "Paid" only when the money is in your own account | Scenario | B | 40 | M3 |
| f07 | lean-marketing, startup-finance | O3, O4 | Each channel's CAC against a customer's contribution | Interp | A | 100 | M4, M6 |
| f08 | lean-marketing, idea-validation | O1, O3 | Positioning and channel taken from the interview evidence | Scenario | I | 75 | M1, M4 |
| f09 | startup-finance, founder-networking, mvp-testing | O3, O4 | Evidence before investors; use the E-cell | Scenario | I | 60 | M2, M5, M6 |
| f10 | founder-networking | O3 | A partnership written down in one paragraph | Scenario | B | 45 | M5 |
| f11 | startup-finance | O4 | A dated fee inside contribution, then CAC taken away | Applied | A | 100 | M6 |
| f12 | team-building | O5 | Leaving before the cliff vests nothing | Applied | I | 60 | M7 |
| f13 | team-building, lean-marketing | O5 | An intern brief: work, hours, learning, guidance, pay | Applied | I | 75 | M4, M7 |
| f14 | startup-finance, lean-marketing, idea-validation | O4, O1 | A whole plan: losing money on every customer outweighs the rest | Interp | E | 120 | M1, M4, M6 |
| f15 | idea-validation | O6, O1 | AI with interview notes: remove personal details, check every theme | Scenario | A | 75 | M1 |

The final takes about 1,045 seconds (about 17 minutes) of answering. Its difficulty mix is 4 Beginner, 7 Intermediate, 3 Advanced and 1 Expert. `finalPrompt()` asks for about 4 B, 6 I, 4 A and 1 E. Revision 1 relabelled f04 Intermediate because it needs the same single step as m02-q3: an honest label matters more than the target mix. The quizzes are 10 B, 15 I and 3 A, so the final is still harder on average.

---

## Coverage map

| Skill / outcome | Quiz questions | Final questions | Project criterion |
| --- | --- | --- | --- |
| idea-validation | m01 ×4 | f01, f02, f03, f04, f08, f14, f15 | evidence, problem |
| mvp-testing | m02 ×4 | f03, f04, f09 | mvp-test |
| first-sales | m03 ×4 | f03, f05, f06 | evidence (commitment) |
| lean-marketing | m04 ×4 | f07, f08, f13, f14 | plan (channel) |
| founder-networking | m05 ×4 | f09, f10 | evidence (introductions), plan |
| startup-finance | m06 ×4 | f07, f09, f11, f14 | money |
| team-building | m07 ×4 | f12, f13 | plan (team roles) |
| O1 validate and judge evidence | m01 ×4 | f01–f04, f08, f14, f15 | evidence, problem |
| O2 MVP against a goal set in advance | m02 ×4 | f03, f04 | mvp-test |
| O3 first customers | m03, m04, m05 | f05–f10 | evidence, plan |
| O4 price, unit economics, cash, funding | m06 ×4 | f07, f09, f11, f14 | money |
| O5 team, equity with vesting | m07 ×4 | f12, f13 | plan (team owners, and the equity split with vesting at Competent) |
| O6 AI used and checked | m01-q4, m04-q3, m05-q3, m06-q3 | f02, f15 | plan (AI note) |

**Gaps:**
- **G1.** Networking has only 2 final questions. That is in proportion: the project and the M5 tasks carry most of its evidence.
- **G2 (closed in revision 1).** Project deliverable 5 now asks for the owner of each area and the equity split with vesting. Co-founders agree it in writing; a solo founder writes the split they would offer. The `plan` criterion requires it at Competent.
- **G3.** No question tests the UPI MDR rules, gateway rates, WhatsApp pricing, LinkedIn limits or AI free tiers as numbers, as Paul asked. m06-q3 and f11 test the method: take the fee from the provider's page, date it and include it in costs. f11 gives the fee in the scenario as an invented total of 2.36%.
- **G4.** No legal or compliance content is tested.

---

## Practical evidence

### Module tasks (the engine doesn't grade these; a mentor, or a later AI check, can look for this)

| Task | Expected output | A competent result shows |
| --- | --- | --- |
| M1 t1 | 5 rewritten questions and 2 lines on strong evidence | Every question asks about a past event ("the last time…"). None mentions the app or a price. The strong answer named is a real cost in time or money (rung 2) or a commitment (rung 3 or 4). |
| M1 t2 | A problem sentence, 8 edited AI questions, a bottom-up estimate and 3 substitutes | Who, what and how they cope today in one sentence. Every "would you" question is removed or rewritten. Each number has a source, and the guesses are marked. The substitutes are real, never "no competitors". |
| M2 t1 | 5 ranked assumptions, an MVP type and a success goal | The top assumption is the one that would end the business, such as paying ₹349. The MVP asks for a real action or payment. The goal has a number, a group and a time. |
| M2 t2 | A one-screen MVP, the AI changes marked, and a 5-user test plan | The MVP opens on a phone and states who it is for, the problem, the offer, the price and how to order. False AI claims are removed. The goal is written before the test. |
| M3 t1 | A pitch of about 120 words and 2 replies to doubts | All five parts, in the parents' own words. It ends with a specific ask and a UPI advance. Each reply follows listen, ask, answer, and the "ask my husband" reply offers a step both parents can take. |
| M3 t2 | A warm list of 15, 3 quick replies and 1 follow-up | Each person has a reason they might buy. The replies are under 50 words and end with a next step. The follow-up is single and specific, not pushy. |
| M4 t1 | A positioning statement, a channel with 2 reasons, and 2 channels to avoid | The template is filled for first-years. The channel (seniors or the class WhatsApp group) is justified by the interview facts. |
| M4 t2 | A 6-line test plan, an AI draft and an edited post, with a change log | One measure that costs the customer effort, such as orders or replies, and a way to tell where each result came from. Every false claim, false urgency or hidden charge is removed and logged. |
| M5 t1 | A network map of at least 20 entries, with asks and offers, and the first 3 contacts | All four circles are used. The college's E-cell, IIC or incubator has been checked. The first 3 are people a step ahead, with a reason for each. |
| M5 t2 | 3 messages, with the edits noted | The introduction request is forwardable, under 80 words, and states the ask and the time. The LinkedIn note mentions something the person posted publicly. The referral or partnership offer says what each side gains. |
| M6 t1 | Contribution, CAC, contribution per customer and 2 improvements | Contribution ₹349 − ₹205 = ₹144. CAC ₹2,000 ÷ 16 = ₹125. One customer brings 1.5 × ₹144 = ₹216 over three months, more than ₹125. The learner notes the UPI fee question, and the improvements raise repeat orders or cut delivery cost. |
| M6 t2 | Floor, ceiling and price; a 4-week cash flow; the lowest week; a funding source | The price sits between floor and ceiling, with a reason. Cash is counted when it arrives. Fees are dated. The funding source suits the stage, starting with bootstrapping or pre-orders. |
| M7 t1 | A note of under 200 words to the three pickle founders | Ayesha and Rahul are co-founders, and Varun could be an adviser or have a smaller vesting share. Vesting runs 4 years with a 1-year cliff. The three questions cover hours, job offers and settling disagreements. |
| M7 t2 | An owner for each area with a two-line split and vesting, a brief for a freelancer or intern, and 3 team habits | Each area (product, sales, money) has one named owner. The split gives percentages and vesting (for example 4 years with a 1-year cliff), with a reason based on commitment and contribution; a solo founder writes what they would offer. A stranger could start from the brief without asking anything: deliverables, deadline, pay and how it is paid, reviewer, and learning for an intern. The habits are specific and can be checked. |

### Project rubric (in the file: `id`, `name`, Competent `description`; detail here)

Proposed weights total 100 and are not stored in the engine. Weighted score = Σ (criterion score ÷ 5 × weight).

| Criterion | Weight | Evidence required |
| --- | --- | --- |
| `evidence`: Evidence quality | 30 | An interview log of at least 5 conversations, with names removed and permission given, each with a date, a role and past behaviour. A ladder rung for each piece of evidence. Proof of at least one commitment, with personal details hidden. |
| `problem`: Problem and customer | 15 | A problem statement for one named group, a bottom-up estimate with its sources, and the substitutes. |
| `mvp-test`: MVP test | 20 | The MVP itself (a link or screenshots), the success goal dated before the test, a 5-user result and the decision taken. |
| `money`: Price and money | 20 | Floor, ceiling and price; a contribution and CAC table with dated fees; a one-month cash flow. |
| `plan`: Plan and judgement | 15 | A one-page plan: customer, offer, channel, the owner of each area, the equity split with vesting (agreed in writing with co-founders, or the split a solo founder would offer) and the next 30 days. A note to the mentor on what changed and on every use of AI and how it was checked. |

| Criterion | Beginning (0–1) | Developing (2) | Competent (3) | Proficient (4) | Advanced (5) |
| --- | --- | --- | --- | --- | --- |
| evidence | Fewer than 5 real conversations, or mostly friends' opinions. Compliments counted as validation, or AI "interviews" presented as customers. | 5 conversations, but many questions ask for opinions or the future. The rungs are wrong in places. Only a vague "maybe" as a commitment. | At least 5 real conversations about past behaviour, each on the right rung, and at least one real commitment shown (rung 3 or 4). | Several commitments, including at least one of money (a pre-order or deposit). The patterns summary shows what was learned and notes where answers disagree. | Evidence from a sharply defined segment, with money commitments from more than one person. The learner shows how the evidence changed the idea, and the mentor can trace each claim to a log entry. |
| problem | The problem is a product ("an app for…"), and the segment is "everyone" or "all students". The market size is an AI figure with no source. | A segment is named but still broad. The estimate mixes checked and unchecked numbers without saying which. | One named group and its problem in their own words. A bottom-up estimate with checked sources and the guesses marked. Real substitutes listed. | The segment was narrowed because of the interviews. The guessed share has been tested or bounded by interview evidence. | A precise segment that the evidence supports. The estimate is cross-checked two ways, and the substitutes are compared on price and effort for the customer. |
| mvp-test | No MVP, or a full build that tests nothing in particular. No goal, or a goal written after the result. | An MVP exists, but it tests a safe assumption, or it was shown to fewer than 5 users, or the success measure is likes or opinions. | The riskiest assumption is named. The goal (number, group, time) was written before the test. 5 users were tested, and the result is reported honestly against the goal with a keep, change or stop decision. | Observations show where users got stuck. One change was made and re-tested, or the result was explained convincingly. | Two or more rounds of tests, each changing one thing. The decision is clearly justified by the numbers, and the MVP took a day or less. |
| money | No price logic, cost-plus or "cheap because students", or the arithmetic is wrong. Fees are missing. | A price and costs are given, but contribution, CAC or the cash timing is wrong or missing. | A price between cost and the next best option, with a reason. Contribution, CAC and dated fees add up. A one-month cash flow with the lowest week marked. | The CAC comes from a real test. Contribution per customer includes repeat orders. The plan says what changes if the numbers are worse. | Unit economics tested against real sales. The cash plan shows the lowest point and how it is covered. The first-funding choice fits the evidence and says what it costs apart from rupees. |
| plan | A generic plan that doesn't follow from the evidence. AI use is hidden or unchecked, or there are false claims. | The next steps are listed but not linked to the evidence. Several channels at once. Team roles say "we all do everything", or the split is "equal" with no vesting. AI use is mentioned without checks. | The next 30 days and one channel follow from the evidence. Each area has one named owner. A written equity split with vesting: agreed with co-founders, or the split a solo founder would offer. Every use of AI is named, with how it was checked. | Each 30-day action has a measure and a date. The split is justified by commitment and contribution, and says what happens if someone leaves before the cliff. The AI note shows a specific error that was caught and fixed. | A plan a supporter could act on tomorrow. Risks and the next riskiest assumption are named. The team agreement covers hours, decisions and disagreements as well as equity, and every co-founder has confirmed it. AI use is honest and checked. |

---

## QUALITY REVIEW (self-review of this draft)

| Dimension | Verdict | Notes |
| --- | --- | --- |
| Accuracy | Good | Every calculation was run with Node: m01-q3, m04-q2, m05-q4, m06-q2, m06-q4, m07-q1, f07, f11, f12 and f14. In revision 1, every question was searched for Ananya's market figures: none uses them, old or new. Facts tested are only what the Learn cards teach and the research brief supports: the Mom Test ladder, NN/g on synthetic users, YC vesting, LinkedIn's ban on automation tools, and double opt-in. No fee, limit or price is tested as a number. |
| Alignment with outcomes | Good | Each quiz tests its module's outcome. All 6 outcomes are covered in the final (see the coverage map). |
| Coverage | Good | All 7 skills are in the final, in proportion. G2 is closed: the equity split with vesting is now project evidence under `plan`. |
| Difficulty | Good | The quizzes are mostly B and I, with A in M6 and M7, which are labelled advanced. The final is 4 B, 7 I, 3 A and 1 E, after f04 was relabelled honestly. The labels reflect the steps each question needs, not the module's level. |
| Fairness and clarity | Good | Indian names and cities from across the country, ₹ throughout. No region, religion, wealth or paid tool is needed. Short sentences, and every question can be answered on a phone. |
| Scoring validity | Good | One defensible answer per question, checked by answering each without the key. The wrong options are the brief's first-founder mistakes: pitching instead of asking, praise taken as validation, building first, everyone as the segment, AI figures and AI personas, cost-plus or "students can't pay" pricing, likes over orders, and handshake equity. The right answer is the longest option in 5 of 43 questions (12%), each by 5% or less. The new m03-q1 key was shortened so that it is not the longest. After `--tidy` the right answers sit in positions A 11, B 11, C 11 and D 10. |
| Integrity | Adequate | The multiple-choice tests can be answered with an AI chatbot open; they show understanding only. The project is the real evidence. See the AI section below. |

**Checked against the team's known weak spots** (`track.mjs report`):
- **Right answer longest** (81.8% in the first Data Analytics draft): 5 of 43 here.
- **Playbook rule 1:** checked by script.
- **Rule 2:** no code questions. The numeric options in m05-q4, f11 and m07-q1 are each a realistic calculation slip.
- **Rule 4:** the rubric is specific to the field.
- **Rule 5:** no laws are tested.
- **Rule 6:** no `why_wrong` starts with "The others".
- **Rule 7:** only free tools.
- **Rule 8:** no software defaults are stated.
- No rules are recorded as broken repeatedly yet, and no review findings have been tagged yet.

**Known remaining defects (minor):**
1. Four items reason with contribution against CAC: m06-q2, f07, f11 and f14. Each adds a different element: repeat orders, the channel choice, the fee, and reading a whole plan. Even so, Question health should check that they don't all rise and fall together.
2. Quizzes m03 and m04 share the answer key B-C-B-D after `--tidy`. check.mjs flags a shared key only at 3 quizzes, so this is cosmetic.
3. Fixed in revision 1: m01-q2 asks for the highest rung, and Mr Khan's note is a one-off ₹400 workbook. It can no longer be argued as the strongest sign. The four notes sit on rungs 3, 1, 2 and 1.
4. The reversed aptitude statements have not been tried on learners. a09 (reworded in revision 1 to a single behaviour) and a21 should be checked for agreement bias once data exists.
5. No learner data exists yet. Difficulty labels are judgements until there are about 30 first-time answers per question.

**AI and integrity:**
- Don't rely on AI-detection tools. The project's defences are built in:
  - the mentor reviews the interview script before the conversations start (the brief says so);
  - the learner keeps a dated log;
  - the commitment is shown live in a 10-minute walkthrough (for example, the UPI credit in the learner's own app, with personal details hidden, or the booked trial message);
  - the learner's Google Doc or Sheet has version history;
  - the mentor asks the learner to explain one number and one interview in their own words.
- An invented interview log falls apart under two follow-up questions about a specific conversation.

## RESULT

**Ready.** Every review-1 finding owned by assessment is fixed. check.mjs reports `ready_to_publish: true` with 0 must-fix and 0 should-fix findings. The assessment parts are ready for the Assessment Agent's round-2 review and Paul's read-through. G2 is closed.

## For the team (Paul decides)

1. **Final pass mark and time:** I kept `pass_percent` 60 and `minutes` 30, the engine defaults. That is 93 of 155 marks, after f04 was relabelled Intermediate. A 7-day retake follows a fail.
2. **Project pass rule (proposed):**
   - Pass = a weighted score of at least 60, with `evidence` at least 3.
   - A project without 5 real conversations and one commitment is incomplete, not failed.
   - The engine doesn't store weights or levels yet, so this needs step 3.
3. **Credential:** a badge only, until score v8 is decided. No Global Readiness points.
4. **Objective diagnostic (optional, not stored by the engine):** a 6-item baseline, for example:
   - pick the past-behaviour question;
   - rank 3 pieces of evidence;
   - choose the riskiest assumption;
   - cost per order from a test;
   - contribution against CAC;
   - the vesting cliff.

   It would give real starting evidence beside the self-check. Use new items, not quiz items, so they don't leak.
5. **Other assessment types:**
   - a written interview script and a one-page plan, graded by AI against this rubric with a person checking;
   - a short role-play of a sales conversation with the mentor.

   Both would test O1 and O3 better than multiple choice.
6. **Module count:** 7 is Paul's deliberate choice; the house style says 8 to 12. check.mjs does not flag it.
7. **Dated facts in the teaching (M6 card 3 and M3 card 4):**
   - M6 card 3 states the UPI MDR from NPCI's FAQ of 15 September 2026 (npci.org.in), which confirms the fee terms.
   - The start was postponed until after Diwali 2026, with the date to be notified.
   - The MDR is not tested. Recheck it before publishing.
   - NPCI stopped person-to-person UPI collect requests from 1 October 2025 (circular of 29 July 2025). M3 card 4 already says one person can't send another a payment request. No question relies on collect requests; m03-q1's key asks for an advance by UPI.
