import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Using mock API instead.')
}

// Create Supabase client with dynamic session persistence
const createSupabaseClient = () => {
  const rememberMe = localStorage.getItem('insurax_remember_me') !== 'false'
  
  return createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      persistSession: rememberMe,
      autoRefreshToken: rememberMe,
      storageKey: 'insurax-auth',
      storage: rememberMe ? window.localStorage : window.sessionStorage,
    }
  })
}

export const supabase = createSupabaseClient()

// Helper functions specifically for real Supabase
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  async signIn(email, password, rememberMe = true) {
    // Store remember preference
    localStorage.setItem('insurax_remember_me', rememberMe ? 'true' : 'false')
    
    // For real Supabase, we need to update the client configuration
    if (!rememberMe) {
      // Configure session to not persist
      await supabase.auth.updateUser({
        data: { session_persistence: 'session' }
      })
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    // Clear remember preference on sign out
    localStorage.removeItem('insurax_remember_me')
    return { error }
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  // Profile helpers
  async getProfile(userId) {
    console.log('🔍 supabaseReal: Getting profile for user:', userId)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('📊 Profile query result:', {
        hasError: !!error, 
        hasData: !!data, 
        data: data,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint
      })
      
      // If we get a PGRST116 error, it means no rows returned
      if (error && error.code === 'PGRST116') {
        console.log('⚠️ No profile found for user')
      }
      
      return { data, error }
    } catch (err) {
      console.error('❌ Unexpected error in getProfile:', err)
      return { data: null, error: err }
    }
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Claims helpers
  async createClaim(claimData) {
    const { data, error } = await supabase
      .from('claims')
      .insert([claimData])
      .select()
      .single()
    return { data, error }
  },

  async getClaims(filters = {}) {
    let query = supabase.from('claims').select('*')
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    if (filters.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  },

  async updateClaim(claimId, updates) {
    const { data, error } = await supabase
      .from('claims')
      .update(updates)
      .eq('id', claimId)
      .select()
      .single()
    return { data, error }
  },

  // Payments helpers
  async createPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()
    return { data, error }
  },

  async getPayments(claimId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // File upload helpers
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    return { data, error }
  },

  async getFileUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }
}

export default supabase