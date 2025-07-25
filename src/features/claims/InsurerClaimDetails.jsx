import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, FileText, Calendar, MapPin, DollarSign,
  Clock, User, Mail, Phone, Download, Eye, Paperclip,
  CheckCircle, XCircle, AlertTriangle, Shield, Brain,
  Activity, TrendingUp, MessageSquare, Send, Archive,
  ChevronDown, ChevronUp, Sparkles, Info, FileImage,
  File, Camera, Hash, Building, Flag, Zap
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader, StatsCard } from '@shared/layouts'
import { 
  Button, Card, CardBody, Alert, Badge, 
  LoadingSpinner, Modal, Tabs 
} from '@shared/components'
import {
  FormTextArea, FormSelect, FormGroup
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
  const [comment, setComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
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
      
      if (error) throw error
      
      setClaim(data)
      
      // Fetch customer profile
      if (data?.customer_id) {
        const { data: profileData } = await supabaseHelpers.getProfile(data.customer_id)
        setCustomerProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching claim:', error)
      setError('Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true)
      
      const updates = {
        status: newStatus,
        claim_data: {
          ...claim.claim_data,
          lastReviewedBy: user.id,
          lastReviewedAt: new Date().toISOString(),
          reviewComment: comment || rejectionReason
        }
      }
      
      const { error } = await supabaseHelpers.updateClaim(id, updates)
      
      if (error) throw error
      
      // Create notification for customer
      await supabaseHelpers.createClaimNotification(
        claim.customer_id,
        id,
        'claim_update',
        `Claim ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your claim ${claim.claim_data.claimNumber} has been ${newStatus}.`,
        { status: newStatus }
      )
      
      setSuccess(`Claim ${newStatus} successfully`)
      setShowApprovalModal(false)
      setShowRejectionModal(false)
      setComment('')
      setRejectionReason('')
      
      // Refresh claim data
      fetchClaimDetails()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error updating claim:', error)
      setError('Failed to update claim status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      submitted: Clock,
      processing: Activity,
      approved: CheckCircle,
      rejected: XCircle
    }
    return icons[status] || Clock
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'primary',
      processing: 'warning',
      approved: 'success',
      rejected: 'danger'
    }
    return colors[status] || 'default'
  }

  const getRiskBadge = (riskLevel) => {
    const config = {
      low: { color: 'success', icon: Shield },
      medium: { color: 'warning', icon: AlertTriangle },
      high: { color: 'danger', icon: AlertTriangle },
      critical: { color: 'danger', icon: Flag }
    }
    
    const { color, icon: Icon } = config[riskLevel] || config.low
    
    return (
      <Badge variant={color} className="flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" />
        {riskLevel?.charAt(0).toUpperCase() + riskLevel?.slice(1)} Risk
      </Badge>
    )
  }

  const getFileIcon = (url) => {
    const extension = url.split('.').pop().toLowerCase()
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
          color={claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel === 'high' ? 'red' : 'green'}
        />
        <StatsCard
          title="Confidence"
          value={`${claim.claim_data?.aiAnalysis?.fraudAssessment?.confidence || 95}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Claim Overview */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Claim Information
            </h2>
            {getRiskBadge(claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel)}
          </div>
        </div>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Hash className="w-4 h-4" />
                  Claim Number
                </p>
                <p className="font-medium text-gray-100">
                  {claim.claim_data?.claimNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <FileText className="w-4 h-4" />
                  Claim Type
                </p>
                <p className="font-medium text-gray-100 capitalize">
                  {claim.claim_data?.claimType || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-4 h-4" />
                  Incident Date
                </p>
                <p className="font-medium text-gray-100">
                  {claim.claim_data?.incidentDate 
                    ? format(new Date(claim.claim_data.incidentDate), 'PPP')
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </p>
                <p className="font-medium text-gray-100">
                  {claim.claim_data?.incidentLocation || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4" />
                  Estimated Amount
                </p>
                <p className="font-medium text-gray-100">
                  ₦{claim.claim_data?.estimatedAmount?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-4 h-4" />
                  Submitted
                </p>
                <p className="font-medium text-gray-100">
                  {format(new Date(claim.created_at), 'PPP')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-400 mb-2">Description</p>
            <p className="text-gray-300 bg-gray-900/50 p-4 rounded-lg">
              {claim.claim_data?.damageDescription || 'No description provided'}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Customer Information */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300">
        <div 
          className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 cursor-pointer hover:bg-gray-700/30 transition-colors"
          onClick={() => toggleSection('customer')}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Customer Information
            </h2>
            {expandedSections.customer ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
        {expandedSections.customer && (
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <User className="w-4 h-4" />
                  Name
                </p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.email || claim.customer_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </p>
                <p className="font-medium text-gray-100">
                  {customerProfile?.created_at 
                    ? format(new Date(customerProfile.created_at), 'PPP')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        )}
      </Card>
    </div>
  )

  const renderAIAnalysisTab = () => (
    <div className="space-y-6">
      {claim.claim_data?.aiAnalysis ? (
        <>
          {/* Fraud Assessment */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div 
              className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 cursor-pointer hover:bg-gray-700/30 transition-colors"
              onClick={() => toggleSection('fraud')}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Fraud Assessment
                </h2>
                <div className="flex items-center gap-3">
                  {getRiskBadge(claim.claim_data.aiAnalysis.fraudAssessment?.riskLevel)}
                  {expandedSections.fraud ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            </div>
            {expandedSections.fraud && (
              <CardBody>
                <div className="space-y-4">
                  {/* Risk Score Visualization */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Risk Score</span>
                      <span className="text-lg font-semibold text-white">
                        {claim.claim_data.aiAnalysis.fraudAssessment?.riskScore || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          claim.claim_data.aiAnalysis.fraudAssessment?.riskScore > 70 
                            ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                            : claim.claim_data.aiAnalysis.fraudAssessment?.riskScore > 40 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
                            : 'bg-gradient-to-r from-emerald-500 to-green-600'
                        }`}
                        style={{ width: `${claim.claim_data.aiAnalysis.fraudAssessment?.riskScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Red Flags */}
                  {claim.claim_data.aiAnalysis.fraudAssessment?.redFlags?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Red Flags Detected
                      </h4>
                      <ul className="space-y-2">
                        {claim.claim_data.aiAnalysis.fraudAssessment.redFlags.map((flag, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span className="text-sm text-gray-300">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">AI Confidence Level</span>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-cyan-400">
                          {claim.claim_data.aiAnalysis.fraudAssessment?.confidence || 95}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            )}
          </Card>

          {/* Processing Recommendations */}
          {claim.claim_data.aiAnalysis.categorization?.processingRecommendations && (
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  AI Recommendations
                </h2>
              </div>
              <CardBody>
                <ul className="space-y-3">
                  {claim.claim_data.aiAnalysis.categorization.processingRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="p-1 bg-cyan-500/20 rounded">
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Alert type="info" title="No AI Analysis Available">
          This claim has not been processed by the AI system yet.
        </Alert>
      )}
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      {claim.documents && claim.documents.length > 0 ? (
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-cyan-400" />
              Supporting Documents ({claim.documents.length})
            </h2>
          </div>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claim.documents.map((doc, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc)}
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        Document {index + 1}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded on submission
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Alert type="info" title="No Documents">
          No documents have been uploaded for this claim.
        </Alert>
      )}
    </div>
  )

  const renderActivityTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Claim Activity
          </h2>
        </div>
        <CardBody>
          <div className="space-y-4">
            {/* Claim Submitted */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-100">Claim Submitted</p>
                <p className="text-sm text-gray-400">
                  {format(new Date(claim.created_at), 'PPP p')}
                </p>
              </div>
            </div>

            {/* AI Processing */}
            {claim.claim_data?.aiProcessingStatus === 'completed' && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Brain className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-100">AI Analysis Completed</p>
                  <p className="text-sm text-gray-400">
                    Risk Level: {claim.claim_data.aiAnalysis?.fraudAssessment?.riskLevel}
                  </p>
                </div>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                claim.status === 'approved' ? 'bg-emerald-500/20' :
                claim.status === 'rejected' ? 'bg-red-500/20' :
                'bg-amber-500/20'
              }`}>
                {React.createElement(getStatusIcon(claim.status), {
                  className: `w-4 h-4 ${
                    claim.status === 'approved' ? 'text-emerald-400' :
                    claim.status === 'rejected' ? 'text-red-400' :
                    'text-amber-400'
                  }`
                })}
              </div>
              <div>
                <p className="font-medium text-gray-100">
                  Status: {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </p>
                <p className="text-sm text-gray-400">
                  {format(new Date(claim.updated_at), 'PPP p')}
                </p>
              </div>
            </div>
          </div>

          {/* Add Comment */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <h4 className="font-medium text-gray-100 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Add Internal Note
            </h4>
            <FormTextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note about this claim..."
              rows={3}
            />
            <Button 
              size="sm" 
              className="mt-3"
              disabled={!comment.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {claim.claim_data?.claimNumber || 'Claim Details'}
          </span>
        }
        description="Review and process insurance claim"
        actions={
          <div className="flex gap-3">
            <Link to="/insurer/claims">
              <Button variant="ghost" className="hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            {claim.status === 'submitted' && (
              <>
                <Button 
                  variant="danger" 
                  onClick={() => setShowRejectionModal(true)}
                  className="hover:shadow-red-500/25"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => setShowApprovalModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-emerald-500/25"
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
        <Alert type="success" title="Success" className="mb-6 bg-emerald-900/20 border-emerald-500/50">
          {success}
        </Alert>
      )}

      {error && (
        <Alert type="error" title="Error" className="mb-6 bg-red-900/20 border-red-500/50">
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      {/* Tab Content */}
      <div className="relative z-10">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'ai-analysis' && renderAIAnalysisTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Claim"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to approve this claim for ₦{claim.claim_data?.estimatedAmount?.toLocaleString()}?
          </p>
          <FormTextArea
            label="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setShowApprovalModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
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
                  Confirm Rejection
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default InsurerClaimDetails