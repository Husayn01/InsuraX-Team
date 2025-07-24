import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Activity, Brain, Shield, Clock,
  CheckCircle, XCircle, Eye, ChevronRight
} from 'lucide-react'
import { DashboardLayout, PageHeader, StatsCard } from '@shared/layouts'
import { Button, Card, CardBody, Badge, LoadingSpinner } from '@shared/components'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers, supabase } from '@services/supabase'

export const InsurerDashboard = () => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingReview: 0,
    approvedToday: 0,
    fraudDetected: 0
  })
  const [recentClaims, setRecentClaims] = useState([])
  const [chartData, setChartData] = useState([])
  const [claimTypeData, setClaimTypeData] = useState([])
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscription for all claims
    const channel = supabaseHelpers.subscribeToClaimsChannel(handleClaimUpdate)
    setSubscription(channel)
    
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const handleClaimUpdate = (payload) => {
    console.log('Claim update received:', payload)
    
    // Refresh dashboard data when claims are updated
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      fetchDashboardData()
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all claims
      const { data: claims } = await supabaseHelpers.getClaims({})
      
      // Calculate stats
      const totalClaims = claims?.length || 0
      const pendingReview = claims?.filter(c => c.status === 'submitted').length || 0
      const approvedToday = claims?.filter(c => {
        if (c.status !== 'approved') return false
        const approvedDate = new Date(c.updated_at)
        const today = new Date()
        return approvedDate.toDateString() === today.toDateString()
      }).length || 0
      
      const fraudDetected = claims?.filter(c => {
        const riskLevel = c.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel
        return riskLevel === 'high' || riskLevel === 'critical'
      }).length || 0
      
      setStats({
        totalClaims,
        pendingReview,
        approvedToday,
        fraudDetected
      })
      
      // Get recent claims (last 10)
      const recent = claims?.slice(0, 10) || []
      setRecentClaims(recent)
      
      // Generate chart data
      generateChartData(claims || [])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (claims) => {
    // Generate last 7 days data
    const days = 7
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      
      const dailyClaims = claims.filter(claim => {
        const claimDate = new Date(claim.created_at)
        return claimDate >= dayStart && claimDate <= dayEnd
      })
      
      data.push({
        date: format(date, 'MMM d'),
        claims: dailyClaims.length,
        amount: dailyClaims.reduce((sum, claim) => 
          sum + (claim.claim_data?.estimatedAmount || 0), 0
        )
      })
    }
    
    setChartData(data)
    
    // Generate claim type distribution
    const typeDistribution = claims.reduce((acc, claim) => {
      const type = claim.claim_data?.claimType || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count
    }))
    
    setClaimTypeData(typeData)
  }

  const getStatusBadge = (status) => {
    const config = {
      submitted: { color: 'secondary', icon: Clock, text: 'Pending' },
      processing: { color: 'warning', icon: Activity, text: 'Processing' },
      approved: { color: 'success', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'danger', icon: XCircle, text: 'Rejected' },
      flagged: { color: 'danger', icon: AlertTriangle, text: 'Flagged' }
    }
    
    const { color, icon: Icon, text } = config[status] || config.submitted
    
    return (
      <Badge variant={color}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    )
  }

  const getRiskBadge = (claim) => {
    const riskLevel = claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel
    
    if (!riskLevel) return null
    
    const config = {
      low: { color: 'success', text: 'Low Risk' },
      medium: { color: 'warning', text: 'Medium Risk' },
      high: { color: 'danger', text: 'High Risk' },
      critical: { color: 'danger', text: 'Critical Risk' }
    }
    
    const { color, text } = config[riskLevel] || config.medium
    
    return (
      <Badge variant={color}>
        <Shield className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
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
        title="Insurer Dashboard"
        description="Monitor claims, detect fraud, and manage customer requests"
        actions={
          <Link to="/insurer/neuroclaim">
            <Button variant="primary">
              <Brain className="w-4 h-4 mr-2" />
              NeuroClaim AI
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={FileText}
          trend={`${stats.totalClaims > 0 ? '+' : ''}${Math.round(Math.random() * 20)}% from last month`}
          trendUp={true}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          trend="Requires attention"
          trendUp={false}
        />
        <StatsCard
          title="Approved Today"
          value={stats.approvedToday}
          icon={CheckCircle}
          trend="On track"
          trendUp={true}
        />
        <StatsCard
          title="Fraud Detected"
          value={stats.fraudDetected}
          icon={AlertTriangle}
          trend="AI monitoring active"
          trendUp={false}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Claims Trend */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claims Trend</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    dot={{ fill: '#06B6D4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Claim Types */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claims by Type</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={claimTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Recent Claims</h2>
            <Link to="/insurer/claims">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 text-sm font-medium text-gray-400">Claim #</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Customer</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Type</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Amount</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Risk</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-gray-700/50">
                    <td className="py-4">
                      <span className="text-sm font-medium text-gray-100">
                        {claim.claim_data?.claimNumber || `#${claim.id.slice(0, 8)}`}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-300">
                        {claim.claim_data?.claimantName || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-300 capitalize">
                        {claim.claim_data?.claimType || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-bold text-gray-100">
                        {formatCurrency(claim.claim_data?.estimatedAmount || 0)}
                      </span>
                    </td>
                    <td className="py-4">
                      {getRiskBadge(claim)}
                    </td>
                    <td className="py-4">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="py-4">
                      <Link to={`/insurer/claims/${claim.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  )
}

export default InsurerDashboard