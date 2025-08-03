import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FileText, ArrowLeft, Clock, Calendar, DollarSign, MapPin, 
  User, Phone, Mail, Hash, Shield, AlertCircle, CheckCircle,
  XCircle, Eye, Download, MessageSquare, Activity, MoreVertical,
  Brain, TrendingUp, AlertTriangle, Info, ChevronDown, ChevronUp,
  FileImage, Sparkles, Zap, CreditCard, Loader2, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, LoadingSpinner, Modal, Alert, Tabs 
} from '@shared/components'
import {
  FormTextArea, FormInput, FormSelect
} from '@shared/components/FormComponents'
import { ClaimsProcessingSystem } from '@features/neuroclaim/services/claimsOrchestrator'
import { paymentService } from '@services/paymentService'
import { settlementService } from '@services/settlementService'

export const InsurerClaimDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [updating, setUpdating] = useState(false)
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showInfoRequestModal, setShowInfoRequestModal] = useState(false)
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)
  
  // Form states
  const [comment, setComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [settlementAmount, setSettlementAmount] = useState('')
  const [deductible, setDeductible] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  
  // Bank details
  const [bankDetails, setBankDetails] = useState({
    bank_code: '',
    account_number: '',
    account_name: ''
  })
  const [banks, setBanks] = useState([])
  const [verifyingBank, setVerifyingBank] = useState(false)
  
  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false)
  const [claimsSystem] = useState(() => new ClaimsProcessingSystem())

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
    { id: 'documents', label: 'Documents', icon: FileImage },
    { id: 'activity', label: 'Activity', icon: Clock }
  ]

  useEffect(() => {
    fetchClaimDetails()
    fetchBankList()
  }, [id])
  
  useEffect(() => {
    // Auto-run AI analysis if not already done
    if (claim && !claim.claim_data?.ai_analysis && !analyzingWithAI) {
      runAIAnalysis()
    }
  }, [claim])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseHelpers.getClaimWithRelations(id)
      
      if (error) {
        setError('Failed to load claim details')
        return
      }
      
      setClaim(data)
      
      // Pre-fill settlement amount
      if (data?.claim_data?.estimatedAmount) {
        setSettlementAmount(data.claim_data.estimatedAmount.toString())
      }
      
      // Load AI analysis from claim data if exists
      if (data?.claim_data?.ai_analysis) {
        setAiAnalysis(data.claim_data.ai_analysis)
      }
    } catch (err) {
      console.error('Error fetching claim:', err)
      setError('An error occurred while loading claim details')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchBankList = async () => {
    try {
      const result = await paymentService.getBankList()
      if (result.success) {
        setBanks(result.banks)
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error)
    }
  }
  
  const runAIAnalysis = async () => {
    if (!claim || analyzingWithAI) return
    
    setAnalyzingWithAI(true)
    try {
      // Prepare claim text for analysis
      const claimText = `
        Claim Type: ${claim.claim_data?.claimType}
        Date of Incident: ${claim.claim_data?.dateOfIncident}
        Location: ${claim.claim_data?.incidentLocation}
        Description: ${claim.claim_data?.incidentDescription}
        Estimated Amount: ₦${claim.claim_data?.estimatedAmount}
        
        Additional Information:
        ${JSON.stringify(claim.claim_data, null, 2)}
      `
      
      // Run AI analysis
      const result = await claimsSystem.processClaimComplete(claimText, {
        generateCustomerResponse: false,
        generateInternalMemo: true
      })
      
      if (result.success) {
        setAiAnalysis(result)
        
        // Save analysis to claim
        await supabaseHelpers.updateClaim(claim.id, {
          claim_data: {
            ...claim.claim_data,
            ai_analysis: {
              fraudAssessment: result.fraudAssessment,
              categorization: result.categorization,
              validation: result.validation,
              actionPlan: result.actionPlan,
              internalMemo: result.internalMemo,
              analyzedAt: new Date().toISOString()
            }
          }
        })
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
      setError('Failed to complete AI analysis')
    } finally {
      setAnalyzingWithAI(false)
    }
  }
  
const verifyBankAccount = async () => {
  if (!bankDetails.bank_code || !bankDetails.account_number) {
    setError('Please select a bank and enter account number')
    return
  }
  
  setVerifyingBank(true)
  try {
    const result = await settlementService.verifyBankAccount(
      bankDetails.account_number,
      bankDetails.bank_code
    )
    
    console.log('Verification result:', result) // Debug log
    
    if (result.success && result.account_name) {
      setBankDetails(prev => ({
        ...prev,
        account_name: result.account_name
      }))
      setSuccess('Bank account verified successfully')
    } else {
      setError(result.error || 'Failed to verify bank account')
      setBankDetails(prev => ({
        ...prev,
        account_name: ''
      }))
    }
  } catch (error) {
    console.error('Bank verification error:', error)
    setError('Bank verification failed. Please check the details and try again.')
    setBankDetails(prev => ({
      ...prev,
      account_name: ''
    }))
  } finally {
    setVerifyingBank(false)
  }
}

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    setError(null)
    
    try {
      // Prepare additional data based on status
      let additionalData = {
        updated_by: user.id,
        audit_details: {
          action: `Status changed to ${newStatus}`,
          performed_by: user.email
        }
      }
      
      // Handle status-specific data
      switch (newStatus) {
        case 'approved':
          // Validate settlement amount
          const amount = parseFloat(settlementAmount)
          if (!amount || amount <= 0) {
            throw new Error('Please enter a valid settlement amount')
          }
          
          additionalData.settlement_amount = amount
          additionalData.settlement_status = 'pending'
          additionalData.claim_data = {
            settlement_amount: amount,
            deductible: parseFloat(deductible) || 0,
            payment_method: paymentMethod,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            bank_details: paymentMethod === 'bank_transfer' ? bankDetails : null
          }
          break
          
        case 'rejected':
          if (!rejectionReason) {
            throw new Error('Please select a rejection reason')
          }
          additionalData.rejection_reason = rejectionReason
          additionalData.rejection_comment = comment
          additionalData.claim_data = {
            rejected_by: user.id,
            rejected_at: new Date().toISOString(),
            rejection_details: {
              reason: rejectionReason,
              comment: comment
            }
          }
          break
          
        case 'additional_info_required':
          if (!comment) {
            throw new Error('Please specify what information is needed')
          }
          additionalData.info_request = comment
          additionalData.claim_data = {
            info_requested_by: user.id,
            info_requested_at: new Date().toISOString(),
            info_request_details: comment
          }
          break
      }
      
      // Update claim status with validation
      const { data, error } = await supabaseHelpers.updateClaimStatus(
        claim.id, 
        newStatus, 
        additionalData
      )
      
      if (error) {
        throw error
      }
      
      // Handle post-update actions
      if (newStatus === 'approved' && data) {
        await initiatePayment(data)
      }
      
      setSuccess(`Claim ${newStatus} successfully`)
      setClaim(data)
      
      // Close all modals
      setShowApprovalModal(false)
      setShowRejectionModal(false)
      setShowInfoRequestModal(false)
      setShowBankDetailsModal(false)
      
      // Reset form fields
      setComment('')
      setRejectionReason('')
      setSettlementAmount('')
      setDeductible('')
      
      // Refresh claim details after a moment
      setTimeout(() => {
        fetchClaimDetails()
      }, 1500)
      
    } catch (err) {
      console.error('Status update error:', err)
      setError(err.message || 'Failed to update claim status')
    } finally {
      setUpdating(false)
    }
  }
  
  const initiatePayment = async (updatedClaim) => {
    try {
      // Get customer details
      const customer = updatedClaim.customer || claim.customer
      
      if (paymentMethod === 'bank_transfer') {
        // Create settlement via bank transfer
        const settlementResult = await settlementService.initiateSettlement(
          updatedClaim.id,
          {
            amount: updatedClaim.claim_data.settlement_amount,
            account_number: bankDetails.account_number,
            bank_code: bankDetails.bank_code,
            account_name: bankDetails.account_name,
            claim_number: updatedClaim.claim_data.claimNumber,
            customer_id: updatedClaim.customer_id
          }
        )
        
        if (settlementResult.success) {
          // Update claim with payment info
          await supabaseHelpers.updateClaim(updatedClaim.id, {
            claim_data: {
              ...updatedClaim.claim_data,
              payment_reference: settlementResult.data.reference,
              payment_status: 'processing',
              transfer_code: settlementResult.data.transfer_code
            }
          })
        }
      } else {
        // Initialize Paystack payment for other methods
        const paymentData = {
          amount: updatedClaim.claim_data.settlement_amount,
          customer_id: updatedClaim.customer_id,
          claim_id: updatedClaim.id,
          email: customer?.email || '',
          payment_type: 'settlement',
          payment_method: paymentMethod,
          description: `Settlement for claim ${updatedClaim.claim_data.claimNumber}`
        }
        
        const paymentResult = await paymentService.initializePayment(paymentData)
        
        if (paymentResult.success) {
          // Update claim with payment info
          await supabaseHelpers.updateClaim(updatedClaim.id, {
            claim_data: {
              ...updatedClaim.claim_data,
              payment_id: paymentResult.data.payment_id,
              payment_reference: paymentResult.data.reference,
              payment_status: 'pending'
            }
          })
          
          // Send payment link to customer via notification
          await supabaseHelpers.createNotification({
            user_id: updatedClaim.customer_id,
            type: 'payment_initiated',
            title: 'Claim Payment Ready',
            message: `Your claim settlement of ₦${updatedClaim.claim_data.settlement_amount.toLocaleString()} is ready. Click here to complete payment.`,
            color: 'blue',
            icon: 'credit-card',
            data: {
              claim_id: updatedClaim.id,
              payment_url: paymentResult.data.authorization_url
            }
          })
        }
      }
    } catch (error) {
      console.error('Payment initiation failed:', error)
      // Don't throw - payment can be retried later
      setError('Payment initiation failed but claim was approved. Payment can be processed later.')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'blue',
      processing: 'cyan',
      under_review: 'purple',
      additional_info_required: 'amber',
      approved: 'emerald',
      rejected: 'red',
      disputed: 'orange',
      settled: 'green',
      closed: 'gray'
    }
    return colors[status] || 'gray'
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <FileImage className="w-5 h-5 text-blue-400" />
    }
    return <FileText className="w-5 h-5 text-gray-400" />
  }
  
  // Tab render functions
  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Claim Information */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Claim Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Claim Number</p>
                <p className="text-white font-medium">{claim?.claim_data?.claimNumber || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Claim Type</p>
                <p className="text-white font-medium capitalize">{claim?.claim_data?.claimType || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Date of Incident</p>
                <p className="text-white font-medium">
                  {claim?.claim_data?.dateOfIncident 
                    ? format(new Date(claim.claim_data.dateOfIncident), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white font-medium">{claim?.claim_data?.incidentLocation || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Estimated Amount</p>
                <p className="text-white font-medium text-lg">
                  ₦{claim?.claim_data?.estimatedAmount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Customer Information */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Customer Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="text-white font-medium">{claim?.claim_data?.claimantName || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-medium">{claim?.claim_data?.contactEmail || claim?.customer?.email || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-white font-medium">{claim?.claim_data?.contactPhone || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="text-white font-medium">{claim?.claim_data?.claimantAddress || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Incident Description */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 lg:col-span-2">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-4">Incident Description</h3>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {claim?.claim_data?.incidentDescription || 'No description provided'}
          </p>
        </CardBody>
      </Card>
    </div>
  )
  
  const renderAIAnalysisTab = () => (
    <div className="space-y-6">
      {analyzingWithAI ? (
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardBody className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
                <Brain className="absolute inset-0 m-auto w-8 h-8 text-cyan-500" />
              </div>
              <p className="text-gray-400">Analyzing claim with AI...</p>
            </div>
          </CardBody>
        </Card>
      ) : aiAnalysis ? (
        <>
          {/* Fraud Assessment */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Fraud Risk Assessment
                </h3>
                <Badge className={`
                  ${aiAnalysis.fraudAssessment?.riskLevel === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    aiAnalysis.fraudAssessment?.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    aiAnalysis.fraudAssessment?.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-red-600/20 text-red-500 border-red-600/30'}
                `}>
                  {aiAnalysis.fraudAssessment?.riskLevel?.toUpperCase()} RISK
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Risk Score</p>
                  <p className="text-2xl font-bold text-white">{aiAnalysis.fraudAssessment?.riskScore || 0}/100</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Confidence</p>
                  <p className="text-2xl font-bold text-white capitalize">{aiAnalysis.fraudAssessment?.confidence || 'N/A'}</p>
                </div>
              </div>
              
              {aiAnalysis.fraudAssessment?.fraudIndicators?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Risk Indicators</h4>
                  <ul className="space-y-2">
                    {aiAnalysis.fraudAssessment.fraudIndicators.map((indicator, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{indicator.indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {aiAnalysis.fraudAssessment?.recommendedActions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {aiAnalysis.fraudAssessment.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Categorization */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Claim Categorization
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Category</p>
                <div>
                  {aiAnalysis.categorization?.category ? (
                    <>
                      <p className="text-white font-medium capitalize">
                        {aiAnalysis.categorization.category.primary || 'N/A'}
                      </p>
                      {aiAnalysis.categorization.category.secondary && (
                        <p className="text-sm text-gray-400 capitalize">
                          {aiAnalysis.categorization.category.secondary}
                        </p>
                      )}
                      {aiAnalysis.categorization.category.complexity && (
                        <Badge className="mt-1 bg-purple-500/20 text-purple-400 text-xs">
                          {aiAnalysis.categorization.category.complexity}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-white font-medium">N/A</p>
                  )}
                </div>
              </div>
                <div>
                  <p className="text-sm text-gray-400">Urgency</p>
                  <Badge className={`
                    ${aiAnalysis.categorization?.urgency?.level === 'low' ? 'bg-gray-500/20 text-gray-400' :
                      aiAnalysis.categorization?.urgency?.level === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                      aiAnalysis.categorization?.urgency?.level === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'}
                  `}>
                    {aiAnalysis.categorization?.urgency?.level?.toUpperCase() || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Priority Score</p>
                  <p className="text-white font-medium">{aiAnalysis.categorization?.priority?.score || 0}/100</p>
                </div>
              </div>
              
              {aiAnalysis.categorization?.routing && (
                <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Recommended Routing</p>
                  <p className="text-white font-medium">{aiAnalysis.categorization.routing.department}</p>
                  <p className="text-sm text-gray-400">{aiAnalysis.categorization.routing.assignmentType}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Internal Memo */}
          {aiAnalysis.internalMemo && (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                AI Generated Internal Memo
              </h3>
              <div className="space-y-4">
                {/* Memo Header */}
                <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-400">To:</p>
                      <p className="text-white font-medium">{aiAnalysis.internalMemo.to || 'Claims Management Team'}</p>
                    </div>
                    <Badge className={`
                      ${aiAnalysis.internalMemo.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                        aiAnalysis.internalMemo.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        aiAnalysis.internalMemo.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'}
                    `}>
                      {aiAnalysis.internalMemo.priority || 'normal'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Subject:</p>
                    <p className="text-white font-medium">{aiAnalysis.internalMemo.subject || 'Claim Review'}</p>
                  </div>
                </div>

                {/* Summary */}
                {aiAnalysis.internalMemo.summary && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Summary</h4>
                    <p className="text-gray-300">{aiAnalysis.internalMemo.summary}</p>
                  </div>
                )}

                {/* Key Findings */}
                {aiAnalysis.internalMemo.keyFindings && aiAnalysis.internalMemo.keyFindings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Findings</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiAnalysis.internalMemo.keyFindings.map((finding, idx) => (
                        <li key={idx} className="text-gray-300">{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.internalMemo.recommendations && aiAnalysis.internalMemo.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiAnalysis.internalMemo.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-gray-300">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Actions */}
                {aiAnalysis.internalMemo.requiredActions && aiAnalysis.internalMemo.requiredActions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Required Actions</h4>
                    <div className="space-y-2">
                      {aiAnalysis.internalMemo.requiredActions.map((action, idx) => (
                        <div key={idx} className="bg-gray-700/30 rounded-lg p-3">
                          <p className="text-white font-medium">{action.action}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>Responsible: {action.responsible}</span>
                            <span>Deadline: {action.deadline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}
        </>
      ) : (
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardBody className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No AI analysis available yet</p>
            <Button
              variant="primary"
              onClick={runAIAnalysis}
              disabled={analyzingWithAI}
            >
              <Brain className="w-4 h-4 mr-2" />
              Run AI Analysis
            </Button>
          </CardBody>
        </Card>
      )}
      
      {/* Refresh Analysis Button */}
      {aiAnalysis && !analyzingWithAI && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={runAIAnalysis}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-run Analysis
          </Button>
        </div>
      )}
    </div>
  )
  
  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-4">Uploaded Documents</h3>
          
          {claim?.documents && claim.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claim.documents.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc)}
                    <div>
                      <p className="text-white font-medium">Document {index + 1}</p>
                      <p className="text-sm text-gray-400">
                        {claim.claim_data?.documents?.[index]?.fileName || 'Uploaded file'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = doc
                        link.download = `claim-document-${index + 1}`
                        link.click()
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents uploaded</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
  
  const renderActivityTab = () => {
    const activities = [
      {
        timestamp: claim?.created_at,
        action: 'Claim Submitted',
        status: 'submitted',
        actor: 'Customer'
      },
      ...(claim?.claim_data?.ai_analysis?.analyzedAt ? [{
        timestamp: claim.claim_data.ai_analysis.analyzedAt,
        action: 'AI Analysis Completed',
        status: 'ai_analyzed',
        actor: 'System'
      }] : []),
      ...(claim?.updated_at !== claim?.created_at ? [{
        timestamp: claim?.updated_at,
        action: `Status changed to ${claim?.status}`,
        status: claim?.status,
        actor: claim?.updated_by === claim?.customer_id ? 'Customer' : 'Insurer'
      }] : [])
    ].filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardBody>
            <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
            
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${activity.status === 'submitted' ? 'bg-blue-500/20' :
                          activity.status === 'ai_analyzed' ? 'bg-purple-500/20' :
                          activity.status === 'approved' ? 'bg-green-500/20' :
                          activity.status === 'rejected' ? 'bg-red-500/20' :
                          'bg-gray-700/50'}
                      `}>
                        {activity.status === 'ai_analyzed' ? (
                          <Brain className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Activity className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white">{activity.action}</h4>
                          <span className="text-xs text-gray-500">
                            {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs">{activity.status}</Badge>
                          <span className="text-xs text-gray-500">by {activity.actor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity recorded yet</p>
                </div>
              )}
            </div>

            {/* Status Transition Buttons */}
            {claim?.status !== 'closed' && claim?.status !== 'settled' && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {claim?.status === 'submitted' && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate('processing')}
                        disabled={updating}
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Start Processing
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate('under_review')}
                        disabled={updating}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Mark for Review
                      </Button>
                    </>
                  )}
                  
                  {(claim?.status === 'processing' || claim?.status === 'under_review') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setComment('')
                        setShowInfoRequestModal(true)
                      }}
                      disabled={updating}
                    >
                      <Info className="w-4 h-4 mr-1" />
                      Request More Info
                    </Button>
                  )}
                  
                  {claim?.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusUpdate('settled')}
                      disabled={updating}
                      className="bg-gradient-to-r from-emerald-500 to-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark as Settled
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Payment Information (if approved) */}
        {claim?.status === 'approved' && claim?.claim_data?.payment_reference && (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Payment Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Settlement Amount</p>
                  <p className="text-lg font-semibold text-white">
                    ₦{claim.claim_data.settlement_amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Method</p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {claim.claim_data.payment_method?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Status</p>
                  <Badge className={`
                    ${claim.claim_data.payment_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      claim.claim_data.payment_status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-500/20 text-gray-400'}
                  `}>
                    {claim.claim_data.payment_status || 'Pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Reference</p>
                  <p className="text-sm font-mono text-gray-300">
                    {claim.claim_data.payment_reference || 'N/A'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link to="/insurer/claims">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span>Claim Details</span>
          </div>
        }
        description={`Claim #${claim?.claim_data?.claimNumber || 'Loading...'}`}
        actions={
          <div className="flex gap-3">
            {claim?.status !== 'approved' && claim?.status !== 'rejected' && claim?.status !== 'closed' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectionModal(true)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowApprovalModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" className="mb-6" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        <Badge className={`bg-${getStatusColor(claim?.status)}-500/20 text-${getStatusColor(claim?.status)}-400 border-${getStatusColor(claim?.status)}-500/30`}>
          {claim?.status}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'ai-analysis' && renderAIAnalysisTab()}
      {activeTab === 'documents' && renderDocumentsTab()}
      {activeTab === 'activity' && renderActivityTab()}

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Claim"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Claim Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Claim Number:</span>
                <span className="text-white">{claim?.claim_data?.claimNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Requested Amount:</span>
                <span className="text-white">₦{claim?.claim_data?.estimatedAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Level:</span>
                <span className={`
                  ${aiAnalysis?.fraudAssessment?.riskLevel === 'high' ? 'text-red-400' :
                    aiAnalysis?.fraudAssessment?.riskLevel === 'medium' ? 'text-amber-400' :
                    'text-green-400'}
                `}>
                  {aiAnalysis?.fraudAssessment?.riskLevel || 'Not analyzed'}
                </span>
              </div>
            </div>
          </div>

          <FormInput
            label="Settlement Amount"
            type="number"
            value={settlementAmount}
            onChange={(e) => setSettlementAmount(e.target.value)}
            placeholder="Enter approved amount"
            required
          />

          <FormInput
            label="Deductible (if any)"
            type="number"
            value={deductible}
            onChange={(e) => setDeductible(e.target.value)}
            placeholder="0"
          />

          <FormSelect
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'card', label: 'Card Payment' },
              { value: 'mobile_money', label: 'Mobile Money' }
            ]}
          />

          <FormTextArea
            label="Approval Notes (Optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any notes about this approval..."
            rows={3}
          />

          <Alert type="info">
            <Info className="w-4 h-4" />
            <span>Approving this claim will automatically initiate payment to the customer.</span>
          </Alert>

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowApprovalModal(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusUpdate('approved')}
              disabled={updating || !settlementAmount}
              className="bg-gradient-to-r from-emerald-500 to-green-600"
            >
              {updating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        isOpen={showBankDetailsModal}
        onClose={() => {
          setShowBankDetailsModal(false)
          // Reset bank details on close
          setBankDetails({
            bank_code: '',
            account_number: '',
            account_name: ''
          })
        }}
        title="Customer Bank Details Required"
        size="md"
      >
        <div className="space-y-4">
          <Alert type="info">
            <Info className="w-4 h-4" />
            <span>Bank details are required for bank transfer settlements.</span>
          </Alert>

          <FormSelect
            label="Bank"
            value={bankDetails.bank_code}
            onChange={(e) => {
              setBankDetails({ 
                ...bankDetails, 
                bank_code: e.target.value,
                account_name: '' // Reset account name when bank changes
              })
            }}
            options={[
              { value: '', label: 'Select a bank' },
              ...banks.map(bank => ({ value: bank.code, label: bank.name }))
            ]}
            required
          />

          <FormInput
            label="Account Number"
            value={bankDetails.account_number}
            onChange={(e) => {
              setBankDetails({ 
                ...bankDetails, 
                account_number: e.target.value,
                account_name: '' // Reset account name when account number changes
              })
            }}
            placeholder="Enter account number"
            maxLength="10"
            pattern="[0-9]*"
            required
          />

          {bankDetails.account_name && bankDetails.account_name.trim() !== '' && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">Verified Account Name</p>
              <p className="text-white font-medium">{bankDetails.account_name}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={verifyBankAccount}
              disabled={!bankDetails.bank_code || !bankDetails.account_number || bankDetails.account_number.length < 10 || verifyingBank}
            >
              {verifyingBank ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Account'
              )}
            </Button>
            
            {bankDetails.account_name && (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Account verified
              </span>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowBankDetailsModal(false)
                setBankDetails({
                  bank_code: '',
                  account_number: '',
                  account_name: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (bankDetails.account_name && bankDetails.account_name.trim() !== '') {
                  setShowBankDetailsModal(false)
                  handleStatusUpdate('approved')
                }
              }}
              disabled={!bankDetails.account_name || bankDetails.account_name.trim() === '' || updating}
            >
              {updating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Continue with Approval'
              )}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Reject Claim"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Please provide a reason for rejecting this claim.
          </p>
          <FormSelect
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            options={[
              { value: '', label: 'Select a reason' },
              { value: 'incomplete_documentation', label: 'Incomplete Documentation' },
              { value: 'policy_exclusion', label: 'Policy Exclusion' },
              { value: 'fraud_suspected', label: 'Fraud Suspected' },
              { value: 'coverage_expired', label: 'Coverage Expired' },
              { value: 'other', label: 'Other' }
            ]}
            required
          />
          <FormTextArea
            label="Additional Comments"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Provide more details..."
            rows={3}
            required
          />
          <div className="flex gap-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setShowRejectionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStatusUpdate('rejected')}
              disabled={updating || !rejectionReason || !comment}
            >
              {updating ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Request Modal */}
      <Modal
        isOpen={showInfoRequestModal}
        onClose={() => setShowInfoRequestModal(false)}
        title="Request Additional Information"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Specify what additional information is needed from the customer.
          </p>
          <FormTextArea
            label="Information Needed"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Please describe what information or documents are required..."
            rows={4}
            required
          />
          <div className="flex gap-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setShowInfoRequestModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusUpdate('additional_info_required')}
              disabled={updating || !comment}
            >
              {updating ? 'Sending Request...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}