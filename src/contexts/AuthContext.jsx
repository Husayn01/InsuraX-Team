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
        const { user } = await supabaseHelpers.getUser()
        console.log('🔄 AuthContext: Current user:', user)
        if (user) {
          setUser(user)
          await loadProfile(user.id)
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
            
            console.log('📝 Creating profile with data:', profileData)
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([profileData])
              .select()
              .single()
            
            if (createError) {
              console.error('❌ Error creating profile:', createError)
            } else {
              console.log('✅ Profile created successfully:', newProfile)
              setProfile(newProfile)
            }
          }
        }
      } else {
        console.log('✅ Profile loaded successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('❌ Unexpected error loading profile:', error)
    }
  }

  const signUp = async (email, password, userData) => {
    console.log('📝 AuthContext: Signing up user:', email)
    try {
      const { data, error } = await supabaseHelpers.signUp(email, password, {
        role: userData.role,
        full_name: userData.fullName,
        company_name: userData.companyName
      })
      
      if (error) throw error

      // Create profile
      if (data.user) {
        console.log('👤 Creating profile for new user...')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            role: userData.role,
            full_name: userData.fullName,
            company_name: userData.companyName,
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

  const signIn = async (email, password) => {
    console.log('🔐 AuthContext: Signing in user:', email)
    try {
      const { data, error } = await supabaseHelpers.signIn(email, password)
      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }
      
      console.log('✅ Sign in successful, user:', data.user?.id)
      
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