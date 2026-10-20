// The JSON shapes the agents answer in (structured outputs: the API only
// returns JSON that matches). Every object lists all its fields as required
// and allows nothing else, as structured outputs need; "optional" fields are
// empty strings or null. Numbers can't carry limits here, so content.mjs
// checks ranges after.

const str = { type: 'string' }
const int = { type: 'integer' }
const strings = { type: 'array', items: str }

const obj = (properties) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
})

export const DIFFICULTY = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
export const LEVEL = ['beginner', 'intermediate', 'advanced']
export const MODULE_LEVEL = ['foundation', 'intermediate', 'advanced']

// A full case, as Digital Marketing's practice questions have; null for most.
const context = {
  anyOf: [
    { type: 'null' },
    obj({ company: str, role: str, industry: str, background: str, objective: str, information: str, constraints: str }),
  ],
}

export const question = obj({
  id: str,
  title: str,
  scenario: str,
  context,
  question: str,
  options: strings,
  correct_index: int,
  explanation: str,
  why_wrong: str,
  learning_outcome: str,
  difficulty: { type: 'string', enum: DIFFICULTY },
  topic: str,
})

const overview = obj({ summary: str, audience: str, outcomes: strings, level: { type: 'string', enum: LEVEL }, hours: int })
const skill = obj({ id: str, name: str, description: str })
const aptitudeItem = obj({ id: str, skill: str, statement: str, reverse: { type: 'boolean' } })
const project = obj({ brief: str, deliverables: strings, rubric: { type: 'array', items: obj({ id: str, name: str, description: str }) } })

/** Everything but the modules and the final: the programme's frame. */
export const frame = obj({
  overview,
  skills: { type: 'array', items: skill },
  aptitude: { type: 'array', items: aptitudeItem },
  project,
})

/** A new programme's plan: the frame, and an outline of each module. */
export const blueprint = obj({
  ...frame.properties,
  modules: {
    type: 'array',
    items: obj({
      title: str,
      summary: str,
      skill: str,
      level: { type: 'string', enum: MODULE_LEVEL },
      outcome: str,
      minutes: int,
      teaches: strings,
      practise: strings,
    }),
  },
  final_plan: str,
})

export const module = obj({
  id: str,
  title: str,
  summary: str,
  skill: str,
  level: { type: 'string', enum: MODULE_LEVEL },
  outcome: str,
  minutes: int,
  learn: { type: 'array', items: obj({ title: str, body: str }) },
  tasks: { type: 'array', items: obj({ id: str, title: str, prompt: str, hint: str }) },
  reflection: obj({ prompt: str, hint: str }),
  quiz: { type: 'array', items: question },
})

export const final = obj({ questions: { type: 'array', items: question } })

export const SEVERITY = ['must_fix', 'should_fix', 'idea']

export const review = obj({
  verdict: { type: 'string', enum: ['ready', 'needs_work'] },
  summary: str,
  strengths: strings,
  findings: {
    type: 'array',
    items: obj({
      target: str,
      severity: { type: 'string', enum: SEVERITY },
      problem: str,
      fix: str,
      source: str,
    }),
  },
  lessons: { type: 'array', items: obj({ rule: str, why: str }) },
})
