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
  XCircle,
  User,
  Calendar,
  Sparkles
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
          color: 'from-blue-400 to-cyan-400',
          bgColor: 'from-blue-500/20 to-cyan-500/20',
          title: 'Claim submitted',
          description: 'Your claim #CLM-2024-001 has been submitted',
          time: new Date(Date.now() - 86400000)
        },
        {
          id: 2,
          type: 'payment',
          icon: DollarSign,
          color: 'from-emerald-400 to-green-400',
          bgColor: 'from-emerald-500/20 to-green-500/20',
          title: 'Payment received',
          description: 'Monthly premium payment processed',
          time: new Date(Date.now() - 172800000)
        },
        {
          id: 3,
          type: 'notification',
          icon: Bell,
          color: 'from-purple-400 to-pink-400',
          bgColor: 'from-purple-500/20 to-pink-500/20',
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
        return <Activity className="w-4 h-4 animate-pulse" />
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
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'processing':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRiskLevelStyle = (level) => {
    switch (level) {
      case 'low':
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20'
        }
      case 'medium':
        return {
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20'
        }
      case 'high':
        return {
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20'
        }
      case 'critical':
        return {
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20'
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/20'
        }
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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-24 h-24 rounded-full border-4 border-gray-700/50"></div>
              <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0"></div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute inset-2 animation-delay-150"></div>
              <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin absolute inset-4 animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-400 animate-pulse">Loading your dashboard...</p>
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
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-gray-400 mt-1">Here's what's happening with your insurance today</p>
            </div>
          </div>
        }
        actions={
          <Link to="/customer/claims/new">
            <Button 
              variant="primary" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Claim
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        }
      />

      {/* Notification Banner */}
      {unreadCount > 0 && (
        <Link to="/customer/notifications">
          <div className="mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-gradient-x"></div>
            <div className="relative p-5 bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl flex items-center justify-between hover:border-cyan-400/50 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                    <Bell className="w-6 h-6 text-white animate-wiggle" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">
                    {unreadCount} new notification{unreadCount > 1 ? 's' : ''} waiting for you
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Stay updated with your claims and policy changes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-cyan-400 font-medium">View all</span>
                <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                  <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Total Claims",
            value: stats.totalClaims,
            icon: FileText,
            trend: stats.totalClaims > 0 ? `${stats.totalClaims} total` : 'No claims yet',
            trendUp: false,
            gradient: 'from-blue-500 to-cyan-500',
            bgPattern: 'from-blue-500/10 to-cyan-500/10'
          },
          {
            title: "Active Claims",
            value: stats.activeClaims,
            icon: Activity,
            trend: stats.activeClaims > 0 ? 'In progress' : 'All resolved',
            trendUp: stats.activeClaims > 0,
            gradient: 'from-purple-500 to-pink-500',
            bgPattern: 'from-purple-500/10 to-pink-500/10'
          },
          {
            title: "Pending Payments",
            value: formatCurrency(stats.pendingPayments),
            icon: Clock,
            trend: "Up to date",
            trendUp: true,
            gradient: 'from-amber-500 to-orange-500',
            bgPattern: 'from-amber-500/10 to-orange-500/10'
          },
          {
            title: "Total Paid Out",
            value: formatCurrency(stats.totalPaid),
            icon: DollarSign,
            trend: stats.totalPaid > 0 ? 'Claims approved' : 'No payouts yet',
            trendUp: stats.totalPaid > 0,
            gradient: 'from-emerald-500 to-green-500',
            bgPattern: 'from-emerald-500/10 to-green-500/10'
          }
        ].map((stat, index) => (
          <div key={index} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl"
                 style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}></div>
            <Card className="relative bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgPattern} opacity-50`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16"></div>
              <CardBody className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.trendUp !== undefined && (
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {stat.trend}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Claims */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Recent Claims</h2>
                </div>
                <Link to="/customer/claims">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 group"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
            <CardBody className="p-6">
              {recentClaims.length > 0 ? (
                <div className="space-y-4">
                  {recentClaims.map((claim, index) => (
                    <Link 
                      key={claim.id} 
                      to={`/customer/claims/${claim.id}`}
                      className="block group"
                    >
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="relative p-5 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge className={`${getStatusColor(claim.status)} border backdrop-blur-sm`}>
                                  {getStatusIcon(claim.status)}
                                  <span className="ml-1.5 font-medium capitalize">{claim.status}</span>
                                </Badge>
                                {claim.claim_data?.aiAnalysis?.fraudAssessment && (
                                  <div className={`
                                    px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm
                                    ${getRiskLevelStyle(claim.claim_data.aiAnalysis.fraudAssessment.riskLevel).bg}
                                    ${getRiskLevelStyle(claim.claim_data.aiAnalysis.fraudAssessment.riskLevel).color}
                                    ${getRiskLevelStyle(claim.claim_data.aiAnalysis.fraudAssessment.riskLevel).border}
                                  `}>
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    {claim.claim_data.aiAnalysis.fraudAssessment.riskLevel} risk
                                  </div>
                                )}
                              </div>
                              <h3 className="font-semibold text-white text-lg mb-1">
                                {claim.claim_data?.claimNumber || `Claim #${claim.id.slice(0, 8)}`}
                              </h3>
                              <p className="text-sm text-gray-400 mb-3">
                                <span className="capitalize">{claim.claim_data?.claimType || 'Insurance'}</span> claim
                                <span className="mx-2">•</span>
                                <span className="font-semibold text-cyan-400">{formatCurrency(claim.claim_data?.estimatedAmount || 0)}</span>
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Submitted {format(new Date(claim.created_at), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 p-2 bg-gray-700/50 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20"></div>
                      <div className="relative p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/30">
                        <FileText className="w-12 h-12 text-blue-400" />
                      </div>
                    </div>
                  }
                  title="No claims yet"
                  description="Submit your first claim to get started with our AI-powered processing"
                  action={
                    <Link to="/customer/claims/new">
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-lg shadow-blue-500/25"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Submit First Claim
                      </Button>
                    </Link>
                  }
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              </div>
            </div>
            <CardBody className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="group relative">
                    <div className="absolute left-[26px] top-[44px] bottom-0 w-[2px] bg-gradient-to-b from-gray-700 to-transparent opacity-50"
                         style={{ display: index === recentActivity.length - 1 ? 'none' : 'block' }}></div>
                    <div className="flex items-start gap-4 relative">
                      <div className={`
                        relative p-3 rounded-xl bg-gradient-to-br ${activity.bgColor}
                        border border-gray-700/50 group-hover:scale-110 transition-transform duration-300
                      `}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${activity.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl`}></div>
                        <activity.icon className={`w-5 h-5 bg-gradient-to-r ${activity.color} bg-clip-text text-transparent relative z-10`} />
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-sm font-semibold text-white mb-1">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(activity.time, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-20 -mt-20"></div>
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
              </div>
            </div>
            <CardBody className="p-4 relative">
              <div className="space-y-3">
                {[
                  { to: '/customer/claims/new', icon: FileText, label: 'Submit New Claim', color: 'cyan' },
                  { to: '/customer/payments', icon: CreditCard, label: 'Make Payment', color: 'emerald' },
                  { to: '/customer/profile', icon: User, label: 'Update Profile', color: 'purple' }
                ].map((action, index) => (
                  <Link key={index} to={action.to} className="block group">
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start bg-gray-700/30 hover:bg-gray-700/50 border-gray-700/50 hover:border-gray-600 group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-${action.color}-500/0 via-${action.color}-500/10 to-${action.color}-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700`}></div>
                      <div className={`p-2 bg-${action.color}-500/20 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                      </div>
                      <span className="relative z-10">{action.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                    </Button>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add custom styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient-x {
          0%, 100% { transform: translateX(0%); }
          50% { transform: translateX(100%); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
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
      `}</style>
    </DashboardLayout>
  )
}

export default CustomerDashboard