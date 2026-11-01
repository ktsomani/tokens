'use client'

import { useCallback, useEffect, useState } from 'react'
import { useStudio } from '@/lib/store'
import { Button, LiveRegion } from '@/components/ui/primitives'

const TOKEN_KEY = 'tokens:edit'

/** Edit tokens are per-design and live only in this browser. */
function readEditToken(id: string): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as Record<string, string>)[id] ?? null
  } catch {
    return null
  }
}

function writeEditToken(id: string, token: string) {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    map[id] = token
    localStorage.setItem(TOKEN_KEY, JSON.stringify(map))
  } catch {
    /* Private mode or blocked storage: the save still worked, this browser
       just will not be able to edit it in place afterwards. */
  }
}

export function ShareButton() {
  const save = useStudio((s) => s.save)
  const setSave = useStudio((s) => s.setSave)
  const setEditToken = useStudio((s) => s.setEditToken)
  const editToken = useStudio((s) => s.editToken)
  const [announce, setAnnounce] = useState('')

  // Pick up an edit token stored from a previous visit to this design.
  useEffect(() => {
    if (save.id && !editToken) {
      const stored = readEditToken(save.id)
      if (stored) setEditToken(stored)
    }
  }, [save.id, editToken, setEditToken])

  const run = useCallback(async () => {
    const state = useStudio.getState()
    setSave({ status: 'saving', error: null })

    const title = state.components[0]?.name ?? 'Untitled'
    const body = { title, tokens: state.tokens, components: state.components }

    const updating = Boolean(state.save.id && state.editToken)
    const response = await fetch('/api/designs', {
      method: updating ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        updating ? { ...body, id: state.save.id, editToken: state.editToken } : body,
      ),
    }).catch(() => null)

    if (!response) {
      setSave({ status: 'error', error: 'Could not reach the server.' })
      return
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setSave({ status: 'error', error: data.error ?? 'Save failed.' })
      setAnnounce(data.error ?? 'Save failed')
      return
    }

    const id: string = data.id
    if (data.editToken) {
      writeEditToken(id, data.editToken)
      setEditToken(data.editToken)
    }

    const url = `${window.location.origin}/d/${id}`
    setSave({ status: 'saved', id, url, error: null })

    try {
      await navigator.clipboard.writeText(url)
      setAnnounce('Share link copied to clipboard')
    } catch {
      setAnnounce(`Saved. Share link: ${url}`)
    }
  }, [setSave, setEditToken])

  const label =
    save.status === 'saving'
      ? 'Saving…'
      : save.status === 'saved'
        ? 'Link copied'
        : save.status === 'error'
          ? 'Retry save'
          : 'Share'

  return (
    <>
      <Button
        onClick={run}
        disabled={save.status === 'saving'}
        title={save.error ?? 'Save and copy a share link'}
        className={save.status === 'error' ? 'text-fail' : undefined}
      >
        {label}
      </Button>
      <LiveRegion message={announce} />
    </>
  )
}
