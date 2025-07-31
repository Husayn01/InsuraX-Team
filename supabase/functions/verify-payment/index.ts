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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the user
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('No authorization token provided')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { reference } = await req.json()

    if (!reference) {
      throw new Error('Payment reference is required')
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Payment verification failed')
    }

    const transaction = paystackData.data

    // Map Paystack status to our status
    let paymentStatus = 'pending'
    if (transaction.status === 'success') {
      paymentStatus = 'completed'
    } else if (transaction.status === 'failed') {
      paymentStatus = 'failed'
    }

    // Update payment record in database
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: paymentStatus,
        gateway_response: transaction,
        paid_at: transaction.paid_at,
        channel: transaction.channel,
        fees: transaction.fees,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_reference', reference)

    if (updateError) {
      console.error('Failed to update payment record:', updateError)
    }

    // If payment is successful and linked to a claim, update claim status
    if (paymentStatus === 'completed' && transaction.metadata?.claim_id) {
      const { error: claimError } = await supabaseClient
        .from('claims')
        .update({
          status: 'settled',
          claim_data: supabaseClient.rpc('jsonb_merge', {
            target: 'claim_data',
            source: JSON.stringify({
              settled_at: new Date().toISOString(),
              settlement_amount: transaction.amount / 100,
              payment_reference: reference
            })
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.metadata.claim_id)

      if (claimError) {
        console.error('Failed to update claim:', claimError)
      }
    }

    return new Response(
      JSON.stringify({
        status: transaction.status === 'success',
        message: transaction.gateway_response || transaction.message,
        reference: transaction.reference,
        amount: transaction.amount / 100, // Convert from kobo to naira
        paid_at: transaction.paid_at,
        channel: transaction.channel,
        fees: transaction.fees / 100,
        customer: transaction.customer,
        metadata: transaction.metadata
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: false,
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})