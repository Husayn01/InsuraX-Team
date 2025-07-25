import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FileText, Download, MessageSquare, Clock, CheckCircle, 
  XCircle, AlertCircle, ChevronRight, Calendar, DollarSign,
  MapPin, User, Paperclip, Eye, ArrowLeft, Send, Plus,
  Shield, Activity, Brain, Sparkles, Upload, Image,
  File, Star, TrendingUp, Zap, MoreVertical, Phone
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
  const [activeTab, setActiveTab] = useState('timeline')

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
          aiProcessingStatus: 'completed',
          fraudScore: 0.15,
          priority: 'normal'
        },
        documents: ['doc1.pdf', 'image1.jpg', 'image2.jpg'],
        timeline: [
          {
            id: '1',
            status: 'completed',
            title: 'Claim Submitted',
            description: 'Claim successfully submitted and received',
            date: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: '2',
            status: 'completed',
            title: 'AI Analysis Complete',
            description: 'NeuroClaim AI has analyzed your claim',
            date: new Date(Date.now() - 86400000 * 2.5).toISOString()
          },
          {
            id: '3',
            status: 'active',
            title: 'Under Review',
            description: 'Claim is being reviewed by our adjusters',
            date: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            id: '4',
            status: 'pending',
            title: 'Awaiting Approval',
            description: 'Final approval pending',
            date: null
          }
        ],
        messages: [
          {
            id: '1',
            sender: 'system',
            message: 'Your claim has been received and is being processed.',
            date: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: '2',
            sender: 'adjuster',
            name: 'John Doe',
            message: 'We have reviewed your claim. Please provide additional photos of the damage.',
            date: new Date(Date.now() - 86400000 * 1).toISOString()
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

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setSendingMessage(true)
    try {
      // In a real app, send message via API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('')
      setShowMessageModal(false)
      alert('Message sent successfully!')
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
      // In a real app, upload to storage
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Document uploaded successfully!')
      setShowDocumentModal(false)
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setUploadingDoc(false)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      submitted: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: Clock, 
        text: 'Submitted',
        pulse: false 
      },
      processing: { 
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
        icon: Activity, 
        text: 'Processing',
        pulse: true 
      },
      approved: { 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
        icon: CheckCircle, 
        text: 'Approved',
        pulse: false 
      },
      rejected: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: XCircle, 
        text: 'Rejected',
        pulse: false 
      }
    }
    
    const { color, icon: Icon, text, pulse } = config[status] || config.submitted
    
    return (
      <Badge className={`${color} border backdrop-blur-sm ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {text}
      </Badge>
    )
  }

  const getTimelineIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'active':
        return <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <Image className="w-5 h-5 text-purple-400" />
    }
    return <File className="w-5 h-5 text-blue-400" />
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {claim.claim_data.claimNumber}
          </span>
        }
        description="View and manage your insurance claim"
        actions={
          <div className="flex gap-3">
            <Link to="/customer/claims">
              <Button variant="ghost" className="hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button variant="secondary" className="hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Overview Card */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Claim Overview</h2>
                </div>
                {getStatusBadge(claim.status)}
              </div>
            </div>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Claim Type</p>
                    <p className="font-medium text-gray-100 capitalize flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      {claim.claim_data.claimType} Insurance
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Incident Date</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(claim.claim_data.incidentDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Incident Location</p>
                    <p className="font-medium text-gray-100 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {claim.claim_data.incidentLocation.split(',')[0]}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estimated Amount</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN'
                      }).format(claim.claim_data.estimatedAmount)}
                    </p>
                  </div>
                  {claim.claim_data.aiProcessingStatus === 'completed' && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-purple-400">AI Analysis Complete</p>
                          <p className="text-xs text-purple-400/80">Fraud Risk: Low ({(claim.claim_data.fraudScore * 100).toFixed(0)}%)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Damage Description</p>
                <p className="text-gray-300 bg-gray-700/30 p-4 rounded-lg">
                  {claim.claim_data.damageDescription}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Tabs for Timeline/Messages/Documents */}
          <div className="mb-4">
            <div className="flex space-x-1 p-1 bg-gray-800/50 backdrop-blur-sm rounded-xl">
              {[
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'documents', label: 'Documents', icon: Paperclip }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Claim Timeline
                </h3>
              </div>
              <CardBody>
                <div className="relative">
                  {claim.timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start mb-8 last:mb-0">
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.status === 'completed' ? 'bg-emerald-500/20' :
                          event.status === 'active' ? 'bg-amber-500/20' :
                          'bg-gray-700/50'
                        }`}>
                          {getTimelineIcon(event.status)}
                        </div>
                        {index < claim.timeline.length - 1 && (
                          <div className={`absolute top-10 left-5 w-0.5 h-16 ${
                            event.status === 'completed' ? 'bg-emerald-500/50' : 'bg-gray-700'
                          }`} />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className={`font-medium ${
                          event.status === 'completed' ? 'text-gray-100' :
                          event.status === 'active' ? 'text-amber-400' :
                          'text-gray-400'
                        }`}>
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                        {event.date && (
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    Messages
                  </h3>
                  <Button 
                    size="sm"
                    onClick={() => setShowMessageModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Message
                  </Button>
                </div>
              </div>
              <CardBody>
                <div className="space-y-4">
                  {claim.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-xl ${
                        msg.sender === 'system' 
                          ? 'bg-blue-500/10 border border-blue-500/30' 
                          : 'bg-gray-700/30 hover:bg-gray-700/50 transition-colors'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'system' 
                            ? 'bg-blue-500/20' 
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                        }`}>
                          {msg.sender === 'system' ? (
                            <Sparkles className="w-5 h-5 text-blue-400" />
                          ) : (
                            <span className="text-white font-medium">
                              {msg.name?.charAt(0) || 'A'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-100">
                              {msg.sender === 'system' ? 'System' : msg.name || 'Adjuster'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {format(new Date(msg.date), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
              <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-emerald-400" />
                    Documents
                  </h3>
                  <Button 
                    size="sm"
                    onClick={() => setShowDocumentModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-green-600"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {claim.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-700/50 rounded-lg group-hover:scale-110 transition-transform">
                          {getFileIcon(doc)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-100 group-hover:text-cyan-400 transition-colors">
                            {doc}
                          </p>
                          <p className="text-xs text-gray-400">Uploaded on submission</p>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4" />
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
          {/* Status Card */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <h3 className="text-lg font-semibold text-white">Status Summary</h3>
            </div>
            <CardBody className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl">
                <Activity className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-white mb-1">Under Review</p>
                <p className="text-sm text-gray-400">Estimated completion in 2-3 days</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-sm text-gray-400">Submitted</span>
                  <span className="text-sm font-medium text-gray-300">
                    {format(new Date(claim.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-sm text-gray-400">Last Updated</span>
                  <span className="text-sm font-medium text-gray-300">
                    {format(new Date(claim.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-sm text-gray-400">Priority</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                    Normal
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Actions
              </h3>
            </div>
            <CardBody className="space-y-3">
              <Button 
                variant="secondary" 
                className="w-full justify-start hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50"
                onClick={() => setShowMessageModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50"
                onClick={() => setShowDocumentModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/50"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Support
              </Button>
            </CardBody>
          </Card>

          {/* Help Card */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30 hover:shadow-xl transition-shadow duration-300">
            <CardBody className="text-center">
              <Shield className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <h4 className="font-medium text-white mb-2">Need Help?</h4>
              <p className="text-sm text-gray-400 mb-4">
                Our support team is available 24/7 to assist you.
              </p>
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                Contact Support
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <Modal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          title="Send Message"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowMessageModal(false)}
                disabled={sendingMessage}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                loading={sendingMessage}
                disabled={sendingMessage || !message.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
              >
                Send Message
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <Modal
          isOpen={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
          title="Upload Document"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
                <input
                  type="file"
                  id="doc-upload"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <label htmlFor="doc-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium mb-1">
                    Click to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    Images, PDFs, Word docs (max 10MB)
                  </p>
                </label>
              </div>
            </div>
            {uploadingDoc && (
              <div className="flex items-center justify-center gap-3 text-cyan-400">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-400 border-t-transparent"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add custom animations */}
      <style jsx>{`
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
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default ClaimDetails