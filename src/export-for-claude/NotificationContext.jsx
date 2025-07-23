import React, { createContext, useContext, useState, useEffect } from 'react'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      
      // Set up real-time subscription for notifications
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          handleNewNotification
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } else {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseHelpers.getNotifications(user.id)
      
      if (error) {
        console.error('Error fetching notifications:', error)
        // If notifications table doesn't exist, use empty array
        setNotifications([])
      } else {
        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleNewNotification = (payload) => {
    console.log('New notification:', payload)
    const newNotification = payload.new
    setNotifications(prev => [newNotification, ...prev])
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabaseHelpers.markNotificationRead(notificationId)
      
      if (!error) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds)
        
        if (!error) {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const notification = notifications.find(n => n.id === notificationId)
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
      
      if (!error) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}