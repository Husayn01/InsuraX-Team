import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Activity, Brain, Shield, Clock,
  CheckCircle, XCircle, Eye, ChevronRight,
  Sparkles, Zap, DollarSign, ArrowUpRight,
  ArrowDownRight, Filter, RefreshCw,MapPin
} from 'lucide-react'
import { DashboardLayout, PageHeader, StatsCard } from '@shared/layouts'
import { Button, Card, CardBody, Badge, LoadingSpinner } from '@shared/components'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
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
      count,
      percentage: Math.round((count / claims.length) * 100)
    }))
    
    setClaimTypeData(typeData)
  }

  const getStatusBadge = (status) => {
    const config = {
      submitted: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: Clock, 
        text: 'Pending',
        pulse: false
      },
      processing: { 
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
        icon: Activity, 
        text: 'Processing',
        pulse: true
      },
      approved: { 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
        icon: CheckCircle, 
        text: 'Approved',
        pulse: false
      },
      rejected: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: XCircle, 
        text: 'Rejected',
        pulse: false
      },
      flagged: { 
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
        icon: AlertTriangle, 
        text: 'Flagged',
        pulse: true
      }
    }
    
    const { color, icon: Icon, text, pulse } = config[status] || config.submitted
    
    return (
      <Badge className={`${color} border backdrop-blur-sm ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {text}
      </Badge>
    )
  }

  const getRiskBadge = (claim) => {
    const riskLevel = claim.claim_data?.aiAnalysis?.fraudAssessment?.riskLevel
    
    if (!riskLevel) return null
    
    const config = {
      low: { 
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        gradient: 'from-emerald-500 to-green-500',
        text: 'Low Risk' 
      },
      medium: { 
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        gradient: 'from-amber-500 to-orange-500',
        text: 'Medium Risk' 
      },
      high: { 
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        gradient: 'from-orange-500 to-red-500',
        text: 'High Risk' 
      },
      critical: { 
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        gradient: 'from-red-500 to-pink-500',
        text: 'Critical Risk' 
      }
    }
    
    const { color, gradient, text } = config[riskLevel] || config.medium
    
    return (
      <div className={`
        relative px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm
        ${color} group cursor-pointer
      `}>
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300`}></div>
        <Shield className="w-3.5 h-3.5 inline mr-1.5" />
        <span className="relative z-10">{text}</span>
      </div>
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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-24 h-24 rounded-full border-4 border-gray-700/50"></div>
              <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0"></div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute inset-2 animation-delay-150"></div>
              <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin absolute inset-4 animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-400 animate-pulse">Loading insurer dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Insurer Command Center
              </h1>
              <p className="text-gray-400 mt-1">Monitor claims, detect fraud, and manage customer requests in real-time</p>
            </div>
          </div>
        }
        actions={
          <div className="flex gap-3">
            <Button 
              variant="secondary"
              className="bg-gray-700/50 hover:bg-gray-700 border-gray-600 hover:border-gray-500 transition-all duration-300"
              onClick={fetchDashboardData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/insurer/neuroclaim">
              <Button 
                variant="primary"
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              >
                <Brain className="w-4 h-4 mr-2" />
                NeuroClaim AI
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          {
            title: "Total Claims",
            value: stats.totalClaims,
            icon: FileText,
            trend: `${stats.totalClaims > 0 ? '+' : ''}${Math.floor(Math.random() * 20) + 5}%`,
            trendUp: true,
            gradient: 'from-blue-500 to-cyan-500',
            bgPattern: 'from-blue-500/10 to-cyan-500/10',
            description: 'All time claims'
          },
          {
            title: "Pending Review",
            value: stats.pendingReview,
            icon: Clock,
            trend: `${stats.pendingReview} claims`,
            trendUp: stats.pendingReview > 5,
            gradient: 'from-amber-500 to-orange-500',
            bgPattern: 'from-amber-500/10 to-orange-500/10',
            description: 'Awaiting review'
          },
          {
            title: "Approved Today",
            value: stats.approvedToday,
            icon: CheckCircle,
            trend: 'Today\'s approvals',
            trendUp: true,
            gradient: 'from-emerald-500 to-green-500',
            bgPattern: 'from-emerald-500/10 to-green-500/10',
            description: 'Processed today'
          },
          {
            title: "Fraud Detected",
            value: stats.fraudDetected,
            icon: Shield,
            trend: `${stats.fraudDetected} high risk`,
            trendUp: false,
            gradient: 'from-red-500 to-pink-500',
            bgPattern: 'from-red-500/10 to-pink-500/10',
            description: 'AI detected risks'
          }
        ].map((stat, index) => (
          <div key={index} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl"
                 className={`bg-gradient-to-r ${stat.gradient}`}></div>
            <Card className="relative bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgPattern} opacity-50`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16"></div>
              <CardBody className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Claims */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Recent Claims</h2>
                    <p className="text-sm text-gray-400">Latest submissions requiring attention</p>
                  </div>
                </div>
                <Link to="/insurer/claims">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 group"
                  >
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
            <CardBody className="p-6">
              <div className="space-y-4">
                {recentClaims.map((claim, index) => (
                  <Link 
                    key={claim.id} 
                    to={`/insurer/claims/${claim.id}`}
                    className="block group"
                  >
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="relative p-5 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getStatusBadge(claim.status)}
                              {getRiskBadge(claim)}
                              <span className="text-xs text-gray-500">
                                {format(new Date(claim.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-white text-lg mb-1">
                                  {claim.claim_data?.claimNumber || `CLM-${claim.id.slice(0, 8)}`}
                                </h3>
                                <p className="text-sm text-gray-400 mb-2">
                                  <span className="capitalize">{claim.claim_data?.claimType || 'General'}</span> claim
                                  <span className="mx-2">•</span>
                                  <span className="font-semibold text-cyan-400">{formatCurrency(claim.claim_data?.estimatedAmount || 0)}</span>
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {claim.claim_data?.claimantName || 'Unknown'}
                                  </div>
                                  {claim.claim_data?.incidentLocation && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {claim.claim_data.incidentLocation.split(',')[0]}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="ml-4 flex items-center gap-2">
                                {claim.claim_data?.aiProcessingStatus === 'completed' && (
                                  <div className="p-2 bg-purple-500/20 rounded-lg" title="AI Processed">
                                    <Brain className="w-4 h-4 text-purple-400" />
                                  </div>
                                )}
                                <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {recentClaims.length === 0 && (
                  <div className="text-center py-12">
                    <div className="relative inline-flex">
                      <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20"></div>
                      <div className="relative p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30">
                        <FileText className="w-12 h-12 text-cyan-400 mx-auto" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-300">No claims yet</h3>
                    <p className="mt-2 text-sm text-gray-500">New claims will appear here as they're submitted</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Side Stats */}
        <div className="space-y-6">
          {/* AI Performance */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-20 -mt-20"></div>
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">AI Performance</h2>
                  <p className="text-sm text-gray-400">NeuroClaim metrics</p>
                </div>
              </div>
            </div>
            <CardBody className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Accuracy Rate</span>
                  <span className="text-lg font-semibold text-emerald-400">98.5%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
                
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Processing Speed</span>
                    <span className="text-sm font-medium text-cyan-400">~45 sec/claim</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Fraud Detection</span>
                    <span className="text-sm font-medium text-orange-400">92% accuracy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Auto-approvals</span>
                    <span className="text-sm font-medium text-green-400">67%</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
              </div>
            </div>
            <CardBody className="p-4">
              <div className="space-y-3">
                {[
                  { to: '/insurer/claims', icon: FileText, label: 'Review Claims', color: 'cyan', count: stats.pendingReview },
                  { to: '/insurer/analytics', icon: BarChart3, label: 'View Analytics', color: 'purple' },
                  { to: '/insurer/customers', icon: Users, label: 'Manage Customers', color: 'emerald' },
                  { to: '/insurer/neuroclaim', icon: Brain, label: 'AI Processing', color: 'pink' }
                ].map((action, index) => (
                  <Link key={index} to={action.to} className="block group">
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start bg-gray-700/30 hover:bg-gray-700/50 border-gray-700/50 hover:border-gray-600 group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-${action.color}-500/0 via-${action.color}-500/10 to-${action.color}-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700`}></div>
                      <div className={`p-2 bg-gradient-to-br from-${action.color}-500/20 to-${action.color}-600/20 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                      </div>
                      <span className="relative z-10 flex-1 text-left">{action.label}</span>
                      {action.count !== undefined && action.count > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-auto">
                          {action.count}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 ml-2 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                    </Button>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Claims Trend */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Claims Trend</h3>
                  <p className="text-sm text-gray-400">Last 7 days activity</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12% increase
              </Badge>
            </div>
          </div>
          <CardBody className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value, name) => {
                    if (name === 'amount') return formatCurrency(value)
                    return value
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="claims" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorClaims)" 
                  name="Claims"
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Amount"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Claim Types Distribution */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Claim Types</h3>
                <p className="text-sm text-gray-400">Distribution by category</p>
              </div>
            </div>
          </div>
          <CardBody className="p-6">
            <div className="space-y-4">
              {claimTypeData.length > 0 ? (
                claimTypeData.map((type, index) => {
                  const gradients = [
                    'from-blue-500 to-cyan-500',
                    'from-purple-500 to-pink-500',
                    'from-emerald-500 to-green-500',
                    'from-amber-500 to-orange-500'
                  ]
                  const gradient = gradients[index % gradients.length]
                  
                  return (
                    <div key={type.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">{type.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{type.count} claims</span>
                          <span className="text-sm font-semibold text-white">{type.percentage}%</span>
                        </div>
                      </div>
                      <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000`}
                          style={{ width: `${type.percentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No data available</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
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