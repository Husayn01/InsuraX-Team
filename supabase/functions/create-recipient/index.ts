// supabase/functions/create-recipient/index.ts
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
    const { 
      type = 'nuban',
      name,
      account_number,
      bank_code,
      currency = 'NGN',
      metadata = {}
    } = await req.json()

    // Validate required fields
    if (!name || !account_number || !bank_code) {
      throw new Error('Name, account number, and bank code are required')
    }

    // Create recipient with Paystack
    const paystackResponse = await fetch(
      'https://api.paystack.co/transferrecipient',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          name,
          account_number,
          bank_code,
          currency,
          metadata: {
            ...metadata,
            created_by: user.id,
            created_at: new Date().toISOString()
          }
        }),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Failed to create recipient')
    }

    // Log recipient creation
    await supabaseClient.rpc('log_payment_action', {
      p_payment_id: metadata.payment_id || null,
      p_action: 'recipient_created',
      p_status: 'success',
      p_details: {
        recipient_code: paystackData.data.recipient_code,
        name: paystackData.data.name,
        account_number: paystackData.data.details.account_number,
        bank_name: paystackData.data.details.bank_name,
        metadata
      }
    })

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Recipient created successfully',
        recipient_code: paystackData.data.recipient_code,
        active: paystackData.data.active,
        id: paystackData.data.id,
        integration: paystackData.data.integration,
        details: paystackData.data.details
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Create recipient error:', error)
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