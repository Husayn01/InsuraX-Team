import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Shield,
  Bell, 
  Activity, 
  Zap, 
  ChevronRight,
  CreditCard,
  XCircle,  // You might need this too
  User,     // And possibly this
  Calendar  // And this as well
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
    fetchDashboardData()
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user's claims
      const { data: claims } = await supabaseHelpers.getClaims({
        customer_id: user.id
      })
      
      // Calculate stats
      const totalClaims = claims?.length || 0
      const activeClaims = claims?.filter(c => 
        c.status === 'submitted' || c.status === 'processing'
      ).length || 0
      
      const totalPaid = claims?.filter(c => c.status === 'approved')
        .reduce((sum, claim) => sum + (claim.claim_data?.approvedAmount || 0), 0) || 0
      
      setStats({
        totalClaims,
        activeClaims,
        pendingPayments: 0, // This would come from payments table
        totalPaid
      })
      
      // Get recent claims (last 5)
      setRecentClaims(claims?.slice(0, 5) || [])
      
      // Simulate recent activity
      const activities = [
        {
          id: 1,
          type: 'claim',
          icon: FileText,
          color: 'text-blue-400',
          title: 'Claim submitted',
          description: 'Your claim #CLM-2024-001 has been submitted',
          time: new Date(Date.now() - 86400000)
        },
        {
          id: 2,
          type: 'payment',
          icon: DollarSign,
          color: 'text-green-400',
          title: 'Payment received',
          description: 'Monthly premium payment processed',
          time: new Date(Date.now() - 172800000)
        },
        {
          id: 3,
          type: 'notification',
          icon: Bell,
          color: 'text-cyan-400',
          title: 'Policy update',
          description: 'Your policy coverage has been updated',
          time: new Date(Date.now() - 259200000)
        }
      ]
      
      setRecentActivity(activities)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />
      case 'processing':
        return <Activity className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'secondary'
      case 'processing':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'secondary'
    }
  }

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-orange-400'
      case 'critical':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
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
          trend={stats.totalClaims > 0 ? `${stats.totalClaims} total` : 'No claims yet'}
          trendUp={false}
        />
        <StatsCard
          title="Active Claims"
          value={stats.activeClaims}
          icon={Activity}
          trend={stats.activeClaims > 0 ? 'In progress' : 'All resolved'}
          trendUp={stats.activeClaims > 0}
        />
        <StatsCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          icon={Clock}
          trend="Up to date"
          trendUp={true}
        />
        <StatsCard
          title="Total Paid Out"
          value={formatCurrency(stats.totalPaid)}
          icon={DollarSign}
          trend={stats.totalPaid > 0 ? 'Claims approved' : 'No payouts yet'}
          trendUp={stats.totalPaid > 0}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Claims */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">Recent Claims</h2>
                <Link to="/customer/claims">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <CardBody>
              {recentClaims.length > 0 ? (
                <div className="space-y-4">
                  {recentClaims.map((claim) => (
                    <Link 
                      key={claim.id} 
                      to={`/customer/claims/${claim.id}`}
                      className="block"
                    >
                      <div className="p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={getStatusColor(claim.status)}>
                                {getStatusIcon(claim.status)}
                                <span className="ml-1">{claim.status}</span>
                              </Badge>
                              {claim.claim_data?.aiAnalysis?.fraudAssessment && (
                                <span className={`text-sm font-medium ${getRiskLevelColor(
                                  claim.claim_data.aiAnalysis.fraudAssessment.riskLevel
                                )}`}>
                                  {claim.claim_data.aiAnalysis.fraudAssessment.riskLevel} risk
                                </span>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-100">
                              {claim.claim_data?.claimNumber || `Claim #${claim.id.slice(0, 8)}`}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {claim.claim_data?.claimType || 'Insurance'} claim • {formatCurrency(claim.claim_data?.estimatedAmount || 0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Submitted {format(new Date(claim.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No claims yet"
                  description="Submit your first claim to get started"
                  action={
                    <Link to="/customer/claims/new">
                      <Button variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Claim
                      </Button>
                    </Link>
                  }
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Recent Activity</h2>
            </div>
            <CardBody>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-700/50`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-100">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(activity.time, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Quick Actions</h2>
            </div>
            <CardBody>
              <div className="space-y-3">
                <Link to="/customer/claims/new" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-3" />
                    Submit New Claim
                  </Button>
                </Link>
                <Link to="/customer/payments" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-3" />
                    Make Payment
                  </Button>
                </Link>
                <Link to="/customer/profile" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <User className="w-4 h-4 mr-3" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CustomerDashboard