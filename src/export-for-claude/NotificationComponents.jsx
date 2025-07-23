import React, { useState, useRef, useEffect } from 'react'
import { 
  Bell, X, Check, Trash2, CheckCircle, AlertCircle, 
  Info, CreditCard, FileText, MessageSquare, Settings,
  ChevronRight, ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@contexts/NotificationContext'
import { Button, Badge, LoadingSpinner } from '@shared/components'
import { formatDistanceToNow } from 'date-fns'

// Notification Bell Icon with Badge
export const NotificationBell = () => {
  const { unreadCount } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown onClose={() => setShowDropdown(false)} />
      )}
    </div>
  )
}

// Notification Dropdown
export const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate()
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications()

  const getIcon = (type, iconName) => {
    const icons = {
      'check-circle': CheckCircle,
      'alert-circle': AlertCircle,
      'info': Info,
      'credit-card': CreditCard,
      'file-text': FileText,
      'message-square': MessageSquare
    }
    const Icon = icons[iconName] || Bell
    
    const colors = {
      success: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      info: 'text-blue-400'
    }

    return <Icon className={`w-5 h-5 ${colors[type] || 'text-gray-400'}`} />
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'claim_update':
        navigate(`/customer/claims/${notification.data.claimId}`)
        break
      case 'payment_reminder':
        navigate('/customer/payments')
        break
      case 'document_request':
        navigate(`/customer/claims/${notification.data.claimId}`)
        break
      default:
        break
    }
    
    onClose()
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-100">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={() => navigate('/customer/notifications')}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`relative group hover:bg-gray-700/50 transition-colors ${
                  !notification.read ? 'bg-gray-700/30' : ''
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.color, notification.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div className="px-4 py-3 border-t border-gray-700">
          <button
            onClick={() => {
              navigate('/customer/notifications')
              onClose()
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 w-full"
          >
            View all notifications
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Notification Center Page
export const NotificationCenter = () => {
  const navigate = useNavigate()
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission
  } = useNotifications()

  const [filter, setFilter] = useState('all') // all, unread, read
  const [selectedType, setSelectedType] = useState('all') // all, claim_update, payment_reminder, etc.

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false
    if (filter === 'read' && !n.read) return false
    if (selectedType !== 'all' && n.type !== selectedType) return false
    return true
  })

  const getIcon = (type, iconName) => {
    const icons = {
      'check-circle': CheckCircle,
      'alert-circle': AlertCircle,
      'info': Info,
      'credit-card': CreditCard,
      'file-text': FileText,
      'message-square': MessageSquare
    }
    const Icon = icons[iconName] || Bell
    
    const colors = {
      success: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      info: 'text-blue-400'
    }

    return <Icon className={`w-5 h-5 ${colors[type] || 'text-gray-400'}`} />
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'claim_update':
        navigate(`/customer/claims/${notification.data.claimId}`)
        break
      case 'payment_reminder':
        navigate('/customer/payments')
        break
      case 'document_request':
        navigate(`/customer/claims/${notification.data.claimId}`)
        break
      default:
        break
    }
  }

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'claim_update', label: 'Claim Updates' },
    { value: 'payment_reminder', label: 'Payment Reminders' },
    { value: 'document_request', label: 'Document Requests' },
    { value: 'system', label: 'System Messages' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Notification Center</h1>
        <p className="text-gray-400">Manage all your notifications in one place</p>
      </div>

      {/* Browser Notifications Permission */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
        <div className="mb-6 bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-400 mb-1">Enable Browser Notifications</h3>
              <p className="text-sm text-gray-300 mb-3">
                Get instant alerts for important updates even when you're not on InsuraX
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  const granted = await requestPermission()
                  if (granted) {
                    alert('Browser notifications enabled!')
                  }
                }}
              >
                Enable Notifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'read'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Read
          </button>
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        >
          {notificationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            {notifications.some(n => !n.read) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  clearAll()
                }
              }}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No notifications found</h3>
          <p className="text-gray-500">
            {filter === 'unread' ? "You're all caught up!" : 
             filter === 'read' ? "No read notifications" :
             "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`group bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-all ${
                !notification.read ? 'border-cyan-500/50' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.color, notification.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-100 mb-1">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-900/50 text-cyan-400">
                              New
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.type !== 'system' && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-cyan-400 hover:text-cyan-300 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-400 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Toast Notification Component
export const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getIcon = (type, iconName) => {
    const icons = {
      'check-circle': CheckCircle,
      'alert-circle': AlertCircle,
      'info': Info,
      'credit-card': CreditCard,
      'file-text': FileText,
      'message-square': MessageSquare
    }
    const Icon = icons[iconName] || Bell
    
    const colors = {
      success: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      info: 'text-blue-400'
    }

    return <Icon className={`w-5 h-5 ${colors[type] || 'text-gray-400'}`} />
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 max-w-sm">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {getIcon(notification.color, notification.icon)}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-100">{notification.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}