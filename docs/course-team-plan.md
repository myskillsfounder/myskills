# Course team plan: world-class modules, and agents that get better

*Drafted 22 Oct 2026. Step 1 is built (branch `claude/module-standard`). Step 3's
scorecard and track record were built in PR #266 on the same day.*

## The goal
Every MySkills programme has modules a student in India would call the best
way they have learned the subject: clear on a phone, practical, current, and
honest about what it proves. The four course agents exist for that goal, and
they get measurably better at it with every programme they work on.

## Where we are
- **The team.** On Paul's PC (`/course-team`): the Course Architect writes the
  teaching, the Assessment Architect the tests, the Assessment Agent reviews,
  and Curriculum Intelligence keeps published programmes current. On the
  server, only the Course Architect and the Assessment Agent exist. PR #263
  (the four-agent team) is still open, so `main` has only the first two.
- **How they work together.** Through files: the review JSON names an `owner`
  for each finding, and each agent fixes its own. That works.
- **How they learn.** One shared playbook of 8 rules, written from review
  findings. Nothing checks whether a rule worked, and old programmes don't get
  new rules: Digital Marketing still has the right answer as the longest
  option in 106 of 135 questions, the very first rule in the playbook.
- **What "good" means.** Today a programme is "ready" when it has no must-fix
  finding and passes `check.mjs`. That is a floor, not world class. Nothing
  measures whether a module teaches well.
- **What students tell us.** Nothing, yet, about engine programmes. Question
  health covers the practice and Foundation banks, not programme quizzes. There
  is no "was this clear?" on a module, and no view of where students stop.
- **A sign of the gap.** Digital Marketing advertises 40 hours; its modules
  add up to about 4.

## The plan, in five steps

### 1. Write down what a world-class module is (the bar)
A short **Module Standard** (`agents/module-standard.md`) that every agent
works to, scored 1–5 per module:

| Dimension | What 5 looks like |
| --- | --- |
| Outcome | One clear, observable outcome a learner can check themselves against |
| Explanation | Plain English, short cards, a worked example before any practice |
| Practice | Hands-on tasks that build to the outcome, with a free tool, doable on a phone |
| Feedback | Every quiz answer and task hint teaches why, not just what |
| Relevance | Indian contexts, current tools and law, the job the learner wants |
| Realistic time | Minutes match the work; programme hours match the modules |
| Progression | Builds on earlier modules; nothing tested before it is taught |
| Inclusion | Readable for second-language readers; no paid tool or regional knowledge needed |

- The Assessment Agent scores every module against it in each review, with the
  reason for any score under 4.
- `check.mjs` measures what code can: minutes against hours, card length,
  reading level, a worked example present, links that work.
- **New "ready" rule:** no must-fix, `check.mjs` passing, and **no module
  below 4** on any dimension.

### 2. Test with learners before students do (the experience)
A fifth agent, the **Learner Tester**: before Paul publishes, it works through
each module as three students would and reports where each gets stuck.
- A first-year student in a small town, on a phone, English as a second language.
- A final-year student who wants a first job in the field.
- A working professional with 30 minutes a day.

It reports confusing cards, tasks it couldn't do with free tools, quiz
questions that felt unfair, and real time taken. Its findings go into the
review with an `owner`, like any other. It doesn't stand in for real students
(step 4); it catches the obvious problems first.

### 3. Make the agents learn from every run (getting better)
- **A team log.** After every `/course-team` run, record: findings by owner,
  dimension and severity; rounds to "ready"; the first draft's scores. The
  key measure is **first-draft quality**: if the Architects are learning, the
  first review finds less each time.
- **A retro at the end of each run.** The agents say what went wrong between
  them (a test written before the teaching was fixed, a finding sent to the
  wrong owner) and propose one change each to their own instructions or the
  playbook. Paul approves which changes stick.
- **A better playbook.** Group rules by owner and module-standard dimension;
  give each rule the finding that caused it; mark rules that haven't been
  broken in 3 runs as "learned" and rules still broken as "not working" (and
  rewrite those). Apply new rules to existing programmes at their next health
  check, not only to new ones.
- **A benchmark.** Keep one programme (Data Analytics) as the test case. After
  any change to the agents' instructions, run a review on it and compare the
  numbers with the last run, so a change that makes the team worse shows up.

### 4. Learn from real students (the loop that matters most)
- **Question health for programme quizzes and finals**, the same flags as
  today's page (too easy, too hard, check the key, an option nobody picks),
  from `programme_quiz_answers`.
- **One tap at the end of each module:** "How clear was this?" (1–5) and
  "What confused you?" (optional, a sentence).
- **Where students stop:** for each module, how many started and finished,
  and the median time taken against the module's minutes.
- **Curriculum Intelligence reads all of it at each monthly health check,**
  alongside what changed in the field, and turns it into proposals with the
  evidence. Small samples stay "watch only" (the 30-answer rule).
- Later, the **Learner Coach** adds which topics individual students miss most.

### 5. One team on the server too (when the API budget allows)
Bring the Assessment Architect, Curriculum Intelligence, the Learner Tester and
the module standard into `agents/lib/prompts.mjs`, so a monthly check on the
server is as good as a run on Paul's PC. This costs API credit, so it comes
last, once steps 1–4 have shown what works.

## Order and size
| Step | What gets built | Size | Needs from Paul |
| --- | --- | --- | --- |
| 0 | Merge PR #263 and #266, so `main` has the four-agent team and its scorecard | small | Approve the PRs |
| 1 | Module Standard, scoring in reviews, new `check.mjs` checks, new "ready" rule | medium | Agree the dimensions and the bar of 4 |
| 2 | Learner Tester agent and its place in `/course-team` | small | Agree the three students |
| 3 | Team log, retro, playbook restructure, benchmark | medium | Approve retro changes after each run |
| 4 | Module feedback, programme Question health, drop-off view, fed to health checks | large (SQL, student page, admin page) | Run the SQL; decide the feedback wording |
| 5 | The same team on the server | medium | API budget |

Then run the improved team on Digital Marketing and Data Analytics first, since
both already have reviews to compare against.

## Rules that don't change
- Agents publish nothing; Paul reads and publishes.
- No change to scores, results or certificates from any agent.
- Built-in programmes keep their structure.
- No claim of improvement without a measure behind it.
