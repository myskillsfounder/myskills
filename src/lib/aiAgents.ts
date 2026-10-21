/**
 * Every AI agent MySkills uses or plans, for the super admin's AI agents page.
 * The one place to see what each agent does, what it reads, who sees what it
 * produces, and what it needs before it can run. Update an agent's status
 * here whenever that changes, and add every new agent before it goes live.
 */
export type AgentStatus = 'live' | 'building' | 'planned' | 'parked'

export interface AiAgent {
  id: string
  name: string
  /** One line: what it does for whom. */
  purpose: string
  status: AgentStatus
  /** Where it stands, in a sentence or two. */
  progress: string
  /** What it reads. */
  reads: string[]
  /** What it produces, and who sees it. */
  produces: string[]
  /** The rules it works under. */
  safeguards: string[]
  /** What has to be in place before it can run. */
  needs: string[]
  /** The model it runs on, once it runs. */
  model: string
  /** Where it runs. */
  runs: string
}

export const AI_AGENTS: AiAgent[] = [
  {
    id: 'learner-coach',
    name: 'Learner Coach',
    purpose: 'Learns how each student learns, and gives them a better next step every time they come back.',
    status: 'building',
    progress:
      'Step 1 is live: every practice and Foundation answer is kept with its topic, and each student has one activity record (Learning journey and Topics to work on, on their admin page). The AI coach itself comes next.',
    reads: [
      'Aptitude results (both programmes)',
      'Practice and Foundation answers, with the topics missed',
      'Global Leadership written work',
      'Project grades and reviewers’ notes',
      'Mentor meeting summaries (from the Mentor Meeting Notes agent)',
      'Goals and how they change',
      'Live sessions, internships, certificates',
    ],
    produces: [
      'A learner profile per student: strengths, weak topics, goals, how they study (team only)',
      '“Your next step” on the student’s LaunchPad, with the reason',
      'Personal review sets built from their own mistakes',
      'Coach feedback on written answers',
      'A brief for the mentor before each meeting',
      'Students at risk, and modules where students struggle (team only)',
    ],
    safeguards: [
      'Never changes the Global Readiness Score',
      'Wellness and career-guidance requests are never read',
      'The two coping modules: only that they were done, never what was written',
      'Students can see “What MySkills has learned about me” and correct it',
      'Privacy policy and sign-up consent updated before it goes live',
    ],
    needs: ['Anthropic API account with billing (key on the server)', 'Privacy policy and consent wording'],
    model: 'Claude Opus 5.5 (Anthropic)',
    runs: 'On the MySkills server, after each student activity, plus a weekly review',
  },
  {
    id: 'mentor-meeting-notes',
    name: 'Mentor Meeting Notes',
    purpose: 'Reads the Google Meet notes from every mentor meeting, so everyone is clear on what mentor and student are working on.',
    status: 'parked',
    progress:
      'Designed, not built (paused on 21 Oct 2026). Every mentor meeting happens on Google Meet, booked in MySkills; the agent reads Meet’s summary notes after each meeting.',
    reads: ['Google Meet “Take notes for me” summaries of mentor meetings (never recordings)'],
    produces: [
      'A meeting record: what they are working on, challenges, decisions, action items with dates, next meeting',
      'Student: their action items and agreed next steps',
      'Mentor: the meeting history, and a brief before the next meeting',
      'Team: everything, on the student’s page; and a “mentor meeting” event for the Learner Coach',
    ],
    safeguards: [
      'Mentor and student agree to meeting notes when the mentorship starts; a parent or guardian too for students under 18',
      'Only the notes are read, never a recording',
      'Raw notes deleted about 30 days after the summary is made',
    ],
    needs: [
      'Google Workspace on myskills.org.in with Meet notes and transcripts (a paid plan with Gemini)',
      'A MySkills Google account for meetings (e.g. meetings@myskills.org.in) and a service account for Calendar, Meet and Drive',
      'Anthropic API account',
      'Consent wording for mentors, students and parents',
    ],
    model: 'Claude Opus 5.5 (Anthropic)',
    runs: 'On the MySkills server, when a meeting ends',
  },
  {
    id: 'assessment-agent',
    name: 'Assessment Agent',
    purpose: 'Keeps the curriculum current and the tests honest: researches each topic regularly, checks how every question performs, and proposes better assessments.',
    status: 'building',
    progress:
      'Built, waiting for the API key and the server set-up: on any programme’s Agents tab it researches the field on the web, reviews every part with automatic test-writing checks, makes the Course Architect fix what it finds, and writes the playbook rules the Architect follows. A programme can be checked every month. Question health (step 1) is live. Next: reading Question health and Learner Coach data in its reviews.',
    reads: [
      'Recent changes in each topic (web search, with sources)',
      'Question health: % right, options picked, how well each question separates strong and weak students',
      'Learner Coach data: the topics students struggle with',
      'The current modules, questions and aptitude statements',
    ],
    produces: [
      'A review report on every job: what was wrong, what was fixed, what still needs a person, with sources',
      'Findings the Course Architect must fix: wrong or out-of-date content, weak questions, gaps',
      'Playbook rules: lessons from each review that the Course Architect follows on every later programme (the team can switch any off)',
      'Monthly checks of the programmes the team chooses',
      'Later: proposals for new kinds of assessment (case simulations, adaptive tests, written answers graded by AI and checked by a person)',
    ],
    safeguards: [
      'Publishes nothing itself: its “ready” verdict is what lets a result be auto-published, where the team has switched that on',
      'Never changes the score rules',
      'Question changes go live as a new version, never mid-test, so past results stay fair',
      'Answer keys stay on the server',
      'Every claim about a change in the field links to its source',
    ],
    needs: [
      'Anthropic API account with billing, with web search allowed; the key on the server',
      'The worker set up on the server (agents/README.md) and docs/supabase-course-agents.sql run',
      'About 30 students answering each question before Question health can judge it (answers kept since 21 Oct 2026)',
    ],
    model: 'Claude Opus 5.5 (Anthropic), with web search',
    runs: 'On the MySkills server: when the team asks on a programme’s Agents tab, and monthly for programmes switched to regular checks',
  },
  {
    id: 'course-architect',
    name: 'Course Architect',
    purpose: 'Name a course (Data Analytics, Cyber Security, AI Engineer…) and it drafts a complete MySkills programme.',
    status: 'building',
    progress:
      'Built, waiting for the API key and the server set-up. On a programme’s Agents tab: “Draft this programme” for a new one, “Improve this programme” for any other (Global Leadership and Digital Marketing too, keeping their structure). It works with the Assessment Agent until the review has nothing left to fix. New programmes earn a badge only until the scoring for several programmes is decided.',
    reads: [
      'The programme’s name and the team’s instructions',
      'The Assessment Agent’s research brief on the field',
      'The current version, when improving',
      'The Assessment Agent’s findings, and the playbook of rules from earlier reviews',
    ],
    produces: [
      'A complete programme: overview, skills, aptitude test, modules (Learn, Practise, Reflect, quizzes), final assessment, project and rubric',
      'Revisions of every part the Assessment Agent flags, round after round (at most four reviews)',
      'A result on the job, with the review report: the team loads it into the draft, reads it, saves and publishes',
    ],
    safeguards: [
      'Publishes only where the team switches on auto-publish for a programme, and only results the Assessment Agent calls ready that pass every check; otherwise a person loads, reads and publishes',
      'Built-in programmes keep every module, task, question, statement and skill in place',
      'Ids, weights and answer positions are set by code, not by the AI',
      'A spending limit: $10 a job, $20 a month',
      'Expert review for technical, legal, finance or health topics',
    ],
    needs: ['Anthropic API account with billing; the key on the server', 'The worker set up on the server (agents/README.md) and docs/supabase-course-agents.sql run'],
    model: 'Claude Opus 5.5 (Anthropic)',
    runs: 'On the MySkills server, when the team asks (about 15–40 minutes; at most $10 a job and $20 a month)',
  },
  {
    id: 'development-assistant',
    name: 'Development assistant',
    purpose: 'Builds and maintains the MySkills app with Paul: code, database scripts, testing and checks after each deploy.',
    status: 'live',
    progress: 'In use. Every change goes through a pull request that Paul approves; Paul runs database scripts and deploys.',
    reads: ['The app’s code and database scripts', 'Test data in the browser', 'The live site after a deploy (public pages only)'],
    produces: ['Pull requests for Paul to review', 'Database scripts for Paul to run', 'Checks of the live site'],
    safeguards: [
      'Never merges, runs database scripts or deploys without Paul',
      'Never enters passwords or keys',
      'Destructive changes come as scripts with backups',
    ],
    needs: [],
    model: 'Claude (Claude Code)',
    runs: 'On Paul’s computer, when Paul asks',
  },
]

export const STATUS_LABEL: Record<AgentStatus, { label: string; tone: 'success' | 'brand' | 'warning' | 'neutral' }> = {
  live: { label: 'Live', tone: 'success' },
  building: { label: 'Being built', tone: 'brand' },
  planned: { label: 'Planned', tone: 'warning' },
  parked: { label: 'Parked', tone: 'neutral' },
}
