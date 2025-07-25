import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Search, Filter, Download, Clock, 
  CheckCircle, XCircle, AlertTriangle, Eye, 
  TrendingUp, Activity, Shield, Brain, ChevronRight,
  MoreVertical, Zap, Calendar, DollarSign, User,
  BarChart3, Sparkles, RefreshCw, Check, X,
  AlertCircle, MapPin
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  LoadingSpinner, Tabs 
} from '@shared/components'
import { format } from 'date-fns'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'

export const InsurerClaims = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [selectedClaims, setSelectedClaims] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [activeView, setActiveView] = useState('table')
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    type: 'all',
    riskLevel: 'all',
    dateRange: 'all'
  })
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0,
    avgProcessingTime: '2.5 days'
  })

  useEffect(() => {
    fetchClaims()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [claims, filters])

  useEffect(() => {
    setShowBulkActions(selectedClaims.length > 0)
  }, [selectedClaims])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      
      // Fetch all claims (insurer can see all)
      const { data, error } = await supabaseHelpers.getClaims({})
      
      if (error) {
        console.error('Error fetching claims:', error)
        return
      }
      
      // Add mock additional data for demo
      const enrichedClaims = (data || []).map(claim => ({
        ...claim,
        priority: ['urgent', 'high', 'normal', 'low'][Math.floor(Math.random() * 4)],
        fraudScore: Math.random(),
        assignedTo: ['John Doe', 'Jane Smith', 'Mike Johnson'][Math.floor(Math.random() * 3)],
        processingDays: Math.floor(Math.random() * 10) + 1
      }))
      
      setClaims(enrichedClaims)
      calculateStats(enrichedClaims)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...claims]
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(claim => 
        claim.claim_data?.claimNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        claim.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        claim.claim_data?.claimantName?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(claim => claim.status === filters.status)
    }
    
    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(claim => claim.claim_data?.claimType === filters.type)
    }
    
    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(claim => claim.priority === filters.priority)
    }
    
    // Risk level filter
    if (filters.riskLevel !== 'all') {
      const thresholds = {
        low: [0, 0.3],
        medium: [0.3, 0.7],
        high: [0.7, 1]
      }
      const [min, max] = thresholds[filters.riskLevel]
      filtered = filtered.filter(claim => claim.fraudScore >= min && claim.fraudScore < max)
    }
    
    setFilteredClaims(filtered)
  }

  const calculateStats = (claimsData) => {
    const stats = {
      total: claimsData.length,
      pending: claimsData.filter(c => c.status === 'submitted').length,
      approved: claimsData.filter(c => c.status === 'approved').length,
      rejected: claimsData.filter(c => c.status === 'rejected').length,
      highRisk: claimsData.filter(c => c.fraudScore > 0.7).length,
      avgProcessingTime: '2.5 days'
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
  }

  const getStatusBadge = (status) => {
    const config = {
      submitted: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: Clock,
        pulse: false 
      },
      processing: { 
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
        icon: Activity,
        pulse: true 
      },
      approved: { 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
        icon: CheckCircle,
        pulse: false 
      },
      rejected: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: XCircle,
        pulse: false 
      }
    }
    
    const { color, icon: Icon, pulse } = config[status] || config.submitted
    
    return (
      <Badge className={`${color} border backdrop-blur-sm ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    
    return (
      <Badge className={`${colors[priority]} border backdrop-blur-sm`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getRiskBadge = (score) => {
    let level, color, icon
    
    if (score < 0.3) {
      level = 'Low Risk'
      color = 'bg-green-500/20 text-green-400 border-green-500/30'
      icon = CheckCircle
    } else if (score < 0.7) {
      level = 'Medium Risk'
      color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      icon = AlertCircle
    } else {
      level = 'High Risk'
      color = 'bg-red-500/20 text-red-400 border-red-500/30'
      icon = AlertTriangle
    }
    
    const Icon = icon
    
    return (
      <Badge className={`${color} border backdrop-blur-sm`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {level}
      </Badge>
    )
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
            <p className="mt-6 text-gray-400 animate-pulse">Loading claims data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Claims Management
          </span>
        }
        description="Review and process insurance claims with AI assistance"
        actions={
          <div className="flex gap-3">
            <Button 
              variant="secondary"
              onClick={fetchClaims}
              className="hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Total Claims</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-amber-400" />
                {stats.pending > 0 && (
                  <div className="animate-pulse">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-gray-400">Pending Review</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-xs text-gray-400">Approved</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <X className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              <p className="text-xs text-gray-400">Rejected</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.highRisk}</p>
              <p className="text-xs text-gray-400">High Risk</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-white">{stats.avgProcessingTime}</p>
              <p className="text-xs text-gray-400">Avg. Processing</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search claims..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>

              <Select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </Select>

              <Select
                value={filters.riskLevel}
                onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <p className="text-cyan-400">
              <span className="font-semibold">{selectedClaims.length}</span> claims selected
            </p>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleBulkAction('approve')}
                className="hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleBulkAction('reject')}
                className="hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSelectedClaims([])}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Claims Table */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-800/50">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
                    className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Claim ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Claimant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredClaims.map((claim) => (
                <tr 
                  key={claim.id}
                  className={`hover:bg-gray-700/30 transition-colors ${
                    selectedClaims.includes(claim.id) ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => handleSelectClaim(claim.id)}
                      className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cyan-400">
                        {claim.claim_data?.claimNumber || `#${claim.id.slice(0, 8)}`}
                      </span>
                      {claim.claim_data?.aiProcessingStatus === 'completed' && (
                        <Brain className="w-4 h-4 text-purple-400" title="AI Processed" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        {claim.claim_data?.claimantName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">{claim.assignedTo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300 capitalize">
                      {claim.claim_data?.claimType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-white">
                      ${claim.claim_data?.estimatedAmount?.toLocaleString() || '0'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(claim.status)}</td>
                  <td className="px-6 py-4">{getPriorityBadge(claim.priority)}</td>
                  <td className="px-6 py-4">{getRiskBadge(claim.fraudScore)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      {format(new Date(claim.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(claim.created_at), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/insurer/claims/${claim.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-cyan-500/20 hover:text-cyan-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-gray-700"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
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

export default InsurerClaims