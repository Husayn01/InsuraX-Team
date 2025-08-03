// features/payments/PaymentCallback.jsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { paymentService } from '@services/paymentService'
import { Button } from '@shared/components'

export const PaymentCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your payment...')
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [errorDetails, setErrorDetails] = useState(null)
  
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
      setErrorDetails('No payment reference was provided in the URL.')
      return
    }
    
    try {
      console.log('Verifying payment:', paymentRef)
      const result = await paymentService.handlePaymentCallback(paymentRef)
      console.log('Payment verification result:', result)
      
      if (result.success) {
        setStatus('success')
        setMessage('Payment successful!')
        setPaymentDetails(result.payment)
        
        // Redirect after showing success
        setTimeout(() => {
          if (result.payment?.claim_id) {
            navigate(`/customer/claims/${result.payment.claim_id}`)
          } else {
            navigate('/customer/payments?status=success')
          }
        }, 3000)
      } else {
        setStatus('failed')
        setMessage(result.message || 'Payment verification failed')
        setErrorDetails(result.error || 'The payment could not be verified. Please check your payment status.')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      setStatus('error')
      setMessage('An error occurred while verifying your payment')
      setErrorDetails(error.message || 'Please contact support if the issue persists.')
    }
  }
  
  const handleRetry = () => {
    setStatus('verifying')
    setMessage('Verifying your payment...')
    setErrorDetails(null)
    handlePaymentVerification()
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center p-8 max-w-md w-full">
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
            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-scale-in">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          )}
          
          {(status === 'failed' || status === 'error') && (
            <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-scale-in">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Verification Error'}
        </h2>
        
        <p className="text-gray-400 mb-4">{message}</p>
        
        {/* Error details if available */}
        {errorDetails && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 text-left">{errorDetails}</p>
            </div>
          </div>
        )}
        
        {/* Payment details on success */}
        {status === 'success' && paymentDetails && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-gray-300">
              Amount: <span className="font-semibold text-green-400">
                ₦{paymentDetails.amount?.toLocaleString()}
              </span>
            </p>
            {paymentDetails.transaction_ref && (
              <p className="text-xs text-gray-400 mt-1">
                Reference: {paymentDetails.transaction_ref}
              </p>
            )}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {status === 'verifying' && (
            <p className="text-sm text-gray-500">Please wait while we confirm your payment...</p>
          )}
          
          {(status === 'failed' || status === 'error') && (
            <>
              <Button
                onClick={handleRetry}
                variant="primary"
                className="w-full"
              >
                Try Again
              </Button>
              <Link to="/customer/payments">
                <Button
                  variant="secondary"
                  className="w-full"
                >
                  Go to Payments
                </Button>
              </Link>
            </>
          )}
          
          {status === 'success' && (
            <div className="flex items-center justify-center gap-2 text-cyan-500">
              <span className="text-sm">Redirecting</span>
              <ArrowRight className="w-4 h-4 animate-bounce-x" />
            </div>
          )}
        </div>
        
        {/* Support link */}
        {(status === 'failed' || status === 'error') && (
          <p className="mt-6 text-xs text-gray-500">
            Need help? <a href="/support" className="text-cyan-500 hover:underline">Contact Support</a>
          </p>
        )}
      </div>
    </div>
  )
}