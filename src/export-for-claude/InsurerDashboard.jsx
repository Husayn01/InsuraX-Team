import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Brain, TrendingUp, Users, 
  Clock, CheckCircle, AlertCircle, BarChart3,
  ArrowRight, Shield, Activity
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, StatsCard, PageHeader } from '@shared/layouts'
import { Button, Card, CardBody, Badge, LoadingSpinner } from '@shared/components'
import { format } from 'date-fns'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd fetch claims assigned to this insurer
      // For demo, we'll use mock data
      const mockClaims = [
        {
          id: '1',
          customer_id: 'cust1',
          status: 'processing',
          claim_data: {
            claimType: 'auto',
            claimNumber: 'CLM-2024-001',
            claimantName: 'John Doe',
            estimatedAmount: 5000,
            damageDescription: 'Front bumper damage from collision'
          },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          customer_id: 'cust2',
          status: 'submitted',
          claim_data: {
            claimType: 'health',
            claimNumber: 'CLM-2024-002',
            claimantName: 'Jane Smith',
            estimatedAmount: 1200,
            damageDescription: 'Emergency room visit'
          },
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          customer_id: 'cust3',
          status: 'approved',
          claim_data: {
            claimType: 'property',
            claimNumber: 'CLM-2024-003',
            claimantName: 'Robert Johnson',
            estimatedAmount: 15000,
            damageDescription: 'Water damage from burst pipe'
          },
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]

      // Calculate stats
      const pendingReview = mockClaims.filter(c => c.status === 'submitted').length
      const approvedToday = mockClaims.filter(c => 
        c.status === 'approved' && 
        new Date(c.created_at).toDateString() === new Date().toDateString()
      ).length

      setStats({
        totalClaims: mockClaims.length,
        pendingReview,
        approvedToday,
        fraudDetected: 2 // Mock value
      })

      setRecentClaims(mockClaims.slice(0, 5))

      // Mock chart data
      setChartData([
        { name: 'Mon', claims: 12, approved: 8 },
        { name: 'Tue', claims: 15, approved: 11 },
        { name: 'Wed', claims: 18, approved: 14 },
        { name: 'Thu', claims: 20, approved: 16 },
        { name: 'Fri', claims: 16, approved: 13 },
        { name: 'Sat', claims: 10, approved: 7 },
        { name: 'Sun', claims: 8, approved: 5 }
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      submitted: 'info',
      processing: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
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
        title={`Welcome back, ${profile?.company_name || 'Insurer'}!`}
        description="Monitor claims, detect fraud, and manage your insurance operations"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          trend={stats.pendingReview > 0 ? 'up' : null}
          trendValue={stats.pendingReview > 0 ? 'Needs attention' : null}
        />
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={FileText}
        />
        <StatsCard
          title="Approved Today"
          value={stats.approvedToday}
          icon={CheckCircle}
        />
        <StatsCard
          title="Fraud Detected"
          value={stats.fraudDetected}
          icon={AlertCircle}
          trend="down"
          trendValue="-15%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Claims Trend */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Weekly Claims Trend</h2>
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
                    name="Total Claims"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10B981" 
                    name="Approved"
                    strokeWidth={2}
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
                <BarChart data={[
                  { type: 'Auto', count: 45 },
                  { type: 'Health', count: 32 },
                  { type: 'Property', count: 28 },
                  { type: 'Life', count: 15 },
                  { type: 'Other', count: 10 }
                ]}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Review Claims</h3>
              <p className="text-sm text-gray-400 mb-3">
                {stats.pendingReview} claims awaiting review
              </p>
              <Link to="/insurer/claims">
                <Button size="sm" variant="primary">
                  Review Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Analytics</h3>
              <p className="text-sm text-gray-400 mb-3">
                View detailed insights and reports
              </p>
              <Link to="/insurer/analytics">
                <Button size="sm" variant="secondary">
                  View Reports
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Claims Queue */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Recent Claims Queue</h2>
          <Link to="/insurer/claims">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <CardBody>
          <div className="space-y-4">
            {recentClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-4 hover:bg-gray-700/30 rounded-lg transition-all duration-300 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-100">
                      {claim.claim_data?.claimNumber}
                    </h3>
                    {getStatusBadge(claim.status)}
                    <Badge variant="info">{claim.claim_data?.claimType}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {claim.claim_data?.claimantName} • {claim.claim_data?.damageDescription?.slice(0, 50)}...
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-100">
                    {formatCurrency(claim.claim_data?.estimatedAmount)}
                  </p>
                  <Link
                    to={`/insurer/claims/${claim.id}`}
                    className="text-sm text-cyan-400 hover:text-cyan-300 group-hover:underline"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  )
}

export default InsurerDashboard