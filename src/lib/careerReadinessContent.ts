/**
 * What each Career Readiness module teaches and asks for — the words on the
 * module pages. This is the file to edit to change the programme: every module
 * is Learn (three short cards), Practise (three written tasks) and Reflect
 * (one prompt), and the app builds the rest from it.
 *
 * Keep the structure fixed: exactly three tasks (keys t1-t3) and one
 * reflection per module. The server counts those 4 items x 5 modules when it
 * decides a learner may ask for a mentor review, so adding or removing an item
 * here means changing career_readiness_items() in
 * docs/supabase-career-readiness-programme.sql too. The wording is free.
 */
import type { ModuleSlug } from './programmes'

export type ItemKey = 't1' | 't2' | 't3' | 'reflect'
export const TASK_KEYS: ItemKey[] = ['t1', 't2', 't3']
export const ITEM_KEYS: ItemKey[] = ['t1', 't2', 't3', 'reflect']

/** Fewest characters a response needs (the server enforces the same). */
export const MIN_TASK_CHARS = 40
export const MIN_REFLECTION_CHARS = 60
export const MAX_RESPONSE_CHARS = 4000

export interface LearnCard {
  title: string
  body: string
}

export interface ModuleTask {
  key: 't1' | 't2' | 't3'
  title: string
  /** What to do. */
  prompt: string
  /** A nudge or an example, shown under the prompt. */
  hint: string
}

export interface ModuleContent {
  slug: ModuleSlug
  /** One line on what the learner can do after the module. */
  outcome: string
  /** Rough time, shown on the module card. */
  minutes: number
  learn: LearnCard[]
  tasks: ModuleTask[]
  reflection: { prompt: string; hint: string }
}

export const MODULE_CONTENT: ModuleContent[] = [
  {
    slug: 'goal-setting',
    outcome: 'Turn a wish into a goal with a date, and a plan for next week.',
    minutes: 45,
    learn: [
      {
        title: 'A wish is not a goal',
        body: '“Get a good job” can’t be checked. “Apply to 10 digital marketing internships by 30 November” can. A real goal says what, how you’ll measure it, and by when.',
      },
      {
        title: 'Work backwards',
        body: 'Start from the finish line and split it into milestones, then into the actions you can do this week. If you can’t say what you’re doing on Monday, the goal is still too big.',
      },
      {
        title: 'Check in every week',
        body: 'Ten minutes a week: what did I plan, what did I do, what changes? Goals slip quietly — a weekly look is what catches it early.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Write one goal properly',
        prompt:
          'Pick one career goal for the next 90 days. Write it so it says what you will do, how you will know you’ve done it, and by when.',
        hint: 'e.g. “Publish 6 blog posts on my portfolio site by 15 December, one every two weeks.”',
      },
      {
        key: 't2',
        title: 'Break it into milestones',
        prompt: 'Split that goal into three or four milestones, each with a date. Work backwards from the finish.',
        hint: 'What has to be true halfway? What has to be done by the end of the first month?',
      },
      {
        key: 't3',
        title: 'Plan your next week',
        prompt:
          'List three to five actions you’ll take this week toward the goal, and the day you’ll do each. Then name one thing that could get in the way, and what you’ll do about it.',
        hint: 'Be concrete: “Tue evening — outline post 1”, not “work on blog”.',
      },
    ],
    reflection: {
      prompt:
        'Look at your goal and your plan. Which part are you least sure you’ll follow through on, and what will you change to make it more likely?',
      hint: 'There’s no right answer — being honest about the weak spot is the point.',
    },
  },
  {
    slug: 'communication',
    outcome: 'Say what you mean clearly — in writing and out loud.',
    minutes: 45,
    learn: [
      {
        title: 'Lead with the point',
        body: 'Busy people read the first line. Say what you want or what you found first, then the reasons. Don’t make the reader dig for the ask.',
      },
      {
        title: 'Know who’s listening',
        body: 'The same news lands differently with a client, a lecturer and a friend. Before you write or speak, ask what they already know and what they need from you.',
      },
      {
        title: 'Clear beats clever',
        body: 'Short sentences, one idea at a time, and a specific next step at the end. “Could you review this by Thursday?” gets a reply; “let me know your thoughts” often doesn’t.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Write a message that opens with the ask',
        prompt:
          'Write a short email to a lecturer, manager or mentor asking for something real — a referral, an extension, ten minutes of their time. Put the ask in the first line.',
        hint: 'Aim for under 120 words. Say what you need, why, and by when.',
      },
      {
        key: 't2',
        title: 'Explain your work in 60 seconds',
        prompt:
          'Write what you would say to an interviewer who asks, “Tell me about a project you’re proud of.” It should take about a minute to say out loud.',
        hint: 'What was the problem, what did you do, what happened? Read it aloud once to check the length.',
      },
      {
        key: 't3',
        title: 'Handle a difficult message',
        prompt:
          'A client writes: “Your campaign report is late and I can’t tell what happened.” Write your reply — calm, honest, and clear about what happens next.',
        hint: 'Acknowledge it, explain briefly without excuses, and give a date for the fix.',
      },
    ],
    reflection: {
      prompt:
        'Read back what you wrote. Where did you use more words than you needed, and what would you cut if you rewrote it?',
      hint: 'Notice your habits — the filler, the hedging, the buried ask.',
    },
  },
  {
    slug: 'leadership',
    outcome: 'Take ownership and bring a small group with you.',
    minutes: 45,
    learn: [
      {
        title: 'Lead without a title',
        body: 'Leadership at your stage is noticing what’s not getting done and quietly taking it on — then making it easy for others to join. Nobody has to appoint you.',
      },
      {
        title: 'Clarity, ownership, follow-through',
        body: 'People follow someone who makes the goal clear, says who does what, and checks back. Most group work stalls on the second: nobody knows whose job it is.',
      },
      {
        title: 'Listen first, share the credit',
        body: 'Ask before you tell. When it goes well, name the people who did the work; when it doesn’t, own your part first. It costs nothing and people remember it.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Take ownership',
        prompt:
          'Describe a group situation — real or imagined — where something wasn’t getting done and nobody had taken it on. What would you do, step by step, to take ownership?',
        hint: 'Start with what you’d say to the group in the first five minutes.',
      },
      {
        key: 't2',
        title: 'Plan a small project',
        prompt:
          'You’re leading a one-week project with three teammates. Write the goal, who does what, and how and when you’ll check in.',
        hint: 'e.g. run a small social campaign for a campus event. Keep roles specific.',
      },
      {
        key: 't3',
        title: 'Have the hard conversation',
        prompt:
          'A teammate keeps missing their part. Write what you would say to open the conversation, and one question you’d ask to understand what’s going on.',
        hint: 'Start with the facts, not the blame. What will you do if they’re stuck?',
      },
    ],
    reflection: {
      prompt:
        'When have you stepped up — or held back — in a group? What would you do differently next time?',
      hint: 'A real example is more useful than a general answer.',
    },
  },
  {
    slug: 'agile',
    outcome: 'Work in short cycles: a backlog, a sprint, and a look back.',
    minutes: 45,
    learn: [
      {
        title: 'Small steps, short cycles',
        body: 'Instead of one long push, work in one- or two-week sprints: pick a little, finish it, look at what happened. You learn sooner and waste less when a plan turns out wrong.',
      },
      {
        title: 'The backlog',
        body: 'A backlog is your to-do list in priority order. The top few items are small and clear; the rest can stay rough. Re-order it as you learn — it is never finished.',
      },
      {
        title: 'Stand-ups and retros',
        body: 'A stand-up is a two-minute check: what I did, what I’ll do, what’s blocking me. A retrospective at the end asks what went well, what didn’t, and one thing to change.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Build a backlog',
        prompt:
          'Pick a personal project — a portfolio site, a small campaign, a study plan. List eight to ten tasks, then put the top three first and say why.',
        hint: 'Ask: what gives the most value for the least effort?',
      },
      {
        key: 't2',
        title: 'Plan a one-week sprint',
        prompt:
          'From your backlog, plan one week: a sprint goal in one sentence, the tasks you commit to, and what “done” means for each.',
        hint: 'Commit to less than you think. A finished small sprint beats an unfinished big one.',
      },
      {
        key: 't3',
        title: 'Run a retrospective',
        prompt:
          'Look back at a recent week of your own work. Write what went well, what didn’t, and one specific change you’ll make next week.',
        hint: 'Keep the change small enough that you’ll really do it.',
      },
    ],
    reflection: {
      prompt:
        'Where in your studies or work would working in short cycles help most, and what’s stopping you from trying it?',
      hint: 'Think about a task you keep putting off — could it be smaller?',
    },
  },
  {
    slug: 'growth-mindset',
    outcome: 'Treat setbacks as information and keep learning when it’s hard.',
    minutes: 45,
    learn: [
      {
        title: 'Not good at it — yet',
        body: 'Skills grow with effort and better methods. “I’m bad at presenting” is a fixed verdict; “I’m not good at presenting yet” leaves room to improve — and to know what to practise.',
      },
      {
        title: 'Setbacks are information',
        body: 'A rejection or a poor result tells you something about what you did, not who you are. Separate the facts from the story, then ask what you’d change.',
      },
      {
        title: 'Ask for feedback and use it',
        body: 'Feedback is the fastest teacher. Ask about something specific, listen without defending, thank the person, and act on one thing. Then tell them what changed.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Look at a recent setback',
        prompt:
          'Describe one recent setback — a bad grade, a rejection, a project that went wrong. Write only what happened, then what it tells you.',
        hint: 'Facts first, no judgement. Then: what would I do differently?',
      },
      {
        key: 't2',
        title: 'Reframe three thoughts',
        prompt:
          'Write three fixed thoughts you’ve had about yourself (“I’m no good at…”) and rewrite each one as a growth version.',
        hint: 'e.g. “I can’t do maths” → “I haven’t found the way of practising that works for me yet.”',
      },
      {
        key: 't3',
        title: 'Ask for feedback',
        prompt:
          'Pick a person and a piece of your work. Write the specific question you’d ask them, and how you’ll use the answer.',
        hint: '“What’s one thing that would make this clearer?” beats “What do you think?”',
      },
    ],
    reflection: {
      prompt:
        'Across these five modules, what is the one habit you most want to keep — and what will you do this week to start it?',
      hint: 'Look back at your answers. What stood out?',
    },
  },
]

export function moduleContent(slug: string): ModuleContent | undefined {
  return MODULE_CONTENT.find((m) => m.slug === slug)
}
