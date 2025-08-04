// Create new file: features/settlements/SettlementDashboard.jsx
import React, { useState, useEffect } from 'react'
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, XCircle,
  RefreshCw, Download, Filter, Search, Calendar,
  AlertCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { DashboardLayout, PageHeader, StatsCard } from '@shared/layouts'
import { 
  Card, CardBody, Button, Input, Select, Badge, 
  LoadingSpinner, EmptyState, Tabs 
} from '@shared/components'
import { settlementService } from '@services/settlementService'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const SettlementDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [settlements, setSettlements] = useState([])
  const [filteredSettlements, setFilteredSettlements] = useState([])
  const [stats, setStats] = useState({
    totalSettled: 0,
    totalPending: 0,
    totalFailed: 0,
    totalAmount: 0,
    successRate: 0,
    averageTime: '2.5 hours'
  })
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'this_month'
  })
  
  const [activeTab, setActiveTab] = useState('all')
  
  useEffect(() => {
    fetchSettlements()
  }, [])
  
  useEffect(() => {
    applyFilters()
  }, [settlements, filters])
  
  const fetchSettlements = async () => {
    setLoading(true)
    
    try {
      // Calculate date range
      let fromDate, toDate
      const now = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          fromDate = new Date(now.setHours(0, 0, 0, 0))
          toDate = new Date(now.setHours(23, 59, 59, 999))
          break
        case 'this_week':
          fromDate = new Date(now.setDate(now.getDate() - now.getDay()))
          toDate = new Date()
          break
        case 'this_month':
          fromDate = startOfMonth(new Date())
          toDate = endOfMonth(new Date())
          break
        case 'last_month':
          fromDate = startOfMonth(subMonths(new Date(), 1))
          toDate = endOfMonth(subMonths(new Date(), 1))
          break
        default:
          fromDate = null
          toDate = null
      }
      
      const result = await settlementService.getSettlementHistory({
        from_date: fromDate?.toISOString(),
        to_date: toDate?.toISOString()
      })
      
      if (result.success) {
        setSettlements(result.settlements)
        calculateStats(result.settlements)
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const calculateStats = (data) => {
    const completed = data.filter(s => s.settlement_status === 'completed')
    const pending = data.filter(s => s.settlement_status === 'processing')
    const failed = data.filter(s => s.settlement_status === 'failed')
    
    const totalAmount = completed.reduce((sum, s) => sum + (s.settlement_amount || 0), 0)
    const successRate = data.length > 0 ? (completed.length / data.length) * 100 : 0
    
    setStats({
      totalSettled: completed.length,
      totalPending: pending.length,
      totalFailed: failed.length,
      totalAmount,
      successRate: Math.round(successRate),
      averageTime: '2.5 hours' // This would need to be calculated from actual data
    })
  }
  
  const applyFilters = () => {
    let filtered = [...settlements]
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(s => 
        s.claim_data?.claimNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.customer?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.customer?.email?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(s => s.settlement_status === filters.status)
    }
    
    // Tab filter
    switch (activeTab) {
      case 'completed':
        filtered = filtered.filter(s => s.settlement_status === 'completed')
        break
      case 'pending':
        filtered = filtered.filter(s => s.settlement_status === 'processing')
        break
      case 'failed':
        filtered = filtered.filter(s => s.settlement_status === 'failed')
        break
    }
    
    setFilteredSettlements(filtered)
  }
  
  const retrySettlement = async (settlement) => {
    // Implementation would go here
    console.log('Retrying settlement:', settlement.id)
  }
  
  const exportSettlements = () => {
    // Generate CSV
    const headers = ['Claim Number', 'Customer', 'Amount', 'Status', 'Date', 'Bank']
    const rows = filteredSettlements.map(s => [
      s.claim_data?.claimNumber || '',
      s.customer?.full_name || '',
      s.settlement_amount || 0,
      s.settlement_status || '',
      s.settlement_date ? format(new Date(s.settlement_date), 'MMM d, yyyy') : '',
      s.claim_data?.bank_details?.bank_name || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settlements-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }
  
  const getStatusBadge = (status) => {
    const configs = {
      completed: { color: 'green', icon: CheckCircle },
      processing: { color: 'blue', icon: RefreshCw },
      failed: { color: 'red', icon: XCircle },
      pending: { color: 'amber', icon: Clock }
    }
    
    const config = configs[status] || configs.pending
    const Icon = config.icon
    
    return (
      <Badge className={`bg-${config.color}-500/20 text-${config.color}-400 border-${config.color}-500/30`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }
  
  const tabs = [
    { id: 'all', label: 'All Settlements', count: settlements.length },
    { id: 'completed', label: 'Completed', count: stats.totalSettled },
    { id: 'pending', label: 'Processing', count: stats.totalPending },
    { id: 'failed', label: 'Failed', count: stats.totalFailed }
  ]
  
  return (
    <DashboardLayout>
      <PageHeader
        title="Settlement Management"
        subtitle="Track and manage claim settlements"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={exportSettlements}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        }
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Settled"
          value={`₦${stats.totalAmount.toLocaleString()}`}
          change={`${stats.totalSettled} claims`}
          trend="up"
          icon={DollarSign}
          color="green"
        />
        
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          change="Last 30 days"
          trend={stats.successRate >= 95 ? 'up' : 'down'}
          icon={TrendingUp}
          color="cyan"
        />
        
        <StatsCard
          title="Processing"
          value={stats.totalPending}
          change="Active transfers"
          icon={RefreshCw}
          color="blue"
        />
        
        <StatsCard
          title="Failed"
          value={stats.totalFailed}
          change="Requires attention"
          icon={AlertCircle}
          color="red"
        />
      </div>
      
      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700 mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
             <Input
                placeholder="Search by claim number, customer..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                icon={Search}
                />
            </div>
            
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full md:w-48"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </Select>
            
            <Select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full md:w-48"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="all_time">All Time</option>
            </Select>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchSettlements}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardBody>
      </Card>
      
      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />
      
      {/* Settlements List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredSettlements.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No settlements found"
              description="Settlements will appear here once claims are approved"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Claim
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSettlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {settlement.claim_data?.claimNumber}
                        </div>
                        <div className="text-xs text-gray-400">
                          {settlement.claim_data?.claimType}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {settlement.customer?.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {settlement.customer?.email}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          ₦{settlement.settlement_amount?.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {settlement.claim_data?.bank_details?.bank_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {settlement.claim_data?.bank_details?.account_number?.slice(-4) 
                            ? `****${settlement.claim_data.bank_details.account_number.slice(-4)}`
                            : ''}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(settlement.settlement_status)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {settlement.settlement_date 
                          ? format(new Date(settlement.settlement_date), 'MMM d, yyyy')
                          : 'Pending'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => window.location.href = `/insurer/claims/${settlement.id}`}
                          >
                            View
                          </Button>
                          
                          {settlement.settlement_status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => retrySettlement(settlement)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

            {/* Add custom animations */}
      <style>{`
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