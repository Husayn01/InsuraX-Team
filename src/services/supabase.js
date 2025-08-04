import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add these constants and methods to supabase.js

// Define valid status transitions
const CLAIM_STATUS_TRANSITIONS = {
  submitted: ['processing', 'rejected', 'approved'],
  processing: ['under_review', 'approved', 'rejected', 'additional_info_required'],
  under_review: ['approved', 'rejected', 'additional_info_required'],
  additional_info_required: ['processing', 'rejected'],
  approved: ['settled'],
  rejected: ['disputed', 'closed'],
  disputed: ['processing', 'closed'],
  settled: ['closed'],
  closed: [] // Terminal state
}

// Status metadata for better UX
const CLAIM_STATUS_META = {
  submitted: { label: 'Submitted', color: 'blue', icon: 'clock' },
  processing: { label: 'Processing', color: 'cyan', icon: 'activity' },
  under_review: { label: 'Under Review', color: 'purple', icon: 'eye' },
  additional_info_required: { label: 'Info Required', color: 'amber', icon: 'alert-circle' },
  approved: { label: 'Approved', color: 'emerald', icon: 'check-circle' },
  rejected: { label: 'Rejected', color: 'red', icon: 'x-circle' },
  disputed: { label: 'Disputed', color: 'orange', icon: 'alert-triangle' },
  settled: { label: 'Settled', color: 'green', icon: 'dollar-sign' },
  closed: { label: 'Closed', color: 'gray', icon: 'archive' }
}

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
  // Enhanced claim helpers with better error handling (no timeout)
  async createClaim(claimData) {
      console.log('Creating claim in database...')
      
      try {
        // Remove the timeout wrapper - let Supabase handle its own timeouts
        const { data, error } = await supabase
          .from('claims')
          .insert([claimData])
          .select()
          .single()
        
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

  // Simplified claim creation with proper error handling
    async createClaimWithDocuments(claimData, files, userId) {
      let createdClaim = null
      let uploadedFiles = []
      const uploadErrors = []

      try {
        console.log('Starting claim submission...')
        
        // Step 1: Format and create the claim first
        const formattedClaimData = {
          ...claimData,
          claim_data: claimData.claim_data || {},
          documents: [], // Start with empty documents array
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Create claim with proper timeout handling
        const { data: claim, error: claimError } = await this.createClaim(formattedClaimData)
        
        if (claimError || !claim) {
          throw new Error(claimError?.message || 'Failed to create claim')
        }
        
        createdClaim = claim
        console.log('Claim created successfully:', createdClaim.id)

        // Step 2: Upload documents if provided (non-blocking for failed uploads)
        if (files && files.length > 0) {
          console.log(`Uploading ${files.length} documents...`)
          
          try {
            const { documentUploadService } = await import('./documentUpload')
            
            // Upload with progress tracking
            const uploadResult = await documentUploadService.uploadMultipleFiles(
              files,
              createdClaim.id,
              userId,
              (progress) => {
                console.log(`Upload progress: ${progress.current}/${progress.total}`)
              }
            )

            uploadedFiles = uploadResult.uploadedFiles
            
            // Track any upload errors
            if (uploadResult.errors.length > 0) {
              uploadErrors.push(...uploadResult.errors)
              console.warn('Some files failed to upload:', uploadResult.errors)
            }

            // Step 3: Update claim with successfully uploaded files
            if (uploadedFiles.length > 0) {
              const updateData = {
                documents: uploadedFiles.map(f => f.url),
                claim_data: {
                  ...createdClaim.claim_data,
                  uploadedDocuments: uploadedFiles.map(f => ({
                    fileName: f.fileName,
                    fileType: f.fileType,
                    fileSize: f.fileSize,
                    url: f.url,
                    uploadedAt: f.uploadedAt
                  }))
                }
              }
              
              const { error: updateError } = await this.updateClaim(createdClaim.id, updateData)
              
              if (updateError) {
                console.error('Failed to link documents to claim:', updateError)
                // Don't fail - claim exists, just documents not linked
              }
            }
          } catch (uploadError) {
            console.error('Document upload process error:', uploadError)
            // Continue - claim was created successfully
            uploadErrors.push({
              fileName: 'All files',
              error: uploadError.message
            })
          }
        }

        // Return success with any warnings
        return {
          success: true,
          claim: createdClaim,
          uploadedFiles,
          uploadErrors,
          warning: uploadErrors.length > 0 
            ? `Claim created but ${uploadErrors.length} file(s) failed to upload` 
            : null
        }

      } catch (error) {
        console.error('Claim submission failed:', error)

        // Clean up if claim was created
        if (createdClaim) {
          try {
            await this.deleteClaim(createdClaim.id)
            console.log('Claim rolled back')
          } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError)
          }
        }

        // Clean up any uploaded files
        if (uploadedFiles.length > 0) {
          try {
            const { documentUploadService } = await import('./documentUpload')
            await documentUploadService.deleteMultipleFiles(
              uploadedFiles.map(f => f.filePath)
            )
          } catch (cleanupError) {
            console.error('File cleanup failed:', cleanupError)
          }
        }

        throw error
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
  },

  // Add this enhanced updateClaimStatus method to supabaseHelpers
  async updateClaimStatus(claimId, newStatus, additionalData = {}) {
    try {
      // Validate the new status
      if (!CLAIM_STATUS_META[newStatus]) {
        throw new Error(`Invalid status: ${newStatus}`)
      }

      // Get current claim to check current status
      const { data: currentClaim, error: fetchError } = await this.getClaim(claimId)
      
      if (fetchError || !currentClaim) {
        throw new Error('Claim not found')
      }

      const currentStatus = currentClaim.status
      const validTransitions = CLAIM_STATUS_TRANSITIONS[currentStatus] || []

      // Check if transition is valid
      if (!validTransitions.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
          `Valid transitions: ${validTransitions.join(', ') || 'none'}`
        )
      }

      // Create audit trail entry
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'status_change',
        from_status: currentStatus,
        to_status: newStatus,
        user_id: additionalData.updated_by || null,
        details: additionalData.audit_details || {}
      }

      // Prepare update data
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalData,
        claim_data: {
          ...currentClaim.claim_data,
          ...(additionalData.claim_data || {}),
          audit_trail: [
            ...(currentClaim.claim_data?.audit_trail || []),
            auditEntry
          ]
        }
      }

      // Remove fields that shouldn't be in the update
      delete updateData.updated_by
      delete updateData.audit_details

      // Perform the update
      const { data: updatedClaim, error: updateError } = await this.updateClaim(
        claimId, 
        updateData
      )

      if (updateError) {
        throw updateError
      }

      // Create notification for status change
      if (currentClaim.customer_id) {
        const statusMeta = CLAIM_STATUS_META[newStatus]
        await this.createNotification({
          user_id: currentClaim.customer_id,
          type: 'claim_update',
          title: `Claim ${statusMeta.label}`,
          message: this.getStatusChangeMessage(newStatus, currentClaim.claim_data?.claimNumber),
          color: statusMeta.color,
          icon: statusMeta.icon,
          data: {
            claimId: claimId,
            previousStatus: currentStatus,
            newStatus: newStatus
          }
        })
      }

      return { data: updatedClaim, error: null }
    } catch (error) {
      console.error('Status update error:', error)
      return { data: null, error }
    }
  },

  // Helper method to generate status change messages
  getStatusChangeMessage(status, claimNumber) {
    const messages = {
      processing: `Your claim ${claimNumber} is now being processed by our team.`,
      under_review: `Your claim ${claimNumber} is under detailed review.`,
      additional_info_required: `We need additional information to process claim ${claimNumber}.`,
      approved: `Great news! Your claim ${claimNumber} has been approved.`,
      rejected: `Your claim ${claimNumber} has been reviewed. Please check the details for more information.`,
      disputed: `Your dispute for claim ${claimNumber} has been received and will be reviewed.`,
      settled: `Your claim ${claimNumber} has been settled and payment processed.`,
      closed: `Claim ${claimNumber} has been closed.`
    }
    return messages[status] || `Claim ${claimNumber} status updated to ${status}.`
  },

  // Export the constants for use in other components
  getStatusTransitions() {
    return CLAIM_STATUS_TRANSITIONS
  },

  getStatusMeta() {
    return CLAIM_STATUS_META
  },

  // NeuroClaim helpers
  async createNeuroClaimSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('neuroclaim_sessions')
        .insert([sessionData])
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating NeuroClaim session:', error)
      return { data: null, error }
    }
  },

  async getNeuroClaimSessions(userId, filters = {}) {
    try {
      let query = supabase
        .from('neuroclaim_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching NeuroClaim sessions:', error)
      return { data: [], error }
    }
  },

  async getNeuroClaimSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('neuroclaim_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching NeuroClaim session:', error)
      return { data: null, error }
    }
  },

  async getNeuroClaimAnalytics(userId) {
    try {
      const { data, error } = await supabase
        .from('neuroclaim_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
      
      if (error) throw error
      
      // Calculate analytics
      const analytics = {
        totalProcessed: data.length,
        totalClaimAmount: data.reduce((sum, session) => 
          sum + (session.claim_data?.estimatedAmount || 0), 0
        ),
        averageProcessingTime: data.length > 0 
          ? data.reduce((sum, session) => sum + session.processing_time_ms, 0) / data.length 
          : 0,
        riskDistribution: {
          high: data.filter(s => s.fraud_assessment?.riskLevel === 'high').length,
          medium: data.filter(s => s.fraud_assessment?.riskLevel === 'medium').length,
          low: data.filter(s => s.fraud_assessment?.riskLevel === 'low').length
        },
        claimTypeDistribution: data.reduce((acc, session) => {
          const type = session.claim_data?.claimType || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
        dailyTrend: this.calculateDailyTrend(data)
      }
      
      return { data: analytics, error: null }
    } catch (error) {
      console.error('Error calculating NeuroClaim analytics:', error)
      return { data: null, error }
    }
  },

  // Helper function for daily trend calculation
  calculateDailyTrend(sessions) {
    const trend = sessions.reduce((acc, session) => {
      const date = new Date(session.created_at).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { count: 0, totalAmount: 0 }
      }
      acc[date].count++
      acc[date].totalAmount += session.claim_data?.estimatedAmount || 0
      return acc
    }, {})
    
    return Object.entries(trend)
      .map(([date, data]) => ({
        date,
        count: data.count,
        totalAmount: data.totalAmount
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7) // Last 7 days
  }
}

export default supabase