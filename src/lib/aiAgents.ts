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
    id: 'course-architect',
    name: 'Course Architect',
    purpose: 'Name a course (Data Analytics, Cyber Security, AI Engineer…) and it drafts a complete MySkills programme.',
    status: 'parked',
    progress:
      'Designed, not built. Needs a course engine first, so new programmes live in the database instead of code; the scoring for several programmes is still to be decided.',
    reads: ['The course name and brief', 'Our existing programmes, as examples of the house style', 'Research on the field (web search)'],
    produces: [
      'A draft programme: skill map, aptitude test, modules (Learn, Practise, Reflect, quizzes), capstone project and rubric',
      'A critic pass that grades and improves the draft',
      'Lands in admin as a draft: nothing is shown to students until the team reviews and publishes it',
    ],
    safeguards: ['Every course is reviewed by a person before it is published', 'Expert review for technical, legal, finance or health topics'],
    needs: ['Course engine (programmes stored in the database)', 'Scoring model for several programmes agreed', 'Anthropic API account'],
    model: 'Claude Opus 5.5 (Anthropic)',
    runs: 'On the MySkills server, when the team asks for a course (about 5–15 minutes each)',
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
