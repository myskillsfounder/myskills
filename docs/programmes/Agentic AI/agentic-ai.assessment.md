# Assessment blueprint: Agentic AI (`agentic-ai.json`)

Drafted 2026-11-21 by the Assessment Architect. Revised the same day for review rounds 1, 2 and 3 (round 3: m01-q4 made unambiguous, final rewrites to f03, f04, f09–f12, f14, f15, and flips in m08-q4, m10-q4, m11-q1). Counts, marks, difficulty mix, answer keys and the per-question table are in [agentic-ai.assessment-tables.md](agentic-ai.assessment-tables.md) (run `node agents/blueprint.mjs` after any change). This file holds the judgement.

Overview outcomes, numbered for the maps below:
O1 decide what to hand to AI · O2 brief an AI · O3 check output, keep a log · O4 protect data, set approval points and limits · O5 build and test a no-code workflow · O6 disclose AI use and own the result.

## ASSESSMENT

| Part | Purpose and skills | Format | Minutes | Scoring | Pass |
| --- | --- | --- | --- | --- | --- |
| Self-check (`aptitude`) | The learner's own view of where they start, on all 8 skills. Not evidence of readiness. | 24 statements, 3 per skill, 1 reversed per skill; Never / Sometimes / Often / Always | 4 | Self-rating only; reversed items scored the other way. Not graded. | None |
| Module quizzes (11) | Each checks its own module's outcome, using only that module and earlier ones. | 4 scenario MCQs each, 44 in all | 6 each | % = marks earned ÷ marks available × 100. Marks come from difficulty (Beginner 5, Intermediate 10, Advanced 15, Expert 20), set by code. No negative marking. An unanswered question scores 0. | No pass mark; feedback only |
| Final = **Foundation assessment** | Foundation certificate and the entry benchmark for experienced learners. Covers modules 1–5 and their 5 skills, 3 questions per skill, each tagged `skill`. | 15 scenario MCQs | 30 | As for quizzes; each skill is also reported on its own (placement). | `pass_percent` 60. Foundation bands (Paul's decision): Gold 80+, Silver 60+, Bronze below 60. One attempt for the Foundation certificate. |
| Project | Practical competence: a real AI-assisted workflow for a small organisation. **This, not the final, is the evidence of job-ready skill.** | 6 deliverables; 5 rubric criteria, each graded 0–5 by the mentor | about 8 h | Proposed weights below; the engine stores criteria without weights, so for now each counts equally. | Proposed: at least 3 (Competent) on every criterion |

The final covers modules 1–5 only, by Paul's decision. Task Breakdown, Tools/Files/Research and No-code Automation are shown by their quizzes and the project, not the final.

## Question map

Type: C concept, A applied, D data interpretation, S scenario decision. Sec = estimated seconds. Prereq = earlier modules it relies on. "Decided by" is the scenario fact that makes the key right and the wrong options wrong (rule 20). **flip** marks a key that is the quicker or less cautious option, with the fact that makes caution costly (rule 32). 2×2 marks a two-part option set built by rule 31.

| Id | Outcome | Type | Sec | Prereq | Decided by |
| --- | --- | --- | --- | --- | --- |
| aa-m01-q1 | O1 | S | 60 | – | **flip**: fixed headings; no manual start; written note wanted |
| aa-m01-q2 | O1 | S | 75 | – | next search depends on results; staff approve bookings (2×2: set-up × who books) |
| aa-m01-q3 | O3 | A | 60 | – | every price raised this month; 200 printed cards (2×2: how many × against what) |
| aa-m01-q4 | O1 | S | 75 | – | label gives adult doses only; no one present can advise; the Check option uses an unqualified blog chart, so only Decide stops it |
| aa-m02-q1 | O2 | A | 60 | – | brief already has context, example and format |
| aa-m02-q2 | O2 | S | 75 | – | new topics every week; chats short; tone fine |
| aa-m02-q3 | O2 | S | 75 | – | reminder in the same chat already failed; 15 drafts left |
| aa-m02-q4 | O2 | A | 50 | – | **flip**: no delivery promise at all; SMS already fits |
| aa-m03-q1 | O3 | D | 75 | – | figures and % already checked; AI cited no source |
| aa-m03-q2 | O3 | A | 60 | – | table lists every district |
| aa-m03-q3 | O3 | A | 60 | – | **flip**: total already matches the fee sheet; report due in 10 min; five claims unchecked |
| aa-m03-q4 | O3 | S | 75 | M1 | welcome figures checked against the register this morning; quote and rates new |
| aa-m04-q1 | O4 | S | 75 | – | **flip**: identifiers and free text already checked; themes by area due within the hour; personal account not allowed |
| aa-m04-q2 | O4 | C/S | 75 | – | Joseph is paid; Ira acts for the agency |
| aa-m04-q3 | O4 | S | 75 | – | written policy names one tool |
| aa-m04-q4 | O4 | S | 75 | – | one row per sick day; policy: approved assistant once names, IDs, health details removed |
| aa-m05-q1 | O1 | S | 75 | M1, M3 | bills turn on a tax rule she can't judge; client files on it |
| aa-m05-q2 | O1 | S | 75 | M1, M3 | **flip**: no one reads Kannada (Guwahati club); contact unreachable until next week; "confirmed" by a second AI is untrue |
| aa-m05-q3 | O6 | S | 50 | – | coursework needs a note; exam bans AI |
| aa-m05-q4 | O6 | A | 60 | M2 | paper exam; his own working on one problem |
| aa-m06-q1 | O1 | S | 90 | M3 | notes had the right date; Telugu matched the draft |
| aa-m06-q2 | O1 | A | 75 | M4, M5 | prices only on the notice board |
| aa-m06-q3 | O3 | A | 75 | M3 | circular of 1 Oct superseded by the accounts office’s 8 Oct correction |
| aa-m06-q4 | O1 | S | 75 | M3 | **flip**: facts already checked; rejection is length and a missing section; 30 in an hour |
| aa-m07-q1 | O3 | S | 75 | M3 | newer circular opens from the news link |
| aa-m07-q2 | O3 | A | 60 | M3 | **flip**: AI figure has no source; owner needs the answer today |
| aa-m07-q3 | O3 | D | 75 | M3 | survey of small shops, 2026, UPI, one city |
| aa-m07-q4 | O3 | S | 90 | M3 | counselling body runs the round and spoke last (every option cites and notes) |
| aa-m08-q1 | O3 | A | 60 | M1, M2 | whole year wanted; 1,400 rows, accepted as an attachment |
| aa-m08-q2 | O3 | D | 90 | M3 | rate = missed ÷ booked |
| aa-m08-q3 | O3 | S | 75 | M3 | **flip**: quote already found in the PDF; contents page lists one clause; bid due in 30 min (2×2: when × cite what) |
| aa-m08-q4 | O4 | S | 60 | M4 | **flip**: approval runs to March; only the manager can reconnect, and she is at building sites every Monday (2×2: scope × duration; key quick in duration) |
| aa-m09-q1 | O6 | C/A | 75 | – | which piece looks real and shows a person |
| aa-m09-q2 | O6 | A | 60 | M5 | college rule asks tool, parts, checks; note omits checks |
| aa-m09-q3 | O6 | S | 60 | M3 | **flip**: owner’s own line; exact search already clean; printer needs text today |
| aa-m09-q4 | O6 | S | 75 | M5 | ownership of AI output unsettled; copying already checked |
| aa-m10-q1 | O4 | S | 60 | M1, M3 | log lists steps only; service emails every booking to the inbox |
| aa-m10-q2 | O4 | S | 90 | M2, M8 | job has no replies; brief already has the data line; recurring emails |
| aa-m10-q3 | O4 | S | 75 | – | **flip**: runaway searching, no booking; the one staff member is in meetings all day |
| aa-m10-q4 | O4 | S | 75 | M8 | **flip**: forms need a code from the fest’s Gmail, and he is in lectures all day; nothing else |
| aa-m11-q1 | O5 | A | 60 | M1 | **flip**: human check present; 150 forms a month against 100 free tasks; no fallback line |
| aa-m11-q2 | O5 | A | 60 | M10 | one test of each kind; five runs this week |
| aa-m11-q3 | O5 | S | 60 | – | phone only; no budget; approval required |
| aa-m11-q4 | O5 | S | 75 | M2 | **flip**: class days already in brief; replies in English; one test run left (2×2: fix × rerun) |

Final (Foundation): skill and modules combined.

| Id | Skill | Modules combined | Outcome | Type | Sec | Decided by |
| --- | --- | --- | --- | --- | --- | --- |
| aa-f01 | ai-foundations | M1 | O1 | S | 60 | **flip**: same three questions, fixed answers |
| aa-f02 | ai-foundations | M1 | O1 | S | 75 | sheet attached to the first; no amount or date for the second |
| aa-f03 | ai-foundations | M1, M3 | O1 | S | 90 | **flip**: error was a company fact; tone fine; 40 emails in 40 minutes; buyer websites linked (2×2: scope × source; key narrow in scope) |
| aa-f04 | briefing | M2, M4 | O2, O4 | S | 105 | he asks two things the rule answers; Ayesha adds name and room (2×2; key answers now rather than deferring). Neutral stem |
| aa-f05 | briefing | M2 | O2 | A | 60 | two descriptions of the voice already failed; no example yet |
| aa-f06 | briefing | M2, M3 | O2 | S | 75 | PDF has no rule numbers; 20 minutes |
| aa-f07 | verification | M3 | O3 | D | 120 | quarter figures match records (options no longer show the working) |
| aa-f08 | verification | M3, M5 | O3 | S | 75 | embassy page dated 2023 sends readers to the e-visa site; client books flights |
| aa-f09 | verification | M3, M5 | O3 | S | 90 | not in the court’s records; the Act doesn’t cover the point; filed tomorrow |
| aa-f10 | safe-use | M4, M5 | O4 | S | 90 | **flip**: approved tool down; eight short codes; meeting can’t move (insurer reviews next day) |
| aa-f11 | safe-use | M4 | O4 | A | 90 | comment 14 identifies one person, comment 31 (one of 40) doesn’t; themes by team. Options name items by label |
| aa-f12 | safe-use | M4 | O4 | S | 75 | **flip**: consent covers the bakery’s offers only; offers bring a third of weekday sales |
| aa-f13 | integrity-judgement | M5, M4 | O6 | S | 75 | **flip**: contract allows AI drafts with training off; setting is on; due tomorrow, replies in a week |
| aa-f14 | integrity-judgement | M5, M3 | O6 | S | 90 | AI allowed with a note; conclusion rests on all three statistics; two hours (2×2: all vs sample × note) |
| aa-f15 | integrity-judgement | M5, M3 | O1 | S | 75 | **flip**: every figure in the open sheet; seven to send within the hour (2×2; key quick in who drafts). Neutral stem |

About 20 minutes of reading and answering, so 30 minutes is fair on a phone.

## Coverage map

| Outcome / skill | Quizzes | Final | Project | Gap |
| --- | --- | --- | --- | --- |
| O1 Decide | m01, m05-q1/q2, m06 (10) | f01–f03, f15 | Step plan; rubric `task-design` | – |
| O2 Brief | m02 (4) | f04–f06 | Briefs; rubric `briefs` | – |
| O3 Check | m01-q3, m03, m06-q3, m07, m08-q1/q2/q3 (13) | f07–f09 | Verification log; rubric `testing` | – |
| O4 Protect / approvals / injection | m04, m08-q4, m10 (9) | f04, f10–f12 (data only) | Privacy and safety check; rubric `safety` | Approvals and injection aren't in the final (M10, advanced) |
| O5 Build and test a workflow | m11 (4) | none, by design | Working workflow and 5 tests; rubric `testing` | Shown only by m11 and the project, which is right for a practical outcome |
| O6 Disclose and own | m05-q3/q4, m09 (6) | f13, f14 | Handover note; rubric `handover` | – |
| ai-foundations, briefing, verification, safe-use, integrity-judgement | yes | 3 each | yes | – |
| task-breakdown, tools-and-agents, automation | 4 each | none (Paul: final = modules 1–5) | step plan, files/access, build | Not in the Foundation result; say so on the test page and certificate (see For the team) |

## Practical evidence (tasks and project)

The engine doesn't grade tasks. What a mentor, or a later AI check, should look for:

| Module | Expected output | A competent result shows |
| --- | --- | --- |
| M1 | t1 four-column table; t2 four-row table plus one disagreement | Prompt B marked "can't tell" until checked; C counted as 14 by hand; jobs 1 and 4 chat, 2 workflow, 3 agent with owner approval of orders |
| M2 | t1 brief, both replies, 2 lines; t2 questions, 2 feedback lines, final reminder | All four FreshTokri facts kept; each feedback line names one measurable change; Friday 5 pm still in the final reminder |
| M3 | t1 six-row log; t2 three-row source log | Total ₹2,70,000, best month June, growth ≈31%, survey removed as unsupported; every link opened, quote searched, NPCI page chosen |
| M4 | t1 redacted table, prompt, reply, 1 line; t2 five-row table plus one done task | No phone numbers; row 4's staff name and flat number gone; themes match real rows; launch plan needs permission |
| M5 | t1 six-row table and a post; t2 two explanations, 3 questions | Task 4 stays with people; post keeps briefed details exactly; second explanation fixes a real gap in own words |
| M6 | t1 step table; t2 prompts, check notes, final FAQ | Facts collected in a person step first; every check specific; at least one invented detail removed that self-review kept |
| M7 | t1 150-word sourced answer, source table, dropped claim; t2 comparison table | Primary sources opened and dated; "Not confirmed" used honestly; disagreement settled by a primary source |
| M8 | t1 AI vs own answers; t2 access plan and settings note | Learner's own Sheets figures; any AI error named; read-only, one source, disconnect, approver named |
| M9 | t1 two notes and a reader's line; t2 four-row table and search result | Notes name tool, parts, checks; reader can say what AI did. Items 1 (a realistic AI image of a real cricketer) and 3 (a realistic AI voice-over) fall under the 2026 IT Rules; items 2 and 4 don't. Item 1 also needs replacing for likeness |
| M10 | t1 action/approval/access/stop/check plan; t2 injection line and two summaries | Ordering and paying need approval; budget cap and step limit; the hidden line copied exactly; the two summaries compared honestly |
| M11 | t1 workflow card; t2 build link or screenshots and five test records | Human check before sending; tests 3–5 handled ("office will confirm", rules kept, number not repeated); brief improved and failed test rerun |

### Project rubric (stored criteria; weights and levels proposed)

| Criterion | Weight | Evidence | Beginning 0–1 | Developing 2 | Competent 3 | Proficient 4 | Advanced 5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Task choice and step plan | 20% | Task brief, step plan | Vague task, no current time or owner; steps unlabelled | Real task; labels given but reasons generic | Real weekly task with current time; each step labelled with a stakes/checkability reason | Plus done criteria per step that a stranger could check | Plus a simpler option weighed and rejected for a stated reason |
| Briefs | 20% | Saved briefs, test outputs | One-line prompts | Some parts of a brief; facts missing | Goal, facts, audience, limits, example, format; "office will confirm" for gaps | Brief changed in response to a named test failure | Briefs reusable by the owner without the learner |
| Testing and verification | 25% | ≥5 test inputs, outputs, log | Fewer than 5 tests, or outputs not kept | 5 tests, all "normal" | Normal, messy, off-topic, tricky and personal-data tests; log shows check, error, change | Failed tests rerun after a fix; one number or fact independently re-checked | Learner finds a failure the mentor didn't expect and fixes it |
| Privacy and safety | 20% | Permission, privacy check | Real personal data in an AI tool, or no permission | Names removed but other identifiers left | Written permission; only sample/redacted data; approval before send/pay/delete; risks listed | Least access stated for every tool and connector | A tested injection or misuse case with its defence |
| Handover and honesty | 15% | Handover note, mentor conversation | No note, or AI use hidden | Note vague ("minor AI help") | Owner can run it; AI use stated specifically; learner explains every step | Owner's feedback acted on | Owner runs it unaided for a week and the log shows it |

Integrity: the mentor asks the learner to explain one brief and one log entry live, and checks the version history of the sheet or build. No AI-detection tools.

## QUALITY REVIEW (round 3 revision)

| Area | Verdict |
| --- | --- |
| Accuracy | m01-q4: the Check option now compares doses with a parenting blog's chart, so only Decide would have stopped the message (the round-2 label option was a fair second answer). m04-q3 now says "from May 2027", since sources give 13 or 14 May; that date is still **unconfirmed** from a primary source, and no question turns on the day. m11-q1 uses M11 card 2's free-plan figure (100 Zapier tasks a month): 150 forms run it out every month. Arithmetic unchanged since round 1 (f07, m03-q1, m08-q2 run in the verification Python). |
| Alignment | Rewritten keys trace to their cards: m06-q3 (M6 card 2 done criteria, checked against the right source), m08-q4 and m10-q4 (least privilege: only the access the task needs, for as long as it needs it), m11-q1 (card 1 "If it fails", card 2 free limits), f03 (M3: check against the original source), f09 (M3 card 1: an unfound ruling comes out), f11 (M4 card 1: combinations identify). |
| Coverage | Unchanged: 6 outcomes and 8 skills; final 3 per foundation skill, each tagged `skill`. |
| Difficulty | Quizzes B9 / I33 / A2; final B3 / I9 / A3. |
| Fairness and clarity | Stems are neutral (rule 35): f04 "Which revised brief should she use?", f15 "What should she do?", m10-q4 "Which set-up should he use?" (was "safest"). f11 names comments by number and never quotes the risky phrase in an option (rule 36). |
| Scoring validity | **Clue test run 3** (round-2 version): options 36 of 59 (61%), final 11 of 15; cards 44 of 44; blind 56 of 59. Examiner's rulings, accepted: 17 of the quiz questions answered from options are fair (knowing the principle is the skill, or a scenario-decided flip); m01-q4 was ambiguous (fixed); m06-q3, m08-q4, m10-q4, m11-q1 and seven final questions gave the answer away (all rewritten as the examiner specified). **Rule 32 (flips, counted by script):** every quiz has at least 1 (M8 2, M10 2, M11 2: m08-q3/q4, m10-q3/q4, m11-q1/q4); final 6 of 15 (f01, f03, f10, f12, f13, f15). **Rule 34:** every 2×2 keys a quicker, narrower or less textbook value in at least one part (m01-q2, m08-q3, m08-q4, m11-q4, f03, f04, f15) except m01-q3 (missed by the run-3 prober, so left) and f14 (the examiner's own rewrite: both checking all three and the note are required by the case). **Rule 28, counting check-ins:** ask-the-AI as a wrong option is now in m05-q2 (the examiner's rewrite, "call it confirmed"), aa-m03-c1, aa-m06-c2, aa-m07-c2 and aa-m08-c2 ("ask the same question again", which the Course Architect's round-3 edit left in); right in m06-q4. That is 5, one over; removing aa-m08-c2's option (Course Architect) brings it to 4. m10-q1's "agent's step log" is counted as its own family (the agent's record), used once. Right answer uniquely longest 9 of 59 (15%); positions 15/15/15/14. **Clue test run 4** (round-3 version): options 34 of 59 (58%), final 6 of 15; cards 43 of 44 (m08-q4); blind 58 of 59 (m08-q4). Review 4's rulings: m08-q4 ambiguous and partly untaught (fixed: Arjun, "building sites with no laptop", and M8 card 3, t2's after and the Least privilege term now teach disconnecting when a repeating approval ends); of the 15 other blind flags, m10-q4 fixed (he is in lectures all day) and 14 not defensible; the 28 quiz questions answered from options accepted as fair. **Rule 28:** 4 (aa-m08-c2's option replaced), met. |
| Integrity | No check-in decision reused (re-checked against the round-3 check-ins). The final repeats no quiz question. |

Review-3 findings fixed (owner `assessment`): m01-q4; final f03, f04, f09, f10, f11, f12, f14, f15; m05-q2; m06-q3; m08-q4; m10-q4; m11-q1; m04-q3's date; this blueprint.

Known remaining defects:
- f14 keys the careful value in both parts (rule 34), by the examiner's design; accepted in review 4.
- Most flips rest on a time cost (a deadline, one run left, 40 minutes). If run 4 shows the prober learning "pick the quick one", vary the cost.
- m08-q2 stays near-transfer of M8 card 1's worked example.

## RESULT
**Ready** (review 4, after its four exact fixes, applied 2026-11-21). `check.mjs --tidy`: must_fix 0, should_fix 0, Module Standard findings 0, ready_to_publish true.

## For the team (Paul)
- **Foundation scope on the page.** Say on the Foundation test page and certificate that it covers modules 1 to 5, and that the programme certificate and project cover the rest.
- **Retake rule.** The Foundation certificate is one attempt; the engine allows a final retake after 7 days. Decide whether a retake can change the certificate band, and say so on the test page before anyone starts.
- **Bronze below 60%** with `pass_percent` 60: confirm that Bronze is awarded below the pass mark, or set Bronze at 40+.
- **Rubric weights and levels** (proposed above) aren't stored by the engine; for now the mentor's five 0–5 grades count equally.
- **Objective diagnostic.** The self-check is self-report; the Foundation final serves as the entry benchmark.
- **Later assessment types:** a short written verification log graded by AI against the testing criterion, with a person confirming, would assess O3 better than MCQs alone.
- Tooling: `agents/blueprint.mjs` still prints "The final's questions carry no skill in the file" though every final question has `skill`. Rules 28 and 32 are counted by scratch scripts; checks in `agents/lib/checks.mjs` would make them repeatable.
