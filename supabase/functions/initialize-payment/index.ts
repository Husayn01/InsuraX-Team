// supabase/functions/initialize-payment/index.ts
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

    // Get the JWT from the Authorization header
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('No authorization token provided')
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { amount, email, metadata, callback_url, channels } = await req.json()

    // Validate required fields
    if (!amount || !email) {
      throw new Error('Amount and email are required')
    }

    // Initialize transaction with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to kobo
        email: email,
        currency: 'NGN',
        metadata: {
          ...metadata,
          user_id: user.id,
          custom_fields: [
            {
              display_name: 'Customer ID',
              variable_name: 'customer_id',
              value: metadata.customer_id || user.id
            },
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: metadata.payment_type || 'premium'
            }
          ]
        },
        callback_url: callback_url || `${Deno.env.get('FRONTEND_URL')}/payment/callback`,
        channels: channels || ['card', 'bank', 'ussd', 'mobile_money', 'qr']
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Payment initialization failed')
    }

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Payment initialized successfully',
        reference: paystackData.data.reference,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code
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