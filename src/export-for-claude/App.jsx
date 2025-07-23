import React from 'react'
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

// Insurer pages
import { InsurerDashboard } from '@features/dashboard/InsurerDashboard'
import { InsurerClaims } from '@features/claims/InsurerClaims'
import { InsurerClaimDetails } from '@features/claims/InsurerClaimDetails'
import { InsurerAnalytics } from '@features/analytics/InsurerAnalytics'
import { InsurerCustomers } from '@features/customers/InsurerCustomers'
import { InsurerSettings } from '@features/settings/InsurerSettings'
import { NeuroClaimPage } from '@features/neuroclaim/NeuroClaimPage'

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRole && profile?.role !== allowedRole) {
    return <Navigate to="/" replace />
  }
  
  return children
}

const AppRoutes = () => {
  const { profile, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Customer routes */}
      <Route path="/customer/*" element={
        <ProtectedRoute allowedRole="customer">
          <Routes>
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="claims" element={<CustomerClaims />} />
            <Route path="claims/new" element={<NewClaim />} />
            <Route path="claims/:id" element={<ClaimDetails />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="payments/new" element={<CustomerPayments />} />
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
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App