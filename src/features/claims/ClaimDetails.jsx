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
          claimantName: 'John Doe',
          incidentDate: new Date(Date.now() - 86400000 * 5).toISOString(),
          incidentLocation: '123 Main Street, Lagos, Nigeria',
          damageDescription: 'Rear-end collision at traffic light. Significant damage to rear bumper and trunk. No injuries reported.',
          estimatedAmount: 5000,
          policyNumber: 'POL-123456',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: '2020',
            licensePlate: 'LAG-123-XY'
          }
        },
        documents: [
          { name: 'Accident_Photos.pdf', size: '2.5 MB', uploadDate: new Date(Date.now() - 86400000 * 3).toISOString() },
          { name: 'Police_Report.pdf', size: '1.2 MB', uploadDate: new Date(Date.now() - 86400000 * 3).toISOString() },
          { name: 'Damage_Estimate.pdf', size: '0.8 MB', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString() }
        ],
        timeline: [
          { 
            date: new Date(Date.now() - 86400000 * 3).toISOString(), 
            event: 'Claim Submitted', 
            description: 'Initial claim submitted with supporting documents',
            icon: FileText,
            status: 'completed'
          },
          { 
            date: new Date(Date.now() - 86400000 * 2).toISOString(), 
            event: 'Under Review', 
            description: 'Claim assigned to adjuster for review',
            icon: Eye,
            status: 'completed'
          },
          { 
            date: new Date(Date.now() - 86400000).toISOString(), 
            event: 'Additional Information Requested', 
            description: 'Adjuster requested damage estimate from approved repair shop',
            icon: MessageSquare,
            status: 'completed'
          },
          { 
            date: new Date().toISOString(), 
            event: 'Processing', 
            description: 'Claim is being processed for approval',
            icon: Clock,
            status: 'active'
          },
          { 
            date: null, 
            event: 'Decision', 
            description: 'Final decision pending',
            icon: CheckCircle,
            status: 'pending'
          }
        ],
        messages: [
          {
            id: '1',
            sender: 'Adjuster',
            message: 'Thank you for submitting your claim. I will review the documents and get back to you soon.',
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingDoc(true)
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add document to the list
      const newDoc = {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toISOString()
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
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">Claim not found</h3>
          <Link to="/customer/claims">
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
              onClick={() => navigate('/customer/claims')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            Claim Details
          </div>
        }
        description={`Claim #${claim.claim_data.claimNumber}`}
        actions={
          <Badge variant={getStatusColor(claim.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(claim.status)}
              {claim.status}
            </span>
          </Badge>
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
                    <p className="text-sm text-gray-400">Claim Type</p>
                    <p className="font-medium text-gray-100 capitalize">{claim.claim_data.claimType} Insurance</p>
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
              </div>
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Claim Timeline</h2>
            </div>
            <CardBody>
              <div className="space-y-6">
                {claim.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        event.status === 'active' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        <event.icon className="w-5 h-5" />
                      </div>
                      {index < claim.timeline.length - 1 && (
                        <div className={`w-0.5 h-full mt-2 ${
                          event.status === 'completed' ? 'bg-green-500/50' : 'bg-gray-700'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <h4 className="font-medium text-gray-100">{event.event}</h4>
                      <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                      {event.date && (
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(event.date), 'MMM d, yyyy - h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Quick Actions</h2>
            </div>
            <CardBody className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowMessageModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowDocumentModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
              <Button
                variant="ghost"
                className="w-full text-red-400 hover:text-red-300"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Withdraw Claim
              </Button>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Documents</h2>
            </div>
            <CardBody>
              <div className="space-y-3">
                {claim.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-100">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Messages */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Recent Messages</h2>
            </div>
            <CardBody>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {claim.messages.map((msg) => (
                  <div key={msg.id} className={`${msg.isUser ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[80%] ${
                      msg.isUser 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
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
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Send Message"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message to Adjuster
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400"
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowMessageModal(false)}
              disabled={sendingMessage}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              loading={sendingMessage}
              disabled={!message.trim() || sendingMessage}
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
        title="Add Document"
        size="md"
      >
        <div className="space-y-4">
          <Alert type="info" title="Supported Formats">
            PDF, Images (JPG, PNG), Word Documents (Max 10MB)
          </Alert>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="doc-upload"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="doc-upload" className="cursor-pointer">
              <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">Click to select a file</p>
            </label>
          </div>
          {uploadingDoc && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-300">Uploading...</span>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default ClaimDetails