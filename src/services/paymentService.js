// services/paymentService.js
import { supabase, supabaseHelpers } from './supabase'

/**
 * Generate a unique transaction reference
 * @returns {string} Unique transaction reference
 */
const generateTransactionRef = () => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase()
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `PAY-${dateStr}-${randomStr}-${timestamp.toString(36).toUpperCase()}`
}

export const paymentService = {
  /**
   * Initialize a payment transaction with Paystack
   * @param {Object} paymentData - Payment details
   * @returns {Object} Payment initialization response
   */
  async initializePayment(paymentData) {
    try {
      // Call Supabase Edge Function to initialize payment
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          amount: paymentData.amount,
          email: paymentData.email,
          metadata: {
            customer_id: paymentData.customer_id,
            claim_id: paymentData.claim_id || null,
            payment_type: paymentData.payment_type || 'premium',
            description: paymentData.description
          },
          callback_url: `${window.location.origin}/payment/callback`,
          channels: this.getPaymentChannels(paymentData.payment_method)
        }
      })

      if (error) {
        console.error('Payment initialization error:', error)
        throw new Error(error.message || 'Failed to initialize payment')
      }

      // Create payment record in database with improved reference
      const paymentRecord = await supabaseHelpers.createPayment({
        customer_id: paymentData.customer_id,
        claim_id: paymentData.claim_id,
        amount: paymentData.amount,
        status: 'pending',
        payment_method: paymentData.payment_method,
        description: paymentData.description,
        gateway_reference: data.reference,
        gateway_type: 'paystack',
        authorization_url: data.authorization_url,
        access_code: data.access_code,
        transaction_ref: generateTransactionRef()
      })

      if (paymentRecord.error) {
        console.error('Failed to create payment record:', paymentRecord.error)
        // Don't throw here - payment is already initialized with Paystack
        // Just log the error and continue
      }

      return {
        success: true,
        data: {
          ...data,
          payment_id: paymentRecord.data?.id
        }
      }
    } catch (error) {
      console.error('Payment service error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Verify payment status with Paystack
   * @param {string} reference - Payment reference
   * @returns {Object} Verification response
   */
  async verifyPayment(reference) {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { reference }
      })

      if (error) {
        throw new Error(error.message || 'Payment verification failed')
      }

      console.log('=== VERIFY PAYMENT RAW RESPONSE ===')
      console.log('Full response:', JSON.stringify(data, null, 2))
      console.log('Response type:', typeof data)
      console.log('Response keys:', Object.keys(data || {}))

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Handle payment callback from Paystack with improved error handling
   * @param {string} reference - Payment reference from URL
   * @returns {Object} Payment status
   */
  async handlePaymentCallback(reference) {
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 1000 // 1 second

    const attemptVerification = async () => {
      try {
        // Verify the payment
        const verificationResult = await this.verifyPayment(reference)

        if (!verificationResult.success) {
          throw new Error(verificationResult.error)
        }

        const paymentData = verificationResult.data

        console.log('=== PAYMENT CALLBACK DEBUG ===')
        console.log('Payment data received:', paymentData)
        console.log('Payment data type:', typeof paymentData)
        console.log('Payment data keys:', Object.keys(paymentData || {}))
        console.log('Status field:', paymentData.status)
        console.log('Status type:', typeof paymentData.status)
        console.log('PaymentStatus field:', paymentData.paymentStatus)
        console.log('Message field:', paymentData.message)

        // Handle different possible response structures
        let isPaymentSuccessful = false
        let statusMessage = ''

        // Check multiple possible status fields
        if (typeof paymentData.status === 'boolean') {
          // New structure: status is boolean
          isPaymentSuccessful = paymentData.status === true
          statusMessage = paymentData.message || ''
        } else if (typeof paymentData.status === 'string') {
          // Old structure: status is string
          isPaymentSuccessful = paymentData.status.toLowerCase() === 'success' || 
                               paymentData.status.toLowerCase() === 'successful'
          statusMessage = paymentData.message || paymentData.status
        } else if (paymentData.paymentStatus) {
          // Alternative: check paymentStatus field
          isPaymentSuccessful = paymentData.paymentStatus.toLowerCase() === 'success' || 
                               paymentData.paymentStatus.toLowerCase() === 'successful'
          statusMessage = paymentData.message || paymentData.paymentStatus
        } else if (paymentData.message && paymentData.message.toLowerCase().includes('success')) {
          // Fallback: check if message contains success
          isPaymentSuccessful = true
          statusMessage = paymentData.message
        }

        console.log('=== PAYMENT STATUS DETERMINATION ===')
        console.log('Is payment successful?', isPaymentSuccessful)
        console.log('Status message:', statusMessage)

        // Determine payment status for database
        const paymentStatus = isPaymentSuccessful ? 'completed' : 'failed'

        // Update payment record based on status
        const updateData = {
          status: paymentStatus,
          gateway_response: paymentData,
          paid_at: paymentData.paid_at,
          channel: paymentData.channel,
          fees: paymentData.fees
        }

        // Update payment in database
        const { data: payment, error } = await supabase
          .from('payments')
          .update(updateData)
          .eq('gateway_reference', reference)
          .select()
          .single()

        if (error) {
          console.error('Failed to update payment record:', error)
          // If payment doesn't exist in DB, try to find by reference
          if (error.code === 'PGRST116') {
            // No rows returned - payment record might not exist
            console.log('Payment record not found, checking by transaction reference...')
            // Even if DB update fails, if payment was successful with Paystack, treat as success
            if (isPaymentSuccessful) {
              return {
                success: true,
                payment: null,
                message: statusMessage || 'Payment successful but record update failed. Please contact support.'
              }
            }
          }
        }

        // Create notification based on payment status
        if (payment) {
          const notificationData = {
            user_id: payment.customer_id,
            type: 'payment',
            title: isPaymentSuccessful ? 'Payment Successful' : 'Payment Failed',
            message: isPaymentSuccessful 
              ? `Your payment of ₦${(payment.amount).toLocaleString()} has been received successfully.`
              : `Your payment could not be processed. ${statusMessage || 'Please try again.'}`,
            color: isPaymentSuccessful ? 'success' : 'error',
            icon: isPaymentSuccessful ? 'check-circle' : 'alert-circle',
            data: {
              payment_id: payment.id,
              reference: reference,
              amount: payment.amount
            }
          }

          await supabaseHelpers.createNotification(notificationData)
        }

        // If payment is for a claim settlement, update claim status
        if (payment?.claim_id && isPaymentSuccessful) {
          await supabaseHelpers.updateClaim(payment.claim_id, {
            status: 'settled',
            settlement_status: 'completed',
            settlement_date: new Date().toISOString(),
            claim_data: {
              settled_at: new Date().toISOString(),
              settlement_amount: payment.amount,
              payment_reference: reference
            }
          })
        }

        return {
          success: isPaymentSuccessful,
          payment,
          message: statusMessage || (isPaymentSuccessful ? 'Payment successful' : 'Payment failed')
        }
      } catch (error) {
        console.error(`Payment callback error (attempt ${retryCount + 1}):`, error)
        
        if (retryCount < maxRetries - 1) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount))
          return attemptVerification()
        }
        
        return {
          success: false,
          error: error.message
        }
      }
    }

    return attemptVerification()
  },

  /**
   * Get payment channels based on payment method
   * @param {string} method - Payment method
   * @returns {Array} Allowed payment channels
   */
    getPaymentChannels(method) {
      const channelMap = {
        // Existing methods
        card: ['card'],
        mobile_money: ['mobile_money'],
        bank_transfer: ['bank', 'bank_transfer'],
        
        // New payment methods
        ussd: ['ussd'],
        qr: ['qr'],
        direct_debit: ['bank'],
        visa_qr: ['visa'],
        apple_pay: ['apple_pay'],
        
        // Combined options
        instant: ['card', 'bank', 'ussd', 'qr'], // Quick payment options
        mobile: ['mobile_money', 'ussd', 'qr'], // Mobile-first options
        all: ['card', 'bank', 'bank_transfer', 'mobile_money', 'ussd', 'qr', 'apple_pay']
      }

      return channelMap[method] || channelMap.all
    },

  /**
   * Get list of banks for bank transfer
   * @returns {Array} List of banks
   */
  async getBankList() {
    try {
      const { data, error } = await supabase.functions.invoke('get-banks')

      if (error) {
        throw new Error(error.message || 'Failed to fetch banks')
      }

      return {
        success: true,
        banks: data.data || []
      }
    } catch (error) {
      console.error('Bank list error:', error)
      return {
        success: false,
        error: error.message,
        banks: []
      }
    }
  },

  /**
   * Resolve account number to get account name
   * @param {string} accountNumber - Account number
   * @param {string} bankCode - Bank code
   * @returns {Object} Account details
   */
  async resolveAccount(accountNumber, bankCode) {
    try {
      const { data, error } = await supabase.functions.invoke('resolve-account', {
        body: {
          account_number: accountNumber,
          bank_code: bankCode
        }
      })

      if (error) {
        throw new Error(error.message || 'Account resolution failed')
      }

      // Extract the nested data structure from the response
      const accountData = data.data || data

      return {
        success: true,
        account_name: accountData.account_name,
        account_number: accountData.account_number,
        bank_id: accountData.bank_id
      }
    } catch (error) {
      console.error('Account resolution error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Get payment history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Object} Payment history
   */
  async getPaymentHistory(userId, filters = {}) {
    try {
      const { data, error } = await supabaseHelpers.getPayments({ 
        customer_id: userId,
        ...filters 
      })

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        payments: data || []
      }
    } catch (error) {
      console.error('Payment history error:', error)
      return {
        success: false,
        error: error.message,
        payments: []
      }
    }
  },

  /**
   * Cancel a pending payment
   * @param {string} paymentId - Payment ID
   * @returns {Object} Cancellation result
   */
  async cancelPayment(paymentId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .eq('status', 'pending')
        .select()
        .single()

      if (error) {
        throw new Error(error.message || 'Failed to cancel payment')
      }

      if (!data) {
        throw new Error('Payment not found or cannot be cancelled')
      }

      return {
        success: true,
        payment: data
      }
    } catch (error) {
      console.error('Payment cancellation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}