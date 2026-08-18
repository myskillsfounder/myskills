import { useEffect, useState } from 'react'
import { Check, ListTodo, Plus, Trash2 } from 'lucide-react'

interface Todo {
  id: string
  text: string
  done: boolean
}

export function TodayFocus({ userKey }: { userKey: string }) {
  const KEY = `myskills.todos.${userKey}`
  const [todos, setTodos] = useState<Todo[]>([])
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setTodos(JSON.parse(localStorage.getItem(KEY) || '[]') as Todo[])
    } catch {
      setTodos([])
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEY])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(todos))
    } catch {
      /* ignore */
    }
  }, [todos, KEY, ready])

  function add(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: t, done: false }])
    setText('')
  }
  const toggle = (id: string) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const remove = (id: string) => setTodos((p) => p.filter((t) => t.id !== id))

  const doneCount = todos.filter((t) => t.done).length

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <ListTodo size={16} />
          </span>
          <h2 className="text-sm font-semibold text-ink-900">Today’s focus</h2>
        </div>
        {todos.length > 0 && (
          <span className="text-xs text-ink-500">{doneCount}/{todos.length}</span>
        )}
      </div>

      <form onSubmit={add} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </form>

      <ul className="mt-3 space-y-1.5">
        {todos.length === 0 && (
          <li className="py-3 text-center text-xs text-ink-500">No tasks yet — add your focus for today.</li>
        )}
        {todos.map((t) => (
          <li key={t.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-ink-100">
            <button
              type="button"
              onClick={() => toggle(t.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                t.done ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 text-transparent hover:border-brand-400'
              }`}
              aria-label={t.done ? 'Mark not done' : 'Mark done'}
            >
              <Check size={13} />
            </button>
            <span className={`flex-1 text-sm ${t.done ? 'text-ink-500 line-through' : 'text-ink-900'}`}>{t.text}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="text-ink-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
