import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  CreditCard, DollarSign, Calendar, CheckCircle, 
  AlertCircle, Clock, TrendingUp, Receipt
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Badge, EmptyState, 
  LoadingSpinner, Modal, Input, Select, Alert
} from '@shared/components'
import { format } from 'date-fns'

export const CustomerPayments = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'card',
    description: ''
  })

  useEffect(() => {
    fetchPayments()
  }, [user])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      // In a real app, you'd fetch payments from the payments table
      // For now, we'll simulate with some mock data
      const mockPayments = [
        {
          id: '1',
          amount: 250.00,
          status: 'completed',
          payment_method: 'card',
          description: 'Monthly Premium - March 2024',
          created_at: new Date('2024-03-01').toISOString()
        },
        {
          id: '2',
          amount: 250.00,
          status: 'completed',
          payment_method: 'mobile_money',
          description: 'Monthly Premium - February 2024',
          created_at: new Date('2024-02-01').toISOString()
        },
        {
          id: '3',
          amount: 500.00,
          status: 'pending',
          payment_method: 'crypto',
          description: 'Claim Deductible - CLM-2024-001',
          created_at: new Date().toISOString()
        }
      ]
      setPayments(mockPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const paymentMethodOptions = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'crypto', label: 'Cryptocurrency' }
  ]

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />
      case 'mobile_money':
        return <Receipt className="w-4 h-4" />
      case 'crypto':
        return <DollarSign className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <DashboardLayout>
      <PageHeader
        title="Payments"
        description="Manage your insurance payments and transaction history"
        actions={
          <Button onClick={() => setShowPaymentModal(true)}>
            <CreditCard className="w-4 h-4 mr-2" />
            Make Payment
          </Button>
        }
      />

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-400">Total Paid</h3>
          <p className="text-2xl font-bold text-gray-100 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-500 mt-2">Lifetime payments</p>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-400">Pending</h3>
          <p className="text-2xl font-bold text-gray-100 mt-1">{formatCurrency(pendingAmount)}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting processing</p>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <Calendar className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-400">Next Due</h3>
          <p className="text-2xl font-bold text-gray-100 mt-1">Apr 1, 2024</p>
          <p className="text-xs text-gray-500 mt-2">Monthly premium</p>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="bg-gray-800/50 border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Payment History</h2>
        </div>
        <CardBody>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Your payment history will appear here"
              action={
                <Button size="sm" onClick={() => setShowPaymentModal(true)}>
                  Make First Payment
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-400">Date</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Description</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Method</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Amount</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-4 text-sm text-gray-300">
                        {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-4 text-sm text-gray-100">
                        {payment.description}
                      </td>
                      <td className="py-4 text-sm text-gray-300">
                        <span className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-semibold text-cyan-400">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Make Payment"
        size="md"
        className="bg-gray-800 text-gray-100"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
          <Alert type="info" title="Demo Mode" className="bg-blue-900/20 border-blue-500/50">
            This is a demo payment interface. In production, this would integrate with real payment gateways.
          </Alert>

          <Input
            label="Amount"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
          />

          <Select
            label="Payment Method"
            value={paymentForm.paymentMethod}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
            options={paymentMethodOptions}
            className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
          />

          <Input
            label="Description"
            type="text"
            value={paymentForm.description}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Monthly premium payment"
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPaymentModal(false)}
              disabled={paymentLoading}
              className="text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={paymentLoading}
              disabled={paymentLoading}
            >
              {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default CustomerPayments