import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, KeyRound, PackageOpen } from 'lucide-react'
import { TabBar, cx } from './components/ui'
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
      aria-label="RentReady home"
      className="-ml-1 flex min-h-11 select-none items-center gap-2.5 rounded-lg px-1 text-lg font-semibold text-ink"
    >
      <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[15px] font-semibold text-white">R</span>
      RentReady
    </Link>
  )
}

const NAV = [
  { to: '/', label: 'Home', icon: <HomeIcon size={22} strokeWidth={1.75} />, match: (p: string) => p !== '/move-in' && p !== '/move-out' && !p.startsWith('/move-in/') && !p.startsWith('/move-out/') },
  { to: '/move-in', label: 'Moving in', icon: <KeyRound size={22} strokeWidth={1.75} />, match: (p: string) => p === '/move-in' || p.startsWith('/move-in/') },
  { to: '/move-out', label: 'Moving out', icon: <PackageOpen size={22} strokeWidth={1.75} />, match: (p: string) => p === '/move-out' || p.startsWith('/move-out/') },
]

/** White top bar with the Palatinate mark; on desktop it also carries the three main links. */
function Shell({ children }: { children: ReactNode }) {
  const path = useLocation().pathname
  const items = NAV.map((n) => ({ to: n.to, label: n.label, icon: n.icon, active: n.match(path) }))
  return (
    <div className="min-h-dvh bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-ink">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-13 max-w-3xl items-center justify-between px-4 sm:px-6">
          <LogoLink />
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex gap-1">
              {items.map((t) => (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    aria-current={t.active ? 'page' : undefined}
                    className={cx('flex min-h-11 items-center rounded-lg px-3 text-sm', t.active ? 'font-semibold text-brand' : 'font-medium text-muted hover:text-ink')}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="pb-tabbar">{children}</main>
      <TabBar items={items} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <DemoHotkeys />
      <Shell>
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
      </Shell>
    </BrowserRouter>
  )
}
