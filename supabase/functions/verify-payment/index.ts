// supabase/functions/verify-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for payment operations
    )

    // Get request body
    const { reference } = await req.json()

    if (!reference) {
      throw new Error('Payment reference is required')
    }

    console.log(`Verifying payment with reference: ${reference}`)

    // Check if Paystack secret key is set
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackKey) {
      throw new Error('Paystack API key not configured')
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackKey}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error('Paystack verification failed:', paystackData)
      throw new Error(paystackData.message || 'Payment verification failed')
    }

    const transaction = paystackData.data
    console.log(`Payment status from Paystack: ${transaction.status}`)

    // Map Paystack status to our status
    let paymentStatus = 'pending'
    const isSuccessful = transaction.status === 'success'
    
    if (isSuccessful) {
      paymentStatus = 'completed'
    } else if (transaction.status === 'failed') {
      paymentStatus = 'failed'
    }

    // Update payment record in database
    try {
      const updateResult = await supabaseClient
        .from('payments')
        .update({
          status: paymentStatus,
          gateway_response: transaction,
          paid_at: transaction.paid_at,
          channel: transaction.channel,
          fees: transaction.fees,
          currency: transaction.currency,
          updated_at: new Date().toISOString()
        })
        .eq('gateway_reference', reference)

      console.log('Payment record update result:', updateResult)

      if (updateResult.error) {
        console.error('Failed to update payment record:', updateResult.error)
        // Don't throw here - payment verification is still valid
      }
    } catch (dbError) {
      console.error('Database update error:', dbError)
      // Continue - payment verification is more important than DB update
    }

    // Log payment verification
    try {
      await supabaseClient.rpc('log_payment_action', {
        p_payment_id: null,
        p_action: 'payment_verified',
        p_status: paymentStatus,
        p_details: {
          reference: reference,
          amount: transaction.amount,
          status: transaction.status,
          channel: transaction.channel,
          customer_email: transaction.customer?.email
        }
      })
    } catch (logError) {
      console.error('Failed to log payment action:', logError)
      // Don't fail the request due to logging error
    }

    // If payment is successful and linked to a claim, update claim status
    if (isSuccessful && transaction.metadata?.claim_id) {
      try {
        await supabaseClient
          .from('claims')
          .update({
            status: 'settled',
            settlement_status: 'completed',
            settlement_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.metadata.claim_id)

        // Create notification for the customer
        if (transaction.metadata.customer_id) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: transaction.metadata.customer_id,
              type: 'payment',
              title: 'Payment Successful',
              message: `Your payment of ₦${(transaction.amount / 100).toLocaleString()} has been received successfully.`,
              color: 'success',
              icon: 'check-circle',
              data: {
                payment_reference: reference,
                amount: transaction.amount / 100,
                claim_id: transaction.metadata.claim_id
              }
            })
        }
      } catch (claimError) {
        console.error('Failed to update claim:', claimError)
        // Don't fail the verification due to claim update error
      }
    }

    // Return consistent response format
    const response = {
      // Boolean status for success/failure - this is what the frontend checks
      status: isSuccessful,
      // Clear message
      message: isSuccessful 
        ? 'Payment verified successfully' 
        : (transaction.gateway_response || 'Payment verification failed'),
      // Payment details
      reference: transaction.reference,
      amount: transaction.amount / 100, // Convert from kobo to naira
      paid_at: transaction.paid_at,
      channel: transaction.channel,
      fees: transaction.fees ? transaction.fees / 100 : 0,
      currency: transaction.currency || 'NGN',
      customer: transaction.customer,
      metadata: transaction.metadata,
      // Include the actual Paystack status for debugging
      paymentStatus: transaction.status,
      // Include gateway response
      gateway_response: transaction.gateway_response
    }

    console.log('Returning response:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Always return 200 for successful API calls
      }
    )
  } catch (error) {
    console.error('Payment verification error:', error)
    
    // Return error response with 200 status to avoid "non-2xx" error
    return new Response(
      JSON.stringify({
        status: false,
        message: error.message || 'Payment verification failed',
        error: error.message,
        paymentStatus: 'failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 even for errors to avoid Edge Function errors
      }
    )
  }
})