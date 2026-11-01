import OpenAI from 'openai'

/**
 * The key is read here and nowhere else. This module is only ever imported by
 * a route handler, so it never reaches a client bundle. Note the env var names
 * are deliberately un-prefixed — anything NEXT_PUBLIC_* would be inlined into
 * the browser build.
 *
 * The endpoint is configurable because the app only needs OpenAI-compatible
 * chat completions with `response_format: json_schema`. xAI is the default;
 * any provider that speaks the same dialect works without a code change.
 */
export const DEFAULT_BASE_URL = 'https://api.x.ai/v1'

export function baseUrl(): string {
  return process.env.AI_BASE_URL?.trim() || DEFAULT_BASE_URL
}

export function apiKey(): string {
  // AI_API_KEY is the general name; XAI_API_KEY still works.
  const key = process.env.AI_API_KEY || process.env.XAI_API_KEY
  if (!key) throw new MissingConfig('No API key is set (AI_API_KEY or XAI_API_KEY).')
  return key
}

export function grokClient(): OpenAI {
  return new OpenAI({
    apiKey: apiKey(),
    baseURL: baseUrl(),
    timeout: 90_000,
    maxRetries: 1,
  })
}

export function grokModel(): string {
  // AI_MODEL is the general name; GROK_MODEL still works.
  const model = process.env.AI_MODEL || process.env.GROK_MODEL
  if (!model) throw new MissingConfig('No model is set (AI_MODEL or GROK_MODEL).')
  return model
}

/**
 * Grok 4 rejects `max_tokens` and requires `max_completion_tokens`; most other
 * OpenAI-compatible endpoints only understand `max_tokens`. Pick by endpoint
 * rather than making the user know this.
 */
export function tokenLimit(limit: number): Record<string, number> {
  return /(^|\.)x\.ai$/.test(hostOf(baseUrl()))
    ? { max_completion_tokens: limit }
    : { max_tokens: limit }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

export class MissingConfig extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingConfig'
  }
}
