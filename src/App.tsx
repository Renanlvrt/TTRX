import { useEffect, useRef } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import { Home as HomeIcon } from 'lucide-react'
import Home, { StagePage } from './pages/Home'
import { enterDemoMode, resetToNewUser } from './lib/demoMode'
import { getState } from './lib/store'
import BillsPage from './pages/bills/BillsPage'
import InspectionPage from './pages/inspection/InspectionPage'
import EmailPage from './pages/email/EmailPage'
import ComparePage from './pages/moveout/ComparePage'
import ReportPage from './pages/moveout/ReportPage'
import StoragePage from './pages/storage/StoragePage'
import CleaningPage from './pages/cleaning/CleaningPage'

// Route table is the navigation contract; page owners only touch their own folders.
export const ROUTES = {
  home: '/',
  bills: '/move-in/bills',
  inspection: '/move-in/inspection',
  email: '/move-in/email',
  compare: '/move-out/compare',
  report: '/move-out/report',
  storage: '/move-out/storage',
  cleaning: '/move-out/cleaning',
} as const

/** Alt+D = presenter demo house, Alt+R = brand-new user. Uses e.code so it works on any keyboard layout. */
function DemoHotkeys() {
  const navigate = useNavigate()
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      if (e.code === 'KeyD') {
        e.preventDefault()
        enterDemoMode()
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        resetToNewUser().then(() => navigate('/'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
  return null
}

/** Logo = home link. Press and hold ~1s (phones: no keyboard) toggles presenter demo mode / reset to new user. */
function LogoLink() {
  const navigate = useNavigate()
  const timer = useRef<number | null>(null)
  const fired = useRef(false)
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }
  const start = () => {
    fired.current = false
    cancel()
    timer.current = window.setTimeout(() => {
      fired.current = true
      navigator.vibrate?.(30)
      if (getState().demoMode) resetToNewUser().then(() => navigate('/'))
      else enterDemoMode()
    }, 900)
  }
  return (
    <Link
      to="/"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (fired.current) e.preventDefault()
      }}
      draggable={false}
      style={{ WebkitTouchCallout: 'none' }}
      className="flex select-none items-center gap-2 text-xl font-extrabold tracking-tight"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
        <HomeIcon size={18} />
      </span>
      RentReady
    </Link>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoHotkeys />
      <div className="min-h-screen bg-white">
        <header className="no-print border-b border-line">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <LogoLink />
            <span className="hidden text-sm font-medium text-slate-500 sm:inline">Free for students · Durham</span>
          </div>
        </header>
        <main>
          <Routes>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path={ROUTES.bills} element={<BillsPage />} />
            <Route path={ROUTES.inspection} element={<InspectionPage />} />
            <Route path={ROUTES.email} element={<EmailPage />} />
            <Route path={ROUTES.compare} element={<ComparePage />} />
            <Route path={ROUTES.report} element={<ReportPage />} />
            <Route path={ROUTES.storage} element={<StoragePage />} />
            <Route path={ROUTES.cleaning} element={<CleaningPage />} />
            <Route path="/move-in" element={<StagePage />} />
            <Route path="/move-out" element={<StagePage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
