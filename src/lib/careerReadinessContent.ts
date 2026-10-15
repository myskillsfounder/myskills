/**
 * What each Life Readiness module teaches and asks for — the words on the
 * module pages. This is the file to edit to change the programme: every module
 * is Learn (short cards), Practise (written tasks) and Reflect (one prompt),
 * and the app builds the rest from it.
 *
 * Fourteen modules, one per skill in the Life aptitude test. The first five
 * (CORE_MODULES) have three tasks; finishing them opens the mentor-graded
 * project. The other nine, one per WHO life skill that had no module, have two.
 *
 * Keep each module's tasks as they are (keys t1-t3, and one reflection): the
 * server's career_readiness_items() (docs/supabase-life-readiness-modules.sql)
 * lists the same items, to count a module as done. The wording is free.
 */
import type { ModuleSlug } from './programmes'

export type ItemKey = 't1' | 't2' | 't3' | 'reflect'
export const TASK_KEYS: ItemKey[] = ['t1', 't2', 't3']
/** The core modules' items. A module's own are itemsFor(slug). */
export const ITEM_KEYS: ItemKey[] = ['t1', 't2', 't3', 'reflect']

/** The original five: finishing them opens the programme's project. */
export const CORE_MODULES: ModuleSlug[] = ['goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset']

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
  // The life skills that had no module of their own (lib/lifeSkills.ts): shorter,
  // two written tasks and a reflection each.
  {
    slug: 'self-awareness',
    outcome: 'Know your strengths, your weak spots and what throws you, and use them on purpose.',
    minutes: 25,
    learn: [
      {
        title: 'Strengths are habits, not talents',
        body: 'A strength is something you do well that also gives you energy. Notice what you do easily that others find hard, and what you lose track of time doing.',
      },
      {
        title: 'Know what throws you',
        body: 'Everyone has triggers: deadlines, criticism, being watched. Knowing yours lets you plan around them instead of being caught out every time.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Name your strengths',
        prompt: 'List three things you do well, with one real example of each from the last few months.',
        hint: 'e.g. “I explain things simply: friends ask me to go over topics before exams.”',
      },
      {
        key: 't2',
        title: 'Name what throws you',
        prompt: 'Describe one situation that regularly throws you off: what happens, how you react, and what it costs you.',
        hint: 'Be specific: “When I’m asked a question in class without warning, I go blank.”',
      },
    ],
    reflection: {
      prompt: 'Ask one person you trust what they think your biggest strength is. How does it compare with your own list, and what surprised you?',
      hint: 'If you can’t ask anyone yet, write what you think they would say.',
    },
  },
  {
    slug: 'empathy',
    outcome: 'Understand how someone else sees things, and show them you do.',
    minutes: 25,
    learn: [
      {
        title: 'Listen to understand, not to reply',
        body: 'Most of us listen while planning our answer. Empathy starts with listening to the end, then checking you understood before you respond.',
      },
      {
        title: 'Name the feeling',
        body: 'Saying “That sounds frustrating” shows someone you heard more than their words. You don’t have to agree with someone to understand them.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Tell it from their side',
        prompt: 'Think of a recent disagreement. Describe it as the other person would: what they wanted, what they felt, and why it made sense to them.',
        hint: 'Write it in their voice: “I felt ignored because…”',
      },
      {
        key: 't2',
        title: 'Write a listening reply',
        prompt: 'A friend tells you they failed an interview and feel useless. Write what you would say: first showing you understood, then, only if they want it, a suggestion.',
        hint: 'Start with their feeling, not your advice.',
      },
    ],
    reflection: {
      prompt: 'Where do you find empathy hardest — with whom, or in what kind of moment — and what will you try differently next time?',
      hint: 'Most people find it hardest when they’re tired, stressed or sure they’re right.',
    },
  },
  {
    slug: 'critical-thinking',
    outcome: 'Check claims, weigh evidence and spot weak arguments before you act on them.',
    minutes: 25,
    learn: [
      {
        title: 'Who says so, and how do they know?',
        body: 'Before you believe or share something, ask where it came from, what evidence backs it, and what the person gains if you believe it.',
      },
      {
        title: 'Look for the other side',
        body: 'A strong view survives its best counter-argument. Find the strongest case against what you think, then decide.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Check a claim',
        prompt: 'Pick a claim you saw recently (a forward, a post, an ad). Check it: where did it come from, what evidence supports it, and is it true, false or unclear?',
        hint: 'e.g. “This course guarantees a job in 30 days.”',
      },
      {
        key: 't2',
        title: 'Argue against yourself',
        prompt: 'Write one opinion you hold about your career or studies, then the strongest argument against it. Has your view changed, and why or why not?',
        hint: 'Make the counter-argument as good as you can, not a weak version.',
      },
    ],
    reflection: {
      prompt: 'What kind of claim are you most likely to believe without checking, and why?',
      hint: 'Think about claims from people you admire, or things you want to be true.',
    },
  },
  {
    slug: 'creative-thinking',
    outcome: 'Come up with more and better ideas, and find another way when the usual one fails.',
    minutes: 25,
    learn: [
      {
        title: 'Quantity first, judge later',
        body: 'Good ideas usually come after many ordinary ones. List ideas quickly without judging them, then pick the best.',
      },
      {
        title: 'Borrow and combine',
        body: 'Most new ideas mix existing ones: something that works in one place, used in another. Ask: who has solved a problem like this before?',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Ten ideas in ten minutes',
        prompt: 'A small tea shop near a college wants more students to visit. Write at least ten ideas to help, without judging any of them.',
        hint: 'Include a few silly ones: they often lead to good ones.',
      },
      {
        key: 't2',
        title: 'Pick one and improve it',
        prompt: 'Choose your best idea from Task 1. Explain why it could work, what it would cost, and one way to test it cheaply this week.',
        hint: 'A test is small: one post, one offer, one conversation.',
      },
    ],
    reflection: {
      prompt: 'When did you last solve something in an unusual way? What helped you think differently that time?',
      hint: 'It can be anything: a study trick, a cheaper way to do something.',
    },
  },
  {
    slug: 'decision-making',
    outcome: 'Make decisions by weighing options and consequences, and stand by them.',
    minutes: 25,
    learn: [
      {
        title: 'Options, consequences, choice',
        body: 'List at least two real options, write what each would lead to, then choose and say why. Writing it down beats going round in circles.',
      },
      {
        title: 'Decide, then review',
        body: 'You rarely have all the information. Set a date to decide, choose the best option you have, and check later what you learned.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Lay out a decision',
        prompt: 'Pick a real decision you face (a course, a job, a project). Write two or three options and what each would likely lead to in a year.',
        hint: 'Include the option of doing nothing.',
      },
      {
        key: 't2',
        title: 'Choose and explain',
        prompt: 'Choose one option from Task 1 and explain why, including what you are giving up. Set a date by which you will act on it.',
        hint: '“I’m choosing X because… I’m giving up Y… I’ll start by 1 November.”',
      },
    ],
    reflection: {
      prompt: 'Think of a decision you put off or let someone else make. What would you do differently now?',
      hint: 'Being honest about why you avoided it is the useful part.',
    },
  },
  {
    slug: 'problem-solving',
    outcome: 'Find the real cause of a problem, weigh fixes and act on one.',
    minutes: 25,
    learn: [
      {
        title: 'Ask why, more than once',
        body: 'The first cause you see is often a symptom. Keep asking “why?” until you reach something you can actually change.',
      },
      {
        title: 'Small steps you can test',
        body: 'Break the fix into steps, try the first one, and see what happens. A small fix you try today beats a perfect plan you never start.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Find the cause',
        prompt: 'Describe a problem that keeps happening to you (missed deadlines, late mornings, low marks). Ask “why?” at least three times and write down each answer.',
        hint: '“I miss deadlines → I start late → I don’t know where to start → the task feels too big.”',
      },
      {
        key: 't2',
        title: 'Plan a fix',
        prompt: 'Based on Task 1, write two possible fixes, choose one, and list the first three steps you will take this week.',
        hint: 'Make the first step something you can do in under 30 minutes.',
      },
    ],
    reflection: {
      prompt: 'Which problem in your life have you been treating only on the surface? What would fixing the cause look like?',
      hint: 'Think of something that keeps coming back.',
    },
  },
  {
    slug: 'relationships',
    outcome: 'Build good working relationships and handle disagreements without falling out.',
    minutes: 25,
    learn: [
      {
        title: 'Built in small moments',
        body: 'Remembering what someone told you, thanking them, keeping a promise: these small things build the trust you need when work gets hard.',
      },
      {
        title: 'Disagree with the idea, not the person',
        body: 'In a conflict, describe the problem and how it affects you, ask for their view, and look for an option that works for both of you.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Plan a hard conversation',
        prompt: 'Think of a disagreement with someone you study or work with. Write how you would open the conversation: the problem, how it affects you, and a question asking their view.',
        hint: '“When the slides came in late, I had to rush my part. What made it hard for you?”',
      },
      {
        key: 't2',
        title: 'Strengthen one relationship',
        prompt: 'Name one person whose relationship with you matters for your studies or work. Write two small things you will do in the next two weeks to strengthen it.',
        hint: 'Small and specific: “Thank her for the notes”, “Ask how his interview went”.',
      },
    ],
    reflection: {
      prompt: 'What do you usually do when a disagreement starts: avoid it, push harder, or talk it through? What would you like to do instead?',
      hint: 'There’s no right answer; noticing the pattern is the point.',
    },
  },
  {
    slug: 'coping-stress',
    outcome: 'Notice what stresses you, and manage it with habits that work.',
    minutes: 25,
    learn: [
      {
        title: 'Know your signs',
        body: 'Stress shows up before you notice it: poor sleep, snapping at people, scrolling instead of starting. Learn your early signs so you can act sooner.',
      },
      {
        title: 'Plan, prioritise, recover',
        body: 'When there’s too much to do, write everything down, pick the one thing that matters most, and do it first. Rest is part of the plan, not a reward at the end.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Map your stress',
        prompt: 'Write your three biggest sources of stress right now, and the early signs that tell you stress is building.',
        hint: 'e.g. “Exams in three weeks: I start sleeping late and avoiding my books.”',
      },
      {
        key: 't2',
        title: 'Build a reset',
        prompt: 'Choose one source from Task 1. Write a plan for the next week: what you will do first, and one habit that helps you reset (a walk, a set bedtime, talking to someone).',
        hint: 'Keep the habit small enough to do on a bad day.',
      },
    ],
    reflection: {
      prompt: 'What has helped you get through a stressful time before, and how can you use it now?',
      hint: 'If stress feels too heavy to manage alone, you can ask a counsellor privately in the Community.',
    },
  },
  {
    slug: 'coping-emotions',
    outcome: 'Recognise strong feelings in yourself and others, and respond rather than react.',
    minutes: 25,
    learn: [
      {
        title: 'Name it to tame it',
        body: 'Putting a feeling into words (angry, worried, disappointed) makes it easier to handle. The more exactly you can name it, the better.',
      },
      {
        title: 'Pause before you respond',
        body: 'Between what happens and what you do, there is a moment. A breath, a short walk or waiting before you reply gives you room to choose.',
      },
    ],
    tasks: [
      {
        key: 't1',
        title: 'Replay a strong moment',
        prompt: 'Describe a recent moment when a strong feeling took over (anger, worry, embarrassment). What happened, what did you feel, and what did you do?',
        hint: 'Name the feeling as exactly as you can.',
      },
      {
        key: 't2',
        title: 'Rewrite the response',
        prompt: 'Rewrite the moment from Task 1: what pause could you have taken, and what would you have said or done instead?',
        hint: '“I would have waited until the evening to reply, and asked what they meant.”',
      },
    ],
    reflection: {
      prompt: 'Which emotion is hardest for you to handle, and what is one thing you will try next time it comes up?',
      hint: 'If your feelings often feel overwhelming, talking to a counsellor in the Community can help.',
    },
  },
]

export function moduleContent(slug: string): ModuleContent | undefined {
  return MODULE_CONTENT.find((m) => m.slug === slug)
}

/** What a module asks for, in order: its tasks, then the reflection. */
export function itemsFor(slug: ModuleSlug): ItemKey[] {
  const m = moduleContent(slug)
  return m ? [...m.tasks.map((x) => x.key), 'reflect'] : ITEM_KEYS
}
