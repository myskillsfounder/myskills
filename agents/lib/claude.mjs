// Calls to Claude: structured answers for drafting, reviewing and revising,
// and web research with sources. Every call is streamed (long answers would
// otherwise time out) and its tokens are added to the job's running cost.
import Anthropic from '@anthropic-ai/sdk'

export const DEFAULT_MODEL = 'claude-opus-5-5'

// US dollars per million tokens for Claude Opus 5.5, and per web search.
// Writing to the prompt cache costs 1.25 times input; reading from it 0.05.
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2, search: 0.01 }

export class AgentError extends Error {}

/** A job's tokens, searches and cost so far. */
export class Usage {
  constructor(model) {
    this.model = model
    this.calls = 0
    this.input_tokens = 0
    this.output_tokens = 0
    this.cache_write_tokens = 0
    this.cache_read_tokens = 0
    this.web_searches = 0
  }

  add(u) {
    this.calls++
    this.input_tokens += u?.input_tokens ?? 0
    this.output_tokens += u?.output_tokens ?? 0
    this.cache_write_tokens += u?.cache_creation_input_tokens ?? 0
    this.cache_read_tokens += u?.cache_read_input_tokens ?? 0
    this.web_searches += u?.server_tool_use?.web_search_requests ?? 0
  }

  get cost() {
    return (
      (this.input_tokens * PRICE.input +
        this.output_tokens * PRICE.output +
        this.cache_write_tokens * PRICE.cacheWrite +
        this.cache_read_tokens * PRICE.cacheRead) /
        1e6 +
      this.web_searches * PRICE.search
    )
  }

  toJSON() {
    const { model, calls, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, web_searches } = this
    return { model, calls, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, web_searches, cost_usd: Math.round(this.cost * 10000) / 10000 }
  }
}

const systemBlocks = (parts) =>
  parts.filter(Boolean).map((text, i) => ({ type: 'text', text, ...(i === 0 ? { cache_control: { type: 'ephemeral' } } : {}) }))

// The shared context (research, the programme) is cached at its last block,
// so the many calls in a job that start the same way pay for it once.
const userContent = (context, prompt) => [
  ...context.map((text, i) => ({ type: 'text', text, ...(i === context.length - 1 ? { cache_control: { type: 'ephemeral' } } : {}) })),
  { type: 'text', text: prompt },
]

export function makeClaude({ apiKey, model = DEFAULT_MODEL, usage, log = () => {} }) {
  const client = new Anthropic({ apiKey, maxRetries: 4, timeout: 20 * 60 * 1000 })

  async function send(params, label) {
    const stream = client.messages.stream(params)
    const msg = await stream.finalMessage()
    usage.add(msg.usage)
    log(
      `${label}: ${msg.usage?.input_tokens ?? 0} in, ${msg.usage?.cache_read_input_tokens ?? 0} cached, ${msg.usage?.output_tokens ?? 0} out, ${msg.stop_reason}; job so far $${usage.cost.toFixed(2)}`,
    )
    if (msg.stop_reason === 'refusal') {
      throw new AgentError(`${label}: Claude declined to answer (${msg.stop_details?.explanation ?? msg.stop_details?.category ?? 'no reason given'}).`)
    }
    return msg
  }

  /**
   * A structured answer matching `schema`. Retries once if the answer is cut
   * off (with twice the room) or isn't valid JSON.
   */
  async function json({ system, context = [], prompt, schema, label, maxTokens = 48000, effort = 'high' }) {
    let room = maxTokens
    for (let attempt = 1; ; attempt++) {
      const msg = await send(
        {
          model,
          max_tokens: room,
          system: systemBlocks(system),
          messages: [{ role: 'user', content: userContent(context, prompt) }],
          output_config: { effort, format: { type: 'json_schema', schema } },
        },
        label,
      )
      const text = msg.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
      if (msg.stop_reason === 'model_context_window_exceeded') throw new AgentError(`${label}: the programme is too large to send in one piece.`)
      if (msg.stop_reason === 'max_tokens') {
        if (attempt < 2) {
          room = Math.min(room * 2, 128000)
          continue
        }
        throw new AgentError(`${label}: the answer was too long to finish.`)
      }
      try {
        return JSON.parse(text)
      } catch {
        if (attempt < 2) continue
        throw new AgentError(`${label}: the answer wasn't valid JSON.`)
      }
    }
  }

  /**
   * Web research: a Markdown brief, and the pages the searches found.
   * Long searches can pause; the turn is sent back to carry on.
   */
  async function research({ system, prompt, label, maxSearches = 12 }) {
    const messages = [{ role: 'user', content: prompt }]
    const tools = [
      {
        type: 'web_search_20260209',
        name: 'web_search',
        max_uses: maxSearches,
        user_location: { type: 'approximate', country: 'IN', timezone: 'Asia/Kolkata' },
      },
    ]
    const text = []
    const sources = new Map()
    for (let turn = 0; turn < 6; turn++) {
      const msg = await send({ model, max_tokens: 32000, system: systemBlocks(system), messages, tools, output_config: { effort: 'high' } }, label)
      for (const b of msg.content) {
        if (b.type === 'text') {
          text.push(b.text)
          for (const c of b.citations ?? []) if (c.url) sources.set(c.url, c.title ?? c.url)
        }
        if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
          for (const r of b.content) if (r.url) sources.set(r.url, r.title ?? r.url)
        }
      }
      if (msg.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: msg.content })
    }
    return { brief: text.join('').trim(), sources: [...sources].map(([url, title]) => ({ url, title })) }
  }

  /** For `worker.mjs --check`: is the key good, and can it use the model? */
  async function ping() {
    const m = await client.models.retrieve(model)
    return m.display_name ?? m.id
  }

  return { json, research, ping }
}
