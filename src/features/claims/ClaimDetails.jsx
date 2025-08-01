import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { NairaIcon } from '@shared/components'
import { 
  FileText, Download, MessageSquare, Clock, CheckCircle, 
  XCircle, AlertCircle, ChevronRight, Calendar, DollarSign,
  MapPin, User, Paperclip, Eye, ArrowLeft, Send, Plus,
  Shield, Activity, Brain, Sparkles, Upload, Image,
  File, Star, TrendingUp, Zap, MoreVertical, Phone,
  AlertTriangle, Info, Archive, Hash, Mail, ChevronDown,
  ChevronUp, Trash2, FileImage, Loader2
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, LoadingSpinner, 
  Modal, Input, Alert 
} from '@shared/components'
import {
  FormTextArea, FormInput, FormSelect
} from '@shared/components/FormComponents'
import { format } from 'date-fns'

export const ClaimDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showInfoResponseModal, setShowInfoResponseModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeEvidence, setDisputeEvidence] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)
  const [infoResponse, setInfoResponse] = useState('')
  const [submittingInfo, setSubmittingInfo] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    documents: true,
    timeline: true,
    payment: true
  })

  useEffect(() => {
    fetchClaimDetails()
  }, [id])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseHelpers.getClaim(id)
      
      if (error) {
        setError('Failed to load claim details')
        return
      }

      // Verify this claim belongs to the user
      if (data?.customer_id !== user?.id) {
        setError('Unauthorized access')
        navigate('/customer/claims')
        return
      }

      setClaim(data)
    } catch (err) {
      console.error('Error fetching claim:', err)
      setError('Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      setError('Please provide a reason for your dispute')
      return
    }

    setSubmittingDispute(true)
    setError(null)

    try {
      // Update claim status to disputed
      const { data, error } = await supabaseHelpers.updateClaimStatus(
        claim.id,
        'disputed',
        {
          claim_data: {
            ...claim.claim_data,
            dispute: {
              reason: disputeReason,
              evidence: disputeEvidence,
              submitted_at: new Date().toISOString(),
              submitted_by: user.id
            }
          }
        }
      )

      if (error) throw error

      // Create notification
      await supabaseHelpers.createNotification({
        user_id: user.id,
        type: 'claim_update',
        title: 'Dispute Submitted',
        message: `Your dispute for claim ${claim.claim_data.claimNumber} has been submitted for review.`,
        data: { 
          claimId: claim.id,
          status: 'disputed' 
        }
      })

      setSuccess('Dispute submitted successfully. We will review and get back to you.')
      setShowDisputeModal(false)
      fetchClaimDetails() // Refresh claim data

    } catch (err) {
      console.error('Dispute submission error:', err)
      setError(err.message || 'Failed to submit dispute')
    } finally {
      setSubmittingDispute(false)
    }
  }

  const handleInfoResponse = async () => {
    if (!infoResponse.trim()) {
      setError('Please provide the requested information')
      return
    }

    setSubmittingInfo(true)
    setError(null)

    try {
      // Update claim with additional info
      const { data, error } = await supabaseHelpers.updateClaim(claim.id, {
        claim_data: {
          ...claim.claim_data,
          additional_info: {
            ...claim.claim_data.additional_info,
            [new Date().toISOString()]: {
              response: infoResponse,
              submitted_by: user.id
            }
          }
        },
        status: 'processing' // Move back to processing after info provided
      })

      if (error) throw error

      setSuccess('Information submitted successfully.')
      setShowInfoResponseModal(false)
      fetchClaimDetails()

    } catch (err) {
      console.error('Info submission error:', err)
      setError(err.message || 'Failed to submit information')
    } finally {
      setSubmittingInfo(false)
    }
  }

  const downloadReceipt = () => {
    // In production, generate PDF receipt
    alert('Receipt download will be implemented soon')
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
    if (!fileName) return <File className="w-5 h-5 text-gray-400" />
    const ext = fileName.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <Image className="w-5 h-5 text-purple-400" />
    }
    return <File className="w-5 h-5 text-blue-400" />
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const renderClaimStatus = () => {
    const statusConfig = {
      submitted: { color: 'blue', icon: Clock, text: 'Submitted' },
      processing: { color: 'cyan', icon: Activity, text: 'Processing' },
      under_review: { color: 'purple', icon: Eye, text: 'Under Review' },
      additional_info_required: { color: 'amber', icon: Info, text: 'Info Required' },
      approved: { color: 'emerald', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: XCircle, text: 'Rejected' },
      disputed: { color: 'orange', icon: AlertTriangle, text: 'Disputed' },
      settled: { color: 'green', icon: DollarSign, text: 'Settled' },
      closed: { color: 'gray', icon: Archive, text: 'Closed' }
    }

    const config = statusConfig[claim?.status] || statusConfig.submitted
    const StatusIcon = config.icon

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-${config.color}-500/20 rounded-xl`}>
              <StatusIcon className={`w-6 h-6 text-${config.color}-400`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Claim Status: {config.text}
              </h3>
              <p className="text-sm text-gray-400">
                Last updated: {claim.updated_at && !isNaN(new Date(claim.updated_at).getTime()) 
                ? format(new Date(claim.updated_at), 'MMM d, yyyy h:mm a')
                : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Action buttons based on status */}
          <div className="flex gap-2">
            {claim?.status === 'additional_info_required' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInfoResponseModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Provide Information
              </Button>
            )}
            
            {claim?.status === 'rejected' && (
              <Button
                variant="secondary"
                onClick={() => setShowDisputeModal(true)}
                className="hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Dispute Decision
              </Button>
            )}
            
            {claim?.status === 'approved' && !claim?.claim_data?.payment_id && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
                Payment Processing
              </Badge>
            )}
            
            {claim?.status === 'settled' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReceipt()}
              >
                <Download className="w-4 h-4 mr-1" />
                Download Receipt
              </Button>
            )}
          </div>
        </div>

        {/* Additional status-specific information */}
        {claim?.status === 'additional_info_required' && claim?.info_request && (
          <Alert type="warning" className="mt-4">
            <AlertCircle className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">Information Required:</p>
              <p className="text-sm mt-1">{claim.info_request}</p>
            </div>
          </Alert>
        )}

        {claim?.status === 'rejected' && claim?.rejection_reason && (
          <Alert type="error" className="mt-4">
            <XCircle className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">Rejection Reason:</p>
              <p className="text-sm mt-1">{claim.rejection_reason}</p>
              {claim?.rejection_comment && (
                <p className="text-sm mt-2 text-gray-400">{claim.rejection_comment}</p>
              )}
            </div>
          </Alert>
        )}

        {claim?.status === 'disputed' && claim?.claim_data?.dispute && (
          <Alert type="info" className="mt-4">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">Dispute Under Review</p>
              <p className="text-sm mt-1">
               Submitted on {claim.claim_data.dispute.submitted_at && !isNaN(new Date(claim.claim_data.dispute.submitted_at).getTime())
                ? format(new Date(claim.claim_data.dispute.submitted_at), 'MMM d, yyyy')
                : 'Date not available'}
              </p>
            </div>
          </Alert>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-24 h-24 rounded-full border-4 border-gray-700/50"></div>
              <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0"></div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute inset-2 animation-delay-150"></div>
              <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin absolute inset-4 animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-400 animate-pulse">Loading claim details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!claim) {
    return (
      <DashboardLayout>
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardBody className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Claim Not Found</h2>
            <p className="text-gray-400 mb-6">The claim you're looking for doesn't exist or has been removed.</p>
            <Link to="/customer/claims">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Claims
              </Button>
            </Link>
          </CardBody>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/30 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link to="/customer/claims">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span>Claim Details</span>
          </div>
        }
        description={`Claim #${claim?.claim_data?.claimNumber || 'Loading...'}`}
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

      {/* Status Display */}
      {renderClaimStatus()}

      {/* Claim Details */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6">
        <CardBody>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('details')}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Claim Information
            </h3>
            {expandedSections.details ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.details && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Claim Number</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  {claim.claim_data?.claimNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Claim Type</p>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {claim.claim_data?.claimType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Date of Incident</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {claim.claim_data?.dateOfIncident && !isNaN(new Date(claim.claim_data.dateOfIncident).getTime())
                    ? format(new Date(claim.claim_data.dateOfIncident), 'MMM d, yyyy')
                    : 'Date not available'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Estimated Amount</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <NairaIcon className="w-4 h-4 text-gray-400" />
                  ₦{claim.claim_data?.estimatedAmount?.toLocaleString()}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-1">Location</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {claim.claim_data?.location}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-white">{claim.claim_data?.description}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* AI Analysis (if available) */}
      {claim.claim_data?.aiAnalysis && (
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                <Badge className={`
                  ${claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}
                `}>
                  {claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel || 'Low'}
                </Badge>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                <p className="text-xl font-bold text-white">{claim.claim_data.aiAnalysis.fraudAssessment?.riskScore || 0}%</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Priority</p>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {claim.claim_data.aiAnalysis.categorization?.priority?.level || 'Normal'}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Documents */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6">
        <CardBody>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('documents')}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-purple-400" />
              Documents ({claim.claim_data?.documents?.length || 0})
            </h3>
            {expandedSections.documents ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.documents && (
            <div className="mt-6">
              {claim.claim_data?.documents && claim.claim_data.documents.length > 0 ? (
                <div className="space-y-3">
                  {claim.claim_data.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.fileName)}
                        <div>
                          <p className="text-white font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-400">
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No documents uploaded</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Timeline */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6">
        <CardBody>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('timeline')}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Activity Timeline
            </h3>
            {expandedSections.timeline ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.timeline && (
            <div className="mt-6 space-y-4">
              {claim.claim_data?.audit_trail && claim.claim_data.audit_trail.length > 0 ? (
                [...claim.claim_data.audit_trail].reverse().map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry.action === 'claim_created' ? 'bg-blue-500/20 text-blue-400' :
                        entry.action === 'status_changed' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        <Activity className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {entry.action === 'claim_created' ? 'Claim Submitted' :
                         entry.action === 'status_changed' ? `Status changed to ${entry.details?.to_status}` :
                         entry.action}
                      </p>
                      <p className="text-sm text-gray-400">
                        {entry.timestamp && !isNaN(new Date(entry.timestamp).getTime())
                          ? format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')
                          : 'Time not available'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">No activity recorded</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Information (if approved) */}
      {claim?.status === 'approved' && claim?.claim_data?.payment_id && (
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardBody>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('payment')}
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <NairaIcon className="w-5 h-5 text-emerald-400" />
                Payment Information
              </h3>
              {expandedSections.payment ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSections.payment && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Settlement Amount</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ₦{claim.claim_data.settlement_amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Deductible</p>
                  <p className="text-lg font-medium text-white">
                    ₦{claim.claim_data.deductible?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Payment Method</p>
                  <p className="text-white font-medium capitalize">
                    {claim.claim_data.payment_method?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Payment Status</p>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Processing
                  </Badge>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Dispute Claim Decision"
        size="md"
      >
        <div className="space-y-4">
          <Alert type="info">
            <Info className="w-4 h-4 mr-2" />
            Please provide detailed information to support your dispute. Our team will review and respond within 2-3 business days.
          </Alert>

          {claim?.rejection_reason && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-400 mb-2">Rejection Reason</h4>
              <p className="text-sm text-gray-300">{claim.rejection_reason}</p>
              {claim?.rejection_comment && (
                <p className="text-sm text-gray-400 mt-2">{claim.rejection_comment}</p>
              )}
            </div>
          )}

          <FormTextArea
            label="Reason for Dispute"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Explain why you believe this decision should be reconsidered..."
            rows={4}
            required
            error={error && !disputeReason ? 'This field is required' : null}
          />

          <FormTextArea
            label="Additional Evidence or Information (Optional)"
            value={disputeEvidence}
            onChange={(e) => setDisputeEvidence(e.target.value)}
            placeholder="Provide any additional information that supports your case..."
            rows={3}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowDisputeModal(false)}
              disabled={submittingDispute}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDispute}
              disabled={submittingDispute || !disputeReason.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              {submittingDispute ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Response Modal */}
      <Modal
        isOpen={showInfoResponseModal}
        onClose={() => setShowInfoResponseModal(false)}
        title="Provide Additional Information"
        size="md"
      >
        <div className="space-y-4">
          {claim?.info_request && (
            <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-400 mb-2">Information Requested</h4>
              <p className="text-sm text-gray-300">{claim.info_request}</p>
            </div>
          )}

          <FormTextArea
            label="Your Response"
            value={infoResponse}
            onChange={(e) => setInfoResponse(e.target.value)}
            placeholder="Provide the requested information..."
            rows={5}
            required
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowInfoResponseModal(false)}
              disabled={submittingInfo}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleInfoResponse}
              disabled={submittingInfo || !infoResponse.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {submittingInfo ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Information
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </DashboardLayout>
  )
}