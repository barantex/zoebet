import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminLayout } from './admin/AdminLayout'
import { AdminGamesPage, AdminMatchesPage, AdminPromotionsPage } from './admin/AdminPages'
import { AdminBannersPage } from './admin/AdminBanners'
import { AdminDashboardPage } from './admin/AdminDashboard'
import { AdminUsersPage } from './admin/AdminUsers'
import { AdminFinancePage } from './admin/AdminFinance'
import { AdminWheelPage } from './admin/AdminWheel'
import { AdminSettingsPage } from './admin/AdminSettings'
import { AdminPasswordPage } from './admin/AdminPassword'
import { AdminLoginPage } from './pages/AdminLogin'
import { FinancePanelLoginPage } from './pages/FinancePanelLogin'
import { FinancePanelPage } from './pages/FinancePanel'
import { ZoeFooter } from './components/ZoeFooter'
import { ZoeHeader } from './components/ZoeHeader'
import { ZoeSidebar } from './components/ZoeSidebar'
import { TawkChat } from './components/TawkChat'
import { ensureSeeded } from './lib/seed'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { FinancePage } from './pages/Finance'
import { HomePage } from './pages/Home'
import { FaqPage, PrivacyPage, ResponsiblePage, SupportPage, TermsPage } from './pages/InfoPages'
import { PlayPage } from './pages/Play'
import { CasinoPage, LiveCasinoPage, LivePage, PromotionsPage, SportsPage, TournamentsPage } from './pages/SimpleListPage'
import { StaffSupportPage } from './pages/StaffSupport'
import { WheelCodePage } from './pages/WheelCode'
import { WheelPage } from './pages/Wheel'
import { LisansPage } from './pages/LisansPage'

function App() {
  return (
    <AuthProvider>
      <Boot />
    </AuthProvider>
  )
}
export default App

function Boot() {
  const { loading } = useAuth()
  useEffect(() => { ensureSeeded() }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#111118', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#f5c518', fontSize: 32, fontWeight: 900 }}>⚡ BahisMosco</div>
      </div>
    )
  }
  return (
    <Routes>
      {/* Admin login — standalone */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Finance Panel — standalone */}
      <Route path="/finans-panel/login" element={<FinancePanelLoginPage />} />
      <Route path="/finans-panel" element={<FinancePanelPage />} />

      {/* Admin — standalone, no sidebar */}
      <Route
        path="/admin"
        element={<ProtectedRoute requireAdmin loginPath="/admin/login"><AdminLayout /></ProtectedRoute>}
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="wheel" element={<AdminWheelPage />} />
        <Route path="matches" element={<AdminMatchesPage />} />
        <Route path="games" element={<AdminGamesPage />} />
        <Route path="promotions" element={<AdminPromotionsPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="password" element={<AdminPasswordPage />} />
      </Route>
      <Route path="/backoffice" element={<Navigate to="/admin" replace />} />

      {/* Main site — with sidebar + header */}
      <Route path="/*" element={<SiteLayout />} />
    </Routes>
  )
}

function SiteLayout() {
  return (
    <div className="zoe-layout">
      <ZoeSidebar />
      <div className="zoe-body">
        <ZoeHeader />
        <main className="zoe-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sports" element={<SportsPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/casino" element={<CasinoPage />} />
            <Route path="/live-casino" element={<LiveCasinoPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/wallet" element={<FinancePage />} />
            <Route path="/wheel-code" element={<WheelCodePage />} />
            <Route path="/wheel" element={<WheelPage />} />
            <Route path="/play/:code" element={<PlayPage />} />
            <Route path="/help/faq" element={<FaqPage />} />
            <Route path="/help/support" element={<SupportPage />} />
            <Route path="/help/responsible" element={<ResponsiblePage />} />
            <Route path="/help/privacy" element={<PrivacyPage />} />
            <Route path="/help/terms" element={<TermsPage />} />
            <Route path="/lisans" element={<LisansPage />} />
            <Route path="/support-team" element={<ProtectedRoute><StaffSupportPage /></ProtectedRoute>} />
            <Route path="*" element={
              <div className="zoe-panel">
                <h2 style={{ marginBottom: 8 }}>Sayfa bulunamadı</h2>
                <p className="zoe-muted">Aradığın sayfa yok.</p>
                <a className="zoe-btn zoe-btn--primary" href="/" style={{ marginTop: 12, display: 'inline-flex' }}>Ana sayfa</a>
              </div>
            } />
          </Routes>
        </main>
        <ZoeFooter />
        <TawkChat />
      </div>
    </div>
  )
}

