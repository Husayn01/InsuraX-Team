// supabase/functions/get-transfer/index.ts
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
    const { transfer_code } = await req.json()

    if (!transfer_code) {
      throw new Error('Transfer code is required')
    }

    // Get transfer details from Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transfer/${transfer_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Failed to get transfer details')
    }

    const transfer = paystackData.data

    // Update claim if this is a claim settlement
    if (transfer.reason && transfer.reason.includes('Claim settlement:')) {
      const metadata = transfer.metadata || {}
      
      if (metadata.claim_id) {
        // Update claim based on transfer status
        let settlementStatus = 'processing'
        
        if (transfer.status === 'success') {
          settlementStatus = 'completed'
        } else if (transfer.status === 'failed' || transfer.status === 'reversed') {
          settlementStatus = 'failed'
        }

        await supabaseClient
          .from('claims')
          .update({
            settlement_status: settlementStatus,
            settlement_date: transfer.status === 'success' ? new Date().toISOString() : null,
            claim_data: supabaseClient.rpc('jsonb_merge', {
              target: 'claim_data',
              source: JSON.stringify({
                transfer_status: transfer.status,
                transfer_updated_at: new Date().toISOString(),
                transfer_failure_reason: transfer.failure_reason || null,
                transfer_completed_at: transfer.status === 'success' ? transfer.updatedAt : null
              })
            })
          })
          .eq('id', metadata.claim_id)

        // Create notification for status update
        const notificationMessage = transfer.status === 'success'
          ? `Your claim settlement of ₦${(transfer.amount / 100).toLocaleString()} has been completed successfully.`
          : `Your claim settlement transfer failed. Reason: ${transfer.failure_reason || 'Unknown error'}`

        await supabaseClient
          .from('notifications')
          .insert({
            user_id: metadata.customer_id || user.id,
            type: 'payment',
            title: transfer.status === 'success' ? 'Settlement Completed' : 'Settlement Failed',
            message: notificationMessage,
            color: transfer.status === 'success' ? 'success' : 'error',
            icon: transfer.status === 'success' ? 'check-circle' : 'alert-circle',
            data: {
              transfer_code: transfer.transfer_code,
              claim_id: metadata.claim_id,
              amount: transfer.amount,
              status: transfer.status
            }
          })
      }
    }

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Transfer details retrieved successfully',
        transfer_code: transfer.transfer_code,
        reference: transfer.reference,
        amount: transfer.amount,
        currency: transfer.currency,
        status: transfer.status,
        recipient: transfer.recipient,
        reason: transfer.reason,
        failure_reason: transfer.failure_reason,
        created_at: transfer.createdAt,
        updated_at: transfer.updatedAt,
        metadata: transfer.metadata
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Get transfer error:', error)
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