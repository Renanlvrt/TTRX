import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ButtonLink, Card, Fine, Page } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { buildMoveInEmail, mailtoLink } from '../../lib/email'
import { CHECKLIST } from '../../data/checklist'

export default function EmailPage() {
  const { property, moveIn, emailDraft, tasks } = useAppState()
  const hasRecords = Object.values(moveIn.records).some((r) => r.condition !== null)
  const template = useMemo(() => buildMoveInEmail(property, moveIn, CHECKLIST), [property, moveIn])

  const [subject, setSubject] = useState(template.subject)
  const [copied, setCopied] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const body = emailDraft ?? template.body

  useEffect(() => {
    if (hasRecords && tasks.email === 'notStarted') setTask('email', 'inProgress')
  }, [hasRecords, tasks.email])

  if (!hasRecords) {
    return (
      <Page title="Email your landlord">
        <Card className="flex flex-col items-center gap-5 py-16 text-center">
          <h2 className="text-2xl font-bold">Do your photo inspection first</h2>
          <ButtonLink to="/move-in/inspection">Start inspection</ButtonLink>
        </Card>
      </Page>
    )
  }

  const editBody = (v: string) => setState((s) => ({ ...s, emailDraft: v }))

  const copy = async () => {
    const text = `Subject: ${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      bodyRef.current?.select() // fallback: let the user press Ctrl+C
      return
    }
    setCopied(true)
    setTask('email', 'done')
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setState((s) => ({ ...s, emailDraft: null }))
    setSubject(template.subject)
  }

  return (
    <Page
      title="Email your landlord"
      actions={
        <Button variant="ghost" size="md" onClick={reset}>
          Reset
        </Button>
      }
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-muted">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-14 w-full rounded-md border border-field-border px-5 text-lg font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => editBody(e.target.value)}
        aria-label="Email body"
        rows={16}
        className="mt-4 w-full resize-y rounded-md border border-field-border p-5 text-lg leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={copy}>
          {copied ? 'Copied' : 'Copy email'}
        </Button>
        <a
          href={mailtoLink(subject, body)}
          onClick={() => setTask('email', 'done')}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-md border border-line bg-card px-7 text-lg font-semibold hover:border-line-strong hover:bg-canvas"
        >
          Open in mail app
        </a>
      </div>

      <Fine className="mt-4">Attach your photos before you send it.</Fine>
    </Page>
  )
}
