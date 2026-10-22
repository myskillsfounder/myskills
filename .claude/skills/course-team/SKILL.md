---
name: course-team
description: Run the MySkills course team on Paul's PC (his Claude plan, no API credit). The Assessment Agent researches and reviews, the Course Architect drafts or fixes the teaching, the Assessment Architect drafts or fixes the tests, and they repeat until the review says ready. The Curriculum Intelligence agent checks a programme is still current and proposes evidence-backed updates. Use for "/course-team improve <file>", "/course-team draft <title>", "/course-team health <file>", or any request to draft, improve, review or keep a programme current without using the server agents.
---

# /course-team

This does the same job as the server's course agents (`agents/`), run here as Claude Code subagents:
- `assessment-agent` researches and reviews;
- `course-architect` writes the teaching: overview, skills, modules, project brief;
- `assessment-architect` writes the tests: aptitude statements, module quizzes, the final and the project rubric. It also keeps the assessment blueprint, `<file without .json>.assessment.md`: the question and coverage maps, rubric levels, practical evidence, and what only Paul can decide;
- `curriculum-intelligence` keeps a published programme current: it researches what changed in the field since its last review, classifies findings (A critical, B important, C enhancement, D monitor), proposes changes with sources, and validates the Architects' revisions. It keeps the curriculum log, `<file without .json>.curriculum.md`.

## Inputs
- **improve `<file>`**: a programme file. If Paul has none, ask him to open the programme in the admin, go to Check & publish, click **Download**, and save it in `docs/programmes/`.
- **health `<file>`**: a published programme to keep current (see "The health loop"). Ask Paul which version number the admin shows as published, and pass it on; if he doesn't know, the agent records it as unknown.
- **draft `<title>`** (and optional instructions): the new file is `docs/programmes/<slug>.json`. The slug must match the programme's web address in the Course engine.
- Is it **built-in**? Global Leadership and Digital Marketing are. If so, pass `--built-in` to every `check.mjs` run, and tell every agent.

## The loop
1. **Research and first review.**
   - For a new programme, run `assessment-agent` for research only: "research `<title>`, write `<file>.research.md`".
   - For an existing one, run `assessment-agent` for research plus review round 1.
2. **Draft or revise.**
   - For a new programme: run `course-architect` to draft the teaching from the research and Paul's instructions, then `assessment-architect` to write the tests, then `assessment-agent` for review round 1.
   - Then, for every round: if the review has must-fix or should-fix findings with `owner` "course", run `course-architect` to fix them; then, if it has any with `owner` "assessment", run `assessment-architect` to fix those. Always in that order, so the tests are fixed against the revised teaching.
   - If the `assessment-architect` says the teaching must change before a test can be fair, pass that to `course-architect` in the same round, then run `assessment-architect` again.
3. **Review again.** Run `assessment-agent` for the next round. Repeat steps 2 and 3 until the verdict is "ready", or after **3 revisions**.
4. **Finish.**
   - Run `node agents/check.mjs <file> --tidy` and confirm `ready_to_publish: true`.
   - Add the reviews' new `lessons` to the end of `agents/playbook.md`, numbered, with today's date and why. Skip any that repeat an existing rule.
   - Write `<file without .json>.report.md` for Paul. Keep it short:
     - the verdict;
     - what changed in each round;
     - what still needs a person;
     - sources worth checking;
     - the blueprint's RESULT and its "For the team" items;
     - the numbers from `check.mjs`.

## The health loop (`health <file>`)
1. **Research and audit.** Run `curriculum-intelligence` on the file. It writes or updates `<file without .json>.curriculum.md` and replies with the programme's health and its proposals.
2. **Stop if there's nothing to do.** If the review found nothing material, tell Paul so in two lines and stop. Don't go looking for changes.
3. **Ask Paul.** Show any class A finding first, then each proposal in one line with its class and whether it needs his approval. Ask which to go ahead with. Nothing is revised without his yes.
4. **Route.** Run `curriculum-intelligence` again with the approved proposal ids to write `<file without .json>.changes-<date>.json`. Then run `course-architect` on its `owner` "course" findings, then `assessment-architect` on its `owner` "assessment" findings (and the blueprint), telling each to treat the changes file as the review.
5. **Validate.** Run `curriculum-intelligence` to validate. For any proposal it marks "needs repair", run the owning Architect on the repair file, then validate again. At most **2 repair rounds**; then list what's unresolved for Paul.
6. **Review.** Run `assessment-agent` for a review round on the revised file, and fix its findings as in step 2 of "The loop", for at most 2 rounds.
7. **Finish** as in step 4 of "The loop", and add a line to the report saying which proposals were implemented and validated. Tell Paul the next review date from the log.

## Tell Paul
1. Say whether the result is ready.
2. Give him the path of the file and of the report.
3. Remind him how to load it: in the admin, open the programme, go to **Check & publish**, click **Replace the draft…**, paste the whole file, then **Use this file**, **Save draft**, read it, and **Publish**.

## Keep in mind
- This uses Paul's Claude plan. A full draft is long work, so it can hit his usage limit. If it stops, say where it got to; the files on disk let the next run carry on.
- Never publish, deploy or touch the database from here. Paul loads the file himself.
- The `.research.md`, `.review-N.json`, `.assessment.md`, `.changes-<date>.json` and `.report.md` files are working files. Commit only if Paul asks.
- The `.curriculum.md` log is the programme's review history: keep it between runs, since the next health review starts from its last review date and open items. Suggest Paul commits it after each health review.
