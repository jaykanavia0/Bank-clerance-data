import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import SebiDirectory from './components/SebiDirectory';
import SebiRouting from './components/SebiRouting';
import Header from './components/Header';
import { Suspense, useEffect, useState } from 'react';
import Spinner from './components/Spinner';

// Import notification system
import notificationService from './services/notificationService';
import { NotificationSettings, ToastNotification } from './components/NotificationBell';

function App() {
  const [toastNotification, setToastNotification] = useState(null);
  const [isNotificationServiceReady, setIsNotificationServiceReady] = useState(false);

  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        console.log('Initializing notification service...');
        
        // Request browser notification permission
        const permissionGranted = await notificationService.requestNotificationPermission();
        console.log('Browser notification permission:', permissionGranted ? 'granted' : 'denied');
        
        // Start polling for email replies (check every minute)
        notificationService.startPolling(60000);
        console.log('Started polling for email replies');
        
        // Subscribe to new notifications for toast display
        const unsubscribe = notificationService.subscribe((notifications) => {
          const latestNotification = notifications[0];
          
          // Show toast for new unread notifications
          if (latestNotification && !latestNotification.read && !latestNotification.toastShown) {
            setToastNotification(latestNotification);
            
            // Mark as toast shown to prevent duplicate toasts
            notificationService.markToastShown(latestNotification.id);
          }
        });

        setIsNotificationServiceReady(true);
        console.log('Notification service initialized successfully');

        // Cleanup function
        return () => {
          console.log('Cleaning up notification service...');
          unsubscribe();
          notificationService.stopPolling();
        };

      } catch (error) {
        console.error('Failed to initialize notification service:', error);
        setIsNotificationServiceReady(true); // Still allow app to function
      }
    };

    const cleanup = initializeNotifications();
    
    // Cleanup on unmount
    return () => {
      cleanup.then(cleanupFn => {
        if (cleanupFn && typeof cleanupFn === 'function') {
          cleanupFn();
        }
      }).catch(error => {
        console.error('Error during notification service cleanup:', error);
      });
    };
  }, []);

  // Add demo notification for testing (remove in production)
  useEffect(() => {
    // Add a test notification after 5 seconds in development
    if (import.meta.env.DEV && isNotificationServiceReady) {
      const timer = setTimeout(() => {
        notificationService.addNotification({
          title: 'Welcome to Banking Router!',
          message: 'Your banking and SEBI contact routing system is now active. This is a test notification.',
          senderName: 'System',
          senderEmail: 'system@bankingrouter.com',
          subject: 'System Welcome',
          snippet: 'This is a demo notification to show you how the system works.'
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isNotificationServiceReady]);

  const handleToastClose = () => {
    setToastNotification(null);
  };

  return (
    <Router>
      <div className="app-container min-h-screen bg-gray-50 text-gray-900">
        {/* Pass notification service to Header */}
        <Header notificationService={notificationService} />

        {/* Suspense fallback for route-level loading protection */}
        <Suspense fallback={<Spinner />}>
          <main className="container mx-auto p-4 pt-24" role="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route 
                path="/contacts" 
                element={<Contacts notificationService={notificationService} />} 
              />
              
              {/* SEBI Routes */}
              <Route path="/sebi/directory" element={<SebiDirectory />} />
              <Route path="/sebi/routing" element={<SebiRouting />} />
              
              {/* Settings route */}
              <Route 
                path="/settings" 
                element={
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-8">
                        Settings
                      </h1>
                      <NotificationSettings notificationService={notificationService} />
                    </div>
                  </div>
                } 
              />
              
              {/* 404 Route - Enhanced styling */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
                        <div className="text-6xl mb-6">🔍</div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                          404
                        </h1>
                        <p className="text-xl text-red-600 mb-6">Page Not Found</p>
                        <p className="text-gray-600 mb-8">
                          The page you're looking for doesn't exist or has been moved.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={() => window.history.back()}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                          >
                            Go Back
                          </button>
                          <a
                            href="/"
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors inline-block"
                          >
                            Home
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
        </Suspense>

        {/* Toast Notification - Fixed position, high z-index */}
        {toastNotification && (
          <ToastNotification
            notification={toastNotification}
            onClose={handleToastClose}
          />
        )}

        {/* Enhanced Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Logo and Description */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white">B</span>
                </div>
                <div>
                  <div className="font-bold text-gray-800">Banking Router</div>
                  <div className="text-sm text-gray-600">Smart Financial Hub</div>
                </div>
              </div>
              
              {/* Service Status */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {isNotificationServiceReady && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600">Notifications Active</span>
                    </div>
                    
                    {import.meta.env.DEV && (
                      <div className="flex items-center gap-1 ml-4">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-600">Dev Mode</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Copyright */}
                <div className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Banking Router. All rights reserved.
                </div>
              </div>
            </div>
            
            {/* Service Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Banking Services</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li><a href="/contacts" className="hover:text-purple-600 transition-colors">Bank Contacts</a></li>
                    <li><a href="/" className="hover:text-purple-600 transition-colors">Issue Routing</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">SEBI Services</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li><a href="/sebi/directory" className="hover:text-purple-600 transition-colors">Entity Directory</a></li>
                    <li><a href="/sebi/routing" className="hover:text-purple-600 transition-colors">Issue Routing</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Support</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li><a href="/settings" className="hover:text-purple-600 transition-colors">Settings</a></li>
                    <li><span className="text-gray-400">Help Center</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Statistics</h3>
                  <ul className="space-y-1 text-gray-600 text-xs">
                    <li>🏦 Banking Partners</li>
                    <li>📊 SEBI Entities</li>
                    <li>🔔 Smart Notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </footer>

        
      </div>
    </Router>
  );
}

export default App;