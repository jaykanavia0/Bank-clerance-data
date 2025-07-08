import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiBarChart2, 
  FiRefreshCw, 
  FiInfo, 
  FiArrowRight, 
  FiCalendar,
  FiAlertTriangle, 
  FiX, 
  FiSearch,
  FiFilter,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi'
import apiService from '../services/apiService'
import RoutingForm from '../components/RoutingForm'
import ResultCard from '../components/ResultCard'
import Spinner from '../components/Spinner'
import StatsCard from '../components/StatsCard'

// Constants
const ITEMS_PER_PAGE = 2
const MAX_HISTORY_ITEMS = 50
const REFRESH_COOLDOWN = 5000 // 5 seconds

function Dashboard() {
  // Core data states
  const [banks, setBanks] = useState([])
  const [categories, setCategories] = useState([])
  const [severities, setSeverities] = useState([])
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Result and error states
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  // History states
  const [routingHistory, setRoutingHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    bank: '',
    dateRange: 'all' // 'today', 'week', 'month', 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // UI states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0)
  
  // Stats state
  const [stats, setStats] = useState({
    totalBanks: 0,
    regionsCount: 0,
    routedIssues: 0,
    previousRoutedIssues: 0,
    activeContacts: 0
  })
  
  const resultCardRef = useRef(null)
  const historyContainerRef = useRef(null)

  // Memoized filtered history with comprehensive filtering
  const filteredHistory = useMemo(() => {
    let filtered = routingHistory

    // Text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.bank?.toLowerCase().includes(searchLower) ||
        entry.category?.toLowerCase().includes(searchLower) ||
        entry.severity?.toLowerCase().includes(searchLower) ||
        entry.result?.contact_name?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(entry => entry.category === filters.category)
    }

    // Severity filter
    if (filters.severity) {
      filtered = filtered.filter(entry => entry.severity === filters.severity)
    }

    // Bank filter
    if (filters.bank) {
      filtered = filtered.filter(entry => entry.bank === filters.bank)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        default:
          break
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.timestamp)
          return entryDate >= filterDate
        })
      }
    }

    return filtered
  }, [routingHistory, searchTerm, filters])

  // Pagination calculations - show pagination only if more than 2 items
  const shouldShowPagination = filteredHistory.length > 2
  const totalPages = shouldShowPagination ? Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) : 1
  const startIndex = shouldShowPagination ? (currentPage - 1) * ITEMS_PER_PAGE : 0
  const endIndex = shouldShowPagination ? startIndex + ITEMS_PER_PAGE : filteredHistory.length
  
  // Get items for current page
  const currentHistoryItems = useMemo(() => {
    return filteredHistory.slice(startIndex, endIndex)
  }, [filteredHistory, startIndex, endIndex])

  // Fetch initial data with error handling and retry logic
  const fetchInitialData = useCallback(async (retryCount = 0) => {
    try {
      setInitialLoading(true)
      
      // Simulate concurrent API requests with timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const requests = Promise.all([
        apiService.getBanks(),
        apiService.getCategories(),
        apiService.getSeverities()
      ])
      
      const [banksResponse, categoriesResponse, severitiesResponse] = await Promise.race([
        requests,
        timeout
      ])
      
      // Validate responses
      if (!banksResponse?.banks || !categoriesResponse?.categories || !severitiesResponse?.severities) {
        throw new Error('Invalid API response structure')
      }
      
      setBanks(banksResponse.banks)
      setCategories(categoriesResponse.categories)
      setSeverities(severitiesResponse.severities)
      
      // Get routing stats from localStorage with validation
      const currentRoutedIssues = Math.max(0, parseInt(localStorage.getItem('routedIssues') || '0'))
      const previousRoutedIssues = Math.max(0, parseInt(localStorage.getItem('previousRoutedIssues') || '0'))
      
      // Calculate stats
      const uniqueRegions = new Set(banksResponse.banks.map(bank => bank.Region_Name).filter(Boolean))
      const activeContacts = Math.max(1, Math.floor(banksResponse.banks.length * 1.5))
      
      setStats({
        totalBanks: banksResponse.banks.length,
        regionsCount: uniqueRegions.size || 5,
        routedIssues: currentRoutedIssues,
        previousRoutedIssues: previousRoutedIssues,
        activeContacts: activeContacts
      })
      
      setLastRefreshed(new Date())
      setError(null)
      
    } catch (err) {
      console.error('Error fetching initial data:', err)
      
      if (retryCount < 2) {
        // Retry with exponential backoff
        setTimeout(() => fetchInitialData(retryCount + 1), (retryCount + 1) * 2000)
        toast.warning(`Retrying... Attempt ${retryCount + 2} of 3`)
      } else {
        setError('Failed to load dashboard data. Please check your connection and try again.')
        toast.error('Failed to load initial data. Please refresh the page.')
      }
    } finally {
      setInitialLoading(false)
    }
  }, [])

  // Optimized refresh with cooldown
  const refreshData = useCallback(async () => {
    const now = Date.now()
    if (isRefreshing || (now - lastRefreshAttempt < REFRESH_COOLDOWN)) {
      if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
        const remainingTime = Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshAttempt)) / 1000)
        toast.info(`Please wait ${remainingTime} seconds before refreshing again`)
      }
      return
    }
    
    setIsRefreshing(true)
    setLastRefreshAttempt(now)
    
    try {
      toast.info('Refreshing dashboard data...')
      await fetchInitialData()
      toast.success('Dashboard data refreshed!')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, lastRefreshAttempt, fetchInitialData])

  // Load routing history with error handling
  const loadRoutingHistory = useCallback(() => {
    try {
      const historyJson = localStorage.getItem('routingHistory')
      if (historyJson) {
        const history = JSON.parse(historyJson)
        // Validate history structure and filter invalid entries
        const validHistory = history.filter(entry => 
          entry && entry.id && entry.timestamp && entry.bank && entry.result
        ).slice(0, MAX_HISTORY_ITEMS)
        
        setRoutingHistory(validHistory)
      }
    } catch (error) {
      console.error('Error loading routing history:', error)
      // Clear corrupted history
      localStorage.removeItem('routingHistory')
      setRoutingHistory([])
    }
  }, [])

  // Save routing history with optimization
  const saveRoutingHistory = useCallback((newEntry) => {
    try {
      setRoutingHistory(prevHistory => {
        const updatedHistory = [newEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS)
        localStorage.setItem('routingHistory', JSON.stringify(updatedHistory))
        return updatedHistory
      })
    } catch (error) {
      console.error('Error saving routing history:', error)
      toast.warning('Failed to save to history')
    }
  }, [])

  // Optimized form submission
  const handleSubmit = useCallback(async (formData) => {
    if (loading) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.routeIssue(formData)
      
      if (response.success && response.result) {
        const resultWithTimestamp = {
          ...response.result,
          timestamp: new Date().toISOString()
        }
        
        setResult(resultWithTimestamp)
        
        // Create optimized history entry
        const historyEntry = {
          id: Date.now(),
          timestamp: resultWithTimestamp.timestamp,
          bank: banks.find(b => b.Bank_ID === formData.bank_id)?.Bank_Name || 'Unknown Bank',
          category: categories.find(c => c.id === formData.issue_category)?.name || 'Unknown Category',
          severity: severities.find(s => s.id === formData.severity)?.name || 'Unknown Severity',
          timeSensitivity: formData.time_sensitivity || 0,
          result: resultWithTimestamp
        }
        
        saveRoutingHistory(historyEntry)
        
        // Update stats atomically
        setStats(prev => {
          const newCount = prev.routedIssues + 1
          localStorage.setItem('previousRoutedIssues', prev.routedIssues.toString())
          localStorage.setItem('routedIssues', newCount.toString())
          
          return {
            ...prev,
            previousRoutedIssues: prev.routedIssues,
            routedIssues: newCount
          }
        })
        
        toast.success('Contact found successfully!')
      } else {
        const errorMsg = response.error || 'An error occurred while routing the issue'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('Error routing issue:', err)
      const errorMsg = 'Failed to connect to server. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [loading, banks, categories, severities, saveRoutingHistory])

  // Clear result with animation
  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  // Format date with memoization
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch {
      return 'Invalid Date'
    }
  }, [])

  // Pagination handlers
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top of history
      if (historyContainerRef.current) {
        historyContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [totalPages])

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  // Filter handlers
  const updateFilter = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      category: '',
      severity: '',
      bank: '',
      dateRange: 'all'
    })
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() || 
           filters.category || 
           filters.severity || 
           filters.bank || 
           filters.dateRange !== 'all'
  }, [searchTerm, filters])

  // Get unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    return [...new Set(routingHistory.map(entry => entry.category).filter(Boolean))]
  }, [routingHistory])

  const uniqueSeverities = useMemo(() => {
    return [...new Set(routingHistory.map(entry => entry.severity).filter(Boolean))]
  }, [routingHistory])

  const uniqueBanks = useMemo(() => {
    return [...new Set(routingHistory.map(entry => entry.bank).filter(Boolean))]
  }, [routingHistory])

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Initial data load
  useEffect(() => {
    fetchInitialData()
    loadRoutingHistory()
  }, [fetchInitialData, loadRoutingHistory])

  // Scroll to result when available (mobile only)
  useEffect(() => {
    if (result && resultCardRef.current && window.innerWidth < 1024) {
      setTimeout(() => {
        resultCardRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    }
  }, [result])

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts or intervals
    }
  }, [])

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center max-w-md w-full">
          <div className="relative mb-6">
            <Spinner className="w-12 h-12 mx-auto" />
            <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 text-sm">
            Setting up your banking contact routing system...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !banks.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load</h3>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button 
            onClick={() => fetchInitialData()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20 lg:h-24"></div>
      
      {/* Dashboard Header */}
      <div className="mx-4 sm:mx-6 lg:mx-8 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 sm:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 text-white">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <FiBarChart2 className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    Banking Router Dashboard
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base mt-1 opacity-90">
                    Route customer issues to the appropriate contact based on issue details and severity
                  </p>
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button 
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} size={16} />
                  <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <FiCalendar size={14} />
                  <span className="hidden sm:inline">Updated:</span>
                  <span>{lastRefreshed.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="mx-4 sm:mx-6 lg:mx-8 mb-6 sm:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <StatsCard 
            title="Banks in System" 
            value={stats.totalBanks} 
            icon="bank" 
            color="blue"
            timeFrame="Total Available"
            loading={isRefreshing}
          />
          <StatsCard 
            title="Banking Regions" 
            value={stats.regionsCount} 
            icon="globe" 
            color="green"
            timeFrame="Global Coverage"
            loading={isRefreshing}
          />
          <StatsCard 
            title="Issues Routed" 
            value={stats.routedIssues} 
            icon="ticket" 
            color="purple"
            timeFrame="Lifetime"
            trend={true}
            previousValue={stats.previousRoutedIssues}
            loading={isRefreshing}
          />
          <StatsCard 
            title="Active Contacts" 
            value={stats.activeContacts} 
            icon="users" 
            color="orange"
            timeFrame="Available Now"
            loading={isRefreshing}
          />
        </motion.div>
      </div>
      
      {/* Main Content */}
      <div className="mx-4 sm:mx-6 lg:mx-8 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - Form and History */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Routing Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-800">Route New Issue</h2>
                  <div className="flex items-center text-sm text-blue-600 bg-blue-100/50 px-3 py-1.5 rounded-lg">
                    <FiInfo size={16} className="mr-2 flex-shrink-0" />
                    <span>Fill all fields for best results</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {loading && !result ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative mb-4">
                      <Spinner className="w-8 h-8" />
                      <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Processing request...</p>
                    <p className="text-gray-500 text-sm mt-1">Finding the best contact for your issue</p>
                  </div>
                ) : (
                  <RoutingForm 
                    banks={banks} 
                    categories={categories} 
                    severities={severities} 
                    onSubmit={handleSubmit}
                    disabled={loading}
                  />
                )}
              </div>
            </div>
            
            {/* Routing History Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">Routing History</h2>
                    {routingHistory.length > 0 && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                        {routingHistory.length} total
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-blue-600 text-sm font-medium bg-blue-100/50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span>{showHistory ? 'Hide History' : 'Show History'}</span>
                    <FiArrowRight className={`transform transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                    ref={historyContainerRef}
                  >
                    <div className="mb-4 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiSearch className="text-gray-400" size={18} />
                        </div>
                        <input
                          type="text"
                          className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="Search history by bank, category, or contact..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Filter Section */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FiFilter className="text-gray-500" size={16} />
                            <span className="text-sm font-medium text-gray-700">Filters</span>
                            {hasActiveFilters && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                              <button
                                onClick={clearAllFilters}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Clear All
                              </button>
                            )}
                            <button
                              onClick={() => setShowFilters(!showFilters)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {showFilters ? 'Hide' : 'Show'} Filters
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {showFilters && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                            >
                              {/* Category Filter */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Category
                                </label>
                                <select
                                  value={filters.category}
                                  onChange={(e) => updateFilter('category', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                  <option value="">All Categories</option>
                                  {uniqueCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Severity Filter */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Severity
                                </label>
                                <select
                                  value={filters.severity}
                                  onChange={(e) => updateFilter('severity', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                  <option value="">All Severities</option>
                                  {uniqueSeverities.map(severity => (
                                    <option key={severity} value={severity}>{severity}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Bank Filter */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Bank
                                </label>
                                <select
                                  value={filters.bank}
                                  onChange={(e) => updateFilter('bank', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                  <option value="">All Banks</option>
                                  {uniqueBanks.map(bank => (
                                    <option key={bank} value={bank}>{bank}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Date Range Filter */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Date Range
                                </label>
                                <select
                                  value={filters.dateRange}
                                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                  <option value="all">All Time</option>
                                  <option value="today">Today</option>
                                  <option value="week">Last Week</option>
                                  <option value="month">Last Month</option>
                                </select>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Results Summary */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                          {filteredHistory.length === 0 ? (
                            'No entries found'
                          ) : shouldShowPagination ? (
                            `Showing ${startIndex + 1}-${Math.min(endIndex, filteredHistory.length)} of ${filteredHistory.length} entries`
                          ) : (
                            `Showing ${filteredHistory.length} ${filteredHistory.length === 1 ? 'entry' : 'entries'}`
                          )}
                        </div>
                        {shouldShowPagination && (
                          <div className="text-xs text-gray-500">
                            Page {currentPage} of {totalPages}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiClock className="text-gray-400" size={24} />
                        </div>
                        <p className="text-gray-600 font-medium mb-1">
                          {searchTerm ? 'No matching history found' : 'No routing history found'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'Try adjusting your search terms' : 'Route an issue to create history'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence mode="wait">
                          {currentHistoryItems.map((entry, index) => (
                            <motion.div 
                              key={entry.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <span className="font-semibold text-gray-800 text-lg">{entry.bank}</span>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border">
                                  {formatDate(entry.timestamp)}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                  {entry.category}
                                </span>
                                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                                  {entry.severity}
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                                  Urgency: {entry.timeSensitivity}/10
                                </span>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <div className="text-sm text-gray-700">
                                  <span className="text-gray-500">Routed to:</span>
                                  <span className="font-semibold text-gray-800 ml-1">{entry.result?.contact_name || 'Unknown'}</span>
                                </div>
                                <button 
                                  onClick={() => setResult(entry.result)}
                                  className="self-start sm:self-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                                >
                                  View Details
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Pagination Controls */}
                        {shouldShowPagination && totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <FiChevronLeft size={16} />
                              </button>
                              
                              {/* Page Numbers */}
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum
                                  if (totalPages <= 5) {
                                    pageNum = i + 1
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                  } else {
                                    pageNum = currentPage - 2 + i
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => goToPage(pageNum)}
                                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        pageNum === currentPage
                                          ? 'bg-blue-600 text-white'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                }).filter(Boolean)}
                              </div>
                              
                              <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <FiChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Right Column - Result */}
          <motion.div 
            ref={resultCardRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Routing Result</h2>
                {result && (
                  <button 
                    onClick={clearResult}
                    className="text-gray-500 hover:text-gray-700 bg-white/70 p-2 rounded-lg hover:bg-white transition-all duration-200"
                    title="Clear result"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-6 text-red-700 rounded-xl">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold mb-2">Routing Error</p>
                      <p className="text-sm leading-relaxed">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ) : loading && !result ? (
                <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="bg-gray-100 rounded-full p-4 mb-4">
                    <FiFilter className="text-gray-400" size={32} />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Submit an issue to see routing result</p>
                  <p className="text-sm text-gray-500">Complete the form to find the right contact</p>
                </div>
              ) : result ? (
                <div>
                  {result.timestamp && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <FiCalendar size={16} />
                        <span className="font-medium">Route generated:</span>
                        <span>{formatDate(result.timestamp)}</span>
                      </div>
                    </motion.div>
                  )}
                  <ResultCard result={result} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="bg-gray-100 rounded-full p-4 mb-4">
                    <FiFilter className="text-gray-400" size={32} />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Submit an issue to see routing result</p>
                  <p className="text-sm text-gray-500">Complete the form to find the right contact</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Performance Optimization: Custom CSS */}
      {/* Performance Optimization: Custom CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Performance optimizations */
        .will-change-transform {
          will-change: transform;
        }
        
        .will-change-opacity {
          will-change: opacity;
        }
        
        /* Reduce layout shifts */
        .aspect-ratio-preserve {
          aspect-ratio: 1 / 1;
        }
        
        /* Smooth transitions */
        .transition-optimized {
          transition: transform 0.2s ease-out, opacity 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Dashboard