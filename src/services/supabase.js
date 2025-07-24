import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

// Create Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'insurax-auth-token',
    // Refresh session 60 seconds before expiry
    expiry_margin: 60
  }
})

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email, password, metadata = {}) {
    console.log('🚀 Starting signup process:', email)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (error) {
        console.error('❌ Signup error:', error)
        return { data: null, error }
      }
      
      console.log('✅ Signup successful, user created:', data.user?.id)
      
      // Profile will be created by database trigger
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected signup error:', error)
      return { data: null, error }
    }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Profile helpers
  async getProfile(userId) {
    console.log('📋 Fetching profile for user:', userId)
    
    if (!userId) {
      console.error('❌ No userId provided to getProfile')
      return { data: null, error: new Error('User ID is required') }
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('❌ Profile fetch error:', error)
        
        // If profile doesn't exist, return null data instead of error
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Profile not found for user:', userId)
          return { data: null, error: null }
        }
        
        return { data: null, error }
      }
      
      console.log('✅ Profile fetched successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error)
      return { data: null, error }
    }
  },

  async createProfile(profileData) {
    console.log('✨ Creating profile:', profileData)
    
    if (!profileData.id) {
      console.error('❌ No user ID provided for profile creation')
      return { data: null, error: new Error('User ID is required') }
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Profile creation error:', error)
        return { data: null, error }
      }
      
      console.log('✅ Profile created successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected error creating profile:', error)
      return { data: null, error }
    }
  },

  async updateProfile(userId, updates) {
    console.log('📝 Updating profile:', userId, updates)
    
    if (!userId) {
      console.error('❌ No userId provided to updateProfile')
      return { data: null, error: new Error('User ID is required') }
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Profile update error:', error)
        return { data: null, error }
      }
      
      console.log('✅ Profile updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected error updating profile:', error)
      return { data: null, error }
    }
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

  // Notification helpers
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  async createNotification(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()
    
    return { data, error }
  },

  async markNotificationRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()
    
    return { data, error }
  },

  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    
    return { error }
  },

  // Helper function to create claim notifications
  async createClaimNotification(userId, claimId, type, title, message, additionalData = {}) {
    return await this.createNotification({
      user_id: userId,
      type: type || 'claim_update',
      title,
      message,
      data: { 
        claimId, 
        ...additionalData 
      },
      read: false
    })
  },

  // File storage helpers
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    return { data, error }
  },

  async deleteFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    return { data, error }
  },

  async getFileUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  // Real-time subscription helpers
  subscribeToClaimsChannel(callback, filters = {}) {
    const channel = supabase.channel('claims-channel')
    
    let subscription = channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'claims',
        ...filters
      },
      callback
    )
    
    return subscription.subscribe()
  },

  subscribeToNotificationsChannel(userId, callback) {
    const channel = supabase.channel('notifications-channel')
    
    let subscription = channel.on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    
    return subscription.subscribe()
  }
}

export default supabase