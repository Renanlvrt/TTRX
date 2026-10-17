// Presenter shortcuts. Alt+D: load the real demo house and hide demo controls. Alt+R: wipe back to a brand-new user.
import { clear } from 'idb-keyval'
import { initialState, resetState, setState } from './store'
import { DEMO_PROPERTY, demoHouseMoveIn, demoHouseMoveOut } from '../data/demoHouse'

export function enterDemoMode() {
  setState(() => {
    const s = initialState()
    return {
      ...s,
      demoMode: true,
      property: DEMO_PROPERTY,
      moveIn: demoHouseMoveIn(),
      moveOut: demoHouseMoveOut(),
      tasks: { ...s.tasks, inspection: 'done', comparison: 'inProgress' },
    }
  })
}

export async function resetToNewUser() {
  try {
    await clear() // uploaded photos
  } catch {
    // IndexedDB unavailable: state reset below still works
  }
  resetState()
}
