import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FileText, Download, MessageSquare, Clock, CheckCircle, 
  XCircle, AlertTriangle, ChevronRight, Calendar, DollarSign,
  MapPin, User, Paperclip, Eye, ArrowLeft, Send, Plus,
  Shield, TrendingUp, AlertCircle, Brain, Loader
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, LoadingSpinner, 
  Modal, Input, Alert, Select
} from '@shared/components'
import { format } from 'date-fns'

export const InsurerClaimDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState(null)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [message, setMessage] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalAmount, setApprovalAmount] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClaimDetails()
  }, [id])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch claim details
      const claimData = await supabaseHelpers.getClaim(id)
      if (!claimData) {
        setError('Claim not found')
        return
      }
      setClaim(claimData)
      setApprovalAmount(claimData.claim_data?.estimatedAmount || '')
      
      // Fetch customer profile
      if (claimData.customer_id) {
        const profile = await supabaseHelpers.getProfile(claimData.customer_id)
        setCustomerProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching claim details:', error)
      setError('Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setProcessing(true)
    setError('')
    
    try {
      await supabaseHelpers.updateClaim(id, {
        status: 'approved',
        claim_data: {
          ...claim.claim_data,
          approvedAmount: parseFloat(approvalAmount),
          approvedBy: user.id,
          approvedAt: new Date().toISOString()
        }
      })
      
      // Create notification for customer
      await supabaseHelpers.createClaimNotification(
        claim.customer_id,
        id,
        'claim_approved',
        'Claim Approved',
        `Your claim #${claim.claim_data?.claimNumber} has been approved for ₦${parseFloat(approvalAmount).toLocaleString('en-NG')}.`,
        { approvedAmount: parseFloat(approvalAmount) }
      )
      
      setSuccess('Claim approved successfully')
      setShowApprovalModal(false)
      
      // Refresh claim data
      fetchClaimDetails()
      
    } catch (error) {
      console.error('Error approving claim:', error)
      setError('Failed to approve claim')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    
    setProcessing(true)
    setError('')
    
    try {
      await supabaseHelpers.updateClaim(id, {
        status: 'rejected',
        claim_data: {
          ...claim.claim_data,
          rejectionReason,
          rejectedBy: user.id,
          rejectedAt: new Date().toISOString()
        }
      })
      
      // Create notification for customer
      await supabaseHelpers.createClaimNotification(
        claim.customer_id,
        id,
        'claim_rejected',
        'Claim Rejected',
        `Your claim #${claim.claim_data?.claimNumber} has been rejected. Reason: ${rejectionReason}`,
        { rejectionReason }
      )
      
      setSuccess('Claim rejected')
      setShowRejectionModal(false)
      setRejectionReason('')
      
      // Refresh claim data
      fetchClaimDetails()
      
    } catch (error) {
      console.error('Error rejecting claim:', error)
      setError('Failed to reject claim')
    } finally {
      setProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setProcessing(true)
    try {
      await supabaseHelpers.createClaimNotification(
        claim.customer_id,
        id,
        'message',
        'New Message from Adjuster',
        message,
        { fromAdjuster: true }
      )
      
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
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

  if (error && !claim) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-lg text-gray-300">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/insurer/claims')} className="mt-4">
            Back to Claims
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`Claim #${claim?.claim_data?.claimNumber || id}`}
        description="Review and process insurance claim"
        actions={
          <div className="flex gap-3">
            <Link to="/insurer/claims">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Claims
              </Button>
            </Link>
            {claim?.status === 'submitted' && (
              <>
                <Button 
                  variant="danger" 
                  onClick={() => setShowRejectionModal(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => setShowApprovalModal(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      {success && (
        <Alert type="success" title="Success" className="mb-6">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Overview */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">Claim Overview</h2>
                <Badge variant={getStatusColor(claim.status)}>
                  {getStatusIcon(claim.status)}
                  <span className="ml-2">{claim.status}</span>
                </Badge>
              </div>
            </div>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Claim Type</p>
                    <p className="font-medium text-gray-100 capitalize">
                      {claim.claim_data?.claimType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Incident Date</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {claim.claim_data?.incidentDate 
                        ? format(new Date(claim.claim_data.incidentDate), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Date Submitted</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Estimated Amount</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {formatCurrency(claim.claim_data?.estimatedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="font-medium text-gray-100 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      {claim.claim_data?.incidentLocation || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Claimant</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {claim.claim_data?.claimantName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-medium text-gray-100 mb-3">Damage Description</h3>
                <p className="text-gray-300 leading-relaxed">
                  {claim.claim_data?.damageDescription || 'No description provided'}
                </p>
              </div>

              {/* Vehicle Info if applicable */}
              {claim.claim_data?.vehicleInfo && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="font-medium text-gray-100 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Make</p>
                      <p className="font-medium text-gray-100">
                        {claim.claim_data.vehicleInfo.make || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Model</p>
                      <p className="font-medium text-gray-100">
                        {claim.claim_data.vehicleInfo.model || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Year</p>
                      <p className="font-medium text-gray-100">
                        {claim.claim_data.vehicleInfo.year || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">License Plate</p>
                      <p className="font-medium text-gray-100">
                        {claim.claim_data.vehicleInfo.licensePlate || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* AI Analysis */}
          {claim.claim_data?.aiAnalysis && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-semibold text-gray-100">AI Analysis</h2>
                </div>
              </div>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                    <p className={`font-bold text-lg ${getRiskLevelColor(
                      claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel
                    )}`}>
                      {claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Fraud Score</p>
                    <p className="font-bold text-lg text-gray-100">
                      {(claim.claim_data.aiAnalysis.fraudAssessment?.fraudScore * 100 || 0).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Confidence</p>
                    <p className="font-bold text-lg text-gray-100">
                      {claim.claim_data.aiAnalysis.extractedData?.confidence || 'N/A'}
                    </p>
                  </div>
                </div>

                {claim.claim_data.aiAnalysis.fraudAssessment?.redFlags && (
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">Red Flags</h4>
                    <ul className="space-y-2">
                      {claim.claim_data.aiAnalysis.fraudAssessment.redFlags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                          <span className="text-sm text-gray-300">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {claim.claim_data.aiAnalysis.categorization?.processingRecommendations && (
                  <div className="mt-4">
                    <h4 className="font-medium text-cyan-400 mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {claim.claim_data.aiAnalysis.categorization.processingRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                          <span className="text-sm text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Documents */}
          {claim.documents && claim.documents.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100">Supporting Documents</h2>
              </div>
              <CardBody>
                <div className="space-y-3">
                  {claim.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-100">Document {index + 1}</p>
                          <p className="text-xs text-gray-400">Uploaded on submission</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
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
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setShowMessageModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Quick Actions</h2>
            </div>
            <CardBody className="space-y-3">
              <Button variant="secondary" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Request Additional Docs
              </Button>
              <Button variant="secondary" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Flag for Investigation
              </Button>
              <Button variant="secondary" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Claim History
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Claim"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Approval Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
                placeholder="Enter approved amount"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Original requested amount: {formatCurrency(claim?.claim_data?.estimatedAmount)}
            </p>
          </div>

          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowApprovalModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              loading={processing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Claim
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white resize-none"
              placeholder="Explain why this claim is being rejected..."
            />
          </div>

          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowRejectionModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={processing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Claim
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
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white resize-none"
              placeholder="Type your message here..."
            />
          </div>

          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
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