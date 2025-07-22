import { createClient } from '@supabase/supabase-js'
import { api } from './api.js'
import { localAuth } from './localStorage.js'

// Check if we should use mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

console.log('Using API:', USE_MOCK_API ? 'Mock (JSON Server)' : 'Real (Supabase)')

// Real Supabase implementation
const createRealSupabase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!USE_MOCK_API && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })
}

// Mock Supabase implementation
const createMockSupabase = () => ({
  auth: {
    signUp: async ({ email, password, options }) => {
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        ...options?.data,
        password
      }
      
      console.log('New user would be created:', newUser)
      
      return { 
        data: { user: newUser }, 
        error: null 
      }
    },

    signInWithPassword: async ({ email, password }) => {
      try {
        const { user } = await api.login(email, password)
        const rememberMe = localStorage.getItem('insurax_remember_me') !== 'false'
        
        if (rememberMe) {
          localAuth.setUser(user)
          localAuth.setToken(`mock-token-${user.id}`)
        } else {
          sessionStorage.setItem('insurax_user', JSON.stringify(user))
          sessionStorage.setItem('insurax_token', `mock-token-${user.id}`)
        }
        
        return {
          data: { user, session: { user, access_token: `mock-token-${user.id}` } },
          error: null
        }
      } catch (error) {
        return {
          data: null,
          error: { message: error.message }
        }
      }
    },

    signOut: async () => {
      localAuth.removeUser()
      localAuth.removeToken()
      sessionStorage.removeItem('insurax_user')
      sessionStorage.removeItem('insurax_token')
      return { error: null }
    },

    getUser: async () => {
      const rememberMe = localStorage.getItem('insurax_remember_me') !== 'false'
      let user = null
      
      if (!rememberMe) {
        const sessionUser = sessionStorage.getItem('insurax_user')
        if (sessionUser) {
          user = JSON.parse(sessionUser)
        }
      } else {
        user = localAuth.getUser()
      }
      
      return { data: { user }, error: null }
    },

    onAuthStateChange: (callback) => {
      const rememberMe = localStorage.getItem('insurax_remember_me') !== 'false'
      let user = null
      
      if (!rememberMe) {
        const sessionUser = sessionStorage.getItem('insurax_user')
        if (sessionUser) {
          user = JSON.parse(sessionUser)
        }
      } else {
        user = localAuth.getUser()
      }
      
      if (user) {
        callback('SIGNED_IN', { user })
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  }
})

// Create the appropriate client
export const supabase = USE_MOCK_API ? createMockSupabase() : createRealSupabase()

// Helper functions that work with both implementations
export const supabaseHelpers = {
  signUp: async (email, password, metadata) => {
    if (USE_MOCK_API) {
      return supabase.auth.signUp({ email, password, options: { data: metadata } })
    } else {
      return supabase.auth.signUp({ email, password, options: { data: metadata } })
    }
  },

  signIn: async (email, password, rememberMe = true) => {
    // Store remember preference before sign in
    localStorage.setItem('insurax_remember_me', rememberMe ? 'true' : 'false')
    
    if (USE_MOCK_API) {
      // For real Supabase, we might need to configure session persistence differently
      // But the auth state change listener will handle it
    }
    
    return supabase.auth.signInWithPassword({ email, password })
  },

  signOut: async () => {
    // Clear remember preference on sign out
    localStorage.removeItem('insurax_remember_me')
    return supabase.auth.signOut()
  },

  getUser: async () => {
    return supabase.auth.getUser()
  },

  getProfile: async (userId) => {
    if (USE_MOCK_API) {
      try {
        const user = await api.getUser(userId)
        return { data: user, error: null }
      } catch (error) {
        return { data: null, error }
      }
    } else {
      // Real Supabase implementation
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      return { data, error }
    }
  },

  updateProfile: async (userId, updates) => {
    if (USE_MOCK_API) {
      try {
        const user = await api.updateUser(userId, updates)
        return { data: user, error: null }
      } catch (error) {
        return { data: null, error }
      }
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      return { data, error }
    }
  },

  getClaims: async (filters = {}) => {
    if (USE_MOCK_API) {
      try {
        const claims = await api.getClaims(filters.customer_id)
        return { data: claims, error: null }
      } catch (error) {
        return { data: null, error }
      }
    } else {
      let query = supabase.from('claims').select('*')
      
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      return { data, error }
    }
  },

  createClaim: async (claimData) => {
    if (USE_MOCK_API) {
      try {
        const claim = await api.createClaim(claimData)
        return { data: claim, error: null }
      } catch (error) {
        return { data: null, error }
      }
    } else {
      const { data, error } = await supabase
        .from('claims')
        .insert([claimData])
        .select()
        .single()
      
      return { data, error }
    }
  },

  uploadFile: async (bucket, path, file) => {
    if (USE_MOCK_API) {
      const fakeUrl = `http://localhost:3001/uploads/${path}`
      return { data: { path: fakeUrl }, error: null }
    } else {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file)
      
      return { data, error }
    }
  },

  getFileUrl: (bucket, path) => {
    if (USE_MOCK_API) {
      return path
    } else {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      return data.publicUrl
    }
  }
}