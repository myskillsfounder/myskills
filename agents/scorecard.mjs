// The programme's scorecard: one row per stage of a /course-team job, so each
// round shows what got better or worse. See agents/lib/scorecard.mjs.
//
//   node agents/scorecard.mjs <programme.json> --stage "<label>"
//        [--built-in]                 Global Leadership or Digital Marketing
//        [--review <review-N.json>]   the Assessment Agent's latest review
//        [--learners <learners.json>] Question health's "Download for the course team"
//        [--save]                     add the row to <file without .json>.scorecard.json
//
// Prints the row and how it compares with the last saved one.
import fs from 'node:fs'
import { compare, scoreProgramme } from './lib/scorecard.mjs'

const args = process.argv.slice(2)
const file = args[0]
const opt = (name) => {
  const i = args.indexOf(name)
  return i > 0 ? args[i + 1] : undefined
}
if (!file || !opt('--stage')) {
  console.error('Usage: node agents/scorecard.mjs <programme.json> --stage "<label>" [--built-in] [--review <file>] [--learners <file>] [--save]')
  process.exit(1)
}
const read = (f) => (f ? JSON.parse(fs.readFileSync(f, 'utf8')) : null)

const content = read(file)
const row = {
  date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  stage: opt('--stage'),
  reviewFile: opt('--review') ?? null,
  learnersFile: opt('--learners') ?? null,
  ...scoreProgramme(content, { locked: args.includes('--built-in'), review: read(opt('--review')), learners: read(opt('--learners')) }),
}

const cardFile = file.replace(/\.json$/, '') + '.scorecard.json'
const card = fs.existsSync(cardFile) ? read(cardFile) : { programme: file.split(/[\\/]/).pop(), rows: [] }
const changes = compare(card.rows.at(-1), row)

if (args.includes('--save')) {
  card.rows.push(row)
  fs.writeFileSync(cardFile, JSON.stringify(card, null, 2) + '\n')
}
console.log(JSON.stringify({ saved: args.includes('--save') ? cardFile : null, row, changes }, null, 1))
