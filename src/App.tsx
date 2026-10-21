import { useEffect, useRef } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import { LogoMark } from './components/Logo'
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
import PartnerBillingPage from './pages/partners/PartnerBillingPage'

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
  partnerBilling: '/partners/billing',
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
      className="flex select-none items-center gap-2.5 text-[1.65rem] font-medium tracking-tight text-white"
    >
      <LogoMark size={36} silver />
      <span className="silver-text">RentReady</span>
    </Link>
  )
}

function Header() {
  return (
    <header className="app-bar no-print pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-18 max-w-4xl items-center justify-center px-6">
        <LogoLink />
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <DemoHotkeys />
      <div className="min-h-screen">
        <Header />
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
            <Route path={ROUTES.partnerBilling} element={<PartnerBillingPage />} />
            <Route path="/move-in" element={<StagePage />} />
            <Route path="/move-out" element={<StagePage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
