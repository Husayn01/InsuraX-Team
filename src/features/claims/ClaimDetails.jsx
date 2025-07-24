import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FileText, Download, MessageSquare, Clock, CheckCircle, 
  XCircle, AlertCircle, ChevronRight, Calendar, DollarSign,
  MapPin, User, Paperclip, Eye, ArrowLeft, Send, Plus
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, LoadingSpinner, 
  Modal, Input, Alert 
} from '@shared/components'
import { format } from 'date-fns'

export const ClaimDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  useEffect(() => {
    fetchClaimDetails()
  }, [id])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      // In a real app, you'd fetch the specific claim
      // For demo, we'll create mock detailed data
      const mockClaim = {
        id: id,
        status: 'processing',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        claim_data: {
          claimNumber: `CLM-2024-${id.slice(0, 6).toUpperCase()}`,
          claimType: 'auto',
          claimantName: 'Ibrahim Sani',
          incidentDate: new Date(Date.now() - 86400000 * 5).toISOString(),
          incidentLocation: '123 Adeola Odeku Street, Victoria Island, Lagos, Nigeria',
          damageDescription: 'Rear-end collision at traffic light. Significant damage to rear bumper and trunk. No injuries reported.',
          estimatedAmount: 250000,
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            licensePlate: 'LAG-123-XY'
          },
          policyNumber: 'POL-AUTO-123456',
          witnessInfo: 'Witnessed by Chinedu Eze (+234 803 456 7890)'
        },
        documents: [
          { id: '1', name: 'Damage_Photos.zip', size: '5.2 MB', uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
          { id: '2', name: 'Police_Report.pdf', size: '1.8 MB', uploadedAt: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', name: 'Repair_Estimate.pdf', size: '892 KB', uploadedAt: new Date().toISOString() }
        ],
        timeline: [
          { id: '1', event: 'Claim submitted', date: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'completed' },
          { id: '2', event: 'Documents received', date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'completed' },
          { id: '3', event: 'Under review', date: new Date(Date.now() - 86400000).toISOString(), status: 'active' },
          { id: '4', event: 'Approval pending', date: null, status: 'pending' },
          { id: '5', event: 'Payment processing', date: null, status: 'pending' }
        ],
        assignedAdjuster: {
          name: 'Adaeze Okafor',
          phone: '+234 802 345 6789',
          email: 'adaeze.okafor@insuranceco.com'
        },
        messages: [
          {
            id: '1',
            sender: 'Adaeze Okafor',
            message: 'Thank you for submitting your claim. I have reviewed the initial documents and everything looks in order. I will review the documents and get back to you soon.',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            isUser: false
          },
          {
            id: '2',
            sender: 'You',
            message: 'I have uploaded the damage estimate from the repair shop as requested.',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            isUser: true
          }
        ]
      }
      
      setClaim(mockClaim)
    } catch (error) {
      console.error('Error fetching claim details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-5 h-5" />
      case 'processing':
        return <Clock className="w-5 h-5 animate-spin" />
      case 'approved':
        return <CheckCircle className="w-5 h-5" />
      case 'rejected':
        return <XCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'info'
      case 'processing':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'info'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setSendingMessage(true)
    try {
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Add message to the list
      const newMessage = {
        id: Date.now().toString(),
        sender: 'You',
        message: message,
        timestamp: new Date().toISOString(),
        isUser: true
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
      setSendingMessage(false)
    }
  }

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingDoc(true)
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Add document to the list
      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString()
      }
      
      setClaim(prev => ({
        ...prev,
        documents: [...prev.documents, newDoc]
      }))
      
      setShowDocumentModal(false)
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setUploadingDoc(false)
    }
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
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-lg text-gray-300">Claim not found</p>
          <Button variant="secondary" onClick={() => navigate('/customer/claims')} className="mt-4">
            Back to Claims
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`Claim #${claim.claim_data.claimNumber}`}
        description="View and manage your insurance claim"
        actions={
          <div className="flex gap-3">
            <Link to="/customer/claims">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Claim Status</h2>
                <Badge variant={getStatusColor(claim.status)}>
                  {getStatusIcon(claim.status)}
                  <span className="ml-1">{claim.status}</span>
                </Badge>
              </div>
              
              {/* Timeline */}
              <div className="relative">
                {claim.timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start mb-6 last:mb-0">
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        event.status === 'completed' ? 'bg-green-500 border-green-500' :
                        event.status === 'active' ? 'bg-yellow-500 border-yellow-500 animate-pulse' :
                        'bg-gray-700 border-gray-600'
                      }`} />
                      {index < claim.timeline.length - 1 && (
                        <div className={`absolute top-4 left-1.5 w-0.5 h-16 ${
                          event.status === 'completed' ? 'bg-green-500' : 'bg-gray-700'
                        }`} />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`font-medium ${
                        event.status === 'completed' ? 'text-gray-100' :
                        event.status === 'active' ? 'text-yellow-400' :
                        'text-gray-500'
                      }`}>
                        {event.event}
                      </p>
                      {event.date && (
                        <p className="text-sm text-gray-400 mt-1">
                          {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Claim Details */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Claim Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Claim Type</p>
                    <p className="font-medium text-gray-100 capitalize">{claim.claim_data.claimType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Policy Number</p>
                    <p className="font-medium text-gray-100">{claim.claim_data.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Incident Date</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(claim.claim_data.incidentDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Estimated Amount</p>
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
                    <p className="text-sm text-gray-400">Claimant</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {claim.claim_data.claimantName}
                    </p>
                  </div>
                </div>
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
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-medium text-gray-100 mb-3">Description</h3>
                <p className="text-gray-300">{claim.claim_data.damageDescription}</p>
                
                {claim.claim_data.witnessInfo && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">Witness Information</p>
                    <p className="text-gray-300">{claim.claim_data.witnessInfo}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Documents</h2>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowDocumentModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </div>
              
              <div className="space-y-3">
                {claim.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-100">{doc.name}</p>
                        <p className="text-sm text-gray-400">
                          {doc.size} • Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Adjuster */}
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-100 mb-4">Assigned Adjuster</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">AO</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-100">{claim.assignedAdjuster.name}</p>
                    <p className="text-sm text-gray-400">Claims Adjuster</p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-300">{claim.assignedAdjuster.phone}</p>
                  <p className="text-sm text-gray-300">{claim.assignedAdjuster.email}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Messages */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-100">Messages</h3>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowMessageModal(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {claim.messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${
                    msg.isUser ? 'bg-cyan-900/20 ml-4' : 'bg-gray-800/50 mr-4'
                  }`}>
                    <p className="text-sm font-medium text-gray-100 mb-1">{msg.sender}</p>
                    <p className="text-sm text-gray-300">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      <Modal 
        isOpen={showMessageModal} 
        onClose={() => setShowMessageModal(false)}
        title="Send Message"
      >
        <div className="space-y-4">
          <textarea
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
            rows={4}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowMessageModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSendMessage}
              loading={sendingMessage}
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Upload Modal */}
      <Modal 
        isOpen={showDocumentModal} 
        onClose={() => setShowDocumentModal(false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <p className="text-gray-300">Select a document to upload for your claim.</p>
          <input
            type="file"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
            onChange={handleDocumentUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <p className="text-sm text-gray-400">
            Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
          </p>
          {uploadingDoc && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-300">Uploading...</span>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  )
}