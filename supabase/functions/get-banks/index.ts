// supabase/functions/get-banks/index.ts
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
    // Get list of banks from Paystack
    const paystackResponse = await fetch(
      'https://api.paystack.co/bank?country=nigeria',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Failed to fetch banks')
    }

    // Return formatted bank list
    return new Response(
      JSON.stringify({
        status: true,
        message: 'Banks fetched successfully',
        data: paystackData.data.map(bank => ({
          name: bank.name,
          code: bank.code,
          slug: bank.slug,
          type: bank.type,
          active: bank.active,
          country: bank.country,
          currency: bank.currency
        }))
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