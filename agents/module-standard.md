# The Module Standard

What a world-class MySkills module is. The Course Architect and the Assessment
Architect write to it, the Assessment Agent scores every module against it in
every review, and Curriculum Intelligence keeps a module there once it is
published. It sits beside the playbook: the playbook holds specific rules
learned from mistakes; this is the bar.

A module is what a student meets in one sitting: its outcome, Learn cards,
Practise tasks, Reflect prompt and quiz. Our students are in India, mostly on a
phone, often reading English as a second language, usually without paid tools.
Write for them.

## The eight dimensions
Each is scored 1 to 5. The descriptors for 5, 3 and 1 anchor the scale; 4 and
2 sit between them.

### 1. `outcome`: one clear, observable outcome
- **5** One outcome, starting with something the learner will *do* ("Clean a
  sales sheet so its totals match the source"). A learner can check it
  themselves. The tasks and quiz lead straight to it.
- **3** Clear, but vague about the result ("Understand data cleaning"), or two
  outcomes in one.
- **1** Missing, or nothing in the module leads to it.

### 2. `explanation`: teaches before it tests
- **5** Short cards, one idea each, in plain words. Every new idea comes with a
  worked example (a real case, worked through, before the learner tries one).
  The common mistake is named and shown. Nothing is assumed that an earlier
  module didn't teach.
- **3** Correct, but abstract: definitions without a worked example, or one
  long card doing three jobs.
- **1** Too thin to do the tasks from, or wrong.

### 3. `practice`: hands-on work that builds the skill
- **5** Tasks a learner can do on a phone with a free tool, producing
  something real (a cleaned sheet, an ad draft, a short plan). They go from
  guided to independent and finish at the outcome. The hint unblocks without
  giving the answer away.
- **3** Tasks are there, but only "think about" or "list" work, or one task
  repeats the Learn card.
- **1** No real practice, or a task that can't be done without a paid tool.

### 4. `feedback`: every answer teaches
- **5** Each quiz explanation says why the right answer is right and
  `why_wrong` names each wrong option's mistake. Task hints and the reflection
  point the learner to what good looks like. A learner who got it wrong knows
  what to do next.
- **3** Explanations repeat the answer without the reasoning, or some wrong
  options get no reason.
- **1** No explanations, or ones that are wrong.

### 5. `relevance`: current, Indian, useful at work
- **5** Tools, screens, terms, laws and figures are current (checked against
  primary sources). Examples are Indian businesses, money in ₹, situations a
  student here meets. It teaches what employers here ask for in this role.
- **3** Correct but generic or foreign examples, or one tool or term out of
  date that doesn't break the module.
- **1** Out of date in a way that teaches something wrong, or no link to work.

### 6. `time`: the minutes are honest
- **5** The module's minutes match the work: reading at about 120 words a
  minute, about 20 minutes per hands-on task, 5 for the reflection, about 1.5
  a quiz question. Programme hours add up from the modules, project and final.
- **3** Off by up to half either way.
- **1** Badly wrong: tasks squeezed into minutes, or hours advertised that the
  content doesn't fill.

### 7. `progression`: it fits where it sits
- **5** It needs only what earlier modules taught, and later modules build on
  it. Its quiz tests only this module and the ones before. Difficulty rises
  gently through the programme.
- **3** It assumes one idea not yet taught, or repeats an earlier module.
- **1** In the wrong place, or tests what it never taught.

### 8. `inclusion`: every learner can do it
- **5** Sentences mostly under 20 words; no idioms or slang; jargon explained
  the first time. Works on a phone. No paid tool, region, religion, wealth or
  local knowledge is needed unless it's the skill being taught. Names and
  examples reflect students across India.
- **3** Mostly readable, with some long sentences or unexplained jargon, or
  one example that leaves some learners out.
- **1** Hard to read in a second language, or needs something many students
  don't have.

## Scoring a module (the Assessment Agent)
- Score from the module as written, not from what it could be.
- A score of 3 or less needs a finding that says exactly what to change to
  reach 4, with an `owner`: the Course Architect for outcome, explanation,
  practice, relevance, time, progression and inclusion; the Assessment
  Architect for feedback and for questions that break progression. A score of
  4 needs no finding, but may get an `idea` for reaching 5.
- `check.mjs` flags what a script can measure (missing outcome, no worked
  example, thin or overlong cards, long sentences, time against content, paid
  tools with no free option, broken links with `--links`). Its findings are
  evidence; the score is still a judgement.
- Be strict and consistent. A 5 means a demanding expert would change
  nothing. Most good first drafts score 3s and 4s.

## The ready rule
A programme is **ready** only when all of these hold:
1. `check.mjs` reports `ready_to_publish: true` and `must_fix: 0`;
2. the review has no must-fix finding;
3. **every module scores at least 4 on every dimension.**

For a built-in programme (Global Leadership, Digital Marketing), the structure
can't change, so a score held down by structure (for example, a module that
needs a third task) is recorded as an idea for Paul and doesn't block "ready":
list it in that module's `held_by_structure`. Digital Marketing's file has no
Learn cards or tasks (its teaching is on its own pages), so dimensions the
file can't show go in `not_in_file` and aren't scored. Say so in the review.
