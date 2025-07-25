import React, { useState, useEffect } from 'react'
import { 
  CreditCard, Plus, Download, Clock, CheckCircle, 
  AlertCircle, DollarSign, Calendar, TrendingUp, 
  Smartphone, Building, Bitcoin, ArrowUpRight,
  ArrowDownRight, Activity, Zap, ChevronRight,
  Receipt, Filter, Search
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  LoadingSpinner, Modal, Alert 
} from '@shared/components'
import { format } from 'date-fns'

export const CustomerPayments = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'card',
    description: ''
  })
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingPayments: 0,
    lastPayment: null,
    upcomingPayment: null,
    monthlyAverage: 0,
    yearToDate: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [payments, searchTerm, filter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      // In a real app, fetch from API
      const mockPayments = [
        {
          id: '1',
          amount: 25000,
          status: 'completed',
          payment_method: 'card',
          description: 'Monthly premium - March 2024',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          reference: 'PAY-2024-001'
        },
        {
          id: '2',
          amount: 25000,
          status: 'completed',
          payment_method: 'mobile_money',
          description: 'Monthly premium - February 2024',
          created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
          reference: 'PAY-2024-002'
        },
        {
          id: '3',
          amount: 5000,
          status: 'pending',
          payment_method: 'bank_transfer',
          description: 'Deductible payment',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          reference: 'PAY-2024-003'
        }
      ]
      
      setPayments(mockPayments)
      calculateStats(mockPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (paymentData) => {
    const completed = paymentData.filter(p => p.status === 'completed')
    const pending = paymentData.filter(p => p.status === 'pending')
    
    const totalPaid = completed.reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0)
    
    const lastPayment = completed.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0]
    
    // Calculate monthly average
    const monthlyPayments = {}
    completed.forEach(p => {
      const month = format(new Date(p.created_at), 'yyyy-MM')
      monthlyPayments[month] = (monthlyPayments[month] || 0) + p.amount
    })
    const monthlyAverage = Object.values(monthlyPayments).reduce((a, b) => a + b, 0) / Object.keys(monthlyPayments).length
    
    // Year to date
    const currentYear = new Date().getFullYear()
    const yearToDate = completed
      .filter(p => new Date(p.created_at).getFullYear() === currentYear)
      .reduce((sum, p) => sum + p.amount, 0)
    
    setStats({
      totalPaid,
      pendingPayments: pendingAmount,
      lastPayment,
      upcomingPayment: pending[0],
      monthlyAverage,
      yearToDate
    })
  }

  const applyFilters = () => {
    let filtered = [...payments]
    
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(payment => payment.status === filter)
    }
    
    setFilteredPayments(filtered)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setPaymentLoading(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, process payment through payment gateway
      alert('Payment processed successfully!')
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        paymentMethod: 'card',
        description: ''
      })
      fetchPayments()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const getPaymentMethodIcon = (method) => {
    const icons = {
      card: CreditCard,
      mobile_money: Smartphone,
      bank_transfer: Building,
      crypto: Bitcoin
    }
    return icons[method] || CreditCard
  }

  const getPaymentMethodColor = (method) => {
    const colors = {
      card: 'blue',
      mobile_money: 'green',
      bank_transfer: 'purple',
      crypto: 'orange'
    }
    return colors[method] || 'gray'
  }

  const getStatusBadge = (status) => {
    const config = {
      completed: {
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle,
        pulse: false
      },
      pending: {
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Clock,
        pulse: true
      },
      failed: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
        pulse: false
      }
    }
    
    const { color, icon: Icon, pulse } = config[status] || config.pending
    
    return (
      <Badge className={`${color} border backdrop-blur-sm ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
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
            <p className="mt-6 text-gray-400 animate-pulse">Loading payment history...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/30 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Payment Center
          </span>
        }
        description="Manage your insurance payments and billing"
        actions={
          <Button 
            onClick={() => setShowPaymentModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Make Payment
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPaid)}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">All time</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                {stats.pendingPayments > 0 && (
                  <div className="animate-pulse">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendingPayments)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400">Awaiting processing</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Monthly Average</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyAverage)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">Per month</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                  {new Date().getFullYear()}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-1">Year to Date</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.yearToDate)}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400">Current year</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Last Payment Alert */}
      {stats.lastPayment && (
        <Alert 
          type="success" 
          title="Last Payment"
          className="mb-6 bg-emerald-900/20 border-emerald-500/50"
        >
          <div className="flex items-center justify-between">
            <span>
              {formatCurrency(stats.lastPayment.amount)} - {stats.lastPayment.description}
            </span>
            <span className="text-sm text-emerald-400">
              {format(new Date(stats.lastPayment.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
                />
              </div>
            </div>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Select>
            <Button variant="secondary" className="bg-gray-700/50 hover:bg-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Payment History */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Receipt className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Payment History</h2>
          </div>
        </div>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Reference</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Method</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const MethodIcon = getPaymentMethodIcon(payment.payment_method)
                    const methodColor = getPaymentMethodColor(payment.payment_method)
                    
                    return (
                      <tr 
                        key={payment.id} 
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-cyan-400">{payment.reference}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{payment.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 bg-${methodColor}-500/20 rounded-lg`}>
                              <MethodIcon className={`w-4 h-4 text-${methodColor}-400`} />
                            </div>
                            <span className="text-sm text-gray-300 capitalize">
                              {payment.payment_method.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-white">{formatCurrency(payment.amount)}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                        <td className="px-6 py-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Make a Payment"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <Input
              label="Amount (NGN)"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="0.00"
              required
              min="0"
              step="0.01"
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            
            <Select
              label="Payment Method"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="card">Credit/Debit Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="crypto">Cryptocurrency</option>
            </Select>
            
            <Input
              label="Description"
              type="text"
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
              placeholder="e.g., Monthly premium payment"
              required
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={paymentLoading}
                disabled={paymentLoading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600"
              >
                Process Payment
              </Button>
            </div>
          </form>
        </Modal>
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

export default CustomerPayments