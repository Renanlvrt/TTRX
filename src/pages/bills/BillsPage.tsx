import { useState } from 'react'
import { setState, setTask, useAppState } from '../../lib/store'
import type { BillsSurvey } from '../../lib/types'
import { DEMO_SURVEY } from '../../lib/bills'
import Survey from './Survey'
import Results from './Results'

export default function BillsPage() {
  const saved = useAppState().bills.survey
  const [editing, setEditing] = useState(!saved)

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
