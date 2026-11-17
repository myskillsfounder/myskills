/**
 * Progress through a Digital Marketing topic page (content/dmTopics.ts).
 * A topic has four steps: Read, Terms, Task, Practise.
 *
 *   Read     the student marked the big idea as read   (kept on this device)
 *   Terms    all six key terms learned                 (the shared vocabulary store)
 *   Task     the small task written and marked done    (kept on this device)
 *   Practise the track's Decision Lab attempted        (the account, via practice summary)
 *
 * Read and Task are kept in the browser, like the streak counters, so no SQL
 * is needed yet. If they should follow a student between devices, they need a
 * table; that is a follow-up.
 */
import { useCallback, useEffect, useState } from 'react'
import { topicChapter } from '@/content/dmTopics'
import { vocabularyTerms } from './vocabulary'
import type { PracticeSummary } from './practiceResults'

export interface TopicLocal {
  read: boolean
  taskDone: boolean
  taskText: string
}

const EMPTY: TopicLocal = { read: false, taskDone: false, taskText: '' }

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

  const get = useCallback((slug: string): TopicLocal => all[slug] ?? EMPTY, [all])
  return { get, update }
}

export const TOPIC_STEPS = ['Read', 'Terms', 'Task', 'Practise'] as const

/** Which of a topic's four steps are done, in order. */
export function topicSteps(
  slug: string,
  local: TopicLocal,
  learnedIds: Set<string>,
  practice: PracticeSummary,
): boolean[] {
  const chapter = topicChapter(slug)
  const ids = (chapter?.terms ?? []).filter((id) => vocabularyTerms.some((t) => t.id === id))
  const termsDone = ids.length > 0 && ids.every((id) => learnedIds.has(id))
  return [local.read, termsDone, local.taskDone, Boolean(practice[slug])]
}
