import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Search, Filter, Calendar,
  Download, Eye, Clock, CheckCircle, XCircle
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, Input, Select, Badge, 
  EmptyState, LoadingSpinner, Modal 
} from '@shared/components'
import { format } from 'date-fns'

export const CustomerClaims = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchClaims()
  }, [user])

  useEffect(() => {
    filterClaims()
  }, [claims, searchTerm, statusFilter])

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

  const filterClaims = () => {
    let filtered = [...claims]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(claim => 
        claim.claim_data?.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.claim_data?.claimType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter)
    }

    setFilteredClaims(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />
      case 'processing':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
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

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'processing', label: 'Processing' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

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
          <Link to="/customer/claims/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-6 bg-gray-800/50 border-gray-700">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5 text-gray-400" />}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            <Button variant="secondary" onClick={fetchClaims} className="bg-gray-700/50 hover:bg-gray-700 border-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <EmptyState
            icon={FileText}
            title={searchTerm || statusFilter !== 'all' ? "No claims found" : "No claims yet"}
            description={
              searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your filters" 
                : "Submit your first claim to get started"
            }
            action={
              !searchTerm && statusFilter === 'all' && (
                <Link to="/customer/claims/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Claim
                  </Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} hoverable className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {claim.claim_data?.claimType || 'Insurance Claim'}
                      </h3>
                      <Badge variant={getStatusColor(claim.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(claim.status)}
                          {claim.status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-400">Claim ID:</span>{' '}
                        <span className="text-gray-200">
                          {claim.claim_data?.claimNumber || claim.id.slice(0, 8)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Date:</span>{' '}
                        <span className="text-gray-200">
                          {format(new Date(claim.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Amount:</span>{' '}
                        <span className="font-semibold text-cyan-400">
                          {formatCurrency(claim.claim_data?.estimatedAmount)}
                        </span>
                      </div>
                    </div>

                    {claim.claim_data?.damageDescription && (
                      <p className="mt-3 text-sm text-gray-300 line-clamp-2">
                        {claim.claim_data.damageDescription}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/customer/claims/${claim.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {claim.documents && claim.documents.length > 0 && (
                      <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">
                        <Download className="w-4 h-4 mr-1" />
                        Docs
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress indicator for processing claims */}
                {claim.status === 'processing' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Processing progress</span>
                      <span className="text-gray-200 font-medium">In Review</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false)
          setSelectedClaim(null)
        }}
        title="Claim Details"
        size="lg"
      >
        {selectedClaim && (
          <div className="space-y-6">
            {/* Modal content would go here */}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default CustomerClaims