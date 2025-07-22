import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

console.log('🔌 Supabase Connected:', supabaseUrl)

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'insurax-auth-token'
  }
})

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email, password, metadata = {}) {
    console.log('📝 SignUp called with:', email, metadata)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    console.log('SignUp result:', { success: !error, userId: data?.user?.id })
    return { data, error }
  },

  async signIn(email, password) {
    console.log('🔐 SignIn called with:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    console.log('SignIn result:', { 
      success: !error, 
      userId: data?.user?.id,
      session: !!data?.session 
    })
    return { data, error }
  },

  async signOut() {
    console.log('👋 Signing out...')
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  // Profile helpers
  async getProfile(userId) {
    console.log('👤 Getting profile for user:', userId)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ No profile found for user')
      return { data: null, error: null } // Return null instead of error for missing profile
    }
    
    return { data, error }
  },

  async createProfile(profileData) {
    console.log('✨ Creating profile:', profileData)
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    
    return { data, error }
  },

  async updateProfile(userId, updates) {
    console.log('📝 Updating profile:', userId, updates)
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Claims helpers
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
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    return { data: data || [], error }
  },

  async getClaim(claimId) {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single()
    
    return { data, error }
  },

  async createClaim(claimData) {
    const { data, error } = await supabase
      .from('claims')
      .insert([claimData])
      .select()
      .single()
    
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
  async getPayments(filters = {}) {
    let query = supabase.from('payments').select('*')
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    
    if (filters.claim_id) {
      query = query.eq('claim_id', filters.claim_id)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    return { data: data || [], error }
  },

  async createPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()
    
    return { data, error }
  },

  // File storage helpers
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: false,
        cacheControl: '3600'
      })
    
    return { data, error }
  },

  async getFileUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  async deleteFile(bucket, paths) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    
    return { data, error }
  },

  // Customer helpers for insurers
  async getCustomers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  // Notification helpers
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  async markNotificationRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    return { data, error }
  }
}

// Export default for backward compatibility
export default supabase