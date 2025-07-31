// supabase/functions/resolve-account/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Get request body
    const { account_number, bank_code } = await req.json()

    if (!account_number || !bank_code) {
      throw new Error('Account number and bank code are required')
    }

    // Resolve account details from Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Failed to resolve account')
    }

    // Return account details
    return new Response(
      JSON.stringify({
        status: true,
        message: 'Account resolved successfully',
        data: {
          account_number: paystackData.data.account_number,
          account_name: paystackData.data.account_name,
          bank_id: paystackData.data.bank_id
        }
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