import React, { useState, useEffect } from 'react'
import { 
  CreditCard, Plus, Download, Clock, CheckCircle, 
  AlertCircle, DollarSign, Calendar, TrendingUp, 
  Smartphone, Building, Bitcoin, ArrowUpRight,
  ArrowDownRight, Activity, Zap, ChevronRight,
  Receipt, Filter, Search, Loader2, Info, Phone, QrCode, 
  Wallet
} from 'lucide-react'
import { NairaIcon } from '@shared/components'
import { useAuth } from '@contexts/AuthContext'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  LoadingSpinner, Modal, Alert 
} from '@shared/components'
import { format } from 'date-fns'
import { supabaseHelpers } from '@services/supabase'
import { paymentService } from '@services/paymentService'
import { FormSelect } from '@shared/components/FormComponents'

export const CustomerPayments = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState(null)
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

  const paymentMethods = [
    { 
      value: 'card', 
      label: 'Debit/Credit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, Verve'
    },
    { 
      value: 'bank_transfer', 
      label: 'Bank Transfer',
      icon: Building,
      description: 'Direct bank transfer'
    },
    { 
      value: 'mobile_money', 
      label: 'Mobile Money',
      icon: Smartphone,
      description: 'MTN, Airtel, 9mobile'
    },
    { 
      value: 'ussd', 
      label: 'USSD Banking',
      icon: Phone,
      description: 'Dial *xxx# to pay'
    },
    { 
      value: 'qr', 
      label: 'QR Code',
      icon: QrCode,
      description: 'Scan to pay with your bank app'
    }
  ]

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [payments, searchTerm, filter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Fetch real payments from database
      const { data, error } = await supabaseHelpers.getPayments({
        customer_id: user.id
      })
      
      if (error) {
        console.error('Error fetching payments:', error)
        return
      }
      
      setPayments(data || [])
      calculateStats(data || [])
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
    const monthlyAverage = Object.keys(monthlyPayments).length > 0 
      ? Object.values(monthlyPayments).reduce((a, b) => a + b, 0) / Object.keys(monthlyPayments).length 
      : 0
    
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
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
    setError(null)
    
    try {
      // Validate amount
      const amount = parseFloat(paymentForm.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      // Initialize payment with Paystack
      const paymentData = {
        amount: amount,
        customer_id: user.id,
        email: user.email,
        description: paymentForm.description,
        payment_method: paymentForm.paymentMethod,
        payment_type: 'premium' // or 'deductible' based on context
      }

      const result = await paymentService.initializePayment(paymentData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize payment')
      }

      // Store payment ID in session storage for callback handling
      sessionStorage.setItem('pending_payment_id', result.data.payment_id)
      
      // Redirect to Paystack payment page
      window.location.href = result.data.authorization_url
      
    } catch (error) {
      console.error('Payment error:', error)
      setError(error.message || 'Payment failed. Please try again.')
      setPaymentLoading(false)
    }
  }

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const result = await paymentService.generateReceipt(paymentId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate receipt')
      }
      
      // Create a simple receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt - ${result.receipt.reference}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; }
            .receipt-info { margin: 20px 0; }
            .receipt-info div { margin: 10px 0; display: flex; justify-content: space-between; }
            .total { font-size: 20px; font-weight: bold; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">InsuraX</div>
            <h2>Payment Receipt</h2>
          </div>
          
          <div class="receipt-info">
            <div><span>Receipt Number:</span> <span>${result.receipt.reference}</span></div>
            <div><span>Date:</span> <span>${new Date(result.receipt.date).toLocaleDateString()}</span></div>
            <div><span>Customer:</span> <span>${result.receipt.customer.full_name}</span></div>
            <div><span>Email:</span> <span>${result.receipt.customer.email}</span></div>
            <div><span>Payment Method:</span> <span>${result.receipt.method.replace('_', ' ').toUpperCase()}</span></div>
            <div><span>Description:</span> <span>${result.receipt.description}</span></div>
            ${result.receipt.claim_number ? `<div><span>Claim Number:</span> <span>${result.receipt.claim_number}</span></div>` : ''}
            <div class="total"><span>Amount Paid:</span> <span>₦${result.receipt.amount.toLocaleString()}</span></div>
          </div>
          
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>InsuraX - Making Insurance Simple</p>
          </div>
        </body>
        </html>
      `
      
      // Create blob and download
      const blob = new Blob([receiptHTML], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${result.receipt.reference}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Receipt download error:', error)
      alert('Failed to download receipt. Please try again.')
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

  // Enhanced payment method selector component
  const PaymentMethodSelector = ({ value, onChange }) => {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Payment Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => onChange(method.value)}
                className={`
                  relative flex items-start p-4 border rounded-lg transition-all
                  ${value === method.value 
                    ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500' 
                    : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    ${value === method.value 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-gray-600/50 text-gray-400'
                    }
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-3 text-left">
                    <h4 className="text-sm font-medium text-white">
                      {method.label}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {method.description}
                    </p>
                  </div>
                </div>
                {value === method.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-cyan-500" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Add method-specific instructions
  const PaymentInstructions = ({ method }) => {
    const instructions = {
      ussd: (
        <Alert variant="info" className="mt-4">
          <Phone className="w-4 h-4" />
          <div>
            <p className="font-semibold">USSD Payment Instructions:</p>
            <ol className="text-sm mt-1 space-y-1">
              <li>1. You'll receive a USSD code after clicking "Pay Now"</li>
              <li>2. Dial the code on your registered phone</li>
              <li>3. Follow the prompts to complete payment</li>
            </ol>
          </div>
        </Alert>
      ),
      qr: (
        <Alert variant="info" className="mt-4">
          <QrCode className="w-4 h-4" />
          <div>
            <p className="font-semibold">QR Code Payment:</p>
            <p className="text-sm mt-1">
              A QR code will be displayed. Open your mobile banking app and scan to pay.
            </p>
          </div>
        </Alert>
      ),
      bank_transfer: (
        <Alert variant="info" className="mt-4">
          <Building className="w-4 h-4" />
          <div>
            <p className="font-semibold">Bank Transfer:</p>
            <p className="text-sm mt-1">
              You'll receive bank account details to complete the transfer.
            </p>
          </div>
        </Alert>
      )
    }
    
    return instructions[method] || null
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
                  <NairaIcon className="w-6 h-6 text-emerald-400" />
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
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendingPayments)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400">In progress</span>
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
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Monthly Average</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyAverage)}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
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
                  <Receipt className="w-6 h-6 text-purple-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Year to Date</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.yearToDate)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400">{new Date().getFullYear()}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by reference or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600"
                />
              </div>
            </div>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="md:w-48 bg-gray-700/50 border-gray-600"
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Payment History */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Payment History
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Reference</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
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
                          <span className="text-sm font-medium text-cyan-400">
                            {payment.gateway_reference || payment.transaction_ref}
                          </span>
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
                            onClick={() => handleDownloadReceipt(payment.id)}
                            disabled={payment.status !== 'completed'}
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
          onClose={() => {
            setShowPaymentModal(false)
            setError(null)
          }}
          title="Make a Payment"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="error" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </Alert>
            )}

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

            {/* Replace the existing Select component with this */}
            <PaymentMethodSelector 
              value={paymentForm.paymentMethod}
              onChange={(method) => setPaymentForm({ ...paymentForm, paymentMethod: method })}
            />

            <PaymentInstructions method={paymentForm.paymentMethod} />

            <Input
              label="Description"
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
              placeholder="e.g., Monthly premium payment"
              className="bg-gray-700/50 border-gray-600 text-white"
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={paymentLoading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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

export default CustomerPayments