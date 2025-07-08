// services/notificationService.js
class NotificationService {
  constructor() {
    this.notifications = this.loadNotifications();
    this.subscribers = [];
    this.isPolling = false;
    this.pollInterval = null;
    this.lastCheckTime = localStorage.getItem('lastEmailCheck') || new Date().toISOString();
    this.sentEmails = this.loadSentEmails();
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Load notifications from localStorage
  loadNotifications() {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Load sent emails from localStorage
  loadSentEmails() {
    try {
      const stored = localStorage.getItem('sentEmails');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sent emails:', error);
      return [];
    }
  }

  // Subscribe to notification updates
  subscribe(callback) {
    this.subscribers.push(callback);
    // Immediately call with current notifications
    callback(this.notifications);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.notifications);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Add a new notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
      toastShown: false,
      type: notification.type || 'email_reply',
      ...notification
    };

    this.notifications.unshift(newNotification);
    
    // Limit to 100 notifications to prevent memory issues
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifySubscribers();
    this.showBrowserNotification(newNotification);

    if (this.debugMode) {
      console.log('📧 New notification added:', newNotification);
    }

    return newNotification;
  }

  // Save notifications to localStorage
  saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Save sent emails to localStorage
  saveSentEmails() {
    try {
      localStorage.setItem('sentEmails', JSON.stringify(this.sentEmails));
    } catch (error) {
      console.error('Error saving sent emails:', error);
    }
  }

  // Track sent email for reply monitoring
  trackSentEmail(emailData) {
    const sentEmail = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      to: emailData.to,
      recipientName: emailData.recipientName || emailData.to.split('@')[0],
      subject: emailData.subject,
      sentAt: new Date().toISOString(),
      originalMessage: emailData.message
    };

    this.sentEmails.push(sentEmail);
    
    // Limit sent emails to 500 entries
    if (this.sentEmails.length > 500) {
      this.sentEmails = this.sentEmails.slice(0, 500);
    }

    this.saveSentEmails();

    if (this.debugMode) {
      console.log('📤 Tracking sent email:', sentEmail);
    }

    return sentEmail;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    this.saveNotifications();
    this.notifySubscribers();
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
    this.saveNotifications();
    this.notifySubscribers();
  }

  // Mark toast as shown to prevent duplicate toasts
  markToastShown(notificationId) {
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, toastShown: true }
        : notification
    );
    this.saveNotifications();
  }

  // Delete notification
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(
      notification => notification.id !== notificationId
    );
    this.saveNotifications();
    this.notifySubscribers();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifySubscribers();
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(notification => !notification.read).length;
  }

  // Show browser notification
  async showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `email-reply-${notification.id}`,
          requireInteraction: false,
          silent: false
        });

        browserNotification.onclick = () => {
          window.focus();
          // Mark as read when clicked
          this.markAsRead(notification.id);
          browserNotification.close();
        };

        // Auto close after 8 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 8000);

      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        
        if (this.debugMode) {
          console.log('🔔 Notification permission:', permission);
        }
        
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  }

  // Start polling for email replies
  startPolling(interval = 60000) {
    if (this.isPolling) {
      if (this.debugMode) {
        console.log('⚠️ Polling already active');
      }
      return;
    }
    
    this.isPolling = true;
    
    if (this.debugMode) {
      console.log(`🔄 Starting email polling every ${interval / 1000} seconds`);
    }
    
    this.pollInterval = setInterval(() => {
      this.checkForEmailReplies();
    }, interval);
    
    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkForEmailReplies();
    }, 5000);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      this.isPolling = false;
      
      if (this.debugMode) {
        console.log('⏹️ Stopped email polling');
      }
    }
  }

  // Check for email replies (placeholder implementation)
  async checkForEmailReplies() {
    try {
      if (this.debugMode) {
        console.log('🔍 Checking for email replies...');
      }

      // Simulate checking emails (replace with real implementation)
      const replies = await this.simulateEmailCheck();
      
      replies.forEach(reply => {
        // Check if we already have a notification for this reply
        const existingNotification = this.notifications.find(
          n => n.emailId === reply.emailId || 
               (n.senderEmail === reply.senderEmail && n.subject === reply.subject)
        );

        if (!existingNotification) {
          this.addNotification({
            title: 'Email Reply Received',
            message: `${reply.senderName} replied to your email about "${reply.subject.replace('Re: ', '')}"`,
            senderName: reply.senderName,
            senderEmail: reply.senderEmail,
            subject: reply.subject,
            snippet: reply.snippet,
            emailId: reply.emailId,
            originalRecipient: reply.originalRecipient || 'Banking Router Team'
          });
        }
      });

      this.lastCheckTime = new Date().toISOString();
      localStorage.setItem('lastEmailCheck', this.lastCheckTime);

    } catch (error) {
      console.error('Error checking for email replies:', error);
    }
  }

  // Simulate email checking (replace with real Gmail API integration)
  async simulateEmailCheck() {
    const mockReplies = [];
    
    // In development, occasionally generate mock replies for testing
    if (this.debugMode && Math.random() > 0.98) { // 2% chance
      const mockSenders = [
        { name: 'John Smith', email: 'john.smith@firstbank.com', bank: 'First National Bank' },
        { name: 'Sarah Johnson', email: 'sarah.j@citybank.com', bank: 'City Bank' },
        { name: 'Michael Brown', email: 'm.brown@trustbank.org', bank: 'Trust Bank' },
        { name: 'Emma Davis', email: 'emma.davis@unitybank.net', bank: 'Unity Bank' }
      ];

      const mockSubjects = [
        'Partnership Opportunity',
        'Banking Solutions Inquiry',
        'Technology Integration',
        'Digital Transformation'
      ];

      const mockSnippets = [
        'Thank you for reaching out. We would be very interested in discussing...',
        'This looks like an excellent opportunity for our bank. Could we schedule...',
        'I appreciate your email about banking solutions. Our team would like to...',
        'Your proposal is intriguing. We would like to learn more about...'
      ];

      const sender = mockSenders[Math.floor(Math.random() * mockSenders.length)];
      const subject = mockSubjects[Math.floor(Math.random() * mockSubjects.length)];
      const snippet = mockSnippets[Math.floor(Math.random() * mockSnippets.length)];

      mockReplies.push({
        senderName: sender.name,
        senderEmail: sender.email,
        subject: `Re: ${subject} - ${sender.bank}`,
        snippet: snippet,
        emailId: 'mock-email-' + Date.now(),
        originalRecipient: 'Banking Router Team'
      });
    }
    
    return mockReplies;
  }

  // Check if an email is a reply to our sent emails
  isReplyToSentEmail(incomingEmail) {
    return this.sentEmails.some(sentEmail => {
      const isSubjectMatch = incomingEmail.subject.toLowerCase().includes('re:') &&
        incomingEmail.subject.toLowerCase().includes(sentEmail.subject.toLowerCase().substring(0, 20));
      
      const isSenderMatch = incomingEmail.from.toLowerCase().includes(sentEmail.to.toLowerCase());
      
      return isSubjectMatch && isSenderMatch;
    });
  }

  // Enable debug mode
  enableDebug() {
    this.debugMode = true;
    console.log('🐛 Debug mode enabled');
  }

  // Disable debug mode
  disableDebug() {
    this.debugMode = false;
  }

  // Get service status
  getStatus() {
    return {
      isPolling: this.isPolling,
      notificationCount: this.notifications.length,
      unreadCount: this.getUnreadCount(),
      sentEmailsCount: this.sentEmails.length,
      lastCheckTime: this.lastCheckTime,
      debugMode: this.debugMode,
      browserNotificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
    };
  }

  // Reset all data (for testing/debugging)
  reset() {
    this.notifications = [];
    this.sentEmails = [];
    this.lastCheckTime = new Date().toISOString();
    
    localStorage.removeItem('notifications');
    localStorage.removeItem('sentEmails');
    localStorage.removeItem('lastEmailCheck');
    
    this.notifySubscribers();
    
    console.log('🔄 Notification service reset');
  }

  // Export data for backup
  exportData() {
    return {
      notifications: this.notifications,
      sentEmails: this.sentEmails,
      lastCheckTime: this.lastCheckTime,
      exportDate: new Date().toISOString()
    };
  }

  // Import data from backup
  importData(data) {
    if (data.notifications) {
      this.notifications = data.notifications;
      this.saveNotifications();
    }
    
    if (data.sentEmails) {
      this.sentEmails = data.sentEmails;
      this.saveSentEmails();
    }
    
    if (data.lastCheckTime) {
      this.lastCheckTime = data.lastCheckTime;
      localStorage.setItem('lastEmailCheck', this.lastCheckTime);
    }
    
    this.notifySubscribers();
    console.log('📥 Data imported successfully');
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  window.notificationService = notificationService;
  console.log('🔧 NotificationService available as window.notificationService for debugging');
}

export default notificationService;