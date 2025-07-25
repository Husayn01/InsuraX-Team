import React, { useState, useEffect } from 'react'
import { 
  Users, Search, Filter, UserPlus, Mail, Phone, 
  MapPin, Calendar, TrendingUp, FileText, DollarSign,
  Shield, Activity, ChevronRight, Star, Eye,
  Download, CheckCircle, AlertCircle, Clock,
  BarChart3, Sparkles, User, Building
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
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    riskLevel: 'all',
    sortBy: 'recent'
  })
  
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalPremiums: 0,
    averageClaimValue: 0
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, filters])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      // Mock data - in real app, fetch from API
      const mockCustomers = [
        {
          id: '1',
          name: 'Adebayo Ogundimu',
          email: 'adebayo.ogundimu@email.com',
          phone: '+234 802 345 6789',
          address: '123 Victoria Island, Lagos',
          joinDate: new Date(Date.now() - 86400000 * 180).toISOString(),
          status: 'active',
          riskScore: 'low',
          policies: [
            { type: 'auto', number: 'POL-AUTO-001', premium: 50000 },
            { type: 'health', number: 'POL-HEALTH-001', premium: 30000 }
          ],
          claims: {
            total: 3,
            approved: 2,
            rejected: 0,
            pending: 1
          },
          lifetime: {
            premiumsPaid: 480000,
            claimsPaid: 120000
          },
          rating: 4.5
        },
        {
          id: '2',
          name: 'Chioma Nwosu',
          email: 'chioma.nwosu@email.com',
          phone: '+234 803 456 7890',
          address: '456 Lekki Phase 1, Lagos',
          joinDate: new Date(Date.now() - 86400000 * 365).toISOString(),
          status: 'active',
          riskScore: 'medium',
          policies: [
            { type: 'property', number: 'POL-PROP-001', premium: 100000 }
          ],
          claims: {
            total: 5,
            approved: 3,
            rejected: 1,
            pending: 1
          },
          lifetime: {
            premiumsPaid: 1200000,
            claimsPaid: 450000
          },
          rating: 4.2
        },
        {
          id: '3',
          name: 'Ibrahim Sani',
          email: 'ibrahim.sani@email.com',
          phone: '+234 805 678 9012',
          address: '789 Wuse 2, Abuja',
          joinDate: new Date(Date.now() - 86400000 * 90).toISOString(),
          status: 'active',
          riskScore: 'high',
          policies: [
            { type: 'auto', number: 'POL-AUTO-002', premium: 75000 },
            { type: 'life', number: 'POL-LIFE-001', premium: 25000 }
          ],
          claims: {
            total: 8,
            approved: 5,
            rejected: 2,
            pending: 1
          },
          lifetime: {
            premiumsPaid: 300000,
            claimsPaid: 380000
          },
          rating: 3.8
        },
        {
          id: '4',
          name: 'Fatima Abdullahi',
          email: 'fatima.abdullahi@email.com',
          phone: '+234 806 789 0123',
          address: '321 Garki, Abuja',
          joinDate: new Date(Date.now() - 86400000 * 45).toISOString(),
          status: 'inactive',
          riskScore: 'low',
          policies: [],
          claims: {
            total: 1,
            approved: 1,
            rejected: 0,
            pending: 0
          },
          lifetime: {
            premiumsPaid: 150000,
            claimsPaid: 50000
          },
          rating: 5.0
        }
      ]
      
      setCustomers(mockCustomers)
      calculateStats(mockCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (customerData) => {
    const active = customerData.filter(c => c.status === 'active').length
    const totalPremiums = customerData.reduce((sum, c) => sum + c.lifetime.premiumsPaid, 0)
    const totalClaims = customerData.reduce((sum, c) => sum + c.claims.total, 0)
    const totalClaimsPaid = customerData.reduce((sum, c) => sum + c.lifetime.claimsPaid, 0)
    
    setStats({
      totalCustomers: customerData.length,
      activeCustomers: active,
      totalPremiums,
      averageClaimValue: totalClaims > 0 ? Math.round(totalClaimsPaid / totalClaims) : 0
    })
  }

  const applyFilters = () => {
    let filtered = [...customers]
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.includes(filters.search)
      )
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(customer => customer.status === filters.status)
    }
    
    // Risk level filter
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(customer => customer.riskScore === filters.riskLevel)
    }
    
    // Sorting
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'value':
        filtered.sort((a, b) => b.lifetime.premiumsPaid - a.lifetime.premiumsPaid)
        break
      case 'risk':
        const riskOrder = { high: 0, medium: 1, low: 2 }
        filtered.sort((a, b) => riskOrder[a.riskScore] - riskOrder[b.riskScore])
        break
    }
    
    setFilteredCustomers(filtered)
  }

  const getRiskBadge = (risk) => {
    const config = {
      low: {
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle
      },
      medium: {
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: AlertCircle
      },
      high: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle
      }
    }
    
    const { color, icon: Icon } = config[risk]
    
    return (
      <Badge className={`${color} border backdrop-blur-sm`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
      </Badge>
    )
  }

  const getStatusBadge = (status) => {
    const config = {
      active: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle
      },
      inactive: {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: Clock
      }
    }
    
    const { color, icon: Icon } = config[status]
    
    return (
      <Badge className={`${color} border backdrop-blur-sm`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-24 h-24 rounded-full border-4 border-gray-700/50"></div>
              <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0"></div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute inset-2 animation-delay-150"></div>
              <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin absolute inset-4 animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-400 animate-pulse">Loading customers...</p>
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
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Customer Management
          </span>
        }
        description="View and manage all insurance customers"
        actions={
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Active Customers</p>
              <p className="text-2xl font-bold text-white">{stats.activeCustomers}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Premiums</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPremiums)}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
          <CardBody className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-amber-400" />
                </div>
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Avg. Claim Value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.averageClaimValue)}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>

              <Select
                value={filters.riskLevel}
                onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </Select>

              <Select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="value">Highest Value</option>
                <option value="risk">Risk Level</option>
              </Select>

              <Button variant="secondary" className="hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card 
            key={customer.id} 
            className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group"
          >
            <CardBody className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                {/* Customer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                        customer.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      } border-2 border-gray-800 rounded-full`}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(customer.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{customer.rating}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(customer.status)}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {customer.address.split(',')[0]}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{customer.policies.length}</p>
                    <p className="text-xs text-gray-400">Policies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{customer.claims.total}</p>
                    <p className="text-xs text-gray-400">Claims</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{calculateClaimRatio(customer)}%</p>
                    <p className="text-xs text-gray-400">Approval</p>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="mb-4">
                  {getRiskBadge(customer.riskScore)}
                </div>

                {/* Lifetime Value */}
                <div className="bg-gray-700/30 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Lifetime Premiums</p>
                      <p className="font-semibold text-white">{formatCurrency(customer.lifetime.premiumsPaid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Claims Paid</p>
                      <p className="font-semibold text-white">{formatCurrency(customer.lifetime.claimsPaid)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setShowCustomerModal(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    onClick={() => {
                      console.log('Send message to', customer.name)
                    }}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Customer Details Modal */}
      {showCustomerModal && selectedCustomer && (
        <Modal
          isOpen={showCustomerModal}
          onClose={() => {
            setShowCustomerModal(false)
            setSelectedCustomer(null)
          }}
          title="Customer Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-400">Customer since {format(new Date(selectedCustomer.joinDate), 'MMMM yyyy')}</p>
              </div>
              {getStatusBadge(selectedCustomer.status)}
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-medium text-gray-100 mb-3">Active Policies</h4>
              <div className="space-y-2">
                {selectedCustomer.policies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-gray-100 capitalize">{policy.type} Insurance</p>
                        <p className="text-sm text-gray-400">{policy.number}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-white">{formatCurrency(policy.premium)}/month</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Claims Summary */}
            <div>
              <h4 className="font-medium text-gray-100 mb-3">Claims Summary</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{selectedCustomer.claims.total}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-400">{selectedCustomer.claims.approved}</p>
                  <p className="text-xs text-gray-400">Approved</p>
                </div>
                <div className="text-center p-3 bg-red-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{selectedCustomer.claims.rejected}</p>
                  <p className="text-xs text-gray-400">Rejected</p>
                </div>
                <div className="text-center p-3 bg-amber-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-amber-400">{selectedCustomer.claims.pending}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <Button variant="secondary" className="flex-1">
                View Claims History
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600">
                Contact Customer
              </Button>
            </div>
          </div>
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

export default InsurerCustomers