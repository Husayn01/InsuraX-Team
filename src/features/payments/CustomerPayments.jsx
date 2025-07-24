import React, { useState, useEffect } from 'react'
import { 
  CreditCard, Plus, Download, Clock, CheckCircle, 
  AlertCircle, DollarSign, Calendar, TrendingUp, 
  Smartphone, Building, Bitcoin
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
    upcomingPayment: null
  })

  useEffect(() => {
    fetchPayments()
  }, [])

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
          description: 'Claim deductible',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          reference: 'PAY-2024-003'
        }
      ]

      setPayments(mockPayments)
      
      // Calculate stats
      const completed = mockPayments.filter(p => p.status === 'completed')
      const pending = mockPayments.filter(p => p.status === 'pending')
      
      setStats({
        totalPaid: completed.reduce((sum, p) => sum + p.amount, 0),
        pendingPayments: pending.reduce((sum, p) => sum + p.amount, 0),
        lastPayment: completed[0],
        upcomingPayment: pending[0]
      })
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-5 h-5" />
      case 'mobile_money':
        return <Smartphone className="w-5 h-5" />
      case 'bank_transfer':
        return <Building className="w-5 h-5" />
      case 'crypto':
        return <Bitcoin className="w-5 h-5" />
      default:
        return <DollarSign className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      completed: 'success',
      failed: 'error'
    }
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      failed: <AlertCircle className="w-3 h-3" />
    }
    
    return (
      <Badge variant={variants[status]}>
        <span className="flex items-center gap-1">
          {icons[status]}
          {status}
        </span>
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setPaymentLoading(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would integrate with payment gateway here
      const newPayment = {
        id: Date.now().toString(),
        amount: parseFloat(paymentForm.amount),
        status: 'pending',
        payment_method: paymentForm.paymentMethod,
        description: paymentForm.description,
        created_at: new Date().toISOString()
      }

      setPayments(prev => [newPayment, ...prev])
      setShowPaymentModal(false)
      setPaymentForm({ amount: '', paymentMethod: 'card', description: '' })
      
      // Show success message
      alert('Payment initiated successfully! You will be redirected to the payment gateway.')
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const exportPayments = () => {
    const csv = [
      ['Reference', 'Amount', 'Method', 'Status', 'Date', 'Description'],
      ...payments.map(payment => [
        payment.reference || payment.id,
        payment.amount,
        payment.payment_method,
        payment.status,
        format(new Date(payment.created_at), 'yyyy-MM-dd'),
        payment.description
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
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
        title="Payments"
        description="Manage your insurance payments and billing"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={exportPayments}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="primary" onClick={() => setShowPaymentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Paid</p>
                <p className="text-2xl font-bold text-gray-100">
                  {formatCurrency(stats.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-100">
                  {formatCurrency(stats.pendingPayments)}
                </p>
              </div>
              <div className="p-3 bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last Payment</p>
                <p className="text-lg font-bold text-gray-100">
                  {stats.lastPayment 
                    ? format(new Date(stats.lastPayment.created_at), 'MMM d')
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Next Due</p>
                <p className="text-lg font-bold text-gray-100">Apr 1</p>
              </div>
              <div className="p-3 bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Payment History</h2>
        </div>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 text-sm font-medium text-gray-400">Reference</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Amount</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Method</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Date</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-700/50">
                    <td className="py-4">
                      <span className="text-sm font-medium text-gray-100">
                        {payment.reference || `#${payment.id}`}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-bold text-gray-100">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="text-sm text-gray-300 capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-300">
                        {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-300">
                        {payment.description}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Make a Payment"
        size="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>

          <Select
            label="Payment Method"
            value={paymentForm.paymentMethod}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
            options={[
              { value: 'card', label: 'Credit/Debit Card' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'crypto', label: 'Cryptocurrency' }
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={paymentForm.description}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
              placeholder="What is this payment for?"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPaymentModal(false)}
              disabled={paymentLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={paymentLoading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default CustomerPayments