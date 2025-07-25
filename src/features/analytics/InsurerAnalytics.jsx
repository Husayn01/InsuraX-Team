import React, { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, Calendar, Download, Filter, 
  FileText, Users, DollarSign, AlertTriangle, Clock,
  ChevronRight, ArrowUpRight, ArrowDownRight, Activity,
  PieChart, Brain, Shield, Zap, RefreshCw, Info,
  CheckCircle, XCircle, Target, Award, Star, AlertCircle
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Select, Badge, 
  LoadingSpinner, Tabs 
} from '@shared/components'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

export const InsurerAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last30days')
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  
  const [analytics, setAnalytics] = useState({
    overview: {
      totalClaims: 1245,
      totalClaimsValue: 45678900,
      approvalRate: 78.5,
      avgProcessingTime: 2.3,
      fraudDetectionRate: 4.2,
      customerSatisfaction: 4.6
    },
    trends: [],
    claimsByType: [],
    claimsByStatus: [],
    fraudAnalysis: [],
    performanceMetrics: []
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // Mock data generation
      const trends = generateTrendData()
      const claimsByType = [
        { type: 'Auto', value: 45, count: 562 },
        { type: 'Health', value: 25, count: 311 },
        { type: 'Property', value: 20, count: 249 },
        { type: 'Life', value: 10, count: 123 }
      ]
      const claimsByStatus = [
        { status: 'Approved', value: 65, count: 809, color: '#10b981' },
        { status: 'Pending', value: 20, count: 249, color: '#f59e0b' },
        { status: 'Rejected', value: 10, count: 124, color: '#ef4444' },
        { status: 'Processing', value: 5, count: 63, color: '#8b5cf6' }
      ]
      const fraudAnalysis = generateFraudAnalysisData()
      const performanceMetrics = generatePerformanceData()
      
      setAnalytics({
        ...analytics,
        trends,
        claimsByType,
        claimsByStatus,
        fraudAnalysis,
        performanceMetrics
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTrendData = () => {
    const days = dateRange === 'last7days' ? 7 : dateRange === 'last30days' ? 30 : 90
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      data.push({
        date: format(date, 'MMM d'),
        claims: Math.floor(Math.random() * 50) + 20,
        amount: Math.floor(Math.random() * 2000000) + 500000,
        fraudDetected: Math.floor(Math.random() * 5)
      })
    }
    
    return data
  }

  const generateFraudAnalysisData = () => {
    return [
      { category: 'Document Fraud', score: 85, incidents: 12 },
      { category: 'Claim Inflation', score: 72, incidents: 8 },
      { category: 'Identity Theft', score: 45, incidents: 3 },
      { category: 'Staged Accidents', score: 68, incidents: 7 },
      { category: 'False Information', score: 55, incidents: 5 }
    ]
  }

  const generatePerformanceData = () => {
    return [
      { metric: 'Processing Speed', current: 85, target: 90, unit: '%' },
      { metric: 'Customer Satisfaction', current: 92, target: 95, unit: '%' },
      { metric: 'Cost Efficiency', current: 78, target: 85, unit: '%' },
      { metric: 'Fraud Detection', current: 94, target: 90, unit: '%' },
      { metric: 'Claim Accuracy', current: 96, target: 95, unit: '%' },
      { metric: 'Response Time', current: 88, target: 90, unit: '%' }
    ]
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

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
            <p className="mt-6 text-gray-400 animate-pulse">Loading analytics...</p>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Analytics Dashboard
          </span>
        }
        description="Comprehensive insights into claims, fraud detection, and performance"
        actions={
          <div className="flex gap-3">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </Select>
            <Button 
              variant="secondary"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  12%
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Claims</p>
              <p className="text-3xl font-bold text-white">{analytics.overview.totalClaims.toLocaleString()}</p>
              <div className="mt-2 text-xs text-gray-500">This period</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  8%
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-1">Claims Value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.overview.totalClaimsValue)}</p>
              <div className="mt-2 text-xs text-gray-500">Total processed</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-purple-400" />
                </div>
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Approval Rate</p>
              <p className="text-3xl font-bold text-white">{analytics.overview.approvalRate}%</p>
              <div className="mt-2 text-xs text-gray-500">Above target</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <Brain className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Fraud Detection</p>
              <p className="text-3xl font-bold text-white">{analytics.overview.fraudDetectionRate}%</p>
              <div className="mt-2 text-xs text-gray-500">AI accuracy</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 p-1 bg-gray-800/50 backdrop-blur-sm rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'fraud', label: 'Fraud Analysis', icon: Shield },
            { id: 'performance', label: 'Performance', icon: Activity },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claims Trend Chart */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Claims Trend</h3>
                </div>
                <Badge className="bg-gray-700/50 text-gray-300 border-gray-600 border">
                  Daily
                </Badge>
              </div>
            </div>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.trends}>
                  <defs>
                    <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#06b6d4" 
                    fillOpacity={1} 
                    fill="url(#colorClaims)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Claims by Type */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Claims Distribution</h3>
              </div>
            </div>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={analytics.claimsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, value }) => `${type}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.claimsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {analytics.claimsByType.map((item, index) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-300">{item.type}</span>
                    <span className="text-sm font-semibold text-white ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Claim Status Breakdown */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Status Overview</h3>
              </div>
            </div>
            <CardBody>
              <div className="space-y-4">
                {analytics.claimsByStatus.map((status) => (
                  <div key={status.status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">{status.status}</span>
                      <span className="text-sm font-semibold text-white">{status.count} ({status.value}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${status.value}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Processing Metrics */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Processing Metrics</h3>
              </div>
            </div>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gray-700/30 rounded-xl">
                  <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white mb-1">{analytics.overview.avgProcessingTime}</p>
                  <p className="text-sm text-gray-400">Avg. Days</p>
                </div>
                <div className="text-center p-6 bg-gray-700/30 rounded-xl">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white mb-1">{analytics.overview.customerSatisfaction}</p>
                  <p className="text-sm text-gray-400">Rating</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'fraud' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fraud Detection by Category */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Fraud Categories</h3>
              </div>
            </div>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analytics.fraudAnalysis}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
                  <PolarRadiusAxis stroke="#9ca3af" />
                  <Radar 
                    name="Risk Score" 
                    dataKey="score" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Fraud Incidents List */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Shield className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Recent Fraud Alerts</h3>
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border animate-pulse">
                  {analytics.fraudAnalysis.reduce((sum, item) => sum + item.incidents, 0)} Total
                </Badge>
              </div>
            </div>
            <CardBody>
              <div className="space-y-3">
                {analytics.fraudAnalysis.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">{item.category}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-400">{item.incidents} incidents</span>
                          <div className="flex items-center gap-1">
                            <div className="w-24 bg-gray-600 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{item.score}%</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {analytics.performanceMetrics.map((metric, index) => (
            <Card key={index} className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
              <CardBody className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-300">{metric.metric}</h4>
                    {metric.current >= metric.target ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  
                  <div className="relative h-32 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white mb-1">
                        {metric.current}
                        <span className="text-xl text-gray-400">{metric.unit}</span>
                      </p>
                      <p className="text-sm text-gray-500">Target: {metric.target}{metric.unit}</p>
                    </div>
                    
                    {/* Circular Progress */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke="#374151"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke={metric.current >= metric.target ? '#10b981' : '#f59e0b'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(metric.current / 100) * 283} 283`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">Performance</span>
                    <span className={`font-semibold ${
                      metric.current >= metric.target ? 'text-green-400' : 'text-amber-400'
                    }`}>
                      {metric.current >= metric.target ? 'Above Target' : 'Below Target'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'trends' && (
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Claims & Revenue Trends</h3>
            </div>
          </div>
          <CardBody>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="claims" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

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

export default InsurerAnalytics