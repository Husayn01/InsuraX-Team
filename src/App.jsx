import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@contexts/AuthContext'
import { NotificationProvider } from '@contexts/NotificationContext'

// Auth pages
import { Login } from '@features/auth/Login'
import { SignUp } from '@features/auth/SignUp'
import LandingPage from '@features/landing/LandingPage'

// Customer pages
import { CustomerDashboard } from '@features/dashboard/CustomerDashboard'
import { CustomerClaims } from '@features/claims/CustomerClaims'
import { NewClaim } from '@features/claims/NewClaim'
import { ClaimDetails } from '@features/claims/ClaimDetails'
import { CustomerPayments } from '@features/payments/CustomerPayments'
import { CustomerProfile } from '@features/profile/CustomerProfile'
import { NotificationCenter } from '@features/notifications/components/NotificationComponents.jsx'
import { PaymentCallback } from '@features/payments/PaymentCallback'

// Insurer pages
import { InsurerDashboard } from '@features/dashboard/InsurerDashboard'
import { InsurerClaims } from '@features/claims/InsurerClaims'
import { InsurerClaimDetails } from '@features/claims/InsurerClaimDetails'
import { InsurerAnalytics } from '@features/analytics/InsurerAnalytics'
import { InsurerCustomers } from '@features/customers/InsurerCustomers'
import { InsurerSettings } from '@features/settings/InsurerSettings'
import { NeuroClaimPage } from '@features/neuroclaim/NeuroClaimPage'
import { SettlementDashboard } from '@features/settlements/SettlementDashboard'

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
        </div>
      </div>
      <p className="mt-4 text-gray-400 font-medium">Loading InsuraX...</p>
    </div>
  </div>
)

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Protected Route wrapper with better loading handling
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth()
  
  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingScreen />
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check role if specified
  if (allowedRole && profile?.role !== allowedRole) {
    return <Navigate to="/" replace />
  }
  
  return children
}

const AppRoutes = () => {
  const { profile, loading } = useAuth()
  
  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingScreen />
  }
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Payment callback route */}
        <Route path="/payment/callback" element={<PaymentCallback />} />
        
        {/* Customer routes */}
        <Route path="/customer/*" element={
          <ProtectedRoute allowedRole="customer">
            <Routes>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="claims" element={<CustomerClaims />} />
              <Route path="claims/new" element={<NewClaim />} />
              <Route path="claims/:id" element={<ClaimDetails />} />
              <Route path="payments" element={<CustomerPayments />} />
              <Route path="profile" element={<CustomerProfile />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="*" element={<Navigate to="/customer/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        } />
        
        {/* Insurer routes */}
        <Route path="/insurer/*" element={
        <ProtectedRoute allowedRole="insurer">
          <Routes>
            <Route path="dashboard" element={<InsurerDashboard />} />
            <Route path="claims" element={<InsurerClaims />} />
            <Route path="claims/:id" element={<InsurerClaimDetails />} />
            <Route path="analytics" element={<InsurerAnalytics />} />
            <Route path="customers" element={<InsurerCustomers />} />
            <Route path="settings" element={<InsurerSettings />} />
            <Route path="neuroclaim" element={<NeuroClaimPage />} />
            <Route path="settlements" element={<SettlementDashboard />} /> {/* Add here */}
            <Route path="*" element={<Navigate to="/insurer/dashboard" replace />} />
          </Routes>
        </ProtectedRoute>
      } />
        
        {/* Redirect based on role */}
        <Route path="*" element={
          profile?.role === 'insurer' 
            ? <Navigate to="/insurer/dashboard" replace />
            : profile?.role === 'customer'
            ? <Navigate to="/customer/dashboard" replace />
            : <Navigate to="/" replace />
        } />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App