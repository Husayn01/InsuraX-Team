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
      const { data: allClaims, error: claimsError } = await supabaseHelpers.getClaims({})
      
      if (claimsError) throw claimsError
      
      // Calculate statistics
      const totalClaims = allClaims.length
      const pendingReview = allClaims.filter(c => 
        c.status === 'submitted' || c.status === 'processing'
      ).length
      
      // Get today's approved claims
      const today = new Date()
      const todayStart = startOfDay(today)
      const todayEnd = endOfDay(today)
      
      const approvedToday = allClaims.filter(c => {
        if (c.status !== 'approved') return false
        const updatedAt = new Date(c.updated_at)
        return updatedAt >= todayStart && updatedAt <= todayEnd
      }).length
      
      // Count high-risk claims as potential fraud
      const fraudDetected = allClaims.filter(c => {
        const riskLevel = c.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel
        return riskLevel === 'high' || riskLevel === 'critical' || c.status === 'flagged'
      }).length
      
      setStats({
        totalClaims,
        pendingReview,
        approvedToday,
        fraudDetected
      })
      
      // Get recent claims (last 10)
      const sortedClaims = allClaims.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      setRecentClaims(sortedClaims.slice(0, 10))
      
      // Prepare chart data for last 7 days
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)
        
        const dayClaims = allClaims.filter(c => {
          const createdAt = new Date(c.created_at)
          return createdAt >= dayStart && createdAt <= dayEnd
        })
        
        const dayApproved = dayClaims.filter(c => c.status === 'approved').length
        
        last7Days.push({
          name: format(date, 'EEE'),
          claims: dayClaims.length,
          approved: dayApproved
        })
      }
      setChartData(last7Days)
      
      // Calculate claim type distribution
      const typeCount = {}
      allClaims.forEach(claim => {
        const type = claim.claim_data?.claimType || 'other'
        typeCount[type] = (typeCount[type] || 0) + 1
      })
      
      const typeData = Object.entries(typeCount).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }))
      setClaimTypeData(typeData)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      submitted: { color: 'secondary', icon: Clock, text: 'Submitted' },
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
          trend={`${stats.totalClaims > 0 ? '+' : ''}${stats.totalClaims}`}
          trendLabel="all time"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Approved Today"
          value={stats.approvedToday}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Fraud Detected"
          value={stats.fraudDetected}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Recent Claims */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Recent Claims</h2>
          <Link to="/insurer/claims">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-sm text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="pb-3 font-medium">Claim ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Risk</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3">
                      <span className="font-medium text-gray-100">
                        #{claim.claim_data?.claimNumber || claim.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-gray-300">
                        {claim.customer_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-gray-300 capitalize">
                        {claim.claim_data?.claimType || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-medium text-gray-100">
                        {formatCurrency(claim.claim_data?.estimatedAmount)}
                      </span>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="py-3">
                      {getRiskBadge(claim)}
                    </td>
                    <td className="py-3">
                      <span className="text-gray-400 text-sm">
                        {format(new Date(claim.created_at), 'MMM d, h:mm a')}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link to={`/insurer/claims/${claim.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Trend */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claims Trend (Last 7 Days)</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
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
                    name="Total Claims"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Approved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Claim Types Distribution */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claim Types Distribution</h2>
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
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">NeuroClaim AI</h3>
              <p className="text-sm text-gray-400 mb-3">
                Process claims with AI-powered analysis
              </p>
              <Link to="/insurer/neuroclaim">
                <Button size="sm" variant="primary">
                  Launch AI
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Fraud Detection</h3>
              <p className="text-sm text-gray-400 mb-3">
                Review high-risk claims flagged by AI
              </p>
              <Badge variant="danger">
                {stats.fraudDetected} Flagged
              </Badge>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Analytics</h3>
              <p className="text-sm text-gray-400 mb-3">
                View detailed insights and reports
              </p>
              <Link to="/insurer/analytics">
                <Button size="sm" variant="secondary">
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default InsurerDashboard