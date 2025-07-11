import { api } from './api'
import { localAuth } from './localStorage'

// Mock Supabase client that uses JSON Server
export const supabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      // For demo, just return success
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        ...options?.data,
        password // In real app, never store plain password!
      }
      
      // Add to db.json manually for persistence
      console.log('New user would be created:', newUser)
      
      return { 
        data: { user: newUser }, 
        error: null 
      }
    },

    signInWithPassword: async ({ email, password }) => {
      try {
        const { user } = await api.login(email, password)
        localAuth.setUser(user)
        localAuth.setToken(`mock-token-${user.id}`)
        
        return {
          data: { user, session: { user } },
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
      return { error: null }
    },

    getUser: async () => {
      const user = localAuth.getUser()
      return { data: { user }, error: null }
    },

    onAuthStateChange: (callback) => {
      // Check for user on load
      const user = localAuth.getUser()
      if (user) {
        callback('SIGNED_IN', { user })
      }

      // Return mock subscription
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  }
}

// Mock helpers to match your existing code
export const supabaseHelpers = {
  signUp: async (email, password, metadata) => {
    return supabase.auth.signUp({ email, password, options: { data: metadata } })
  },

  signIn: async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  },

  signOut: async () => {
    return supabase.auth.signOut()
  },

  getUser: async () => {
    return supabase.auth.getUser()
  },

  getProfile: async (userId) => {
    try {
      const user = await api.getUser(userId)
      return { data: user, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  updateProfile: async (userId, updates) => {
    try {
      const user = await api.updateUser(userId, updates)
      return { data: user, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  getClaims: async (filters) => {
    try {
      const claims = await api.getClaims(filters.customer_id)
      return { data: claims, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  createClaim: async (claimData) => {
    try {
      const claim = await api.createClaim(claimData)
      return { data: claim, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Mock file upload - just return a fake URL
  uploadFile: async (bucket, path, file) => {
    const fakeUrl = `http://localhost:3001/uploads/${path}`
    return { data: { path: fakeUrl }, error: null }
  },

  getFileUrl: (bucket, path) => {
    return path // Already a full URL in mock
  }
}