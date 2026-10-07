import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PublicRoute } from './components/layout/PublicRoute'
import { ScrollToTop } from './components/layout/ScrollToTop'

import { NotFoundPage } from './pages/NotFoundPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { AuthCallback } from './pages/AuthCallback'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { EditProfilePage } from './pages/EditProfilePage'
import { CandidateSearchPage } from './pages/CandidateSearchPage'

import { CompetitionsPage } from './pages/CompetitionsPage'
import { CreateCompetitionPage } from './pages/CreateCompetitionPage'
import { CompetitionDetailPage } from './pages/CompetitionDetailPage'
import { JobsPage } from './pages/JobsPage'
import { CreateJobPage } from './pages/CreateJobPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { MessagesPage } from './pages/MessagesPage'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
          </Route>
          
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Full-screen protected routes (no sidebar) */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Protected Routes inside AppShell */}
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              
              <Route path="/search" element={<CandidateSearchPage />} />
              
              <Route path="/competitions" element={<CompetitionsPage />} />
              <Route path="/competitions/new" element={<CreateCompetitionPage />} />
              <Route path="/competitions/:id" element={<CompetitionDetailPage />} />

              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/new" element={<CreateJobPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />

              <Route path="/messages" element={<MessagesPage />} />
              
              {/* Fallback for authenticated users */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          
          {/* Global Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
