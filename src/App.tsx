import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Home as HomeIcon } from 'lucide-react'
import Home from './pages/Home'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <header className="no-print border-b border-line">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                <HomeIcon size={18} />
              </span>
              RentReady
            </Link>
            <span className="text-sm font-medium text-slate-500">Free for students · Durham</span>
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
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
