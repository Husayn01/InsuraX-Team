import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Search, Filter, Download, 
  Calendar, ChevronDown, Eye, Clock, CheckCircle, 
  XCircle, AlertCircle, Shield
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  LoadingSpinner, Alert, EmptyState 
} from '@shared/components'
import { format } from 'date-fns'

export const CustomerClaims = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchClaims()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [claims, searchTerm, filters])

  const fetchClaims = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Use the correct format for getClaims
      const { data, error } = await supabaseHelpers.getClaims({ 
        customer_id: user.id 
      })
      
      if (error) {
        console.error('Error fetching claims:', error)
        setError('Failed to load claims. Please try again.')
        setClaims([])
        return
      }
      
      // Ensure data is always an array
      setClaims(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching claims:', error)
      setError('An unexpected error occurred. Please try again.')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    // Safety check to ensure claims is an array
    if (!Array.isArray(claims)) {
      setFilteredClaims([])
      return
    }

    let filtered = [...claims]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim => {
        const searchLower = searchTerm.toLowerCase()
        return (
          claim.id?.toLowerCase().includes(searchLower) ||
          claim.claim_data?.claimNumber?.toLowerCase().includes(searchLower) ||
          claim.claim_data?.damageDescription?.toLowerCase().includes(searchLower) ||
          claim.claim_data?.claimantName?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(claim => claim.status === filters.status)
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(claim => claim.claim_data?.claimType === filters.type)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const dateLimit = new Date()
      
      switch (filters.dateRange) {
        case '7days':
          dateLimit.setDate(now.getDate() - 7)
          break
        case '30days':
          dateLimit.setDate(now.getDate() - 30)
          break
        case '90days':
          dateLimit.setDate(now.getDate() - 90)
          break
      }
      
      filtered = filtered.filter(claim => 
        new Date(claim.created_at) >= dateLimit
      )
    }

    setFilteredClaims(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
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

  const getRiskBadge = (claim) => {
    const riskLevel = claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel
    
    if (!riskLevel) return null
    
    const colors = {
      low: 'text-green-400 bg-green-900/50',
      medium: 'text-yellow-400 bg-yellow-900/50',
      high: 'text-orange-400 bg-orange-900/50',
      critical: 'text-red-400 bg-red-900/50'
    }
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors[riskLevel] || colors.medium} flex items-center gap-1`}>
        <Shield className="w-3 h-3" />
        <span>{riskLevel} Risk</span>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0)
  }

  const exportClaims = () => {
    if (!Array.isArray(filteredClaims) || filteredClaims.length === 0) {
      return
    }

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
    window.URL.revokeObjectURL(url)
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
            <Button 
              variant="secondary" 
              onClick={exportClaims} 
              disabled={!Array.isArray(filteredClaims) || filteredClaims.length === 0}
            >
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

      {/* Error Alert */}
      {error && (
        <Alert type="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5 text-gray-400" />}
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'processing', label: 'Processing' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
            <Select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'auto', label: 'Auto' },
                { value: 'health', label: 'Health' },
                { value: 'property', label: 'Property' },
                { value: 'life', label: 'Life' }
              ]}
            />
            <Select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              options={[
                { value: 'all', label: 'All Time' },
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' }
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Claims List */}
      {!Array.isArray(filteredClaims) || filteredClaims.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No claims found"
          description={
            searchTerm || filters.status !== 'all' || filters.type !== 'all' || filters.dateRange !== 'all'
              ? 'Try adjusting your filters'
              : 'Submit your first claim to get started'
          }
          action={
            !searchTerm && filters.status === 'all' && filters.type === 'all' && filters.dateRange === 'all' && (
              <Button onClick={() => navigate('/customer/claims/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Claim
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} className="hover:border-cyan-500/50 transition-colors">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {claim.claim_data?.claimNumber || `Claim #${claim.id.slice(0, 8)}`}
                      </h3>
                      <Badge variant={getStatusColor(claim.status)}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1">{claim.status}</span>
                      </Badge>
                      {getRiskBadge(claim)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="ml-2 text-gray-200 capitalize">
                          {claim.claim_data?.claimType || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <span className="ml-2 text-gray-200 font-medium">
                          {formatCurrency(claim.claim_data?.estimatedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Submitted:</span>
                        <span className="ml-2 text-gray-200">
                          {format(new Date(claim.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {claim.claim_data?.damageDescription && (
                      <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                        {claim.claim_data.damageDescription}
                      </p>
                    )}
                  </div>
                  <Link to={`/customer/claims/${claim.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}