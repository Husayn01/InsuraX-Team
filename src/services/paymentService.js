// services/paymentService.js
import { supabase, supabaseHelpers } from './supabase'

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

      // Create payment record in database
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
        transaction_ref: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      })

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
   * Handle payment callback from Paystack
   * @param {string} reference - Payment reference from URL
   * @returns {Object} Payment status
   */
  async handlePaymentCallback(reference) {
    try {
      // Verify the payment
      const verificationResult = await this.verifyPayment(reference)

      if (!verificationResult.success) {
        throw new Error(verificationResult.error)
      }

      const paymentData = verificationResult.data

      // Update payment record based on status
      const updateData = {
        status: paymentData.status,
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
      }

      // If payment is for a claim settlement, update claim status
      if (payment?.claim_id && paymentData.status === 'success') {
        await supabaseHelpers.updateClaim(payment.claim_id, {
          status: 'settled',
          claim_data: {
            settled_at: new Date().toISOString(),
            settlement_amount: payment.amount
          }
        })
      }

      return {
        success: paymentData.status === 'success',
        payment,
        message: paymentData.gateway_response || paymentData.message
      }
    } catch (error) {
      console.error('Payment callback error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Get payment channels based on payment method
   * @param {string} method - Payment method
   * @returns {Array} Allowed payment channels
   */
  getPaymentChannels(method) {
    const channelMap = {
      card: ['card'],
      mobile_money: ['mobile_money'],
      bank_transfer: ['bank', 'bank_transfer'],
      all: ['card', 'bank', 'mobile_money', 'ussd', 'qr']
    }

    return channelMap[method] || channelMap.all
  },

  /**
   * Create virtual account for claim settlements
   * @param {Object} settlementData - Settlement details
   * @returns {Object} Virtual account details
   */
  async createSettlementAccount(settlementData) {
    try {
      const { data, error } = await supabase.functions.invoke('create-settlement-account', {
        body: {
          customer_id: settlementData.customer_id,
          claim_id: settlementData.claim_id,
          amount: settlementData.amount,
          bank_code: settlementData.bank_code,
          account_number: settlementData.account_number,
          account_name: settlementData.account_name
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create settlement account')
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Settlement account error:', error)
      return {
        success: false,
        error: error.message
      }
    }
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
   * Resolve account details
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
        throw new Error(error.message || 'Failed to resolve account')
      }

      return {
        success: true,
        data: data.data
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
   * Generate payment receipt
   * @param {string} paymentId - Payment ID
   * @returns {Object} Receipt data
   */
  async generateReceipt(paymentId) {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          customer:customer_id (
            full_name,
            email,
            phone
          ),
          claim:claim_id (
            claim_data
          )
        `)
        .eq('id', paymentId)
        .single()

      if (error) {
        throw new Error('Payment not found')
      }

      return {
        success: true,
        receipt: {
          payment_id: payment.id,
          reference: payment.gateway_reference || payment.transaction_ref,
          amount: payment.amount,
          status: payment.status,
          method: payment.payment_method,
          date: payment.paid_at || payment.created_at,
          customer: payment.customer,
          description: payment.description,
          claim_number: payment.claim?.claim_data?.claimNumber
        }
      }
    } catch (error) {
      console.error('Receipt generation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}