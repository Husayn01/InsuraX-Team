// supabase/functions/payment-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.160.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the webhook signature from headers
    const signature = req.headers.get('x-paystack-signature')
    if (!signature) {
      throw new Error('No signature provided')
    }

    // Get the raw body
    const body = await req.text()

    // Verify webhook signature
    const hash = createHmac('sha512', Deno.env.get('PAYSTACK_WEBHOOK_SECRET') ?? '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      throw new Error('Invalid signature')
    }

    // Parse the webhook payload
    const event = JSON.parse(body)
    console.log('Webhook event received:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const transaction = event.data

        // Update payment record
        const { data: payment, error: paymentError } = await supabaseClient
          .from('payments')
          .update({
            status: 'completed',
            gateway_response: transaction,
            paid_at: transaction.paid_at,
            channel: transaction.channel,
            fees: transaction.fees,
            updated_at: new Date().toISOString()
          })
          .eq('gateway_reference', transaction.reference)
          .select()
          .single()

        if (paymentError) {
          console.error('Failed to update payment:', paymentError)
          break
        }

        // Create notification for customer
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: payment.customer_id,
            type: 'payment_success',
            title: 'Payment Successful',
            message: `Your payment of ₦${(transaction.amount / 100).toLocaleString()} has been confirmed.`,
            color: 'success',
            icon: 'check-circle',
            data: {
              payment_id: payment.id,
              reference: transaction.reference,
              amount: transaction.amount / 100
            }
          })

        // If payment is for a claim, update claim status
        if (payment.claim_id) {
          await supabaseClient
            .from('claims')
            .update({
              status: 'settled',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.claim_id)

          // Notify about claim settlement
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: payment.customer_id,
              type: 'claim_settled',
              title: 'Claim Settled',
              message: 'Your insurance claim has been settled and payment processed.',
              color: 'success',
              icon: 'check-circle',
              data: {
                claim_id: payment.claim_id,
                payment_id: payment.id
              }
            })
        }
        break
      }

      case 'charge.failed': {
        const transaction = event.data

        // Update payment record
        await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
            gateway_response: transaction,
            updated_at: new Date().toISOString()
          })
          .eq('gateway_reference', transaction.reference)

        // Get payment details for notification
        const { data: payment } = await supabaseClient
          .from('payments')
          .select('customer_id')
          .eq('gateway_reference', transaction.reference)
          .single()

        if (payment) {
          // Create failure notification
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: payment.customer_id,
              type: 'payment_failed',
              title: 'Payment Failed',
              message: `Your payment of ₦${(transaction.amount / 100).toLocaleString()} could not be processed. ${transaction.gateway_response || ''}`,
              color: 'error',
              icon: 'alert-circle',
              data: {
                reference: transaction.reference,
                reason: transaction.gateway_response
              }
            })
        }
        break
      }

      case 'transfer.success': {
        // Handle successful claim settlement transfer
        const transfer = event.data
        console.log('Transfer successful:', transfer.reference)

        // Extract claim ID from metadata or reason
        let claimId = transfer.metadata?.claim_id
        
        // Fallback: Extract from reason field
        if (!claimId && transfer.reason) {
          const match = transfer.reason.match(/Claim settlement: (CLM-[A-Z0-9-]+)/)
          if (match) {
            const claimNumber = match[1]
            // Find claim by claim number
            const { data: claimData } = await supabaseClient
              .from('claims')
              .select('id')
              .eq('claim_data->claimNumber', claimNumber)
              .single()
            
            claimId = claimData?.id
          }
        }

        if (claimId) {
          // Update claim settlement status to completed
          await supabaseClient
            .from('claims')
            .update({
              settlement_status: 'completed',
              status: 'settled',  // Also update main status
              claim_data: supabaseClient.rpc('jsonb_merge', {
                target: 'claim_data',
                source: JSON.stringify({
                  transfer_completed: true,
                  transfer_reference: transfer.reference,
                  transfer_completed_at: new Date().toISOString()
                })
              })
            })
            .eq('id', claimId)
          
          // Create notification for customer
          const { data: claim } = await supabaseClient
            .from('claims')
            .select('customer_id, settlement_amount, claim_data')
            .eq('id', claimId)
            .single()
          
          if (claim) {
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: claim.customer_id,
                type: 'settlement_completed',
                title: 'Settlement Completed! 💰',
                message: `Your claim ${claim.claim_data?.claimNumber} settlement of ₦${claim.settlement_amount?.toLocaleString()} has been successfully transferred to your account.`,
                color: 'green',
                icon: 'check-circle',
                data: {
                  claim_id: claimId,
                  amount: claim.settlement_amount,
                  transfer_reference: transfer.reference
                }
              })
          }
        }
        break
      }

      // Update payment-webhook/index.ts to handle transfer events properly

      case 'transfer.success': {
        // Handle successful claim settlement transfer
        const transfer = event.data
        console.log('Transfer successful:', transfer.reference)

        // Extract claim ID from metadata or reason
        let claimId = transfer.metadata?.claim_id
        
        // Fallback: Extract from reason field
        if (!claimId && transfer.reason) {
          const match = transfer.reason.match(/Claim settlement: CLM-[A-Z0-9-]+/)
          if (match) {
            const claimNumber = match[0].replace('Claim settlement: ', '')
            // Find claim by claim number
            const { data: claimData } = await supabaseClient
              .from('claims')
              .select('id, customer_id')
              .eq('claim_data->>claimNumber', claimNumber)
              .single()
            
            if (claimData) {
              claimId = claimData.id
            }
          }
        }

        if (claimId) {
          // Update claim to settled status
          await supabaseClient
            .from('claims')
            .update({
              status: 'settled',
              settlement_status: 'completed',
              settlement_date: new Date().toISOString(),
              claim_data: supabaseClient.rpc('jsonb_merge', {
                target: 'claim_data',
                source: JSON.stringify({
                  transfer_completed: true,
                  transfer_reference: transfer.reference,
                  transfer_completed_at: new Date().toISOString(),
                  transfer_amount: transfer.amount,
                  transfer_final_status: 'success'
                })
              })
            })
            .eq('id', claimId)

          // Get claim details for notification
          const { data: claim } = await supabaseClient
            .from('claims')
            .select('customer_id, claim_data')
            .eq('id', claimId)
            .single()

          if (claim) {
            // Create success notification
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: claim.customer_id,
                type: 'settlement_completed',
                title: 'Settlement Completed ✅',
                message: `Your claim ${claim.claim_data.claimNumber} settlement of ₦${(transfer.amount / 100).toLocaleString()} has been successfully transferred to your bank account.`,
                color: 'green',
                icon: 'check-circle',
                data: {
                  claim_id: claimId,
                  transfer_reference: transfer.reference,
                  amount: transfer.amount / 100,
                  completed_at: new Date().toISOString()
                }
              })

            // Log the successful transfer
            await supabaseClient.rpc('log_payment_action', {
              p_payment_id: null,
              p_action: 'transfer_completed',
              p_status: 'success',
              p_details: {
                claim_id: claimId,
                transfer_code: transfer.transfer_code,
                reference: transfer.reference,
                amount: transfer.amount,
                recipient: transfer.recipient
              }
            })
          }
        }
        break
      }

      case 'transfer.failed':
      case 'transfer.reversed': {
        // Handle failed or reversed transfers
        const transfer = event.data
        console.error('Transfer failed/reversed:', transfer.reference)
        
        let claimId = transfer.metadata?.claim_id
        
        if (claimId) {
          // Update claim status
          await supabaseClient
            .from('claims')
            .update({
              settlement_status: 'failed',
              claim_data: supabaseClient.rpc('jsonb_merge', {
                target: 'claim_data',
                source: JSON.stringify({
                  transfer_failed: true,
                  transfer_failure_reason: transfer.failure_reason || 'Transfer failed',
                  transfer_failed_at: new Date().toISOString(),
                  transfer_final_status: event.event === 'transfer.reversed' ? 'reversed' : 'failed'
                })
              })
            })
            .eq('id', claimId)

          // Get claim details
          const { data: claim } = await supabaseClient
            .from('claims')
            .select('customer_id, claim_data')
            .eq('id', claimId)
            .single()

          if (claim) {
            // Create failure notification
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: claim.customer_id,
                type: 'settlement_failed',
                title: 'Settlement Failed ❌',
                message: `Settlement for claim ${claim.claim_data.claimNumber} failed. ${transfer.failure_reason || 'Please contact support.'}`,
                color: 'red',
                icon: 'x-circle',
                data: {
                  claim_id: claimId,
                  transfer_reference: transfer.reference,
                  failure_reason: transfer.failure_reason,
                  failed_at: new Date().toISOString()
                }
              })

            // Log the failed transfer
            await supabaseClient.rpc('log_payment_action', {
              p_payment_id: null,
              p_action: 'transfer_failed',
              p_status: 'failed',
              p_details: {
                claim_id: claimId,
                transfer_code: transfer.transfer_code,
                reference: transfer.reference,
                failure_reason: transfer.failure_reason,
                event_type: event.event
              }
            })
          }
        }
        break
      }

      case 'transfer.failed':
      case 'transfer.reversed': {
        // Handle failed or reversed transfers
        const transfer = event.data
        console.error('Transfer failed/reversed:', transfer.reference)
        // Implement appropriate error handling and notifications
        break
      }

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})