import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FileText, Calendar, MapPin, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Clock, MessageSquare, ChevronLeft,
  Send, Loader, Upload, Download, ExternalLink, Shield,
  Brain, TrendingUp, AlertCircle, Eye
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, LoadingSpinner, 
  Modal, Alert, Tabs, TabsList, TabsTrigger, TabsContent 
} from '@shared/components'
import { format } from 'date-fns'
import { supabaseHelpers } from '@services/supabase'
import { useAuth } from '@contexts/AuthContext'

export const InsurerClaimDetails = () => {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState(null)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Modal states
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  
  // Form states
  const [decision, setDecision] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [message, setMessage] = useState('')
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    fetchClaimDetails()
  }, [claimId])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch claim details
      const { data: claimData, error: claimError } = await supabaseHelpers.getClaim(claimId)
      
      if (claimError) throw claimError
      if (!claimData) throw new Error('Claim not found')
      
      setClaim(claimData)
      
      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabaseHelpers.getProfile(claimData.customer_id)
      
      if (!profileError && profileData) {
        setCustomerProfile(profileData)
      }
      
    } catch (error) {
      console.error('Error fetching claim details:', error)
      setError(error.message || 'Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async () => {
    if (!decision || !decisionReason) {
      alert('Please select a decision and provide a reason')
      return
    }

    setProcessing(true)
    setError('')
    
    try {
      // Update claim with decision
      const updatedClaim = {
        status: decision,
        insurer_id: user.id,
        claim_data: {
          ...claim.claim_data,
          decision: {
            status: decision,
            reason: decisionReason,
            decidedBy: user.id,
            decidedAt: new Date().toISOString()
          }
        }
      }
      
      const { data, error } = await supabaseHelpers.updateClaim(claimId, updatedClaim)
      
      if (error) throw error
      
      // Create notification for customer
      const notificationTitle = decision === 'approved' 
        ? 'Claim Approved!' 
        : 'Claim Update'
      
      const notificationMessage = decision === 'approved'
        ? `Your claim ${claim.claim_data.claimNumber} has been approved. ${decisionReason}`
        : `Your claim ${claim.claim_data.claimNumber} has been reviewed. ${decisionReason}`
      
      await supabaseHelpers.createClaimNotification(
        claim.customer_id,
        claimId,
        'claim_update',
        notificationTitle,
        notificationMessage,
        { 
          status: decision,
          decidedBy: user.email 
        }
      )
      
      setSuccess(`Claim ${decision} successfully!`)
      setClaim(data)
      setShowDecisionModal(false)
      setDecision('')
      setDecisionReason('')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/insurer/claims')
      }, 2000)
      
    } catch (error) {
      console.error('Error processing decision:', error)
      setError(error.message || 'Failed to process decision')
    } finally {
      setProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setProcessing(true)
    try {
      // Create notification for customer
      await supabaseHelpers.createClaimNotification(
        claim.customer_id,
        claimId,
        'message',
        'New Message from Insurer',
        message,
        { 
          from: user.email,
          timestamp: new Date().toISOString()
        }
      )
      
      // Update claim with message in history
      const messageHistory = claim.claim_data.messages || []
      messageHistory.push({
        id: Date.now().toString(),
        sender: user.email,
        role: 'insurer',
        message: message,
        timestamp: new Date().toISOString()
      })
      
      await supabaseHelpers.updateClaim(claimId, {
        claim_data: {
          ...claim.claim_data,
          messages: messageHistory
        }
      })
      
      setSuccess('Message sent successfully')
      setMessage('')
      setShowMessageModal(false)
      
      // Refresh claim data
      fetchClaimDetails()
      
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-5 h-5" />
      case 'processing':
        return <Loader className="w-5 h-5 animate-spin" />
      case 'approved':
        return <CheckCircle className="w-5 h-5" />
      case 'rejected':
        return <XCircle className="w-5 h-5" />
      case 'flagged':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'secondary'
      case 'processing':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'danger'
      case 'flagged':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-orange-400'
      case 'critical':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!claim) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">Claim not found</h3>
          <Link to="/insurer/claims">
            <Button variant="primary">Back to Claims</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const aiAnalysis = claim.claim_data?.aiAnalysis

  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/insurer/claims')}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span>Claim #{claim.claim_data?.claimNumber || claimId.slice(0, 8)}</span>
          </div>
        }
        description={`Submitted on ${format(new Date(claim.created_at), 'MMM d, yyyy')}`}
        actions={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowMessageModal(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Customer
            </Button>
            {claim.status === 'submitted' || claim.status === 'processing' ? (
              <Button
                variant="primary"
                onClick={() => setShowDecisionModal(true)}
              >
                Make Decision
              </Button>
            ) : null}
          </div>
        }
      />

      {error && (
        <Alert type="error" title="Error" className="mb-6 bg-red-900/20 border-red-500/50">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" title="Success" className="mb-6 bg-green-900/20 border-green-500/50">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Claim Status</h2>
                <Badge variant={getStatusColor(claim.status)}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(claim.status)}
                    <span className="capitalize">{claim.status}</span>
                  </div>
                </Badge>
              </div>
              
              {claim.claim_data?.decision && (
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-300 mb-1">Decision Reason</p>
                  <p className="text-gray-100">{claim.claim_data.decision.reason}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Decided on {format(new Date(claim.claim_data.decision.decidedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* AI Analysis */}
          {aiAnalysis && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  AI Analysis Results
                </h2>
              </div>
              <CardBody>
                <Tabs defaultValue="fraud" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="fraud">Fraud Assessment</TabsTrigger>
                    <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fraud" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                        <p className="text-2xl font-bold text-gray-100">
                          {(aiAnalysis.fraudAssessment?.score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="p-4 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                        <p className={`text-2xl font-bold capitalize ${getRiskLevelColor(aiAnalysis.fraudAssessment?.riskLevel)}`}>
                          {aiAnalysis.fraudAssessment?.riskLevel}
                        </p>
                      </div>
                    </div>
                    
                    {aiAnalysis.fraudAssessment?.flags?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-100 mb-2">Risk Indicators</h4>
                        <ul className="space-y-2">
                          {aiAnalysis.fraudAssessment.flags.map((flag, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-300">{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="extracted" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(aiAnalysis.extractedData || {}).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-gray-100 font-medium">{value || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="space-y-3">
                    {aiAnalysis.recommendations?.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
                
                {aiAnalysis.processingTime && (
                  <p className="text-xs text-gray-500 mt-4">
                    AI processing completed in {(aiAnalysis.processingTime / 1000).toFixed(2)}s
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          {/* Claim Details */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Claim Details</h2>
            </div>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Claim Type</p>
                  <p className="font-medium text-gray-100 capitalize">{claim.claim_data?.claimType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Incident Date</p>
                  <p className="font-medium text-gray-100">
                    {claim.claim_data?.incidentDate 
                      ? format(new Date(claim.claim_data.incidentDate), 'MMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Estimated Amount</p>
                  <p className="font-medium text-gray-100">
                    {formatCurrency(claim.claim_data?.estimatedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p className="font-medium text-gray-100">
                    {claim.claim_data?.incidentLocation || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Description</p>
                <p className="text-gray-100">{claim.claim_data?.damageDescription}</p>
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          {claim.documents?.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100">
                  Documents ({claim.documents.length})
                </h2>
              </div>
              <CardBody>
                <div className="space-y-3">
                  {claim.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="font-medium text-gray-100">
                            Document {index + 1}
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded with claim
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Customer Information</h2>
            </div>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Name</p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.email || claim.customer_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Phone</p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Member Since</p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.created_at 
                    ? format(new Date(customerProfile.created_at), 'MMM yyyy')
                    : 'N/A'}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Quick Actions</h2>
            </div>
            <CardBody className="space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/insurer/customers/${claim.customer_id}`)}
              >
                View Customer Profile
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.print()}
              >
                Print Claim Details
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Make Claim Decision"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDecision('approved')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'approved' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-600 hover:border-green-500'
                }`}
              >
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="font-medium">Approve</p>
              </button>
              <button
                onClick={() => setDecision('rejected')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'rejected' 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-gray-600 hover:border-red-500'
                }`}
              >
                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="font-medium">Reject</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason / Notes
            </label>
            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Provide reason for your decision..."
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDecisionModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDecision}
              loading={processing}
              disabled={!decision || !decisionReason || processing}
            >
              Confirm Decision
            </Button>
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Send Message to Customer"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Type your message to the customer..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowMessageModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              loading={processing}
              disabled={!message.trim() || processing}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default InsurerClaimDetails