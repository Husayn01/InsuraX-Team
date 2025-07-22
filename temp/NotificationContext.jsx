import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@services/supabase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext({})

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Mock notifications for demo
  const mockNotifications = [
    {
      id: '1',
      type: 'claim_update',
      title: 'Claim Status Updated',
      message: 'Your claim #CLM-2024-001 has been approved',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      icon: 'CheckCircle',
      iconColor: 'text-green-400',
      link: '/customer/claims/1'
    },
    {
      id: '2',
      type: 'payment_reminder',
      title: 'Payment Due Soon',
      message: 'Your monthly premium payment is due in 3 days',
      read: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      icon: 'CreditCard',
      iconColor: 'text-yellow-400',
      link: '/customer/payments'
    },
    {
      id: '3',
      type: 'document_request',
      title: 'Document Required',
      message: 'Please upload additional documents for claim #CLM-2024-002',
      read: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      icon: 'FileText',
      iconColor: 'text-blue-400',
      link: '/customer/claims/2'
    },
    {
      id: '4',
      type: 'system',
      title: 'Welcome to InsuraX!',
      message: 'Thank you for joining us. Complete your profile to get started.',
      read: true,
      createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      icon: 'Sparkles',
      iconColor: 'text-purple-400',
      link: '/customer/profile'
    }
  ]

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Set up real-time subscription for new notifications
      subscribeToNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // In a real app, fetch from database
      // For demo, use mock data
      setNotifications(mockNotifications)
      updateUnreadCount(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    // In a real app, set up Supabase real-time subscription
    // For demo, simulate real-time updates
    const interval = setInterval(() => {
      // Randomly add a new notification every 30 seconds for demo
      if (Math.random() > 0.7) {
        addNewNotification()
      }
    }, 30000)

    return () => clearInterval(interval)
  }

  const addNewNotification = () => {
    const newNotification = {
      id: Date.now().toString(),
      type: 'claim_update',
      title: 'New Update',
      message: 'You have a new update on your claim',
      read: false,
      createdAt: new Date().toISOString(),
      icon: 'Bell',
      iconColor: 'text-cyan-400',
      link: '/customer/claims'
    }

    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/icon.png'
      })
    }
  }

  const updateUnreadCount = (notificationsList) => {
    const unread = notificationsList.filter(n => !n.read).length
    setUnreadCount(unread)
  }

  const markAsRead = async (notificationId) => {
    try {
      // In a real app, update in database
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // In a real app, update all in database
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      // In a real app, delete from database
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      // Update unread count if needed
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const clearAll = async () => {
    try {
      // In a real app, clear from database
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    addNewNotification // For demo purposes
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}