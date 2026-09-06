import { Component, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  error: Error | null
}

/**
 * Catches a render-time crash in the chat panel without taking the whole page
 * down with it. By the time this panel mounts, a mentor's claim (or a
 * learner's connect) has already succeeded server-side -- losing the entire
 * console (online status, queue, other active chats) over one panel failing
 * to render would be a worse outcome than a local retry right here.
 */
export class ChatErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[chat panel error]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <TriangleAlert size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Couldn’t open this chat</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-600">
              The connection went through fine — this is just a display hiccup. Try again below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              this.props.onReset?.()
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
