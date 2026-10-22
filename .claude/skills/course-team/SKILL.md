---
name: course-team
description: Run the MySkills course team on Paul's PC (his Claude plan, no API credit). The Assessment Agent researches and reviews, the Course Architect drafts or fixes the teaching, the Assessment Architect drafts or fixes the tests, and they repeat until the review says ready. The Curriculum Intelligence agent checks a programme is still current and proposes evidence-backed updates. Every round is scored, and a track record shows whether the programmes and the agents are getting better. Use for "/course-team improve <file>", "/course-team draft <title>", "/course-team health <file>", "/course-team outcome <file>", "/course-team progress", or any request to draft, improve, review or keep a programme current without using the server agents, or to ask whether the course team is working.
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
- **outcome `<file>`**: how students do on a published version (see "The scorecard").
- **progress**: is the course team getting better? Run `node agents/track.mjs report` and explain it to Paul in plain words (see "The scorecard").
- Is it **built-in**? Global Leadership and Digital Marketing are. If so, pass `--built-in` to every `check.mjs` run, and tell every agent.

## The scorecard (run it every round)
The feedback loop has two halves, and both run from files, never from the database:
- **Is this programme getting better?** `node agents/scorecard.mjs <file> --stage "<label>" --review <latest review file> --save` (add `--built-in`, and `--learners <file>` when there is one) adds a row to `<file without .json>.scorecard.json` and prints what got better or worse since the last row. Its main numbers: must-fix and should-fix per 10 questions (automatic checks plus review), how often the right answer is the longest option (chance is about 25%), how many questions have explanations, and, with student data, the share of healthy questions and the separation between strong and weak students.
- **Are the agents getting better?** At the end of every job, `node agents/track.mjs add <file> --job draft|improve|health --rounds <n> --lessons <new playbook rules>` copies the first and last scorecard rows into `agents/track-record.json`. `node agents/track.mjs report` then shows how good each new draft is at its first review, how many rounds it takes to reach ready, which playbook rules were broken again after they were written (a rule that isn't working), and what first reviews find most.

Student data: ask Paul to open Admin → **Question health**, set **Answers since** to the date the version was published (or leave it empty for every answer), click **Download for the course team**, and save the file next to the programme as `<file without .json>.learners.json`. A question needs 30+ first-time answers before its numbers mean anything.

**outcome `<file>`**: once a version has been live long enough, get the student data as above, then run `node agents/track.mjs outcome <file> --learners <file without .json>.learners.json --version <n>` (the published version Paul names). Compare it with the previous version's outcome in `track.mjs report`. Say plainly when too few questions have 30+ answers to judge.

**After a report shows a rule broken again**: tell Paul, then do what the playbook's "How the rules learn" says (sharpen it; after two repeats, make it an automatic check in `agents/lib/checks.mjs` if a script can see it). That change is part of the job.

## The loop
1. **Research and first review.**
   - For a new programme, run `assessment-agent` for research only: "research `<title>`, write `<file>.research.md`".
   - For an existing one, run `assessment-agent` for research plus review round 1.
2. **Draft or revise.**
   - For a new programme: run `course-architect` to draft the teaching from the research and Paul's instructions, then `assessment-architect` to write the tests, then `assessment-agent` for review round 1.
   - Then, for every round: if the review has must-fix or should-fix findings with `owner` "course", run `course-architect` to fix them; then, if it has any with `owner` "assessment", run `assessment-architect` to fix those. Always in that order, so the tests are fixed against the revised teaching.
   - If the `assessment-architect` says the teaching must change before a test can be fair, pass that to `course-architect` in the same round, then run `assessment-architect` again.
   - Scorecard: after review round 1, save a row with `--stage "start (review 1)"` for an existing programme, or `--stage "draft (review 1)"` for a new one. That first row is what the track record judges the Architects by, so never skip it.
3. **Review again.** Run `assessment-agent` for the next round, then save a scorecard row with `--stage "round <n>"`. Repeat steps 2 and 3 until the verdict is "ready", or after **3 revisions**.
4. **Finish.**
   - Run `node agents/check.mjs <file> --tidy` and confirm `ready_to_publish: true`.
   - Add the reviews' new `lessons` to the end of `agents/playbook.md`, numbered, ending "(added <today>)", with why. Skip any that repeat an existing rule.
   - Run `node agents/track.mjs add <file> --job draft|improve --rounds <n> --lessons <rules added>`, then `node agents/track.mjs report`.
   - Write `<file without .json>.report.md` for Paul. Keep it short:
     - the verdict;
     - what changed in each round;
     - what still needs a person;
     - sources worth checking;
     - the blueprint's RESULT and its "For the team" items;
     - the numbers from `check.mjs`;
     - the scorecard: the first and last rows' main numbers and what changed;
     - any playbook rule the report shows broken again, and what was done about it.

## The health loop (`health <file>`)
1. **Research and audit.** If Paul has student data, save it as `<file without .json>.learners.json` first (see "The scorecard"). Run `curriculum-intelligence` on the file. It writes or updates `<file without .json>.curriculum.md` and replies with the programme's health and its proposals.
2. **Stop if there's nothing to do.** If the review found nothing material, tell Paul so in two lines and stop. Don't go looking for changes.
3. **Ask Paul.** Show any class A finding first, then each proposal in one line with its class and whether it needs his approval. Ask which to go ahead with. Nothing is revised without his yes.
4. **Route.** Run `curriculum-intelligence` again with the approved proposal ids to write `<file without .json>.changes-<date>.json`. Then run `course-architect` on its `owner` "course" findings, then `assessment-architect` on its `owner` "assessment" findings (and the blueprint), telling each to treat the changes file as the review.
5. **Validate.** Run `curriculum-intelligence` to validate. For any proposal it marks "needs repair", run the owning Architect on the repair file, then validate again. At most **2 repair rounds**; then list what's unresolved for Paul.
6. **Review.** Run `assessment-agent` for a review round on the revised file, and fix its findings as in step 2 of "The loop", for at most 2 rounds. Save a scorecard row after every review (`--stage "health round <n>"`). If the programme has no scorecard yet, first save a baseline row for the published version with its first review.
7. **Finish** as in step 4 of "The loop" (with `--job health`), and add a line to the report saying which proposals were implemented and validated. Tell Paul the next review date from the log.

## Tell Paul
1. Say whether the result is ready.
2. Give him the path of the file and of the report.
3. Remind him how to load it: in the admin, open the programme, go to **Check & publish**, click **Replace the draft…**, paste the whole file, then **Use this file**, **Save draft**, read it, and **Publish**.

## Keep in mind
- This uses Paul's Claude plan. A full draft is long work, so it can hit his usage limit. If it stops, say where it got to; the files on disk let the next run carry on.
- Never publish, deploy or touch the database from here. Paul loads the file himself.
- The `.research.md`, `.review-N.json`, `.assessment.md`, `.changes-<date>.json` and `.report.md` files are working files. Commit only if Paul asks.
- `agents/track-record.json` holds no answers or student data: commit it with the job. The `.scorecard.json` holds only numbers: suggest Paul commits it with the curriculum log.
- The `.curriculum.md` log is the programme's review history: keep it between runs, since the next health review starts from its last review date and open items. Suggest Paul commits it after each health review.
