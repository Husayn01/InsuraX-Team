import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, DollarSign, Clock, CheckCircle, Plus, 
  TrendingUp, AlertCircle, ArrowRight, Shield,
  Bell, Activity, Zap
} from 'lucide-react'
import { DashboardLayout, PageHeader, StatsCard } from '@shared/layouts'
import { Button, Card, CardBody, Badge, EmptyState, LoadingSpinner } from '@shared/components'
import { format } from 'date-fns'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers, supabase } from '@services/supabase'
import { useNotifications } from '@contexts/NotificationContext'

export const CustomerDashboard = () => {
  const { user, profile } = useAuth()
  const { unreadCount } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClaims: 0,
    activeClaims: 0,
    pendingPayments: 0,
    totalPaid: 0
  })
  const [recentClaims, setRecentClaims] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscription for claims
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
      
      // Fetch all claims for the user
      const { data: claims, error: claimsError } = await supabaseHelpers.getClaims({
        customer_id: user.id
      })
      
      if (claimsError) throw claimsError
      
      // Calculate statistics
      const totalClaims = claims.length
      const activeClaims = claims.filter(c => 
        c.status === 'submitted' || c.status === 'processing'
      ).length
      const approvedClaims = claims.filter(c => c.status === 'approved')
      const totalPaid = approvedClaims.reduce((sum, claim) => 
        sum + (claim.claim_data?.estimatedAmount || 0), 0
      )
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabaseHelpers.getPayments({
        customer_id: user.id
      })
      
      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0
      
      setStats({
        totalClaims,
        activeClaims,
        pendingPayments,
        totalPaid
      })
      
      // Get recent claims (last 5)
      setRecentClaims(claims.slice(0, 5))
      
      // Create activity feed from claims and notifications
      const activities = claims.slice(0, 3).map(claim => ({
        id: claim.id,
        type: 'claim',
        title: `Claim ${claim.claim_data?.claimNumber || claim.id.slice(0, 8)}`,
        description: `Status: ${claim.status}`,
        timestamp: claim.updated_at || claim.created_at,
        icon: FileText,
        color: getStatusColor(claim.status)
      }))
      
      setRecentActivity(activities)
      
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
      rejected: { color: 'danger', icon: AlertCircle, text: 'Rejected' },
      flagged: { color: 'danger', icon: Shield, text: 'Under Review' }
    }
    
    const { color, icon: Icon, text } = config[status] || config.submitted
    
    return (
      <Badge variant={color}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'text-gray-400',
      processing: 'text-yellow-400',
      approved: 'text-green-400',
      rejected: 'text-red-400',
      flagged: 'text-orange-400'
    }
    return colors[status] || 'text-gray-400'
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
        title={`Welcome back, ${profile?.full_name || user.email}!`}
        description="Manage your insurance claims and track their progress"
        actions={
          <Link to="/customer/claims/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </Link>
        }
      />

      {/* Notification Banner */}
      {unreadCount > 0 && (
        <Link to="/customer/notifications">
          <div className="mb-6 p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/50 rounded-lg flex items-center justify-between hover:border-cyan-400 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Bell className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-cyan-400">You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
                <p className="text-sm text-gray-400">Click to view your notifications</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={FileText}
          trend={stats.totalClaims > 0 ? '+' + stats.totalClaims : '0'}
          trendLabel="all time"
        />
        <StatsCard
          title="Active Claims"
          value={stats.activeClaims}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={DollarSign}
          variant="danger"
        />
        <StatsCard
          title="Total Paid Out"
          value={formatCurrency(stats.totalPaid)}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Claims */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Recent Claims</h2>
              <Link to="/customer/claims">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <CardBody>
              {recentClaims.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No claims yet"
                  description="Submit your first claim to get started"
                  action={
                    <Link to="/customer/claims/new">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Claim
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {recentClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-700/30 rounded-lg transition-all duration-300 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-100">
                            {claim.claim_data?.claimType ? 
                              `${claim.claim_data.claimType.charAt(0).toUpperCase() + claim.claim_data.claimType.slice(1)} Claim` 
                              : 'Insurance Claim'}
                          </h3>
                          {getStatusBadge(claim.status)}
                          {claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel === 'critical' && (
                            <Badge variant="danger">
                              <Shield className="w-3 h-3 mr-1" />
                              Under Review
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-400">
                            #{claim.claim_data?.claimNumber || claim.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(claim.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-100">
                          {formatCurrency(claim.claim_data?.estimatedAmount)}
                        </p>
                        <Link
                          to={`/customer/claims/${claim.id}`}
                          className="text-sm text-cyan-400 hover:text-cyan-300 group-hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="h-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Recent Activity</h2>
            </div>
            <CardBody>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 bg-gray-700/50 rounded-lg ${activity.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-100 text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Submit a Claim</h3>
              <p className="text-sm text-gray-400 mb-3">
                File a new insurance claim with our AI-powered system
              </p>
              <Link to="/customer/claims/new">
                <Button size="sm" variant="primary">
                  Start Claim
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Make a Payment</h3>
              <p className="text-sm text-gray-400 mb-3">
                Pay your premiums or deductibles securely online
              </p>
              <Link to="/customer/payments">
                <Button size="sm" variant="secondary">
                  View Payments
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">AI Processing</h3>
              <p className="text-sm text-gray-400 mb-3">
                Experience instant claim processing with NeuroClaim AI
              </p>
              <Badge variant="secondary">
                <Activity className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CustomerDashboard