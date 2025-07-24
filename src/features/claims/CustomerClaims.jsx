import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Plus, Search, Filter, Calendar, 
  DollarSign, Clock, CheckCircle, XCircle, 
  AlertTriangle, ChevronRight, Download,
  Shield, Activity, Brain
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  EmptyState, LoadingSpinner 
} from '@shared/components'
import { format } from 'date-fns'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'

export const CustomerClaims = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    fetchClaims()
    
    // Set up real-time subscription
    const channel = supabaseHelpers.subscribeToClaimsChannel(
      handleClaimUpdate,
      { filter: `customer_id=eq.${user.id}` }
    )
    
    setSubscription(channel)
    
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user.id])

  useEffect(() => {
    applyFilters()
  }, [claims, searchTerm, statusFilter, typeFilter, sortBy])

  const handleClaimUpdate = (payload) => {
    console.log('Claim update received:', payload)
    // Refresh claims when updates occur
    fetchClaims()
  }

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseHelpers.getClaims({
        customer_id: user.id
      })
      
      if (error) throw error
      
      setClaims(data || [])
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...claims]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim => {
        const searchLower = searchTerm.toLowerCase()
        return (
          claim.claim_data?.claimNumber?.toLowerCase().includes(searchLower) ||
          claim.claim_data?.claimType?.toLowerCase().includes(searchLower) ||
          claim.claim_data?.damageDescription?.toLowerCase().includes(searchLower) ||
          claim.id.toLowerCase().includes(searchLower)
        )
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(claim => claim.claim_data?.claimType === typeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'amount_desc':
          return (b.claim_data?.estimatedAmount || 0) - (a.claim_data?.estimatedAmount || 0)
        case 'amount_asc':
          return (a.claim_data?.estimatedAmount || 0) - (b.claim_data?.estimatedAmount || 0)
        default:
          return 0
      }
    })

    setFilteredClaims(filtered)
  }

  const getStatusBadge = (status) => {
    const config = {
      submitted: { 
        color: 'secondary', 
        icon: Clock, 
        text: 'Submitted',
        description: 'Your claim has been received'
      },
      processing: { 
        color: 'warning', 
        icon: Activity, 
        text: 'Processing',
        description: 'AI is analyzing your claim'
      },
      approved: { 
        color: 'success', 
        icon: CheckCircle, 
        text: 'Approved',
        description: 'Your claim has been approved'
      },
      rejected: { 
        color: 'danger', 
        icon: XCircle, 
        text: 'Rejected',
        description: 'Your claim was not approved'
      },
      flagged: { 
        color: 'danger', 
        icon: AlertTriangle, 
        text: 'Under Review',
        description: 'Additional review required'
      }
    }
    
    const { color, icon: Icon, text } = config[status] || config.submitted
    
    return (
      <Badge variant={color}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    )
  }

  const getAIProcessingBadge = (claim) => {
    const aiStatus = claim.claim_data?.aiProcessingStatus
    
    if (!aiStatus || aiStatus === 'no_documents') return null
    
    const config = {
      pending: { color: 'secondary', icon: Clock, text: 'AI Pending' },
      completed: { color: 'success', icon: Brain, text: 'AI Processed' },
      failed: { color: 'danger', icon: AlertTriangle, text: 'AI Error' }
    }
    
    const { color, icon: Icon, text } = config[aiStatus] || config.pending
    
    return (
      <Badge variant={color}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    )
  }

  const getRiskIndicator = (claim) => {
    const riskLevel = claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel
    
    if (!riskLevel) return null
    
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    }
    
    return (
      <div className={`flex items-center gap-1 text-sm ${colors[riskLevel] || 'text-gray-400'}`}>
        <Shield className="w-4 h-4" />
        <span className="capitalize">{riskLevel} Risk</span>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const exportClaims = () => {
    const csv = [
      ['Claim Number', 'Type', 'Status', 'Amount', 'Date', 'Description'],
      ...filteredClaims.map(claim => [
        claim.claim_data?.claimNumber || claim.id,
        claim.claim_data?.claimType || 'N/A',
        claim.status,
        claim.claim_data?.estimatedAmount || 0,
        format(new Date(claim.created_at), 'yyyy-MM-dd'),
        claim.claim_data?.damageDescription || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claims_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
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

  return (
    <DashboardLayout>
      <PageHeader
        title="My Claims"
        description="View and manage all your insurance claims"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={exportClaims} disabled={filteredClaims.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link to="/customer/claims/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                New Claim
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                type="search"
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'processing', label: 'Processing' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'flagged', label: 'Under Review' }
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'auto', label: 'Auto' },
                { value: 'health', label: 'Health' },
                { value: 'property', label: 'Property' },
                { value: 'life', label: 'Life' },
                { value: 'other', label: 'Other' }
              ]}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'date_desc', label: 'Newest First' },
                { value: 'date_asc', label: 'Oldest First' },
                { value: 'amount_desc', label: 'Highest Amount' },
                { value: 'amount_asc', label: 'Lowest Amount' }
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={FileText}
              title={claims.length === 0 ? "No claims yet" : "No claims found"}
              description={
                claims.length === 0 
                  ? "Start by submitting your first insurance claim"
                  : "Try adjusting your filters to see more results"
              }
              action={
                claims.length === 0 && (
                  <Link to="/customer/claims/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit First Claim
                    </Button>
                  </Link>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} hoverable>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        Claim #{claim.claim_data?.claimNumber || claim.id.slice(0, 8)}
                      </h3>
                      {getStatusBadge(claim.status)}
                      {getAIProcessingBadge(claim)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span className="capitalize">{claim.claim_data?.claimType || 'Unknown'} Claim</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(claim.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(claim.claim_data?.estimatedAmount)}</span>
                      </div>
                    </div>
                    
                    {claim.claim_data?.damageDescription && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                        {claim.claim_data.damageDescription}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4">
                      {getRiskIndicator(claim)}
                      {claim.documents?.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <FileText className="w-4 h-4" />
                          <span>{claim.documents.length} Document{claim.documents.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {claim.claim_data?.decision && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>Reviewed {format(new Date(claim.claim_data.decision.decidedAt), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link 
                    to={`/customer/claims/${claim.id}`}
                    className="ml-4"
                  >
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {claims.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50">
            <CardBody className="text-center">
              <p className="text-sm text-gray-400 mb-1">Total Claims</p>
              <p className="text-2xl font-bold text-gray-100">{claims.length}</p>
            </CardBody>
          </Card>
          <Card className="bg-gray-800/50">
            <CardBody className="text-center">
              <p className="text-sm text-gray-400 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-400">
                {claims.filter(c => c.status === 'approved').length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-gray-800/50">
            <CardBody className="text-center">
              <p className="text-sm text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {claims.filter(c => c.status === 'submitted' || c.status === 'processing').length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-gray-800/50">
            <CardBody className="text-center">
              <p className="text-sm text-gray-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(
                  claims.reduce((sum, c) => sum + (c.claim_data?.estimatedAmount || 0), 0)
                )}
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default CustomerClaims