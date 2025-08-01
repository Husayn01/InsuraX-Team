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
        .maybeSingle()
      
      if (error) {
        console.error('❌ Profile fetch error:', error)
        return { data: null, error }
      }
      
      console.log('✅ Profile fetched successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Unexpected profile fetch error:', error)
      return { data: null, error }
    }
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle()
    
    return { data, error }
  },

  // Enhanced claim helpers with better error handling and timeout
  async createClaim(claimData) {
    console.log('Creating claim in database...')
    
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claim creation timed out after 30 seconds')), 30000)
      )
      
      const createPromise = supabase
        .from('claims')
        .insert([claimData])
        .select()
        .single()
      
      // Race between the actual request and timeout
      const result = await Promise.race([createPromise, timeoutPromise])
      
      const { data, error } = result
      
      if (error) {
        console.error('Supabase error creating claim:', error)
        throw error
      }
      
      console.log('Claim created successfully:', data.id)
      return { data, error: null }
      
    } catch (error) {
      console.error('Failed to create claim:', error)
      return { data: null, error }
    }
  },

  async updateClaim(claimId, updates) {
    try {
      const { data, error } = await supabase
        .from('claims')
        .update(updates)
        .eq('id', claimId)
        .select()
        .single()
      
      if (error) {
        console.error('Claim update error:', error)
        return { data: null, error }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Unexpected claim update error:', error)
      return { data: null, error }
    }
  },

  async getClaim(claimId) {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single()
    
    return { data, error }
  },

  async getClaims(filters = {}) {
    let query = supabase.from('claims').select('*')
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    return { data: data || [], error }
  },

  async deleteClaim(claimId) {
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', claimId)
    
    return { error }
  },

  // NEW: Update claim status with optional data
  async updateClaimStatus(claimId, status, additionalData = {}) {
    const updates = {
      status,
      ...additionalData,
      updated_at: new Date().toISOString()
    }

    return this.updateClaim(claimId, updates)
  },

  // Updated transactional claim creation with better error handling
  async createClaimWithDocuments(claimData, files, userId) {
    let createdClaim = null
    let uploadedFiles = []

    try {
      console.log('Starting claim transaction...')
      
      // Ensure claim_data is properly formatted
      const formattedClaimData = {
        ...claimData,
        claim_data: claimData.claim_data || {},
        documents: claimData.documents || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Formatted claim data:', JSON.stringify(formattedClaimData, null, 2))
      
      // Step 1: Create the claim with timeout
      const { data: claim, error: claimError } = await this.createClaim(formattedClaimData)
      
      if (claimError) {
        console.error('Claim creation failed:', claimError)
        throw new Error(claimError.message || 'Failed to create claim')
      }
      
      if (!claim) {
        throw new Error('No claim data returned from database')
      }
      
      createdClaim = claim
      console.log('Claim created with ID:', createdClaim.id)

      // Step 2: Upload files if provided
      if (files && files.length > 0) {
        console.log(`Uploading ${files.length} files...`)
        
        try {
          // Import dynamically to avoid circular dependencies
          const { documentUploadService } = await import('./documentUpload')
          
          const uploadResult = await documentUploadService.uploadMultipleFiles(
            files,
            createdClaim.id,
            userId
          )

          if (uploadResult.errors.length > 0) {
            console.warn('Some files failed to upload:', uploadResult.errors)
          }

          uploadedFiles = uploadResult.uploadedFiles
          console.log(`Successfully uploaded ${uploadedFiles.length} files`)

          // Step 3: Update claim with file references if any uploaded
          if (uploadedFiles.length > 0) {
            const updateData = {
              documents: uploadedFiles.map(f => f.url),
              claim_data: {
                ...createdClaim.claim_data,
                documents: uploadedFiles
              },
              updated_at: new Date().toISOString()
            }
            
            console.log('Updating claim with documents...')
            const { error: updateError } = await this.updateClaim(createdClaim.id, updateData)

            if (updateError) {
              console.error('Failed to update claim with documents:', updateError)
              // Don't throw here - claim is created, just documents not linked
            } else {
              console.log('Claim updated with documents successfully')
            }
          }
        } catch (uploadError) {
          console.error('File upload process failed:', uploadError)
          // Don't throw - claim is created successfully
        }
      }

      return {
        success: true,
        claim: createdClaim,
        uploadedFiles
      }

    } catch (error) {
      console.error('Transaction failed:', error)

      // Rollback: Delete claim if it was created
      if (createdClaim) {
        console.log('Rolling back claim creation...')
        try {
          await this.deleteClaim(createdClaim.id)
          console.log('Claim rolled back successfully')
        } catch (rollbackError) {
          console.error('Failed to rollback claim:', rollbackError)
        }
      }

      // Rollback: Delete uploaded files
      if (uploadedFiles.length > 0) {
        console.log('Cleaning up uploaded files...')
        try {
          const { documentUploadService } = await import('./documentUpload')
          await documentUploadService.deleteMultipleFiles(
            uploadedFiles.map(f => f.filePath)
          )
          console.log('Files cleaned up successfully')
        } catch (cleanupError) {
          console.error('Failed to cleanup files:', cleanupError)
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to create claim'
      }
    }
  },

  // Get claim with all related data
  async getClaimWithRelations(claimId) {
    try {
      // Get claim
      const { data: claim, error: claimError } = await this.getClaim(claimId)
      if (claimError) throw claimError

      // Get related payments
      const { data: payments } = await this.getPayments({ claim_id: claimId })

      // Get customer profile
      const { data: customer } = await this.getProfile(claim.customer_id)

      return {
        data: {
          ...claim,
          payments: payments || [],
          customer: customer || null
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  },

  // NEW: Batch update claims
  async updateMultipleClaims(claimIds, updates) {
    try {
      const { data, error } = await supabase
        .from('claims')
        .update(updates)
        .in('id', claimIds)
        .select()

      return { data: data || [], error }
    } catch (error) {
      return { data: [], error }
    }
  },

  // NEW: Get claim statistics for dashboard
  async getClaimStatistics(filters = {}) {
    try {
      let query = supabase.from('claims').select('*')

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      if (filters.insurer_id) {
        query = query.eq('insurer_id', filters.insurer_id)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data: claims, error } = await query

      if (error) {
        return { stats: null, error }
      }

      // Calculate statistics
      const stats = {
        total: claims.length,
        submitted: claims.filter(c => c.status === 'submitted').length,
        processing: claims.filter(c => c.status === 'processing').length,
        approved: claims.filter(c => c.status === 'approved').length,
        rejected: claims.filter(c => c.status === 'rejected').length,
        totalAmount: claims.reduce((sum, c) => 
          sum + (parseFloat(c.claim_data?.estimatedAmount) || 0), 0
        ),
        averageProcessingTime: this.calculateAverageProcessingTime(claims)
      }

      return { stats, error: null }
    } catch (error) {
      return { stats: null, error }
    }
  },

  calculateAverageProcessingTime(claims) {
    const processedClaims = claims.filter(c => 
      ['approved', 'rejected'].includes(c.status) && c.updated_at
    )

    if (processedClaims.length === 0) return 0

    const totalDays = processedClaims.reduce((sum, claim) => {
      const created = new Date(claim.created_at)
      const updated = new Date(claim.updated_at)
      const days = Math.ceil((updated - created) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    return (totalDays / processedClaims.length).toFixed(1)
  },

  // NEW: Complete claim processing with payment
  async completeClaimWithPayment(claimId, paymentData) {
    try {
      // Update claim status
      const { data: claim, error: claimError } = await this.updateClaimStatus(
        claimId, 
        'approved',
        { 
          claim_data: { 
            ...paymentData,
            approvedAt: new Date().toISOString() 
          } 
        }
      )

      if (claimError) throw claimError

      // Create payment record
      const { data: payment, error: paymentError } = await this.createPayment({
        ...paymentData,
        claim_id: claimId,
        customer_id: claim.customer_id,
        status: 'completed'
      })

      if (paymentError) throw paymentError

      return { claim, payment, error: null }
    } catch (error) {
      return { claim: null, payment: null, error }
    }
  },

  // NEW: Create claim-specific notification
  async createClaimNotification(userId, claimId, type, title, message, data = {}) {
    try {
      const notificationData = {
        user_id: userId,
        type,
        title,
        message,
        data: {
          claimId,
          ...data
        },
        read: false,
        created_at: new Date().toISOString()
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single()

      return notification
    } catch (error) {
      console.error('Notification creation error:', error)
      return null
    }
  },

  // NEW: Create audit log entry
  async createAuditLog(logData) {
    try {
      // For now, store in claim_data as audit_trail
      // In production, create a separate audit_logs table
      const { data: claim } = await supabase
        .from('claims')
        .select('claim_data')
        .eq('id', logData.claim_id)
        .single()

      if (!claim) return

      const auditTrail = claim.claim_data.audit_trail || []
      auditTrail.push({
        ...logData,
        timestamp: new Date().toISOString()
      })

      await supabase
        .from('claims')
        .update({
          claim_data: {
            ...claim.claim_data,
            audit_trail: auditTrail
          }
        })
        .eq('id', logData.claim_id)

    } catch (error) {
      console.error('Audit log error:', error)
    }
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