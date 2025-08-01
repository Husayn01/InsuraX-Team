// features/payments/PaymentCallback.jsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { paymentService } from '@services/paymentService'
import { LoadingSpinner } from '@shared/components'

export const PaymentCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your payment...')
  
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')
  
  useEffect(() => {
    handlePaymentVerification()
  }, [reference, trxref])
  
  const handlePaymentVerification = async () => {
    const paymentRef = reference || trxref
    
    if (!paymentRef) {
      setStatus('error')
      setMessage('Invalid payment reference')
      setTimeout(() => navigate('/customer/payments'), 3000)
      return
    }
    
    try {
      const result = await paymentService.handlePaymentCallback(paymentRef)
      
      if (result.success) {
        setStatus('success')
        setMessage('Payment successful! Redirecting...')
        
        // Check if this was a claim settlement
        if (result.payment?.claim_id) {
          setTimeout(() => navigate(`/customer/claims/${result.payment.claim_id}`), 2000)
        } else {
          setTimeout(() => navigate('/customer/payments?status=success'), 2000)
        }
      } else {
        setStatus('failed')
        setMessage(result.message || 'Payment verification failed')
        setTimeout(() => navigate('/customer/payments?status=failed'), 3000)
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      setStatus('error')
      setMessage('An error occurred while verifying your payment')
      setTimeout(() => navigate('/customer/payments?status=error'), 3000)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-500 border-t-transparent mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-pulse" />
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          )}
          
          {(status === 'failed' || status === 'error') && (
            <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Error Occurred'}
        </h2>
        
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  )
}