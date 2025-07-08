import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Mail, Clock, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// NotificationBell Component (Enhanced version of your existing one)
export const NotificationBell = ({ notificationService, isScrolled = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    });

    // Initialize with current notifications
    setNotifications(notificationService.notifications);
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, [notificationService]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDelete = (notificationId) => {
    notificationService.deleteNotification(notificationId);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 md:p-2.5 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-12 active:scale-95 ${
          isScrolled 
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:shadow-md' 
            : 'bg-white/20 backdrop-blur-md hover:bg-white/30 text-white'
        }`}
      >
        <Bell size={16} />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bell size={18} className="text-blue-600" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No notifications yet</p>
                  <p className="text-sm mt-1">We'll notify you when someone replies to your emails</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                        !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-xl flex-shrink-0 ${
                          notification.type === 'email_reply'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Mail size={16} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium text-sm ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {notification.snippet && (
                                <p className="text-gray-500 text-xs mt-2 bg-gray-50 p-2 rounded-lg italic">
                                  "{notification.snippet.substring(0, 100)}..."
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock size={12} />
                                {formatTime(notification.timestamp)}
                                {notification.senderEmail && (
                                  <>
                                    <span>•</span>
                                    <span>{notification.senderEmail}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                className="p-1 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    notificationService.clearAll();
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-red-600 hover:text-red-700 text-sm font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Notification Settings Component
export const NotificationSettings = ({ notificationService }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [pollInterval, setPollInterval] = useState(60);
  const [browserNotifications, setBrowserNotifications] = useState(
    Notification?.permission === 'granted'
  );

  const handleToggleNotifications = () => {
    if (isEnabled) {
      notificationService.stopPolling();
    } else {
      notificationService.startPolling(pollInterval * 1000);
    }
    setIsEnabled(!isEnabled);
  };

  const handleRequestBrowserPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    setBrowserNotifications(granted);
  };

  const handleIntervalChange = (newInterval) => {
    setPollInterval(newInterval);
    if (isEnabled) {
      notificationService.stopPolling();
      notificationService.startPolling(newInterval * 1000);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings size={20} className="text-blue-600" />
        Notification Settings
      </h3>

      <div className="space-y-4">
        {/* Enable/Disable Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <h4 className="font-medium text-gray-800">Email Reply Notifications</h4>
            <p className="text-sm text-gray-600">Get notified when someone replies to your emails</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Check Interval */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h4 className="font-medium text-gray-800 mb-2">Check Frequency</h4>
          <p className="text-sm text-gray-600 mb-3">How often to check for new replies</p>
          <select
            value={pollInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>Every 30 seconds</option>
            <option value={60}>Every minute</option>
            <option value={300}>Every 5 minutes</option>
            <option value={900}>Every 15 minutes</option>
            <option value={1800}>Every 30 minutes</option>
          </select>
        </div>

        {/* Browser Notifications */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Browser Notifications</h4>
              <p className="text-sm text-gray-600">Show desktop notifications</p>
            </div>
            {browserNotifications ? (
              <span className="text-green-600 text-sm font-medium">Enabled</span>
            ) : (
              <button
                onClick={handleRequestBrowserPermission}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
export const ToastNotification = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm z-50"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-green-100 text-green-600 flex-shrink-0">
          <Mail size={20} />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{notification.title}</h4>
          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};