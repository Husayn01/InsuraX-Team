import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, Users, FileText, DollarSign, AlertTriangle, 
  Clock, Filter, Download, Calendar, BarChart2, PieChart
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { Button, Card, CardBody, Select, LoadingSpinner } from '@shared/components'
import { format, subDays } from 'date-fns'

export const InsurerAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalClaims: 0,
      totalAmount: 0,
      approvalRate: 0,
      averageProcessingTime: 0,
      fraudDetectionRate: 0,
      customerSatisfaction: 0
    },
    charts: {
      claimsOverTime: [],
      claimsByType: [],
      processingTime: [],
      monthlyComparison: []
    }
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate mock data
      const mockData = {
        summary: {
          totalClaims: 1234,
          totalAmount: 75600000,
          approvalRate: 78.5,
          averageProcessingTime: 3.2,
          fraudDetectionRate: 4.3,
          customerSatisfaction: 4.6
        },
        charts: {
          claimsOverTime: generateTimeSeriesData(),
          claimsByType: [
            { type: 'Auto', count: 456, amount: 31920000 },
            { type: 'Health', count: 312, amount: 21840000 },
            { type: 'Property', count: 234, amount: 16380000 },
            { type: 'Life', count: 232, amount: 5460000 }
          ],
          processingTime: generateProcessingTimeData(),
          monthlyComparison: generateMonthlyComparison()
        }
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSeriesData = () => {
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      data.push({
        date: format(date, 'MMM d'),
        claims: Math.floor(Math.random() * 50) + 20,
        amount: Math.floor(Math.random() * 7000000) + 3500000,
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
      amount: Math.floor(Math.random() * 35000000) + 14000000,
      fraudDetected: Math.floor(Math.random() * 20) + 5
    }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
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
          <p className="text-xs text-green-600 mt-1">+0.3 from last period</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Claims Over Time */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Claims Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.charts.claimsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="claims" stroke="#3B82F6" strokeWidth={2} name="Total Claims" />
                <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Claims by Type */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Claims by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={analyticsData.charts.claimsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.charts.claimsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  formatter={(value, name) => [`${value} claims`, name]}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {analyticsData.charts.claimsByType.map((item, index) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-gray-600">{item.type}: {formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Processing Time Distribution */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Processing Time Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.charts.processingTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Monthly Comparison */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.charts.monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value, name) => {
                    if (name === 'amount') return formatCurrency(value)
                    return value
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="claims" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Claims" />
                <Area type="monotone" dataKey="fraudDetected" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Fraud Detected" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <BarChart2 className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-blue-900">Peak Claim Hours</h4>
              <p className="text-sm text-blue-700 mt-1">Most claims are submitted between 9 AM - 12 PM</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-green-900">Best Performing Region</h4>
              <p className="text-sm text-green-700 mt-1">Lagos has the highest approval rate at 85%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-purple-900">Customer Retention</h4>
              <p className="text-sm text-purple-700 mt-1">92% of customers renew their policies annually</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  )
}