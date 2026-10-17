// Presenter shortcuts. Alt+D: load the real demo house and hide demo controls. Alt+R: wipe back to a brand-new user.
// A first visit already opens in demo mode (see demoState in store.ts).
import { clear } from 'idb-keyval'
import { demoState, resetState, setState } from './store'

export function enterDemoMode() {
  setState(() => demoState())
}

export async function resetToNewUser() {
  try {
    await clear() // uploaded photos
  } catch {
    // IndexedDB unavailable: state reset below still works
  }
  resetState()
}
