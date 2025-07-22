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
  const navigate = useNavigate()

  useEffect(() => {
    // Check active sessions and sets the user
    const initAuth = async () => {
      console.log('🔄 AuthContext: Initializing auth...')
      try {
        const rememberMe = localStorage.getItem('insurax_remember_me') !== 'false'
        
        if (!rememberMe) {
          // Check sessionStorage for non-remembered sessions
          const sessionUser = sessionStorage.getItem('insurax_user')
          if (sessionUser) {
            const parsedUser = JSON.parse(sessionUser)
            console.log('🔄 AuthContext: Found session user:', parsedUser.id)
            setUser(parsedUser)
            await loadProfile(parsedUser.id)
            return
          }
        }
        
        // Check persistent storage
        const { data } = await supabaseHelpers.getUser()
        const authUser = data?.user
        console.log('🔄 AuthContext: Current user:', authUser)
        if (authUser) {
          setUser(authUser)
          await loadProfile(authUser.id)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
      } finally {
        setLoading(false)
        console.log('✅ AuthContext: Initial loading complete')
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 AuthContext: Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ AuthContext: User signed in')
        setUser(session.user)
        await loadProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 AuthContext: User signed out')
        setUser(null)
        setProfile(null)
        // Clear both storages on sign out
        sessionStorage.removeItem('insurax_user')
        sessionStorage.removeItem('insurax_token')
        navigate('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const loadProfile = async (userId) => {
    console.log('📋 AuthContext: Loading profile for user:', userId)
    try {
      const { data, error } = await supabaseHelpers.getProfile(userId)
      
      if (error) {
        console.error('❌ Error loading profile:', error)
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') { // Profile not found
          console.log('⚠️ Profile not found, creating default profile...')
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            const email = userData.user.email
            // Determine role based on email for demo accounts
            const role = email?.includes('insurer') ? 'insurer' : 'customer'
            const profileData = {
              id: userId,
              role: role,
              email: email,
              full_name: role === 'customer' ? 'Demo Customer' : null,
              company_name: role === 'insurer' ? 'Demo Insurance Co.' : null
            }
            setProfile(profileData)
            console.log('✅ Created default profile:', profileData)
          }
        }
        return
      }
      
      setProfile(data)
      console.log('✅ Profile loaded:', data?.role)
    } catch (error) {
      console.error('❌ Error in loadProfile:', error)
    }
  }

  const signUp = async (email, password, metadata) => {
    console.log('📝 AuthContext: Signing up new user')
    try {
      const { data, error } = await supabaseHelpers.signUp(email, password, metadata)
      
      if (error) {
        console.error('❌ Signup error:', error)
        throw error
      }
      
      console.log('✅ Signup successful')
      
      // If using real Supabase and profile creation is needed
      if (data?.user && import.meta.env.VITE_USE_MOCK_API !== 'true') {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            role: metadata.role,
            full_name: metadata.fullName,
            company_name: metadata.companyName,
            email: email
          }])
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError)
          throw profileError
        }
        console.log('✅ Profile created successfully')
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  const signIn = async (email, password, rememberMe = true) => {
    console.log('🔐 AuthContext: Signing in user:', email, 'Remember:', rememberMe)
    try {
      // Store remember preference
      localStorage.setItem('insurax_remember_me', rememberMe ? 'true' : 'false')
      
      const { data, error } = await supabaseHelpers.signIn(email, password, rememberMe)
      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }
      
      console.log('✅ Sign in successful, user:', data.user?.id)
      
      // Store in session storage if not remembering
      if (!rememberMe && data.user) {
        sessionStorage.setItem('insurax_user', JSON.stringify(data.user))
        if (data.session?.access_token) {
          sessionStorage.setItem('insurax_token', data.session.access_token)
        }
      }
      
      // Navigate based on role
      if (data.user) {
        console.log('🔍 Fetching profile for navigation...')
        const { data: profileData, error: profileError } = await supabaseHelpers.getProfile(data.user.id)
        
        if (profileError) {
          console.error('❌ Error fetching profile for navigation:', profileError)
        } else {
          console.log('📍 Profile role:', profileData?.role)
          if (profileData?.role === 'customer') {
            console.log('➡️ Navigating to customer dashboard')
            navigate('/customer/dashboard')
          } else if (profileData?.role === 'insurer') {
            console.log('➡️ Navigating to insurer dashboard')
            navigate('/insurer/dashboard')
          } else {
            console.warn('⚠️ Unknown role:', profileData?.role)
          }
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ SignIn error in AuthContext:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    console.log('👋 AuthContext: Signing out...')
    try {
      const { error } = await supabaseHelpers.signOut()
      if (error) throw error
      
      // Clear all storage
      sessionStorage.removeItem('insurax_user')
      sessionStorage.removeItem('insurax_token')
      localStorage.removeItem('insurax_remember_me')
      
      console.log('✅ Sign out successful')
      return { success: true }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (updates) => {
    console.log('📝 AuthContext: Updating profile...')
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

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isCustomer: profile?.role === 'customer',
    isInsurer: profile?.role === 'insurer'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}