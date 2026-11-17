/**
 * Progress through a Digital Marketing topic page (content/dmTopics.ts).
 * A topic has up to five steps, in this order:
 *
 *   Read      the student marked the big idea as read      (kept on this device)
 *   Check-in  every check-in question answered right       (kept on this device; only topics that have questions)
 *   Terms     all six key terms learned                    (the shared vocabulary store)
 *   Task      the small task written and marked done       (kept on this device)
 *   Practise  the track's Decision Lab attempted           (the account, via practice summary)
 *
 * Read, Check-in and Task are kept in the browser, like the streak counters, so
 * no SQL is needed yet. If they should follow a student between devices, they
 * need a table; that is a follow-up. Check-ins are for learning, not for a score
 * or a certificate: the answers ship with the page.
 */
import { useCallback, useEffect, useState } from 'react'
import { topicChapter } from '@/content/dmTopics'
import { vocabularyTerms } from './vocabulary'
import type { PracticeSummary } from './practiceResults'

export interface TopicLocal {
  read: boolean
  taskDone: boolean
  taskText: string
  /** every check-in question answered right (after any retries) */
  checkDone: boolean
  /** how many were right the first time, last time the check-in finished */
  checkFirstTry: number
}

const EMPTY: TopicLocal = { read: false, taskDone: false, taskText: '', checkDone: false, checkFirstTry: 0 }

const key = (userKey: string) => `myskills.topics.${userKey}`

function readAll(userKey: string): Record<string, TopicLocal> {
  try {
    const raw = localStorage.getItem(key(userKey))
    return raw ? (JSON.parse(raw) as Record<string, TopicLocal>) : {}
  } catch {
    return {}
  }
}

function writeAll(userKey: string, all: Record<string, TopicLocal>) {
  try {
    localStorage.setItem(key(userKey), JSON.stringify(all))
  } catch {
    /* ignore: the page still works, it just forgets */
  }
}

export function useTopicProgress(userKey: string) {
  const [all, setAll] = useState<Record<string, TopicLocal>>({})

  useEffect(() => {
    setAll(readAll(userKey))
  }, [userKey])

  const update = useCallback(
    (slug: string, patch: Partial<TopicLocal>) => {
      setAll((prev) => {
        const next = { ...prev, [slug]: { ...EMPTY, ...prev[slug], ...patch } }
        writeAll(userKey, next)
        return next
      })
    },
    [userKey],
  )

  const get = useCallback((slug: string): TopicLocal => ({ ...EMPTY, ...all[slug] }), [all])
  return { get, update }
}

export interface TopicStep {
  key: 'read' | 'check' | 'terms' | 'task' | 'practise'
  label: string
  done: boolean
}

/** A topic's steps in order, each with whether it is done. */
export function topicSteps(
  slug: string,
  local: TopicLocal,
  learnedIds: Set<string>,
  practice: PracticeSummary,
): TopicStep[] {
  const chapter = topicChapter(slug)
  const ids = (chapter?.terms ?? []).filter((id) => vocabularyTerms.some((t) => t.id === id))
  const termsDone = ids.length > 0 && ids.every((id) => learnedIds.has(id))
  const steps: TopicStep[] = [{ key: 'read', label: 'Read', done: local.read }]
  if (chapter?.checks?.length) steps.push({ key: 'check', label: 'Check-in', done: local.checkDone })
  steps.push(
    { key: 'terms', label: 'Terms', done: termsDone },
    { key: 'task', label: 'Task', done: local.taskDone },
    { key: 'practise', label: 'Practise', done: Boolean(practice[slug]) },
  )
  return steps
}
