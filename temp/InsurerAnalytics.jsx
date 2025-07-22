import React, { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  FileText, Clock, Users, Calendar, Download,
  Filter, ChevronDown, AlertTriangle
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Select, LoadingSpinner 
} from '@shared/components'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, AreaChart
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

export const InsurerAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [claimType, setClaimType] = useState('all')
  const [analyticsData, setAnalyticsData] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, claimType])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate mock analytics data
      const mockData = {
        summary: {
          totalClaims: 1234,
          totalAmount: 2500000,
          approvalRate: 78.5,
          averageProcessingTime: 3.2,
          fraudDetectionRate: 15.3,
          customerSatisfaction: 4.2
        },
        trends: {
          claims: generateTrendData('claims'),
          amounts: generateTrendData('amounts'),
          processingTime: generateProcessingTimeData()
        },
        distribution: {
          byType: [
            { name: 'Auto', value: 45, amount: 1125000 },
            { name: 'Health', value: 30, amount: 750000 },
            { name: 'Property', value: 20, amount: 500000 },
            { name: 'Life', value: 5, amount: 125000 }
          ],
          byStatus: [
            { name: 'Approved', value: 78, color: '#10B981' },
            { name: 'Rejected', value: 12, color: '#EF4444' },
            { name: 'Pending', value: 10, color: '#F59E0B' }
          ],
          byRisk: [
            { name: 'Low Risk', value: 65, color: '#10B981' },
            { name: 'Medium Risk', value: 25, color: '#F59E0B' },
            { name: 'High Risk', value: 10, color: '#EF4444' }
          ]
        },
        topMetrics: {
          highestClaimAmount: { amount: 125000, type: 'Property', date: '2024-03-15' },
          averageClaimAmount: 2025,
          totalCustomers: 856,
          repeatClaimants: 124
        },
        monthlyComparison: generateMonthlyComparison()
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTrendData = (type) => {
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      data.push({
        date: format(date, 'MMM d'),
        claims: Math.floor(Math.random() * 50) + 20,
        amount: Math.floor(Math.random() * 100000) + 50000,
        approved: Math.floor(Math.random() * 40) + 15,
        rejected: Math.floor(Math.random() * 10) + 2
      })
    }
    
    return data
  }

  const generateProcessingTimeData = () => {
    return [
      { range: '0-1 days', count: 234 },
      { range: '1-3 days', count: 456 },
      { range: '3-5 days', count: 312 },
      { range: '5-7 days', count: 178 },
      { range: '7+ days', count: 54 }
    ]
  }

  const generateMonthlyComparison = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map(month => ({
      month,
      claims: Math.floor(Math.random() * 200) + 100,
      amount: Math.floor(Math.random() * 500000) + 200000,
      fraudDetected: Math.floor(Math.random() * 20) + 5
    }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

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
        title="Analytics Dashboard"
        description="Comprehensive insights into claims processing and performance"
        actions={
          <div className="flex gap-3">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' }
              ]}
            />
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600">Total Claims</p>
          <p className="text-2xl font-bold">{analyticsData.summary.totalClaims.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">+12% from last period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.totalAmount)}</p>
          <p className="text-xs text-green-600 mt-1">+8% from last period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-600">Approval Rate</p>
          <p className="text-2xl font-bold">{formatPercentage(analyticsData.summary.approvalRate)}</p>
          <p className="text-xs text-green-600 mt-1">+2.5% from last period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600">Avg Processing</p>
          <p className="text-2xl font-bold">{analyticsData.summary.averageProcessingTime} days</p>
          <p className="text-xs text-red-600 mt-1">+0.5 days from last period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-600">Fraud Rate</p>
          <p className="text-2xl font-bold">{formatPercentage(analyticsData.summary.fraudDetectionRate)}</p>
          <p className="text-xs text-red-600 mt-1">+3.2% from last period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600">Satisfaction</p>
          <p className="text-2xl font-bold">{analyticsData.summary.customerSatisfaction}/5</p>
          <p className="text-xs text-green-600 mt-1">+0.2 from last period</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Claims Trend */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claims Trend</h2>
          </div>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.trends.claims}>
                  <defs>
                    <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorClaims)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorApproved)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Amount Trend */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claim Amounts</h2>
          </div>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.trends.amounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Claim Type Distribution */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Claims by Type</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.distribution.byType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.distribution.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value, name, props) => [
                      `${value} claims (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Status Distribution */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Status Distribution</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.distribution.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.distribution.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value) => [`${value}%`, 'Percentage']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Risk Assessment</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.distribution.byRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                    formatter={(value) => [`${value}%`, 'Percentage']}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {analyticsData.distribution.byRisk.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Processing Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Processing Time Distribution</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.trends.processingTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
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

        {/* Monthly Comparison */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100">Monthly Comparison</h2>
          </div>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="claims" fill="#3B82F6" name="Total Claims" />
                  <Bar dataKey="fraudDetected" fill="#EF4444" name="Fraud Detected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Key Insights</h2>
        </div>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h3 className="font-semibold text-blue-400 mb-2">Highest Claim</h3>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(analyticsData.topMetrics.highestClaimAmount.amount)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {analyticsData.topMetrics.highestClaimAmount.type} claim on {analyticsData.topMetrics.highestClaimAmount.date}
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <h3 className="font-semibold text-green-400 mb-2">Average Claim</h3>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(analyticsData.topMetrics.averageClaimAmount)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Across all claim types
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <h3 className="font-semibold text-purple-400 mb-2">Total Customers</h3>
              <p className="text-2xl font-bold text-gray-100">
                {analyticsData.topMetrics.totalCustomers.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Active policy holders
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h3 className="font-semibold text-yellow-400 mb-2">Repeat Claimants</h3>
              <p className="text-2xl font-bold text-gray-100">
                {analyticsData.topMetrics.repeatClaimants}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Multiple claims filed
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  )
}

export default InsurerAnalytics