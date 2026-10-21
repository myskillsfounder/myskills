---
name: course-team
description: Run the MySkills course team on Paul's PC (his Claude plan, no API credit). The Assessment Agent researches and reviews, the Course Architect drafts or fixes, and they repeat until the review says ready. Use for "/course-team improve <file>", "/course-team draft <title>", or any request to draft, improve or review a programme without using the server agents.
---

# /course-team

This does the same job as the server's course agents (`agents/`), run here as two Claude Code subagents: `assessment-agent` and `course-architect`.

## Inputs
- **improve `<file>`**: a programme file. If Paul has none, ask him to open the programme in the admin, go to Check & publish, click **Download**, and save it in `docs/programmes/`.
- **draft `<title>`** (and optional instructions): the new file is `docs/programmes/<slug>.json`. The slug must match the programme's web address in the Course engine.
- Is it **built-in**? Global Leadership and Digital Marketing are. If so, pass `--built-in` to every `check.mjs` run, and tell both agents.

## The loop
1. **Research and first review.**
   - For a new programme, run `assessment-agent` for research only: "research `<title>`, write `<file>.research.md`".
   - For an existing one, run `assessment-agent` for research plus review round 1.
2. **Draft or revise.**
   - For a new programme: run `course-architect` to draft the whole file from the research and Paul's instructions, then `assessment-agent` for review round 1.
   - Then, for every round: if the review has any must-fix or should-fix findings, run `course-architect` to fix them all.
3. **Review again.** Run `assessment-agent` for the next round. Repeat steps 2 and 3 until the verdict is "ready", or after **3 revisions**.
4. **Finish.**
   - Run `node agents/check.mjs <file> --tidy` and confirm `ready_to_publish: true`.
   - Add the reviews' new `lessons` to the end of `agents/playbook.md`, numbered, with today's date and why. Skip any that repeat an existing rule.
   - Write `<file without .json>.report.md` for Paul. Keep it short:
     - the verdict;
     - what changed in each round;
     - what still needs a person;
     - sources worth checking;
     - the numbers from `check.mjs`.

## Tell Paul
1. Say whether the result is ready.
2. Give him the path of the file and of the report.
3. Remind him how to load it: in the admin, open the programme, go to **Check & publish**, click **Replace the draft…**, paste the whole file, then **Use this file**, **Save draft**, read it, and **Publish**.

## Keep in mind
- This uses Paul's Claude plan. A full draft is long work, so it can hit his usage limit. If it stops, say where it got to; the files on disk let the next run carry on.
- Never publish, deploy or touch the database from here. Paul loads the file himself.
- The `.research.md`, `.review-N.json` and `.report.md` files are working files. Commit only if Paul asks.
