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
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      console.log('🔄 AuthContext: Initializing auth...')
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('✅ Found existing session:', session.user.id)
          setSession(session)
          setUser(session.user)
          await loadProfile(session.user.id)
        } else {
          console.log('ℹ️ No existing session found')
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
      } finally {
        setLoading(false)
        console.log('✅ AuthContext: Initial loading complete')
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in')
        setSession(session)
        setUser(session.user)
        await loadProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        setSession(null)
        setUser(null)
        setProfile(null)
        navigate('/login')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refreshed')
        setSession(session)
      } else if (event === 'USER_UPDATED' && session) {
        console.log('👤 User updated')
        setUser(session.user)
        await loadProfile(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  const loadProfile = async (userId) => {
    console.log('📋 Loading profile for user:', userId)
    try {
      const { data, error } = await supabaseHelpers.getProfile(userId)
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading profile:', error)
        return
      }
      
      if (!data) {
        console.log('⚠️ No profile found, creating default profile...')
        
        // Get user email from session
        const { data: { user } } = await supabase.auth.getUser()
        const email = user?.email || ''
        
        // Determine role based on email for demo accounts
        let role = 'customer'
        let fullName = null
        let companyName = null
        
        if (email === 'customer@demo.com') {
          role = 'customer'
          fullName = 'Demo Customer'
        } else if (email === 'insurer@demo.com') {
          role = 'insurer'
          companyName = 'Demo Insurance Co.'
        } else if (email.includes('insurer')) {
          role = 'insurer'
          companyName = 'Insurance Company'
        }
        
        // Create profile
        const profileData = {
          id: userId,
          role,
          email,
          full_name: fullName,
          company_name: companyName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: newProfile, error: createError } = await supabaseHelpers.createProfile(profileData)
        
        if (createError) {
          console.error('❌ Error creating profile:', createError)
          // Set a basic profile even if creation fails
          setProfile(profileData)
        } else {
          console.log('✅ Profile created successfully')
          setProfile(newProfile)
        }
      } else {
        setProfile(data)
        console.log('✅ Profile loaded:', data.role)
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadProfile:', error)
    }
  }

  const signUp = async (email, password, metadata) => {
    console.log('📝 Signing up new user:', email)
    try {
      const { data, error } = await supabaseHelpers.signUp(email, password, metadata)
      
      if (error) {
        console.error('❌ Signup error:', error)
        throw error
      }
      
      console.log('✅ Signup successful')
      
      // If email confirmation is disabled, create profile immediately
      if (data?.user && data?.session) {
        const profileData = {
          id: data.user.id,
          role: metadata.role,
          email: email,
          full_name: metadata.fullName || null,
          company_name: metadata.companyName || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { error: profileError } = await supabaseHelpers.createProfile(profileData)
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError)
        } else {
          console.log('✅ Profile created successfully')
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  const signIn = async (email, password) => {
    console.log('🔐 Signing in user:', email)
    try {
      const { data, error } = await supabaseHelpers.signIn(email, password)
      
      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }
      
      console.log('✅ Sign in successful, user:', data.user?.id)
      
      // Immediately set the user to trigger UI updates
      setUser(data.user)
      
      // Load profile
      if (data.user) {
        console.log('🔍 Loading profile for navigation...')
        
        // Load the profile
        await loadProfile(data.user.id)
        
        // Determine navigation based on email if profile is not ready
        let targetRoute = '/customer/dashboard'
        
        // Try to get profile data
        const { data: profileData } = await supabaseHelpers.getProfile(data.user.id)
        
        if (profileData?.role) {
          targetRoute = profileData.role === 'insurer' 
            ? '/insurer/dashboard' 
            : '/customer/dashboard'
        } else {
          // Fallback: determine based on email
          const email = data.user.email || ''
          if (email.includes('insurer') || email === 'insurer@demo.com') {
            targetRoute = '/insurer/dashboard'
          }
        }
        
        console.log('➡️ Navigating to:', targetRoute)
        navigate(targetRoute)
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('❌ SignIn error:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    console.log('👋 Signing out...')
    try {
      const { error } = await supabaseHelpers.signOut()
      if (error) throw error
      
      console.log('✅ Sign out successful')
      return { success: true }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (updates) => {
    console.log('📝 Updating profile...')
    try {
      const { data, error } = await supabaseHelpers.updateProfile(user.id, updates)
      if (error) throw error
      
      setProfile(data)
      console.log('✅ Profile updated successfully')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Update profile error:', error)
      return { success: false, error: error.message }
    }
  }

  const refreshSession = async () => {
    console.log('🔄 Refreshing session...')
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      if (data.session) {
        setSession(data.session)
        console.log('✅ Session refreshed')
      }
      return { success: true, data }
    } catch (error) {
      console.error('❌ Session refresh error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshSession,
    isAuthenticated: !!user,
    isCustomer: profile?.role === 'customer',
    isInsurer: profile?.role === 'insurer'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}