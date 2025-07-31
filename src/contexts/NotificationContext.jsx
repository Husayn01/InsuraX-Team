import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, supabaseHelpers } from '@services/supabase'
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
  const [loading, setLoading] = useState(false)
  const notificationSound = useRef(null)
  const realtimeSubscription = useRef(null)

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio('/notification.mp3')
    notificationSound.current.volume = 0.5
  }, [])

  // Fetch notifications when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
      setupRealtimeSubscription()
    } else {
      setNotifications([])
      setUnreadCount(0)
      cleanupSubscription()
    }

    return () => {
      cleanupSubscription()
    }
  }, [user?.id])

  const setupRealtimeSubscription = () => {
    if (!user?.id) return

    // Subscribe to new notifications
    realtimeSubscription.current = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          handleNewNotification(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload)
          handleNotificationUpdate(payload.new)
        }
      )
      .subscribe()

    // Also subscribe to claim updates for the user
    supabase
      .channel(`claims:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'claims',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Claim updated:', payload)
          handleClaimUpdate(payload.new, payload.old)
        }
      )
      .subscribe()
  }

  const cleanupSubscription = () => {
    if (realtimeSubscription.current) {
      supabase.removeChannel(realtimeSubscription.current)
      realtimeSubscription.current = null
    }
  }

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Play notification sound
    try {
      notificationSound.current?.play()
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }

    // Show browser notification if permitted
    showBrowserNotification(notification)
  }

  const handleNotificationUpdate = (updatedNotification) => {
    setNotifications(prev => 
      prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
    )
    
    if (updatedNotification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleClaimUpdate = async (newClaim, oldClaim) => {
    // Only create notification if status changed
    if (newClaim.status !== oldClaim.status) {
      const statusMessages = {
        processing: {
          title: 'Claim Being Processed',
          message: `Your claim ${newClaim.claim_data?.claimNumber} is now being processed by our team.`,
          type: 'info',
          icon: 'activity'
        },
        under_review: {
          title: 'Claim Under Review',
          message: `Your claim ${newClaim.claim_data?.claimNumber} is under detailed review.`,
          type: 'info',
          icon: 'eye'
        },
        additional_info_required: {
          title: 'Additional Information Required',
          message: `We need more information to process your claim ${newClaim.claim_data?.claimNumber}.`,
          type: 'warning',
          icon: 'alert-circle'
        },
        approved: {
          title: 'Claim Approved! 🎉',
          message: `Great news! Your claim ${newClaim.claim_data?.claimNumber} has been approved.`,
          type: 'success',
          icon: 'check-circle'
        },
        rejected: {
          title: 'Claim Decision',
          message: `Your claim ${newClaim.claim_data?.claimNumber} has been reviewed. Please check the details.`,
          type: 'error',
          icon: 'x-circle'
        },
        disputed: {
          title: 'Dispute Submitted',
          message: `Your dispute for claim ${newClaim.claim_data?.claimNumber} is being reviewed.`,
          type: 'warning',
          icon: 'alert-triangle'
        },
        settled: {
          title: 'Claim Settled ✅',
          message: `Your claim ${newClaim.claim_data?.claimNumber} has been settled and payment processed.`,
          type: 'success',
          icon: 'dollar-sign'
        }
      }

      const statusInfo = statusMessages[newClaim.status]
      if (statusInfo) {
        // Create notification in database
        await supabaseHelpers.createNotification({
          user_id: user.id,
          type: 'claim_update',
          title: statusInfo.title,
          message: statusInfo.message,
          color: statusInfo.type === 'success' ? 'green' : 
                 statusInfo.type === 'error' ? 'red' : 
                 statusInfo.type === 'warning' ? 'amber' : 'blue',
          icon: statusInfo.icon,
          data: {
            claimId: newClaim.id,
            status: newClaim.status,
            previousStatus: oldClaim.status
          }
        })
      }
    }
  }

  const fetchNotifications = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabaseHelpers.getNotifications(user.id)
      
      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }
      
      setNotifications(data || [])
      const unread = data?.filter(n => !n.read).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabaseHelpers.markNotificationRead(notificationId)
      
      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      
      await Promise.all(
        unreadNotifications.map(n => 
          supabaseHelpers.markNotificationRead(n.id)
        )
      )
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabaseHelpers.deleteNotification(notificationId)
      
      if (error) {
        console.error('Error deleting notification:', error)
        return
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error)
    }
  }

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      })

      browserNotification.onclick = () => {
        window.focus()
        // Navigate to relevant page based on notification type
        if (notification.data?.claimId) {
          window.location.href = `/customer/claims/${notification.data.claimId}`
        }
        browserNotification.close()
      }
    }
  }

  const createTestNotification = async () => {
    if (!user?.id) return

    const testNotification = {
      user_id: user.id,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      color: 'blue',
      icon: 'info',
      data: { test: true }
    }

    await supabaseHelpers.createNotification(testNotification)
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    requestPermission,
    createTestNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}