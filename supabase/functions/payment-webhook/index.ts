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

        // Update any related records
        if (transfer.reason && transfer.reason.includes('claim_id:')) {
          const claimId = transfer.reason.split('claim_id:')[1].split(' ')[0]
          
          await supabaseClient
            .from('claims')
            .update({
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