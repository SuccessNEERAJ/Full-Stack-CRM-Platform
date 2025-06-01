import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { getAuthToken } from '../utils/authUtils';
import axios from 'axios';

// Create the context
const NotificationsContext = createContext();

// Customer threshold for batch notifications
const NEW_CUSTOMERS_THRESHOLD = 15;

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_CAMPAIGN: 'NEW_CAMPAIGN',
  NEW_SEGMENT: 'NEW_SEGMENT',
  NEW_CUSTOMERS: 'NEW_CUSTOMERS',
  CAMPAIGN_PERFORMANCE: 'CAMPAIGN_PERFORMANCE',
  SYSTEM: 'SYSTEM'
};

// Provider component
export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [newCustomerCount, setNewCustomerCount] = useState(0);

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  // Process notifications from API data
  const processNotifications = (data) => {
    const { customers, segments, campaigns } = data;
    const newNotifications = [];

    // Sort all items by creation date (newest first)
    const sortedCustomers = [...(customers || [])].sort(
      (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
    );
    
    const sortedSegments = [...(segments || [])].sort(
      (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
    );
    
    const sortedCampaigns = [...(campaigns || [])].sort(
      (a, b) => new Date(b.launchedAt || b.createdAt || Date.now()) - new Date(a.launchedAt || a.createdAt || Date.now())
    );

    // Count recently added customers (for the threshold notification)
    const recentCustomerCount = sortedCustomers.filter(customer => {
      const customerDate = new Date(customer.createdAt || Date.now());
      const isRecent = lastFetchTime ? customerDate > lastFetchTime : false;
      return isRecent;
    }).length;

    // If we've reached the threshold for new customers, add a batch notification
    if (recentCustomerCount + newCustomerCount >= NEW_CUSTOMERS_THRESHOLD) {
      newNotifications.push({
        id: `new-customers-${Date.now()}`,
        type: NOTIFICATION_TYPES.NEW_CUSTOMERS,
        title: `${recentCustomerCount + newCustomerCount} new customers added to the database`,
        details: 'Customer database has been updated',
        date: new Date().toISOString(),
        read: false
      });
      // Reset the counter
      setNewCustomerCount(0);
    } else if (recentCustomerCount > 0) {
      // Increment the counter but don't create notification yet
      setNewCustomerCount(prevCount => prevCount + recentCustomerCount);
    }

    // Add notifications for new segments
    sortedSegments.slice(0, 5).forEach(segment => {
      const segmentDate = new Date(segment.createdAt || Date.now());
      // Only create notification if segment is newer than our last fetch
      if (lastFetchTime && segmentDate > lastFetchTime) {
        newNotifications.push({
          id: segment._id || segment.id || `segment-${Date.now()}`,
          type: NOTIFICATION_TYPES.NEW_SEGMENT,
          title: `New segment "${segment.name}" created`,
          details: `Contains ${segment.customerCount || 0} customers`,
          date: segment.createdAt || new Date().toISOString(),
          read: false
        });
      }
    });

    // Add notifications for new campaigns
    sortedCampaigns.slice(0, 5).forEach(campaign => {
      const campaignDate = new Date(campaign.launchedAt || campaign.createdAt || Date.now());
      // Only create notification if campaign is newer than our last fetch
      if (lastFetchTime && campaignDate > lastFetchTime) {
        newNotifications.push({
          id: campaign._id || campaign.id || `campaign-${Date.now()}`,
          type: NOTIFICATION_TYPES.NEW_CAMPAIGN,
          title: `Campaign "${campaign.name}" launched`,
          details: `Sent to ${campaign.audienceSize || 0} customers`,
          date: campaign.launchedAt || campaign.createdAt || new Date().toISOString(),
          read: false
        });

        // If campaign has performance metrics, add a performance notification
        if (campaign.deliveryStats) {
          const deliveryRate = campaign.audienceSize > 0
            ? (campaign.deliveryStats.sent / campaign.audienceSize * 100).toFixed(1)
            : 0;
          
          const openRate = campaign.deliveryStats.sent > 0 && campaign.deliveryStats.opened !== undefined
            ? (campaign.deliveryStats.opened / campaign.deliveryStats.sent * 100).toFixed(1)
            : null;
          
          let performanceDetails = `Delivery rate: ${deliveryRate}%`;
          if (openRate !== null) {
            performanceDetails += `, Open rate: ${openRate}%`;
          }
          
          newNotifications.push({
            id: `performance-${campaign._id || campaign.id || Date.now()}`,
            type: NOTIFICATION_TYPES.CAMPAIGN_PERFORMANCE,
            title: `Performance metrics for "${campaign.name}"`,
            details: performanceDetails,
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    // Update the notifications state
    if (newNotifications.length > 0) {
      setNotifications(prevNotifications => {
        // Combine new and existing notifications, avoid duplicates by ID
        const updatedNotifications = [...newNotifications, ...prevNotifications];
        const uniqueNotifications = [];
        const ids = new Set();
        
        updatedNotifications.forEach(notification => {
          if (!ids.has(notification.id)) {
            uniqueNotifications.push(notification);
            ids.add(notification.id);
          }
        });
        
        // Sort by date (newest first)
        uniqueNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limit to 50 notifications
        return uniqueNotifications.slice(0, 50);
      });
    }

    // Update last fetch time
    setLastFetchTime(new Date());
  };

  // Fetch data and generate notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // Check for token in URL or localStorage
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      const tokenFromStorage = getAuthToken();
      const token = tokenFromUrl || tokenFromStorage;
      
      console.log('NotificationsContext: Token available:', token ? 'Yes' : 'No');
      
      // If we don't have a token yet, don't try to fetch data
      if (!token) {
        console.log('NotificationsContext: No token available, skipping fetch');
        return;
      }
      
      // Create headers with token
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      console.log('NotificationsContext: Using token for API calls');
      
      // Use fetch API for consistent header handling
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Fetch data with token
      const customersResponse = await fetch(`${apiUrl}/api/customers?_t=${timestamp}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      const segmentsResponse = await fetch(`${apiUrl}/api/segments?_t=${timestamp}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      const campaignsResponse = await fetch(`${apiUrl}/api/campaigns?_t=${timestamp}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      // Process responses
      if (!customersResponse.ok || !segmentsResponse.ok || !campaignsResponse.ok) {
        throw new Error('One or more API requests failed');
      }
      
      const customersData = await customersResponse.json();
      const segmentsData = await segmentsResponse.json();
      const campaignsData = await campaignsResponse.json();
      
      // Process the data to create notifications
      processNotifications({
        customers: customersData || [],
        segments: segmentsData || [],
        campaigns: campaignsData || []
      });
      
    } catch (error) {
      console.error('Failed to fetch notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
    setUnreadCount(0);
  };

  // Mark a specific notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    updateUnreadCount();
  };

  // Delete a notification
  const deleteNotification = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
    updateUnreadCount();
  };

  // Update unread count
  const updateUnreadCount = () => {
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  };

  // Add a system notification
  const addSystemNotification = (title, details) => {
    const newNotification = {
      id: `system-${Date.now()}`,
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      details,
      date: new Date().toISOString(),
      read: false
    };

    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    updateUnreadCount();
  };

  // Track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for authentication when component mounts or URL changes
  useEffect(() => {
    // Check for token in URL or localStorage
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const tokenFromStorage = getAuthToken();
    const hasToken = tokenFromUrl || tokenFromStorage;
    
    console.log('NotificationsContext: Authentication check -', hasToken ? 'Token found' : 'No token');
    setIsAuthenticated(!!hasToken);
    
    // If authenticated, fetch notifications
    if (hasToken) {
      fetchNotifications();
    }
  }, [window.location.search]); // Re-run when URL changes (for token in URL)
  
  // Set up interval to refresh notifications if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('NotificationsContext: Not authenticated, skipping notification interval');
      return;
    }
    
    console.log('NotificationsContext: Setting up notification refresh interval');
    // Set up interval to refresh notifications every 60 seconds
    const intervalId = setInterval(fetchNotifications, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Update unread count whenever notifications change
  useEffect(() => {
    updateUnreadCount();
  }, [notifications]);

  // Export context value
  const value = {
    notifications,
    unreadCount,
    loading,
    formatRelativeTime,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    addSystemNotification,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// Custom hook for using the notifications context
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
