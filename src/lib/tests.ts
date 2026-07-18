/**
 * Test mode = a timed, exam-style run over a skill track's question bank
 * (reused from lib/decisionLabs). Unlike Practice (untimed, weighted, review
 * every question, keeps your best), a Test is a compact MCQ run against the
 * clock with a pass mark. Only the resulting score/pass is stored.
 */
import { questionsForTrack, type ScenarioQuestion } from './decisionLabs'

export const TEST_SIZE = 10 // questions per test (or fewer if the bank is small)
export const PASS_MARK = 70 // percent

export interface TestGrade {
  correct: number
  total: number
  percent: number
  passed: boolean
}

/** A fresh, shuffled question set for one attempt. */
export function buildTest(slug: string): ScenarioQuestion[] {
  const all = questionsForTrack(slug)
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(TEST_SIZE, all.length))
}

export function gradeTest(
  questions: ScenarioQuestion[],
  answers: (number | null)[],
): TestGrade {
  let correct = 0
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) correct += 1
  })
  const total = questions.length
  const percent = total ? Math.round((correct / total) * 100) : 0
  return { correct, total, percent, passed: percent >= PASS_MARK }
}
