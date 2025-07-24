import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Search, Filter, Calendar, ChevronDown,
  Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  TrendingUp, Users, Brain, Download
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  LoadingSpinner, Modal 
} from '@shared/components'
import { format } from 'date-fns'
import { supabaseHelpers } from '@services/supabase'

export const InsurerClaims = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    dateRange: 'all'
  })
  const [selectedClaims, setSelectedClaims] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0
  })

  useEffect(() => {
    fetchAllClaims()
  }, [])

  useEffect(() => {
    applyFilters()
    calculateStats()
  }, [claims, searchTerm, filters])

  const fetchAllClaims = async () => {
    try {
      setLoading(true)
      // In real app, fetch all claims for the insurance company
      // For demo, we'll create mock data
      const mockClaims = [
        {
          id: '1',
          customer_id: 'cust1',
          status: 'submitted',
          priority: 'high',
          riskLevel: 'medium',
          claim_data: {
            claimNumber: 'CLM-2024-001',
            claimType: 'auto',
            claimantName: 'Ibrahim Sani',
            estimatedAmount: 350000,
            incidentDate: '2024-03-15',
            damageDescription: 'Front bumper damage from collision'
          },
          customer: {
            name: 'Ibrahim Sani',
            email: 'ibrahim.sani@example.com',
            totalClaims: 3,
            riskScore: 'low'
          },
          created_at: new Date().toISOString(),
          assignedTo: null,
          fraudScore: 0.15
        },
        {
          id: '2',
          customer_id: 'cust2',
          status: 'processing',
          priority: 'urgent',
          riskLevel: 'high',
          claim_data: {
            claimNumber: 'CLM-2024-002',
            claimType: 'health',
            claimantName: 'Adaeze Okafor',
            estimatedAmount: 850000,
            incidentDate: '2024-03-18',
            damageDescription: 'Emergency surgery required'
          },
          customer: {
            name: 'Adaeze Okafor',
            email: 'adaeze.okafor@example.com',
            totalClaims: 1,
            riskScore: 'medium'
          },
          created_at: new Date(Date.now() - 86400000).toISOString(),
          assignedTo: 'adjuster1',
          fraudScore: 0.65
        },
        {
          id: '3',
          customer_id: 'cust3',
          status: 'approved',
          priority: 'normal',
          riskLevel: 'low',
          claim_data: {
            claimNumber: 'CLM-2024-003',
            claimType: 'property',
            claimantName: 'Chinedu Eze',
            estimatedAmount: 250000,
            incidentDate: '2024-03-10',
            damageDescription: 'Water damage from burst pipe'
          },
          customer: {
            name: 'Chinedu Eze',
            email: 'chinedu.eze@example.com',
            totalClaims: 5,
            riskScore: 'low'
          },
          created_at: new Date(Date.now() - 172800000).toISOString(),
          assignedTo: 'adjuster2',
          fraudScore: 0.05
        }
      ]
      
      setClaims(mockClaims)
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
      filtered = filtered.filter(claim => 
        claim.claim_data.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.claim_data.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(claim => claim.status === filters.status)
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(claim => claim.claim_data.claimType === filters.type)
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(claim => claim.priority === filters.priority)
    }

    setFilteredClaims(filtered)
  }

  const calculateStats = () => {
    const stats = {
      total: claims.length,
      pending: claims.filter(c => c.status === 'submitted').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
      highRisk: claims.filter(c => c.fraudScore > 0.5).length
    }
    setStats(stats)
  }

  const handleSelectClaim = (claimId) => {
    setSelectedClaims(prev => {
      if (prev.includes(claimId)) {
        return prev.filter(id => id !== claimId)
      }
      return [...prev, claimId]
    })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClaims(filteredClaims.map(claim => claim.id))
    } else {
      setSelectedClaims([])
    }
  }

  const handleBulkAction = async (action) => {
    console.log(`Bulk ${action} for claims:`, selectedClaims)
    // Implement bulk action logic
    setSelectedClaims([])
    setShowBulkActions(false)
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error'
      case 'high':
        return 'warning'
      case 'normal':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'info'
    }
  }

  const getRiskColor = (fraudScore) => {
    if (fraudScore > 0.7) return 'text-red-400 bg-red-900/50 border border-red-500/50'
    if (fraudScore > 0.4) return 'text-yellow-400 bg-yellow-900/50 border border-yellow-500/50'
    return 'text-green-400 bg-green-900/50 border border-green-500/50'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN'
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Claims Management"
        description="Review and process insurance claims"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link to="/insurer/neuroclaim">
              <Button>
                <Brain className="w-4 h-4 mr-2" />
                AI Processing
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Claims</p>
              <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">High Risk</p>
              <p className="text-2xl font-bold text-orange-400">{stats.highRisk}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-gray-800/50 border-gray-700">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Search by claim number, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5 text-gray-400" />}
              className="lg:w-96"
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
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              options={[
                { value: 'all', label: 'All Priority' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' }
              ]}
            />
            <Button variant="secondary" onClick={fetchAllClaims}>
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Bulk Actions */}
      {selectedClaims.length > 0 && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-400">
            {selectedClaims.length} claim(s) selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleBulkAction('approve')}>
              Approve Selected
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleBulkAction('reject')}>
              Reject Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedClaims([])}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Claims Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50 border-b border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
                    className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Claim Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-700/30 transition-all duration-200">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => handleSelectClaim(claim.id)}
                      className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-100">
                        {claim.claim_data.claimNumber}
                      </p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(claim.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-100">
                        {claim.customer.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {claim.customer.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {claim.customer.totalClaims} total claims
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{claim.claim_data.claimType}</Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-100">
                    {formatCurrency(claim.claim_data.estimatedAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(claim.fraudScore)}`}>
                        {(claim.fraudScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusColor(claim.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(claim.status)}
                        {claim.status}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getPriorityColor(claim.priority)}>
                      {claim.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/insurer/claims/${claim.id}`}>
                      <Button size="sm" variant="primary">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}

export default InsurerClaims