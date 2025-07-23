import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, CreditCard, Clock, CheckCircle, 
  AlertCircle, ArrowRight, Plus, TrendingUp 
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, StatsCard, PageHeader } from '@shared/layouts'
import { Button, Card, CardBody, Badge, EmptyState, LoadingSpinner } from '@shared/components'
import { format } from 'date-fns'
import { NotificationCenter } from '@features/notifications/components/NotificationComponents.jsx'

export const CustomerDashboard = () => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClaims: 0,
    activeClaims: 0,
    approvedAmount: 0,
    pendingAmount: 0
  })
  const [recentClaims, setRecentClaims] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const { data: claims } = await supabaseHelpers.getClaims({ 
        customer_id: user.id 
      })

      if (claims) {
        // Calculate stats
        const totalClaims = claims.length
        const activeClaims = claims.filter(c => 
          ['submitted', 'processing'].includes(c.status)
        ).length
        const approvedAmount = claims
          .filter(c => c.status === 'approved')
          .reduce((sum, c) => sum + (c.claim_data?.estimatedAmount || 0), 0)
        const pendingAmount = claims
          .filter(c => ['submitted', 'processing'].includes(c.status))
          .reduce((sum, c) => sum + (c.claim_data?.estimatedAmount || 0), 0)

        setStats({
          totalClaims,
          activeClaims,
          approvedAmount,
          pendingAmount
        })

        // Get recent claims (last 5)
        setRecentClaims(claims.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      submitted: 'info',
      processing: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    const icons = {
      submitted: <Clock className="w-3 h-3" />,
      processing: <Clock className="w-3 h-3 animate-spin" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <AlertCircle className="w-3 h-3" />
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
        title={`Welcome back, ${profile?.full_name || 'User'}!`}
        description="Manage your insurance claims and track your payments"
        actions={
          <Link to="/customer/claims/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={FileText}
        />
        <StatsCard
          title="Active Claims"
          value={stats.activeClaims}
          icon={Clock}
          trend={stats.activeClaims > 0 ? 'up' : null}
          trendValue={stats.activeClaims > 0 ? 'In Progress' : null}
        />
        <StatsCard
          title="Approved Amount"
          value={formatCurrency(stats.approvedAmount)}
          icon={CheckCircle}
        />
        <StatsCard
          title="Pending Amount"
          value={formatCurrency(stats.pendingAmount)}
          icon={AlertCircle}
        />
      </div>

      {/* Recent Claims */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Recent Claims</h2>
          <Link to="/customer/claims">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <CardBody>
          {recentClaims.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No claims yet"
              description="Submit your first claim to get started"
              action={
                <Link to="/customer/claims/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Claim
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {recentClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-700/30 rounded-lg transition-all duration-300 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-100">
                        {claim.claim_data?.claimType || 'Insurance Claim'}
                      </h3>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Submitted on {format(new Date(claim.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-100">
                      {formatCurrency(claim.claim_data?.estimatedAmount)}
                    </p>
                    <Link
                      to={`/customer/claims/${claim.id}`}
                      className="text-sm text-cyan-400 hover:text-cyan-300 group-hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Submit a Claim</h3>
              <p className="text-sm text-gray-400 mb-3">
                File a new insurance claim with our AI-powered system
              </p>
              <Link to="/customer/claims/new">
                <Button size="sm" variant="primary">
                  Start Claim
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Make Payment</h3>
              <p className="text-sm text-gray-400 mb-3">
                Pay your insurance premiums securely online
              </p>
              <Link to="/customer/payments/new">
                <Button size="sm" variant="primary">
                  Pay Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card hoverable className="p-6 group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100 mb-1">Track Status</h3>
              <p className="text-sm text-gray-400 mb-3">
                Monitor your claims and payment history
              </p>
              <Link to="/customer/claims">
                <Button size="sm" variant="secondary">
                  View History
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CustomerDashboard