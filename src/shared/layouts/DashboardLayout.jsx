import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Shield, Menu, X, Home, FileText, CreditCard, 
  User, Bell, LogOut, Brain, BarChart3, Users,
  Settings, ChevronDown, Activity, 
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { NotificationBell } from '@features/notifications/components/NotificationComponents'

export const DashboardLayout = ({ children }) => {
  const { user, profile, signOut, isCustomer, isInsurer } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Define navigation items based on user role
  const navigationItems = isCustomer ? [
    { name: 'Dashboard', href: '/customer/dashboard', icon: Home },
    { name: 'My Claims', href: '/customer/claims', icon: FileText },
    { name: 'Payments', href: '/customer/payments', icon: CreditCard },
    { name: 'Profile', href: '/customer/profile', icon: User },
  ] : [
    { name: 'Dashboard', href: '/insurer/dashboard', icon: Home },
    { name: 'Claims', href: '/insurer/claims', icon: FileText },
    { name: 'NeuroClaim AI', href: '/insurer/neuroclaim', icon: Brain },
    { name: 'Analytics', href: '/insurer/analytics', icon: BarChart3 },
    { name: 'Customers', href: '/insurer/customers', icon: Users },
    { name: 'Settings', href: '/insurer/settings', icon: Settings },
  ]
  // ✅ Move isActive function definition BEFORE handleSignOut
  const isActive = (href) => {
    return location.pathname.startsWith(href)
  }
  
const handleSignOut = async () => {
  try {
    // Show loading state or disable button
    const result = await signOut()
    
    // Navigation is handled by signOut function
    // Even if there's an error, user should be redirected
  } catch (error) {
    console.error('Logout error:', error)
    // Force navigation even on error
    navigate('/login')
  }
}
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800 border-r border-gray-700">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                InsuraX
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive(item.href) ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User info */}
          <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {profile?.full_name?.charAt(0) || profile?.company_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {profile?.full_name || profile?.company_name || 'User'}
                </p>
                <p className="text-xs font-medium text-gray-400">
                  {isCustomer ? 'Customer' : 'Insurer'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Shield className="w-8 h-8 text-cyan-400" />
                <span className="ml-2 text-xl font-bold text-white">InsuraX</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        isActive(item.href) ? 'text-cyan-400' : 'text-gray-400'
                      }`} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex-1 flex items-center justify-end space-x-4">
                {/* Activity indicator */}
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>Last activity: 2 minutes ago</span>
                </div>

                {/* <NotificationBell /> */}
                <NotificationBell />

                {/* User menu */}
                <div className="relative">
                  <button
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {profile?.full_name?.charAt(0) || profile?.company_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Link
                        to={isCustomer ? '/customer/profile' : '/insurer/settings'}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        {isCustomer ? 'Profile' : 'Settings'}
                      </Link>
                      <Link
                        to={isCustomer ? '/customer/notifications' : '/insurer/settings'}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </Link>
                      <hr className="my-1 border-gray-600" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-gray-900">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}