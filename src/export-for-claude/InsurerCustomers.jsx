import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, Search, Filter, Mail, Phone, MapPin,
  FileText, TrendingUp, AlertTriangle, DollarSign,
  Eye, MessageSquare, Calendar, Shield, Clock
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, Badge, 
  LoadingSpinner, Modal 
} from '@shared/components'
import { format } from 'date-fns'

export const InsurerCustomers = () => {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    claimHistory: 'all',
    status: 'all'
  })
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, searchTerm, filters])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      // Mock customer data
      const mockCustomers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+234 801 234 5678',
          address: '45 Victoria Island, Lagos',
          memberSince: '2020-01-15',
          status: 'active',
          riskScore: 'low',
          policies: [
            { type: 'auto', number: 'POL-AUTO-001', premium: 500, status: 'active' },
            { type: 'health', number: 'POL-HEALTH-001', premium: 300, status: 'active' }
          ],
          claims: {
            total: 3,
            approved: 2,
            rejected: 0,
            pending: 1,
            totalAmount: 15000
          },
          lastActivity: '2024-03-18',
          lifetime: {
            premiumsPaid: 25000,
            claimsPaid: 12000,
            profitability: 13000
          }
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+234 802 345 6789',
          address: '123 Lekki Phase 1, Lagos',
          memberSince: '2021-06-20',
          status: 'active',
          riskScore: 'medium',
          policies: [
            { type: 'health', number: 'POL-HEALTH-002', premium: 400, status: 'active' }
          ],
          claims: {
            total: 1,
            approved: 1,
            rejected: 0,
            pending: 0,
            totalAmount: 8000
          },
          lastActivity: '2024-03-15',
          lifetime: {
            premiumsPaid: 10000,
            claimsPaid: 8000,
            profitability: 2000
          }
        },
        {
          id: '3',
          name: 'Robert Johnson',
          email: 'robert.j@example.com',
          phone: '+234 803 456 7890',
          address: '78 Ikoyi Crescent, Lagos',
          memberSince: '2019-03-10',
          status: 'active',
          riskScore: 'high',
          policies: [
            { type: 'property', number: 'POL-PROP-001', premium: 1000, status: 'active' },
            { type: 'auto', number: 'POL-AUTO-002', premium: 600, status: 'active' }
          ],
          claims: {
            total: 8,
            approved: 5,
            rejected: 2,
            pending: 1,
            totalAmount: 45000
          },
          lastActivity: '2024-03-20',
          lifetime: {
            premiumsPaid: 48000,
            claimsPaid: 35000,
            profitability: 13000
          }
        }
      ]
      
      setCustomers(mockCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...customers]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      )
    }

    // Risk level filter
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(customer => customer.riskScore === filters.riskLevel)
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(customer => customer.status === filters.status)
    }

    setFilteredCustomers(filtered)
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'success'
      case 'medium':
        return 'warning'
      case 'high':
        return 'error'
      default:
        return 'info'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const calculateClaimRatio = (customer) => {
    if (customer.claims.total === 0) return 0
    return ((customer.claims.approved / customer.claims.total) * 100).toFixed(0)
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
        title="Customer Management"
        description="View and manage all insurance customers"
        actions={
          <Button variant="primary">
            <Users className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Policies</p>
              <p className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.policies.length, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.riskScore === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(customers.reduce((sum, c) => sum + c.lifetime.premiumsPaid, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5 text-gray-400" />}
              className="lg:w-96"
            />
            <Select
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              options={[
                { value: 'all', label: 'All Risk Levels' },
                { value: 'low', label: 'Low Risk' },
                { value: 'medium', label: 'Medium Risk' },
                { value: 'high', label: 'High Risk' }
              ]}
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' }
              ]}
            />
            <Button variant="secondary" onClick={fetchCustomers}>
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-500">Member since {format(new Date(customer.memberSince), 'MMM yyyy')}</p>
                  </div>
                </div>
                <Badge variant={getRiskColor(customer.riskScore)}>
                  {customer.riskScore} risk
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    {customer.address}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Last active: {format(new Date(customer.lastActivity), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Policies</p>
                  <p className="text-lg font-semibold">{customer.policies.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Claims</p>
                  <p className="text-lg font-semibold">{customer.claims.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Claim Ratio</p>
                  <p className="text-lg font-semibold">{calculateClaimRatio(customer)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lifetime Value</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm">
                      <span className="text-gray-500">Paid:</span> 
                      <span className="font-semibold text-green-600 ml-1">
                        {formatCurrency(customer.lifetime.premiumsPaid)}
                      </span>
                    </span>
                    <span className="text-sm">
                      <span className="text-gray-500">Claims:</span> 
                      <span className="font-semibold text-red-600 ml-1">
                        {formatCurrency(customer.lifetime.claimsPaid)}
                      </span>
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setShowCustomerModal(true)
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false)
          setSelectedCustomer(null)
        }}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-100">{selectedCustomer.name}</h3>
                <p className="text-gray-400">Customer ID: {selectedCustomer.id}</p>
              </div>
              <Badge variant={getRiskColor(selectedCustomer.riskScore)}>
                {selectedCustomer.riskScore} risk
              </Badge>
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-semibold text-gray-100 mb-3">Active Policies</h4>
              <div className="space-y-2">
                {selectedCustomer.policies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-100 capitalize">{policy.type} Insurance</p>
                      <p className="text-sm text-gray-400">{policy.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(policy.premium)}/month</p>
                      <Badge variant="success" size="sm">{policy.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claims Summary */}
            <div>
              <h4 className="font-semibold text-gray-100 mb-3">Claims Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-100">{selectedCustomer.claims.total}</p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {formatCurrency(selectedCustomer.claims.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="text-xs text-green-400">Approved</p>
                  <p className="text-lg font-semibold text-green-500">{selectedCustomer.claims.approved}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                  <p className="text-xs text-yellow-400">Pending</p>
                  <p className="text-lg font-semibold text-yellow-500">{selectedCustomer.claims.pending}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg text-center">
                  <p className="text-xs text-red-400">Rejected</p>
                  <p className="text-lg font-semibold text-red-500">{selectedCustomer.claims.rejected}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                View Claims
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setShowCustomerModal(false)
                  setShowMessageModal(true)
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Send Message to ${selectedCustomer?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <Input
              placeholder="Enter message subject..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Type your message..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowMessageModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default InsurerCustomers