// Tiny global store: app state in localStorage, photos in IndexedDB.
// UI reads/writes through useAppState() and the photo helpers only.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { get, set, del } from 'idb-keyval'
import type { AppState, TaskId, TaskStatus } from './types'
import { DEMO_PROPERTY, demoHouseMoveIn, demoHouseMoveOut } from '../data/demoHouse'

// v3: every device starts fresh in the demo state (move-out 9/10, oven left for the live upload).
const KEY = 'rentready:v3'

export function initialState(): AppState {
  return {
    property: {
      label: '12 Example Street, Gilesgate',
      area: 'gilesgate',
      moveInDate: '2025-07-01',
      moveOutDate: '2026-06-18',
      tenantName: 'Alex',
      landlordName: 'Landlord',
    },
    bills: { survey: null },
    moveIn: { kind: 'moveIn', records: {} },
    moveOut: { kind: 'moveOut', records: {} },
    emailDraft: null,
    demoMode: false,
    storageArea: null,
    storageNeeds: { boxes: { small: 0, medium: 0, large: 0 }, weeks: 15 },
    cleaningDone: [],
    cleaning: { bedrooms: null, depositPerPerson: 400, dirtyItems: null },
    tasks: {
      bills: 'notStarted',
      inspection: 'notStarted',
      email: 'notStarted',
      comparison: 'notStarted',
      storage: 'notStarted',
      cleaning: 'notStarted',
    },
  }
}

/** Presenter demo house: real photos loaded, demo controls hidden. This is what a first visit opens. */
export function demoState(): AppState {
  const s = initialState()
  return {
    ...s,
    demoMode: true,
    property: DEMO_PROPERTY,
    moveIn: demoHouseMoveIn(),
    moveOut: demoHouseMoveOut(),
    tasks: { ...s.tasks, inspection: 'done', comparison: 'inProgress' },
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
  } catch {
    // corrupt or blocked storage: fall back to the demo house
  }
  return demoState()
}

let state: AppState = load()
const listeners = new Set<() => void>()

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full/blocked: keep working in memory
  }
  listeners.forEach((l) => l())
}

export function getState(): AppState {
  return state
}

export function setState(update: (s: AppState) => AppState) {
  state = update(state)
  emit()
}

export function setTask(id: TaskId, status: TaskStatus) {
  setState((s) => (s.tasks[id] === status ? s : { ...s, tasks: { ...s.tasks, [id]: status } }))
}

export function resetState() {
  state = initialState()
  emit()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Read the whole app state; re-renders on any change. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState)
}

// ---------- Photos ----------

const MAX_SIDE = 1280

/** Downscale to a JPEG so photos stay small, then store in IndexedDB. Returns the photo id. */
export async function savePhoto(file: Blob): Promise<string> {
  const blob = await downscale(file)
  const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await set(id, blob)
  return id
}

export async function deletePhoto(photoId: string) {
  if (!photoId.startsWith('url:')) await del(photoId)
}

async function downscale(file: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85))
  } catch {
    return file // unsupported format: store the original
  }
}

/** Resolve a photo reference to a displayable URL ("url:" prefix = bundled demo image). */
export function usePhotoUrl(photoId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!photoId) return setUrl(null)
    if (photoId.startsWith('url:')) {
      // Bundled demo photos: resolve against the app's base path (e.g. /TTRX/ on GitHub Pages).
      const path = photoId.slice(4)
      return setUrl(path.startsWith('/') ? import.meta.env.BASE_URL + path.slice(1) : path)
    }
    let objectUrl: string | null = null
    let cancelled = false
    get<Blob>(photoId).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])
  return url
}
