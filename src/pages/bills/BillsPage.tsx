import { useEffect, useState } from 'react'
import { setState, setTask, useAppState } from '../../lib/store'
import type { BillsSurvey } from '../../lib/types'
import { DEMO_SURVEY } from '../../lib/bills'
import Survey from './Survey'
import Results from './Results'

export default function BillsPage() {
  const saved = useAppState().bills.survey
  const [editing, setEditing] = useState(!saved)

  // Results on screen = task done (also when returning after an abandoned edit).
  useEffect(() => {
    if (!editing && saved) setTask('bills', 'done')
  }, [editing, saved])

  function finish(survey: BillsSurvey) {
    setState((s) => ({ ...s, bills: { survey } }))
    setTask('bills', 'done')
    setEditing(false)
  }

  if (!editing && saved) {
    return (
      <Results
        survey={saved}
        onEdit={() => {
          setTask('bills', 'inProgress')
          setEditing(true)
        }}
        onReset={() => {
          // Back to a blank survey at step 1, so the demo can be rerun.
          setState((s) => ({ ...s, bills: { survey: null } }))
          setTask('bills', 'notStarted')
          setEditing(true)
        }}
        onTenancyChange={(tenancyWeeks) => setState((s) => ({ ...s, bills: { survey: { ...saved, tenancyWeeks } } }))}
      />
    )
  }

  return (
    <Survey
      initial={saved}
      onStart={() => setTask('bills', 'inProgress')}
      onFinish={finish}
      onDemo={() => finish(DEMO_SURVEY)}
    />
  )
}
