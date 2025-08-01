import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, supabaseHelpers } from '@services/supabase'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false) // ✅ Add this flag

  useEffect(() => {
    // ✅ Prevent re-initialization
    if (isInitialized) return
    
    let mounted = true
    let authListener = null

    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthContext: Checking session...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          setSessionError(error.message)
          if (mounted) {
            setLoading(false)
            setIsInitialized(true) // ✅ Mark as initialized
          }
          return
        }

        if (session?.user && mounted) {
          console.log('✅ Session found:', session.user.id)
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          console.log('ℹ️ No active session')
        }

        // Set up auth state listener
        authListener = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state changed:', event)
          
          // Prevent handling events if component is unmounted
          if (!mounted) return
          
          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                setUser(session.user)
                await loadUserProfile(session.user.id)
              }
              break
              
            case 'SIGNED_OUT': // ✅ Fixed: removed duplicate case
              setUser(null)
              setProfile(null)
              
              // Only navigate if not already on public pages
              const publicPaths = ['/login', '/signup', '/']
              if (!publicPaths.includes(window.location.pathname)) {
                console.log('Session expired, redirecting to login...')
                window.location.href = '/login' // ✅ Use window.location to avoid dependency issues
              }
              break
              
            case 'TOKEN_REFRESHED':
              console.log('🔄 Token refreshed successfully')
              if (session?.user) {
                setUser(session.user)
              }
              break
              
            case 'USER_UPDATED':
              if (session?.user) {
                setUser(session.user)
                await loadUserProfile(session.user.id)
              }
              break
              
            default:
              break
          }
        })

      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        setSessionError(error.message)
      } finally {
        if (mounted) {
          setLoading(false)
          setIsInitialized(true) // ✅ Mark as initialized
          console.log('✅ AuthContext: Initial loading complete')
        }
      }
    }

    initializeAuth()

    // Cleanup function
    return () => {
      mounted = false
      authListener?.data?.subscription?.unsubscribe()
    }
  }, []) // ✅ Remove navigate from dependencies

  const loadUserProfile = async (userId) => {
    if (!userId) return
    
    try {
      console.log('📋 Loading profile for user:', userId)
      const { data, error } = await supabaseHelpers.getProfile(userId)
      
      if (error) {
        console.error('❌ Error loading profile:', error)
        return
      }
      
      if (data) {
        console.log('✅ Profile loaded:', data.role)
        setProfile(data)
      } else {
        console.log('⚠️ No profile found for user')
      }
    } catch (error) {
      console.error('❌ Unexpected error loading profile:', error)
    }
  }

  // ✅ Separate effect for navigation after login
  useEffect(() => {
    // Only navigate after everything is loaded and initialized
    if (user && profile && !loading && isInitialized) {
      const currentPath = window.location.pathname
      if (currentPath === '/login' || currentPath === '/signup') {
        const dashboardPath = profile.role === 'insurer' ? '/insurer/dashboard' : '/customer/dashboard'
        console.log(`Redirecting ${profile.role} to ${dashboardPath}`)
        navigate(dashboardPath)
      }
    }
  }, [user, profile, loading, isInitialized, navigate])

  const signUp = async (email, password, metadata = {}) => {
    try {
      setSessionError(null)
      const { data, error } = await supabaseHelpers.signUp(email, password, metadata)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('Signup error:', error)
      setSessionError(error.message)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      setSessionError(null)
      setIsRefreshing(true)
      
      const { data, error } = await supabaseHelpers.signIn(email, password)
      
      if (error) throw error
      
      if (data.user) {
        setUser(data.user)
        await loadUserProfile(data.user.id)
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      setSessionError(error.message)
      return { data: null, error }
    } finally {
      setIsRefreshing(false)
    }
  }

  const signOut = async () => {
    try {
      setSessionError(null)
      
      // Check if there's an active session before trying to sign out
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Only try to sign out if there's an active session
        const { error } = await supabaseHelpers.signOut()
        
        if (error && !error.message.includes('session_not_found')) {
          // Only log real errors, not "no session" errors
          console.error('Sign out error:', error)
          setSessionError(error.message)
        }
      } else {
        console.log('No active session to sign out from')
      }
      
      // Always clear local state and navigate, regardless of signOut success
      setUser(null)
      setProfile(null)
      
      // Clear any stored tokens
      localStorage.removeItem('insurax-auth-token')
      
      // ✅ Use window.location to avoid dependency issues
      window.location.href = '/login'
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      
      // Even if there's an error, clear state and navigate
      setUser(null)
      setProfile(null)
      localStorage.removeItem('insurax-auth-token')
      window.location.href = '/login'
      
      return { error }
    }
  }

const refreshSession = async () => {
  if (isRefreshing) {
    console.log('🔄 Already refreshing session, skipping...')
    return
  }
  
  try {
    setIsRefreshing(true)
    console.log('🔄 Manually refreshing session...')
    
    // Add timeout to prevent infinite hanging
    const refreshPromise = supabase.auth.refreshSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Refresh timeout')), 10000)
    )
    
    const { data: { session }, error } = await Promise.race([
      refreshPromise,
      timeoutPromise
    ])
      
      if (error) {
        console.error('❌ Session refresh error:', error)
        // Only sign out if it's an invalid refresh token error
        if (error.message.includes('refresh_token') || error.message.includes('invalid')) {
          await signOut()
        }
        return { error }
      }
      
      if (session) {
        console.log('✅ Session refreshed successfully')
        setUser(session.user)
        await loadUserProfile(session.user.id)
      }
      
      return { error: null }
    } catch (error) {
      console.error('❌ Refresh session error:', error)
      return { error }
    } finally {
      setIsRefreshing(false)
    }
  }

  // Check session validity on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user && !isRefreshing) {
        console.log('🔍 Tab became visible, checking session...')
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            console.log('⚠️ Session invalid or expired')
            // Instead of trying to refresh, just sign out
            setUser(null)
            setProfile(null)
            window.location.href = '/login' // ✅ Use window.location
          } else {
            console.log('✅ Session still valid')
          }
        } catch (error) {
          console.error('❌ Visibility change session check error:', error)
          // On error, assume session is invalid
          setUser(null)
          setProfile(null)
          window.location.href = '/login' // ✅ Use window.location
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, isRefreshing]) // ✅ Remove navigate from dependencies

  // Periodic session check (every 10 minutes while tab is active)
  useEffect(() => {
    if (!user) return

    const checkInterval = setInterval(async () => {
      if (document.visibilityState === 'visible' && !isRefreshing) {
        console.log('⏰ Periodic session check...')
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            console.log('⚠️ Session needs refresh')
            await refreshSession()
          }
        } catch (error) {
          console.error('❌ Periodic session check error:', error)
        }
      }
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(checkInterval)
  }, [user, isRefreshing]) // ✅ Remove unnecessary dependencies

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession,
    sessionError,
    isAuthenticated: !!user,
    isCustomer: profile?.role === 'customer',
    isInsurer: profile?.role === 'insurer',
    isInitialized // ✅ Export this for components that need it
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}