// services/settlementService.js
import { supabase } from './supabase'

export const settlementService = {
  /**
   * Verify bank account details
   */
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const { data, error } = await supabase.functions.invoke('resolve-account', {
        body: {
          account_number: accountNumber,
          bank_code: bankCode
        }
      })

      if (error) {
        throw new Error(error.message || 'Account verification failed')
      }

      // Handle nested response structure
      const accountData = data.data || data

      return {
        success: true,
        account_name: accountData.account_name,
        account_number: accountData.account_number,
        bank_code: bankCode
      }
    } catch (error) {
      console.error('Bank verification error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Create transfer recipient for settlement
   */
  async createTransferRecipient(recipientData) {
    try {
      const { data, error } = await supabase.functions.invoke('create-recipient', {
        body: {
          type: 'nuban',
          name: recipientData.name,
          account_number: recipientData.account_number,
          bank_code: recipientData.bank_code,
          currency: recipientData.currency || 'NGN',
          metadata: recipientData.metadata || {}
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create recipient')
      }

      return {
        success: true,
        recipient_code: data.recipient_code,
        ...data
      }
    } catch (error) {
      console.error('Create recipient error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Initiate settlement transfer with retry mechanism
   */
  async initiateSettlement(claimId, settlementData) {
    let retryCount = 0
    const maxRetries = 2
    
    const attemptSettlement = async () => {
      try {
        // Step 1: Verify the bank account
        console.log('Verifying bank account...')
        const verificationResult = await this.verifyBankAccount(
          settlementData.account_number,
          settlementData.bank_code
        )

        if (!verificationResult.success) {
          throw new Error(verificationResult.error || 'Bank account verification failed')
        }

        // Step 2: Create transfer recipient
        console.log('Creating transfer recipient...')
        const recipientResult = await this.createTransferRecipient({
          name: settlementData.account_name || verificationResult.account_name,
          account_number: settlementData.account_number,
          bank_code: settlementData.bank_code,
          metadata: {
            claim_id: claimId,
            customer_id: settlementData.customer_id,
            claim_number: settlementData.claim_number
          }
        })

        if (!recipientResult.success) {
          throw new Error(recipientResult.error || 'Failed to create transfer recipient')
        }

        // Step 3: Initiate the transfer
        console.log('Initiating transfer...')
        const { data, error } = await supabase.functions.invoke('initiate-transfer', {
          body: {
            source: 'balance',
            reason: `Claim settlement: ${settlementData.claim_number}`,
            amount: Math.round(settlementData.amount * 100), // Convert to kobo
            recipient: recipientResult.recipient_code,
            reference: `CLM-SETTLE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            metadata: {
              claim_id: claimId,
              claim_number: settlementData.claim_number,
              customer_id: settlementData.customer_id,
              payment_id: settlementData.payment_id
            }
          }
        })

        if (error) {
          throw new Error(error.message || 'Transfer initiation failed')
        }

        // Log successful settlement initiation
        console.log('Settlement initiated successfully:', data)


        // Update claim with settlement tracking
        await supabase
          .from('claims')
          .update({
            settlement_status: 'processing',
            settlement_date: new Date().toISOString(),
            settlement_amount: settlementData.amount
          })
          .eq('id', claimId)

        return {
          success: true,
          data: {
            transfer_code: data.transfer_code,
            reference: data.reference,
            status: data.status,
            recipient_code: recipientResult.recipient_code,
            ...data
          }
        }
      } catch (error) {
        console.error(`Settlement initiation error (attempt ${retryCount + 1}):`, error)
        
        // Retry logic for transient failures
        if (retryCount < maxRetries && 
            (error.message.includes('network') || 
             error.message.includes('timeout') ||
             error.message.includes('fetch'))) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
          return attemptSettlement()
        }
        
        return {
          success: false,
          error: error.message
        }
      }
    }

    return attemptSettlement()
  },

  /**
   * Check transfer status with automatic claim updates
   */
  async getTransferStatus(transferCode) {
    try {
      const { data, error } = await supabase.functions.invoke('get-transfer', {
        body: { transfer_code: transferCode }
      })

      if (error) {
        throw new Error(error.message || 'Failed to get transfer status')
      }

      return {
        success: true,
        status: data.status,
        data
      }
    } catch (error) {
      console.error('Transfer status error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Batch check multiple transfer statuses
   */
  async checkMultipleTransfers(transferCodes) {
    const results = []
    
    for (const code of transferCodes) {
      const result = await this.getTransferStatus(code)
      results.push({
        transfer_code: code,
        ...result
      })
    }
    
    return results
  },

  /**
   * Cancel a pending transfer
   */
  async cancelTransfer(transferCode, reason) {
    try {
      // Note: Paystack doesn't allow direct transfer cancellation
      // This would need to be handled through their dashboard or support
      // We can only update our records
      
      console.warn('Transfer cancellation not supported via API. Contact Paystack support.')
      
      return {
        success: false,
        error: 'Transfer cancellation must be done through Paystack dashboard'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Get settlement history for claims
   */
  async getSettlementHistory(filters = {}) {
    try {
      let query = supabase
        .from('claims')
        .select(`
          id,
          claim_data,
          settlement_amount,
          settlement_status,
          settlement_date,
          customer:profiles!customer_id(
            full_name,
            email
          )
        `)
        .not('settlement_status', 'is', null)
        .order('settlement_date', { ascending: false })

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }

      if (filters.status) {
        query = query.eq('settlement_status', filters.status)
      }

      if (filters.from_date) {
        query = query.gte('settlement_date', filters.from_date)
      }

      if (filters.to_date) {
        query = query.lte('settlement_date', filters.to_date)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return {
        success: true,
        settlements: data || []
      }
    } catch (error) {
      console.error('Settlement history error:', error)
      return {
        success: false,
        error: error.message,
        settlements: []
      }
    }
  }
}