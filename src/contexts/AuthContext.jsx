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

  useEffect(() => {
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
              
            case 'SIGNED_OUT':
              setUser(null)
              setProfile(null)
              navigate('/login')
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
  }, [navigate])

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
      const { error } = await supabaseHelpers.signOut()
      
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      navigate('/login')
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      setSessionError(error.message)
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
      
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
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
            console.log('⚠️ Session invalid or expired, attempting refresh...')
            await refreshSession()
          } else {
            console.log('✅ Session still valid')
          }
        } catch (error) {
          console.error('❌ Visibility change session check error:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, isRefreshing])

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
  }, [user, isRefreshing])

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
    isInsurer: profile?.role === 'insurer'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}