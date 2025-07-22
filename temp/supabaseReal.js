import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.supabase = supabase
}

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email, password, metadata = {}) {
    console.log('SignUp called with:', email, metadata)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    console.log('SignUp result:', { data, error })
    return { data, error }
  },

  async signIn(email, password) {
    console.log('SignIn called with:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    console.log('SignIn result:', { 
      success: !error, 
      userId: data?.user?.id,
      session: !!data?.session,
      error: error?.message 
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Profile helpers
  async getProfile(userId) {
    console.log('Getting profile for user:', userId)
    
    try {
      // First, let's check if the profiles table is accessible
      console.log('📊 Checking if profiles table is accessible...')
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('❌ Error accessing profiles table:', countError)
        console.error('Details:', { 
          message: countError.message, 
          details: countError.details,
          hint: countError.hint,
          code: countError.code 
        })
      } else {
        console.log('✅ Profiles table accessible, total profiles:', count)
      }
      
      // Now get the specific profile
      console.log('🔍 Querying specific profile...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('Profile query completed')
      console.log('Profile query result:', { 
        found: !!data, 
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