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

      return {
        success: true,
        account_name: data.account_name,
        account_number: data.account_number,
        bank_code: data.bank_code
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
   * Initiate settlement transfer
   */
  async initiateSettlement(claimId, settlementData) {
    try {
      // First verify the bank account
      const verificationResult = await this.verifyBankAccount(
        settlementData.account_number,
        settlementData.bank_code
      )

      if (!verificationResult.success) {
        throw new Error('Bank account verification failed')
      }

      // Create transfer recipient
      const recipientResult = await this.createTransferRecipient({
        name: verificationResult.account_name,
        account_number: settlementData.account_number,
        bank_code: settlementData.bank_code,
        metadata: {
          claim_id: claimId,
          customer_id: settlementData.customer_id
        }
      })

      if (!recipientResult.success) {
        throw new Error('Failed to create transfer recipient')
      }

      // Initiate the transfer
      const { data, error } = await supabase.functions.invoke('initiate-transfer', {
        body: {
          source: 'balance',
          reason: `Claim settlement: ${settlementData.claim_number}`,
          amount: Math.round(settlementData.amount * 100), // Convert to kobo
          recipient: recipientResult.recipient_code,
          reference: `CLM-SETTLE-${Date.now()}`,
          metadata: {
            claim_id: claimId,
            claim_number: settlementData.claim_number,
            customer_id: settlementData.customer_id
          }
        }
      })

      if (error) {
        throw new Error(error.message || 'Transfer initiation failed')
      }

      return {
        success: true,
        data: {
          transfer_code: data.transfer_code,
          reference: data.reference,
          status: data.status,
          ...data
        }
      }
    } catch (error) {
      console.error('Settlement initiation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Check transfer status
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
  }
}