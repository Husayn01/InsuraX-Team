import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { LoadingSpinner } from '@shared/components'

export const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, profile, loading, isAuthenticated, sessionError } = useAuth()
  const location = useLocation()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsReady(true)
    }, 3000) // 3 seconds max wait time

    // If loading completes before timeout, set ready immediately
    if (!loading) {
      setIsReady(true)
      clearTimeout(timeout)
    }

    return () => clearTimeout(timeout)
  }, [loading])

  // Show loading spinner while checking auth
  if (!isReady && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If there's a session error, redirect to login
  if (sessionError) {
    console.log('Session error detected, redirecting to login:', sessionError)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    console.log('User not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Wait for profile to load if we have allowedRole
  if (allowedRole && !profile && !sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (allowedRole && profile && profile.role !== allowedRole) {
    console.log(`Access denied. Required role: ${allowedRole}, User role: ${profile.role}`)
    
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = profile.role === 'customer' ? '/customer/dashboard' : '/insurer/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  // All checks passed, render children
  return children
}

export default ProtectedRoute