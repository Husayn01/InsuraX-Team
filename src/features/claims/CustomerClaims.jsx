import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Search, Filter, Download, 
  Calendar, ChevronDown, Eye, Clock, CheckCircle, 
  XCircle, AlertCircle, Shield, TrendingUp,
  Activity, Sparkles, ChevronRight, Brain, Car, Stethoscope, Home, Heart
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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    if (user) {
      fetchClaims()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
    calculateStats()
  }, [claims, searchTerm, filters])

  const fetchClaims = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabaseHelpers.getClaims({ 
        customer_id: user.id 
      })
      
      if (error) {
        console.error('Error fetching claims:', error)
        setError('Failed to load claims. Please try again.')
        setClaims([])
        return
      }
      
      setClaims(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching claims:', error)
      setError('An unexpected error occurred. Please try again.')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const newStats = {
      total: claims.length,
      pending: claims.filter(c => c.status === 'submitted').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length
    }
    setStats(newStats)
  }

  const applyFilters = () => {
    let filtered = [...claims]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim => 
        claim.claim_data?.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.claim_data?.claimType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.status.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (filters.dateRange) {
        case '7days':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30days':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '90days':
          cutoffDate.setDate(now.getDate() - 90)
          break
      }
      
      filtered = filtered.filter(claim => 
        new Date(claim.created_at) >= cutoffDate
      )
    }

    setFilteredClaims(filtered)
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

const getClaimTypeIcon = (type) => {
  const icons = {
    auto: '▣',      // Filled square (document/form symbol)
    health: '✚',    // Medical cross
    property: '▦',  // Rectangle (building/property symbol)
    life: '◉',      // Circle with dot (record/policy symbol)
    other: '▪'      // Small filled square (generic document)
  }
  return icons[type] || '▪'
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
            <p className="mt-6 text-gray-400 animate-pulse">Loading your claims...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/30 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            My Insurance Claims
          </span>
        }
        description="Track and manage all your insurance claims in one place"
        actions={
          <Link to="/customer/claims/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert type="error" title="Error" className="mb-6 bg-red-900/20 border-red-500/50">
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Claims', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' }
        ].map((stat, index) => (
          <Card key={index} className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
            <CardBody className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 bg-${stat.color}-500/20 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Types</option>
                <option value="auto">Auto</option>
                <option value="health">Health</option>
                <option value="property">Property</option>
                <option value="life">Life</option>
                <option value="other">Other</option>
              </Select>

              <Select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardBody className="py-16">
              <EmptyState
                icon={FileText}
                title="No claims found"
                description={searchTerm || filters.status !== 'all' ? "Try adjusting your filters" : "Start by creating your first claim"}
                action={
                  !searchTerm && filters.status === 'all' && (
                    <Link to="/customer/claims/new">
                      <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Claim
                      </Button>
                    </Link>
                  )
                }
              />
            </CardBody>
          </Card>
        ) : (
          filteredClaims.map((claim, index) => (
            <Link 
              key={claim.id} 
              to={`/customer/claims/${claim.id}`}
              className="block group"
            >
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                          <div className="relative p-3 bg-gray-700/50 rounded-xl">
                            <span className="text-2xl">{getClaimTypeIcon(claim.claim_data?.claimType)}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                              {claim.claim_data?.claimNumber || `Claim #${claim.id.slice(0, 8)}`}
                            </h3>
                            {getStatusBadge(claim.status)}
                            {claim.claim_data?.aiProcessingStatus === 'completed' && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
                                <Brain className="w-3.5 h-3.5 mr-1" />
                                AI Processed
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="capitalize">{claim.claim_data?.claimType || 'N/A'} Insurance</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(claim.created_at), 'MMM d, yyyy')}
                            </span>
                            {claim.claim_data?.estimatedAmount && (
                              <span className="font-medium text-green-400">
                                ₦{claim.claim_data.estimatedAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {claim.claim_data?.damageDescription && (
                        <p className="text-sm text-gray-300 line-clamp-2 ml-16">
                          {claim.claim_data.damageDescription}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-cyan-500/20 transition-all duration-300">
                        <Eye className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))
        )}
      </div>

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

export default CustomerClaims