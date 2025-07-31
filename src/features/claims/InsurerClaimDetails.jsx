import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, FileText, Calendar, MapPin, DollarSign,
  Clock, User, Mail, Phone, Download, Eye, Paperclip,
  CheckCircle, XCircle, AlertTriangle, Shield, Brain,
  Activity, TrendingUp, MessageSquare, Send, Archive,
  ChevronDown, ChevronUp, Sparkles, Info, FileImage,
  File, Camera, Hash, Building, Flag, Zap, CreditCard,
  Loader2
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader, StatsCard } from '@shared/layouts'
import { 
  Button, Card, CardBody, Alert, Badge, 
  LoadingSpinner, Modal, Tabs 
} from '@shared/components'
import {
  FormTextArea, FormSelect, FormGroup, FormInput
} from '@shared/components/FormComponents'
import { format } from 'date-fns'

export const InsurerClaimDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [claim, setClaim] = useState(null)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showInfoRequestModal, setShowInfoRequestModal] = useState(false)
  const [comment, setComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [settlementAmount, setSettlementAmount] = useState('')
  const [deductible, setDeductible] = useState(5000)
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    documents: true,
    ai: true,
    history: true
  })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'activity', label: 'Activity', icon: Activity }
  ]

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

      setClaim(data)
      
      // Fetch customer profile
      if (data?.customer_id) {
        const { data: profile } = await supabaseHelpers.getProfile(data.customer_id)
        setCustomerProfile(profile)
      }
    } catch (err) {
      console.error('Error fetching claim:', err)
      setError('Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!claim) return
    
    setUpdating(true)
    setError(null)
    
    try {
      let updateData = {
        status: newStatus,
        updated_by: user.id
      }
      
      // Add status-specific data
      if (newStatus === 'rejected') {
        if (!rejectionReason || !comment) {
          setError('Please provide rejection reason and comments')
          setUpdating(false)
          return
        }
        updateData.rejection_reason = rejectionReason
        updateData.rejection_comment = comment
      }
      
      if (newStatus === 'approved') {
        const claimAmount = claim.claim_data?.estimatedAmount || 0
        const finalSettlement = settlementAmount || (claimAmount - deductible)
        
        updateData.claim_data = {
          ...claim.claim_data,
          approved_amount: finalSettlement,
          deductible: deductible,
          payment_method: paymentMethod,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        }
      }
      
      if (newStatus === 'additional_info_required') {
        updateData.info_request = comment
      }
      
      // Update claim status using enhanced helper
      const { data, error } = await supabaseHelpers.updateClaimStatus(
        claim.id, 
        newStatus, 
        updateData
      )
      
      if (error) {
        throw error
      }
      
      // Show success message
      setSuccess(`Claim ${newStatus} successfully`)
      setClaim(data)
      
      // Close modals
      setShowApprovalModal(false)
      setShowRejectionModal(false)
      setShowInfoRequestModal(false)
      
      // Reset form fields
      setComment('')
      setRejectionReason('')
      setSettlementAmount('')
      
      // Refresh claim details
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
      return <FileImage className="w-5 h-5 text-cyan-400" />
    } else if (extension === 'pdf') {
      return <File className="w-5 h-5 text-red-400" />
    }
    return <FileText className="w-5 h-5 text-gray-400" />
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
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
        <Alert type="error" title="Claim not found">
          The requested claim could not be found.
        </Alert>
      </DashboardLayout>
    )
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Claim Amount"
          value={`₦${claim.claim_data?.estimatedAmount?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="emerald"
          trend={claim.claim_data?.estimatedAmount > 100000 ? 'up' : 'down'}
        />
        <StatsCard
          title="Processing Time"
          value={`${Math.floor((new Date() - new Date(claim.created_at)) / (1000 * 60 * 60 * 24))} days`}
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="Risk Score"
          value={`${claim.claim_data?.aiAnalysis?.fraudAssessment?.riskScore || 0}%`}
          icon={Shield}
          color={claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel === 'high' ? 'red' : 'emerald'}
        />
        <StatsCard
          title="Documents"
          value={claim.documents?.length || 0}
          icon={Paperclip}
          color="purple"
        />
      </div>

      {/* Customer Information */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('customer')}
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Customer Information
            </h3>
            {expandedSections.customer ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.customer && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Full Name</p>
                <p className="text-white font-medium">{customerProfile?.full_name || claim.claim_data?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {customerProfile?.email || claim.claim_data?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Phone</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {customerProfile?.phone || claim.claim_data?.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Address</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {customerProfile?.address || claim.claim_data?.address || 'Not provided'}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Claim Information */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Claim Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Claim Number</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                {claim.claim_data?.claimNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Claim Type</p>
              <Badge className={`bg-${getStatusColor(claim.claim_data?.claimType)}-500/20 text-${getStatusColor(claim.claim_data?.claimType)}-400 border-${getStatusColor(claim.claim_data?.claimType)}-500/30`}>
                {claim.claim_data?.claimType}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Date of Incident</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {format(new Date(claim.claim_data?.dateOfIncident), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
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
        </CardBody>
      </Card>
    </div>
  )

  const renderAIAnalysisTab = () => (
    <div className="space-y-6">
      {claim.claim_data?.aiAnalysis ? (
        <>
          {/* Fraud Assessment */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Fraud Risk Assessment
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Risk Level</span>
                  <Badge className={`
                    ${claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}
                  `}>
                    {claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel || 'Low'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Risk Score</span>
                  <span className="text-2xl font-bold text-white">{claim.claim_data.aiAnalysis.fraudAssessment?.riskScore || 0}%</span>
                </div>
                {claim.claim_data.aiAnalysis.fraudAssessment?.suspiciousIndicators && (
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Suspicious Indicators</p>
                    <ul className="space-y-1">
                      {claim.claim_data.aiAnalysis.fraudAssessment.suspiciousIndicators.map((indicator, index) => (
                        <li key={index} className="text-sm text-amber-400 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Categorization */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI Categorization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Category</p>
                  <p className="text-white font-medium">{claim.claim_data.aiAnalysis.categorization?.category?.primary}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Priority</p>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {claim.claim_data.aiAnalysis.categorization?.priority?.level}
                  </Badge>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Routing</p>
                  <p className="text-white font-medium">{claim.claim_data.aiAnalysis.categorization?.routing?.department}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Est. Processing Time</p>
                  <p className="text-white font-medium">{claim.claim_data.aiAnalysis.categorization?.routing?.estimatedHandlingTime}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <Alert type="info">
          No AI analysis available for this claim.
        </Alert>
      )}
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-cyan-400" />
            Uploaded Documents
          </h3>
          {claim.claim_data?.documents && claim.claim_data.documents.length > 0 ? (
            <div className="space-y-3">
              {claim.claim_data.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.fileName)}
                    <div>
                      <p className="text-white font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-400">
                        {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = doc.url
                        a.download = doc.fileName
                        a.click()
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No documents uploaded for this claim.</p>
          )}
        </CardBody>
      </Card>
    </div>
  )

  const renderActivityTab = () => {
    const auditTrail = claim?.claim_data?.audit_trail || []
    const sortedAudit = [...auditTrail].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )

    return (
      <div className="space-y-6">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardBody>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Claim Timeline
            </h3>
            
            <div className="space-y-4">
              {sortedAudit.length > 0 ? (
                sortedAudit.map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry.action === 'claim_created' ? 'bg-blue-500/20 text-blue-400' :
                        entry.action === 'status_changed' && entry.details?.to_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        entry.action === 'status_changed' && entry.details?.to_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {entry.action === 'claim_created' ? <FileText className="w-5 h-5" /> :
                         entry.action === 'status_changed' ? <Activity className="w-5 h-5" /> :
                         <Info className="w-5 h-5" />}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white">
                            {entry.action === 'claim_created' ? 'Claim Submitted' :
                             entry.action === 'status_changed' ? `Status: ${entry.details?.from_status} → ${entry.details?.to_status}` :
                             entry.action}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        
                        {entry.details?.reason && (
                          <p className="text-sm text-gray-400">
                            Reason: {entry.details.reason}
                          </p>
                        )}
                        
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>
                            {entry.user_id === claim?.customer_id ? 'Customer' : 'Insurer'}
                          </span>
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
        {claim?.status === 'approved' && claim?.claim_data?.payment_id && (
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
                  <p className="text-sm text-gray-400">Deductible</p>
                  <p className="text-lg font-semibold text-white">
                    ₦{claim.claim_data.deductible?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Status</p>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Pending
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
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
                  ${claim?.claim_data?.fraudRiskLevel === 'high' ? 'text-red-400' :
                    claim?.claim_data?.fraudRiskLevel === 'medium' ? 'text-amber-400' :
                    'text-emerald-400'}
                `}>
                  {claim?.claim_data?.fraudRiskLevel || 'Low'}
                </span>
              </div>
            </div>
          </div>

          <FormInput
            label="Settlement Amount (₦)"
            type="number"
            value={settlementAmount || (claim?.claim_data?.estimatedAmount - deductible)}
            onChange={(e) => setSettlementAmount(e.target.value)}
            placeholder="Enter approved amount"
            icon={DollarSign}
            min="0"
            step="0.01"
          />

          <FormInput
            label="Deductible (₦)"
            type="number"
            value={deductible}
            onChange={(e) => setDeductible(Number(e.target.value))}
            placeholder="Enter deductible"
            icon={DollarSign}
            min="0"
            step="0.01"
          />

          <FormSelect
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'card', label: 'Card Payment' },
              { value: 'crypto', label: 'Cryptocurrency' }
            ]}
            icon={CreditCard}
          />

          <FormTextArea
            label="Approval Comments (Optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any notes about this approval..."
            rows={3}
          />

          <Alert type="info" className="text-sm">
            <Info className="w-4 h-4 mr-2" />
            Approving this claim will create a payment record and notify the customer.
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
              disabled={updating}
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
              {updating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Claim
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Request Info Modal */}
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
            label="Information Required"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Please describe what additional information or documents are needed..."
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
              {updating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}