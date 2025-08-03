// supabase/functions/initiate-transfer/index.ts
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

    // Verify user is an insurer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'insurer') {
      throw new Error('Only insurers can initiate transfers')
    }

    // Get request body
    const {
      source = 'balance',
      reason,
      amount,
      recipient,
      reference,
      metadata = {}
    } = await req.json()

    // Validate required fields
    if (!reason || !amount || !recipient) {
      throw new Error('Reason, amount, and recipient are required')
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    // Generate reference if not provided
    const transferReference = reference || `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Initiate transfer with Paystack
    const paystackResponse = await fetch(
      'https://api.paystack.co/transfer',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          reason,
          amount, // Amount is already in kobo from settlementService
          recipient,
          reference: transferReference,
          metadata: {
            ...metadata,
            initiated_by: user.id,
            initiated_at: new Date().toISOString()
          }
        }),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      // Log failed transfer attempt
      await supabaseClient.rpc('log_payment_action', {
        p_payment_id: metadata.payment_id || null,
        p_action: 'transfer_failed',
        p_status: 'failed',
        p_details: {
          error: paystackData.message,
          amount,
          recipient,
          reference: transferReference
        }
      })
      
      throw new Error(paystackData.message || 'Transfer initiation failed')
    }

    // Log successful transfer initiation
    await supabaseClient.rpc('log_payment_action', {
      p_payment_id: metadata.payment_id || null,
      p_action: 'transfer_initiated',
      p_status: 'processing',
      p_details: {
        transfer_code: paystackData.data.transfer_code,
        reference: paystackData.data.reference,
        amount: paystackData.data.amount,
        recipient: paystackData.data.recipient,
        status: paystackData.data.status,
        metadata
      }
    })

    // If transfer is for a claim, update the claim record
    if (metadata.claim_id) {
      await supabaseClient
        .from('claims')
        .update({
          settlement_status: 'processing',
          claim_data: supabaseClient.rpc('jsonb_merge', {
            target: 'claim_data',
            source: JSON.stringify({
              transfer_code: paystackData.data.transfer_code,
              transfer_reference: paystackData.data.reference,
              transfer_initiated_at: new Date().toISOString(),
              transfer_status: paystackData.data.status
            })
          })
        })
        .eq('id', metadata.claim_id)
    }

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Transfer initiated successfully',
        transfer_code: paystackData.data.transfer_code,
        reference: paystackData.data.reference,
        status: paystackData.data.status,
        amount: paystackData.data.amount,
        currency: paystackData.data.currency,
        recipient: paystackData.data.recipient,
        created_at: paystackData.data.createdAt,
        updated_at: paystackData.data.updatedAt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Transfer initiation error:', error)
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