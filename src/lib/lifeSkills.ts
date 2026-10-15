/**
 * What the Life Readiness Programme measures and builds: WHO's ten life
 * skills, and four of the programme's own that WHO doesn't list (goal setting,
 * leadership, agile working, growth mindset; communication is in both, as
 * WHO's "effective communication"). The Life Skills Profile, the programme's
 * one starting assessment (docs/supabase-life-skills.sql and
 * -life-skills-combined.sql), asks three statements per skill, rated
 * Never / Sometimes / Often / Always (1-4), one of the three worded the other
 * way round. A skill scores 3-12.
 *
 * The five modules between them build all ten (MODULE_LIFE_SKILLS). A
 * self-rating, so it never counts toward the Career Readiness Score; the
 * student and their mentor see it, companies don't.
 */
import type { ModuleSlug } from './programmes'

export type LifeSkillKey =
  | 'self-awareness'
  | 'empathy'
  | 'critical-thinking'
  | 'creative-thinking'
  | 'decision-making'
  | 'problem-solving'
  | 'effective-communication'
  | 'relationships'
  | 'coping-stress'
  | 'coping-emotions'

/** In WHO's order, which is also the order they're shown. */
export const LIFE_SKILLS: { key: LifeSkillKey; name: string; what: string; modules: ModuleSlug[] }[] = [
  {
    key: 'self-awareness',
    name: 'Self-awareness',
    what: 'Knowing your strengths, weaknesses, values and emotions.',
    modules: ['goal-setting', 'growth-mindset'],
  },
  {
    key: 'empathy',
    name: 'Empathy',
    what: 'Understanding how other people feel and see things.',
    modules: ['communication', 'leadership'],
  },
  {
    key: 'critical-thinking',
    name: 'Critical thinking',
    what: 'Weighing evidence and questioning assumptions before you decide.',
    modules: ['agile'],
  },
  {
    key: 'creative-thinking',
    name: 'Creative thinking',
    what: 'Coming up with new ideas and other ways to approach a problem.',
    modules: ['agile'],
  },
  {
    key: 'decision-making',
    name: 'Decision-making',
    what: 'Choosing a course of action after weighing the options and what they lead to.',
    modules: ['goal-setting', 'leadership'],
  },
  {
    key: 'problem-solving',
    name: 'Problem-solving',
    what: 'Finding the cause of a problem, weighing fixes and acting on one.',
    modules: ['agile', 'goal-setting'],
  },
  {
    key: 'effective-communication',
    name: 'Effective communication',
    what: 'Saying what you think, feel and need, clearly and appropriately.',
    modules: ['communication'],
  },
  {
    key: 'relationships',
    name: 'Interpersonal relationships',
    what: 'Building good relationships, working together and handling disagreements well.',
    modules: ['communication', 'leadership'],
  },
  {
    key: 'coping-stress',
    name: 'Coping with stress',
    what: 'Noticing what causes stress and managing it in healthy ways.',
    modules: ['growth-mindset'],
  },
  {
    key: 'coping-emotions',
    name: 'Coping with emotions',
    what: 'Recognising emotions in yourself and others, and responding well.',
    modules: ['growth-mindset'],
  },
]

/** The programme's own skills that WHO's list doesn't have, each built by the
 *  module of the same name. Their read-outs are the earlier assessment's
 *  (READOUT in lib/careerReadinessAssessment.ts), which go by level. */
export const PROGRAMME_SKILLS: { key: 'goal-setting' | 'leadership' | 'agile' | 'growth-mindset'; name: string; module: ModuleSlug }[] = [
  { key: 'goal-setting', name: 'Goal setting', module: 'goal-setting' },
  { key: 'leadership', name: 'Leadership', module: 'leadership' },
  { key: 'agile', name: 'Agile working', module: 'agile' },
  { key: 'growth-mindset', name: 'Growth mindset', module: 'growth-mindset' },
]

/** Three statements per skill, 1-4 each. */
export const LIFE_SKILL_MIN = 3
export const LIFE_SKILL_MAX = 12

/** The skills a module builds: its own (if it has one), then WHO's, in order. */
export function lifeSkillsForModule(slug: ModuleSlug): string[] {
  return [
    ...PROGRAMME_SKILLS.filter((s) => s.module === slug).map((s) => s.name),
    ...LIFE_SKILLS.filter((s) => s.modules.includes(slug)).map((s) => s.name),
  ]
}

type Level = 'Emerging' | 'Developing' | 'Established' | 'Standout'

/** Plain-language read-out for each life skill at each level: where they are,
 *  and the one next thing to practise. */
export const LIFE_READOUT: Record<LifeSkillKey, Record<Level, string>> = {
  'self-awareness': {
    Emerging: 'You don’t often stop to look at how you work. Try ending each day by noting one thing that went well and one that didn’t, and why.',
    Developing: 'You know some of your strengths and weak spots. Ask two people you trust what they’d say you’re best and worst at, and compare it with your own list.',
    Established: 'You have a good sense of what you’re good at and what throws you. Use it: plan your hardest work for the times you’re at your best.',
    Standout: 'You know yourself well, including how your mood affects your work. Help others reflect the same way.',
  },
  empathy: {
    Emerging: 'Other people’s feelings can be easy to miss when you’re busy. In your next conversation, listen to the end before you reply, and ask one question about how they feel.',
    Developing: 'You try to understand others, especially people close to you. Practise it with people you disagree with: say back what they think before you answer.',
    Established: 'You listen well and see other sides. Keep it up when you’re stressed, which is when it slips first.',
    Standout: 'People feel heard around you. That makes you a natural mentor and team member: use it on purpose.',
  },
  'critical-thinking': {
    Emerging: 'You tend to take things as they come. Before you accept a claim, ask: who says so, and how do they know?',
    Developing: 'You question some things, often after the fact. Make a habit of checking one source before sharing or deciding.',
    Established: 'You weigh evidence before you decide. Stretch it by looking for the best argument against your own view.',
    Standout: 'You question assumptions and look for evidence as a habit. Teams need someone who does this: say what you see.',
  },
  'creative-thinking': {
    Emerging: 'You usually stick to the way things are done. Next time something doesn’t work, write down three other ways to try it before you choose.',
    Developing: 'You find new ideas when you have to. Give yourself ten minutes to list ideas before you judge any of them.',
    Established: 'You enjoy new approaches and try them. Test your ideas quickly and cheaply, then keep what works.',
    Standout: 'New ideas come easily to you. Pair that with follow-through: pick one idea and see it all the way through.',
  },
  'decision-making': {
    Emerging: 'Decisions tend to get put off or made for you. For your next one, write down two options and one consequence of each, then choose by a set date.',
    Developing: 'You make decisions, sometimes without weighing the options. A short list of pros and cons for the big ones will make them steadier.',
    Established: 'You compare options and can explain your choices. Practise deciding with incomplete information: it’s how real work goes.',
    Standout: 'You decide well and can say why. Others will look to you; involve them so they learn to decide too.',
  },
  'problem-solving': {
    Emerging: 'When something goes wrong, it can be tempting to give up or try the first fix. Next time, ask “why?” three times before you act.',
    Developing: 'You solve problems, mostly one at a time. Break a big one into small steps, and do the first step today.',
    Established: 'You look for causes and break problems down. Keep a note of what fixed what: it speeds up the next one.',
    Standout: 'You find root causes and act on them calmly. Take on the problems others avoid; that’s where you stand out.',
  },
  'effective-communication': {
    Emerging: 'Speaking up or explaining your ideas doesn’t come easily yet. Start with the point: say what you think in one sentence, then the reason.',
    Developing: 'You communicate clearly with people you know. Practise in groups: say what you expect from others, politely and early.',
    Established: 'People usually understand what you mean. Stretch it with harder moments: giving feedback, or disagreeing well.',
    Standout: 'You say what you mean clearly and adapt it to the listener. Look for chances to present and to coach others.',
  },
  relationships: {
    Emerging: 'Getting along with people who are different, or handling disagreements, can be hard. After a disagreement, take the first step to talk it through calmly.',
    Developing: 'You get on well with most people. Work on disagreements: talk about the problem, not the person.',
    Established: 'You build good relationships and handle disagreements without falling out. Keep in touch with people outside your usual circle.',
    Standout: 'People work well with you, even when you disagree. You can help a team settle its conflicts.',
  },
  'coping-stress': {
    Emerging: 'Pressure can stop you from getting started. When it builds, write down everything on your mind, then pick the one thing to do first.',
    Developing: 'You notice stress but it still gets in the way. Plan your week ahead, and keep one regular habit that helps you reset, like a walk.',
    Established: 'You manage pressure with planning and priorities. Notice your early warning signs and act on them before stress builds.',
    Standout: 'You stay steady under pressure. Share what works for you: others around you will be under the same pressure.',
  },
  'coping-emotions': {
    Emerging: 'Strong feelings can take over before you’ve had a chance to think. When you feel them rising, pause and name the feeling before you respond.',
    Developing: 'You notice your emotions, sometimes after they’ve shaped what you said. Practise a pause: one breath before you reply when you’re upset.',
    Established: 'You recognise your emotions and usually respond well. Keep noticing other people’s feelings too, especially in tense moments.',
    Standout: 'You handle strong emotions well, yours and others’. That calm is what people rely on in hard moments.',
  },
}
