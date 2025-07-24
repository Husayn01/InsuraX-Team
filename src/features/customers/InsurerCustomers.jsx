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
          name: 'Ibrahim Sani',
          email: 'ibrahim.sani@example.com',
          phone: '+234 801 234 5678',
          address: '45 Victoria Island, Lagos',
          memberSince: '2020-01-15',
          status: 'active',
          riskScore: 'low',
          policies: [
            { type: 'auto', number: 'POL-AUTO-001', premium: 35000, status: 'active' },
            { type: 'health', number: 'POL-HEALTH-001', premium: 21000, status: 'active' }
          ],
          claims: {
            total: 3,
            approved: 2,
            rejected: 0,
            pending: 1,
            totalAmount: 1050000
          },
          lastActivity: '2024-03-18',
          lifetime: {
            premiumsPaid: 1750000,
            claimsPaid: 840000,
            profitability: 910000
          }
        },
        {
          id: '2',
          name: 'Adaeze Okafor',
          email: 'adaeze.okafor@example.com',
          phone: '+234 802 345 6789',
          address: '123 Lekki Phase 1, Lagos',
          memberSince: '2021-06-20',
          status: 'active',
          riskScore: 'medium',
          policies: [
            { type: 'health', number: 'POL-HEALTH-002', premium: 28000, status: 'active' }
          ],
          claims: {
            total: 1,
            approved: 1,
            rejected: 0,
            pending: 0,
            totalAmount: 560000
          },
          lastActivity: '2024-03-15',
          lifetime: {
            premiumsPaid: 700000,
            claimsPaid: 560000,
            profitability: 140000
          }
        },
        {
          id: '3',
          name: 'Chinedu Eze',
          email: 'chinedu.eze@example.com',
          phone: '+234 803 456 7890',
          address: '78 Ikoyi Crescent, Lagos',
          memberSince: '2019-03-10',
          status: 'active',
          riskScore: 'high',
          policies: [
            { type: 'property', number: 'POL-PROP-001', premium: 70000, status: 'active' },
            { type: 'auto', number: 'POL-AUTO-002', premium: 42000, status: 'active' }
          ],
          claims: {
            total: 8,
            approved: 5,
            rejected: 2,
            pending: 1,
            totalAmount: 3150000
          },
          lastActivity: '2024-03-20',
          lifetime: {
            premiumsPaid: 3360000,
            claimsPaid: 2450000,
            profitability: 910000
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
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
                    <span className="text-white font-medium text-lg">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
                <Badge variant={getRiskColor(customer.riskScore)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {customer.riskScore} Risk
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">{format(new Date(customer.memberSince), 'MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Activity</p>
                  <p className="font-medium">{format(new Date(customer.lastActivity), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {customer.address}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{customer.policies.length}</p>
                  <p className="text-sm text-gray-600">Policies</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{customer.claims.total}</p>
                  <p className="text-sm text-gray-600">Claims</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{calculateClaimRatio(customer)}%</p>
                  <p className="text-sm text-gray-600">Approval</p>
                </div>
              </div>

              <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-4 rounded-b-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Lifetime Premiums</p>
                    <p className="font-semibold">{formatCurrency(customer.lifetime.premiumsPaid)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Claims Paid</p>
                    <p className="font-semibold">{formatCurrency(customer.lifetime.claimsPaid)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setShowCustomerModal(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setShowMessageModal(true)
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Customer Details Modal */}
      <Modal 
        isOpen={showCustomerModal} 
        onClose={() => setShowCustomerModal(false)}
        title={selectedCustomer?.name}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{selectedCustomer.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant="success">{selectedCustomer.status}</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Active Policies</h4>
              <div className="space-y-2">
                {selectedCustomer.policies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{policy.type} Insurance</p>
                      <p className="text-sm text-gray-600">{policy.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(policy.premium)}/month</p>
                      <Badge variant="success" size="sm">{policy.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Claims History</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedCustomer.claims.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedCustomer.claims.approved}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{selectedCustomer.claims.rejected}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{selectedCustomer.claims.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Message Modal */}
      <Modal 
        isOpen={showMessageModal} 
        onClose={() => setShowMessageModal(false)}
        title={`Send Message to ${selectedCustomer?.name}`}
      >
        <div className="space-y-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            placeholder="Type your message here..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowMessageModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}