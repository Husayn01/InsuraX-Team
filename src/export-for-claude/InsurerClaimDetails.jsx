import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FileText, Download, MessageSquare, Clock, CheckCircle, 
  XCircle, AlertCircle, Calendar, DollarSign, MapPin, 
  User, Paperclip, Eye, ArrowLeft, Send, Brain,
  Shield, TrendingUp, AlertTriangle, Phone, Mail
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, LoadingSpinner, 
  Modal, Input, Alert 
} from '@shared/components'
import { format } from 'date-fns'

export const InsurerClaimDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [decision, setDecision] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchClaimDetails()
  }, [id])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      // Mock detailed claim data
      const mockClaim = {
        id: id,
        customer_id: 'cust1',
        status: 'submitted',
        priority: 'high',
        claim_data: {
          claimNumber: `CLM-2024-${id.padStart(3, '0')}`,
          claimType: 'auto',
          claimantName: 'John Doe',
          incidentDate: '2024-03-15',
          incidentLocation: '123 Main Street, Lagos, Nigeria',
          damageDescription: 'Rear-end collision at traffic light. Significant damage to rear bumper and trunk. No injuries reported. The other driver admitted fault at the scene.',
          estimatedAmount: 5000,
          policyNumber: 'POL-123456',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: '2020',
            licensePlate: 'LAG-123-XY',
            vin: '1HGBH41JXMN109186'
          }
        },
        customer: {
          id: 'cust1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+234 801 234 5678',
          address: '45 Victoria Island, Lagos',
          memberSince: '2020-01-15',
          totalClaims: 3,
          approvedClaims: 2,
          totalPremiumPaid: 15000,
          riskScore: 'low',
          paymentHistory: 'excellent'
        },
        documents: [
          { id: '1', name: 'Accident_Photos.pdf', size: '2.5 MB', type: 'image', uploadDate: '2024-03-16' },
          { id: '2', name: 'Police_Report.pdf', size: '1.2 MB', type: 'document', uploadDate: '2024-03-16' },
          { id: '3', name: 'Damage_Estimate.pdf', size: '0.8 MB', type: 'document', uploadDate: '2024-03-17' }
        ],
        fraudAssessment: {
          score: 0.15,
          riskLevel: 'low',
          indicators: [
            { type: 'positive', message: 'Customer has excellent payment history' },
            { type: 'positive', message: 'Police report matches claim description' },
            { type: 'positive', message: 'Damage photos are consistent with description' },
            { type: 'neutral', message: 'First auto claim in 2 years' }
          ],
          recommendation: 'Approve claim - Low fraud risk detected'
        },
        timeline: [
          { 
            date: '2024-03-16T10:00:00Z', 
            event: 'Claim Submitted', 
            user: 'John Doe',
            details: 'Initial claim submission with photos'
          },
          { 
            date: '2024-03-16T14:30:00Z', 
            event: 'Documents Added', 
            user: 'John Doe',
            details: 'Police report and damage estimate uploaded'
          },
          { 
            date: '2024-03-17T09:00:00Z', 
            event: 'AI Analysis Complete', 
            user: 'System',
            details: 'NeuroClaim AI assessed claim with 85% confidence'
          }
        ],
        messages: [
          {
            id: '1',
            sender: 'John Doe',
            senderType: 'customer',
            message: 'I have uploaded all the required documents. Please let me know if you need anything else.',
            timestamp: '2024-03-16T15:00:00Z'
          }
        ],
        aiAnalysis: {
          confidence: 0.85,
          processingTime: '2.3s',
          extractedData: {
            damageType: 'Collision - Rear Impact',
            severity: 'Moderate',
            repairCategory: 'Body Work',
            estimatedRepairTime: '5-7 days'
          },
          similarClaims: [
            { claimNumber: 'CLM-2024-089', similarity: 0.92, outcome: 'Approved', amount: 4800 },
            { claimNumber: 'CLM-2024-045', similarity: 0.87, outcome: 'Approved', amount: 5200 },
            { claimNumber: 'CLM-2023-234', similarity: 0.83, outcome: 'Approved', amount: 4500 }
          ]
        }
      }
      
      setClaim(mockClaim)
    } catch (error) {
      console.error('Error fetching claim details:', error)
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
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update claim status
      setClaim(prev => ({ ...prev, status: decision }))
      setShowDecisionModal(false)
      
      // Show success message
      alert(`Claim ${decision} successfully!`)
      navigate('/insurer/claims')
    } catch (error) {
      console.error('Error processing decision:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newMessage = {
        id: Date.now().toString(),
        sender: 'Insurance Adjuster',
        senderType: 'insurer',
        message: message,
        timestamp: new Date().toISOString()
      }
      
      setClaim(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage]
      }))
      
      setMessage('')
      setShowMessageModal(false)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getFraudRiskColor = (score) => {
    if (score > 0.7) return 'text-red-600 bg-red-100'
    if (score > 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
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

  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/insurer/claims')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            Claim Review
          </div>
        }
        description={`Reviewing claim ${claim.claim_data.claimNumber}`}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowMessageModal(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Customer
            </Button>
            <Button variant="primary" onClick={() => setShowDecisionModal(true)}>
              Make Decision
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Information */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Claim Information</h2>
            </div>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Claim Number</p>
                    <p className="font-medium text-gray-100">{claim.claim_data.claimNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Policy Number</p>
                    <p className="font-medium text-gray-100">{claim.claim_data.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Claim Type</p>
                    <p className="font-medium text-gray-100 capitalize">{claim.claim_data.claimType} Insurance</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Priority</p>
                    <Badge variant={claim.priority === 'high' ? 'warning' : 'info'}>
                      {claim.priority}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Incident Date</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(claim.claim_data.incidentDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Claimed Amount</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {formatCurrency(claim.claim_data.estimatedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="font-medium text-gray-100 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      {claim.claim_data.incidentLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <Badge variant="info">
                      <Clock className="w-3 h-3 mr-1" />
                      {claim.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-medium text-gray-100 mb-3">Incident Description</h3>
                <p className="text-gray-300">{claim.claim_data.damageDescription}</p>
              </div>

              {claim.claim_data.vehicleInfo && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="font-medium text-gray-100 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Make</p>
                      <p className="font-medium text-gray-100">{claim.claim_data.vehicleInfo.make}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Model</p>
                      <p className="font-medium text-gray-100">{claim.claim_data.vehicleInfo.model}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Year</p>
                      <p className="font-medium text-gray-100">{claim.claim_data.vehicleInfo.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">License Plate</p>
                      <p className="font-medium text-gray-100">{claim.claim_data.vehicleInfo.licensePlate}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* AI Analysis */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                NeuroClaim AI Analysis
              </h2>
              <Badge variant="success">
                {(claim.aiAnalysis.confidence * 100).toFixed(0)}% Confidence
              </Badge>
            </div>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Extracted Information</p>
                  <div className="space-y-2">
                    {Object.entries(claim.aiAnalysis.extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-sm font-medium text-gray-100">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Processing Metrics</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Processing Time:</span>
                      <span className="text-sm font-medium text-gray-100">{claim.aiAnalysis.processingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Analysis Date:</span>
                      <span className="text-sm font-medium text-gray-100">
                        {format(new Date(claim.timeline[2]?.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-3">Similar Claims Analysis</p>
                <div className="space-y-2">
                  {claim.aiAnalysis.similarClaims.map((similar, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${similar.outcome === 'Approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">{similar.claimNumber}</span>
                        <span className="text-xs text-gray-400">{(similar.similarity * 100).toFixed(0)}% match</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(similar.amount)}</p>
                        <p className="text-xs text-gray-400">{similar.outcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Activity Timeline</h2>
            </div>
            <CardBody>
              <div className="space-y-4">
                {claim.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-100">{event.event}</h4>
                        <span className="text-xs text-gray-400">
                          {format(new Date(event.date), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{event.details}</p>
                      <p className="text-xs text-gray-500 mt-1">by {event.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Customer Profile</h2>
            </div>
            <CardBody>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-100">{claim.customer.name}</h3>
                  <p className="text-sm text-gray-400">Member since {format(new Date(claim.customer.memberSince), 'yyyy')}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{claim.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{claim.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{claim.customer.address}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Claims</span>
                    <span className="font-medium">{claim.customer.totalClaims}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Approved Claims</span>
                    <span className="font-medium">{claim.customer.approvedClaims}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Premiums</span>
                    <span className="font-medium">{formatCurrency(claim.customer.totalPremiumPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Risk Score</span>
                    <Badge variant={claim.customer.riskScore === 'low' ? 'success' : 'warning'}>
                      {claim.customer.riskScore}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Fraud Assessment */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Fraud Assessment
              </h2>
            </div>
            <CardBody>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${getFraudRiskColor(claim.fraudAssessment.score)}`}>
                  <AlertTriangle className="w-5 h-5" />
                  {(claim.fraudAssessment.score * 100).toFixed(0)}% Risk
                </div>
                <p className="text-sm text-gray-400 mt-2">{claim.fraudAssessment.riskLevel} risk level</p>
              </div>

              <div className="space-y-2">
                {claim.fraudAssessment.indicators.map((indicator, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      indicator.type === 'positive' ? 'bg-green-500' :
                      indicator.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-gray-300">{indicator.message}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                <p className="text-sm font-medium text-gray-100">AI Recommendation:</p>
                <p className="text-sm text-gray-300 mt-1">{claim.fraudAssessment.recommendation}</p>
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Documents</h2>
            </div>
            <CardBody>
              <div className="space-y-3">
                {claim.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-100">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
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

          {/* Messages */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Messages</h2>
            </div>
            <CardBody>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {claim.messages.map((msg) => (
                  <div key={msg.id} className={`${msg.senderType === 'insurer' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[80%] ${
                      msg.senderType === 'insurer' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                        : 'bg-gray-700'
                    } rounded-lg px-4 py-2`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{msg.sender}</p>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-4"
                onClick={() => setShowMessageModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
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
        <div className="space-y-6">
          <Alert type="info" title="Review Summary">
            AI Risk Assessment: {(claim.fraudAssessment.score * 100).toFixed(0)}% fraud risk ({claim.fraudAssessment.riskLevel})
          </Alert>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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