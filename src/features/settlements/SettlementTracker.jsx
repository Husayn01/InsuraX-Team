// Create new file: features/settlements/SettlementTracker.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
  DollarSign, CreditCard, Building, TrendingUp, Info
} from 'lucide-react'
import { Card, CardBody, Badge, LoadingSpinner, Button, Alert } from '@shared/components'
import { settlementService } from '@services/settlementService'
import { supabaseHelpers } from '@services/supabase'
import { format } from 'date-fns'

export const SettlementTracker = ({ claim, onStatusUpdate, showRetry = true }) => {
  const [status, setStatus] = useState(claim?.settlement_status || 'pending')
  const [transferDetails, setTransferDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const pollingInterval = useRef(null)
  const pollCount = useRef(0)
  
  const transferCode = claim?.claim_data?.transfer_code
  const settlementAmount = claim?.settlement_amount || claim?.claim_data?.settlement_amount
  
  useEffect(() => {
    if (transferCode && status === 'processing') {
      startPolling()
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [transferCode, status])

  const startPolling = () => {
    // Initial check
    checkTransferStatus()
    
    // Poll every 10 seconds for the first 2 minutes
    // Then every 30 seconds for the next 5 minutes
    // Then every minute after that
    pollingInterval.current = setInterval(() => {
      pollCount.current += 1
      
      if (pollCount.current > 60) {
        // Stop polling after 10 minutes
        clearInterval(pollingInterval.current)
        return
      }
      
      checkTransferStatus()
    }, getPollingInterval())
  }
  
  const getPollingInterval = () => {
    if (pollCount.current < 12) return 10000 // 10 seconds
    if (pollCount.current < 22) return 30000 // 30 seconds
    return 60000 // 1 minute
  }
  
  const checkTransferStatus = async () => {
    if (!transferCode) return
    
    try {
      const result = await settlementService.getTransferStatus(transferCode)
      
      if (result.success && result.data) {
        setTransferDetails(result.data)
        
        // Update status based on transfer status
        if (result.data.status === 'success') {
          setStatus('completed')
          clearInterval(pollingInterval.current)
          if (onStatusUpdate) {
            onStatusUpdate('completed', result.data)
          }
        } else if (result.data.status === 'failed' || result.data.status === 'reversed') {
          setStatus('failed')
          setError(result.data.failure_reason || 'Transfer failed')
          clearInterval(pollingInterval.current)
          if (onStatusUpdate) {
            onStatusUpdate('failed', result.data)
          }
        }
      }
    } catch (err) {
      console.error('Failed to check transfer status:', err)
      // Don't stop polling on error - might be temporary
    }
  }
  
  const retrySettlement = async () => {
    setRetrying(true)
    setError(null)
    
    try {
      // Get latest claim data
      const { data: latestClaim } = await supabaseHelpers.getClaim(claim.id)
      
      if (!latestClaim) {
        throw new Error('Claim not found')
      }
      
      // Retry the settlement
      const result = await settlementService.initiateSettlement(claim.id, {
        amount: settlementAmount,
        account_number: latestClaim.claim_data?.bank_details?.account_number,
        bank_code: latestClaim.claim_data?.bank_details?.bank_code,
        account_name: latestClaim.claim_data?.bank_details?.account_name,
        claim_number: latestClaim.claim_data?.claimNumber,
        customer_id: latestClaim.customer_id
      })
      
      if (result.success) {
        // Update claim with new transfer details
        await supabaseHelpers.updateClaim(claim.id, {
          settlement_status: 'processing',
          claim_data: {
            ...latestClaim.claim_data,
            transfer_code: result.data.transfer_code,
            transfer_reference: result.data.reference,
            transfer_retry_count: (latestClaim.claim_data?.transfer_retry_count || 0) + 1,
            transfer_retried_at: new Date().toISOString()
          }
        })
        
        setStatus('processing')
        setTransferDetails(result.data)
        pollCount.current = 0
        startPolling()
      } else {
        throw new Error(result.error || 'Failed to retry settlement')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRetrying(false)
    }
  }
  
  const getStatusConfig = () => {
    const configs = {
      pending: {
        color: 'amber',
        icon: Clock,
        label: 'Pending',
        message: 'Settlement is pending approval'
      },
      processing: {
        color: 'blue',
        icon: RefreshCw,
        label: 'Processing',
        message: 'Transfer is being processed',
        animate: true
      },
      completed: {
        color: 'green',
        icon: CheckCircle,
        label: 'Completed',
        message: 'Settlement has been successfully transferred'
      },
      failed: {
        color: 'red',
        icon: XCircle,
        label: 'Failed',
        message: error || 'Settlement transfer failed'
      }
    }
    
    return configs[status] || configs.pending
  }
  
  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Settlement Status
          </h3>
          <Badge className={`bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400 border-${statusConfig.color}-500/30`}>
            <StatusIcon className={`w-4 h-4 mr-1 ${statusConfig.animate ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Amount Display */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Settlement Amount</div>
            <div className="text-2xl font-bold text-white">
              ₦{settlementAmount?.toLocaleString() || '0'}
            </div>
          </div>
          
          {/* Status Message */}
         <Alert 
            variant={status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info'}
            icon={StatusIcon}
          >
            {statusConfig.message}
          </Alert>
          
          {/* Transfer Details */}
          {transferDetails && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Transfer Details
              </h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Reference</div>
                  <div className="text-gray-300 font-mono text-xs">
                    {transferDetails.reference}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">Transfer Code</div>
                  <div className="text-gray-300 font-mono text-xs">
                    {transferDetails.transfer_code}
                  </div>
                </div>
                
                {transferDetails.recipient && (
                  <div className="col-span-2">
                    <div className="text-gray-500">Recipient Bank</div>
                    <div className="text-gray-300">
                      {transferDetails.recipient.details?.bank_name}
                    </div>
                  </div>
                )}
                
                {transferDetails.updated_at && (
                  <div className="col-span-2">
                    <div className="text-gray-500">Last Updated</div>
                    <div className="text-gray-300">
                      {format(new Date(transferDetails.updated_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Retry Button */}
          {status === 'failed' && showRetry && (
            <div className="pt-4 border-t border-gray-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={retrySettlement}
                disabled={retrying}
                className="w-full"
              >
                {retrying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Retrying Settlement...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Settlement
                  </>
                )}
              </Button>
              
              {claim?.claim_data?.transfer_retry_count > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Retry attempts: {claim.claim_data.transfer_retry_count}
                </p>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}