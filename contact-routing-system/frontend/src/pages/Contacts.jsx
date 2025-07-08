import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import apiService from '../services/apiService'
import ContactsFilter from '../components/ContactsFilter'
import ContactsList from '../components/ContactsList'
import Spinner from '../components/Spinner'

function Contacts() {
  const [contacts, setContacts] = useState([])
  const [filteredContacts, setFilteredContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 9
  
  useEffect(() => {
    fetchContacts('all')
  }, [])
  
  useEffect(() => {
    // Filter contacts based on search term and reset to first page
    if (contacts.length) {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredContacts(filtered)
      setCurrentPage(1) // Reset to first page when filtering
    }
  }, [searchTerm, contacts])
  
  const fetchContacts = async (position) => {
    try {
      setLoading(true)
      const response = await apiService.getContacts(position)
      if (response.success) {
        setContacts(response.contacts)
        setFilteredContacts(response.contacts)
      } else {
        toast.error(response.error || 'Failed to load contacts')
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching contacts:', err)
      toast.error('Failed to connect to server')
      setLoading(false)
    }
  }
  
  const handlePositionChange = (position) => {
    setSelectedPosition(position)
    setCurrentPage(1) // Reset to first page when changing position
    fetchContacts(position)
  }
  
  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Calculate quick stats
  const totalContacts = contacts.length
  const filteredCount = filteredContacts.length
  const uniqueBanks = new Set(contacts.map(contact => contact.bank_name)).size
  const hasActiveFilters = selectedPosition !== 'all' || searchTerm

  // Pagination calculations
  const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex)

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      
      <div className="relative z-10">
        {/* Spacer for fixed header - increased */}
        <div className="h-16 sm:h-20 lg:h-24"></div>
        
        {/* Header Section - Improved */}
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-blue-600 px-6 sm:px-8 py-4">
              <div className="flex items-center gap-4 text-white">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    Contact Management
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base mt-1 opacity-90">
                    Manage and track your banking contacts efficiently
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 sm:px-8 py-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{totalContacts}</p>
                      <p className="text-sm text-blue-700 font-medium">Total Contacts</p>
                    </div>
                  </div>
                </div>
                
                {hasActiveFilters ? (
                  <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-900">{filteredCount}</p>
                        <p className="text-sm text-green-700 font-medium">Filtered Results</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
                        <p className="text-sm text-gray-700 font-medium">All Contacts</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{uniqueBanks}</p>
                      <p className="text-sm text-purple-700 font-medium">Unique Banks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Contained width but full gradient background */}
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Filter Section */}
          <div className="mb-4 sm:mb-6">
            <ContactsFilter 
              selectedPosition={selectedPosition}
              onPositionChange={handlePositionChange}
              onSearch={handleSearch}
              searchTerm={searchTerm}
            />
          </div>

          {/* Content Section */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 max-w-md w-full mx-4">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Spinner />
                      <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800">Loading Contacts</h3>
                      <p className="text-gray-600 text-sm">
                        Fetching your contact data...
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                {!loading && (hasActiveFilters || filteredContacts.length > 0) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {hasActiveFilters ? 'Filtered Results' : 'All Contacts'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {hasActiveFilters 
                              ? `Showing ${Math.min(ITEMS_PER_PAGE, paginatedContacts.length)} of ${filteredCount} contacts (page ${currentPage} of ${totalPages})`
                              : `Showing ${Math.min(ITEMS_PER_PAGE, paginatedContacts.length)} of ${totalContacts} contacts (page ${currentPage} of ${totalPages})`
                            }
                          </p>
                        </div>
                      </div>

                      {hasActiveFilters && (
                        <button
                          onClick={() => {
                            setSelectedPosition('all')
                            setSearchTerm('')
                            setCurrentPage(1)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Contacts List */}
                <div className="rounded-xl overflow-hidden">
                  <ContactsList contacts={paginatedContacts} isFirstPage={currentPage === 1} allContacts={filteredContacts} />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Page Info */}
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
                        <span className="font-medium text-gray-900">{Math.min(endIndex, filteredCount)}</span> of{' '}
                        <span className="font-medium text-gray-900">{filteredCount}</span> results
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={goToPrevious}
                          disabled={currentPage === 1}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            currentPage === 1
                              ? 'text-gray-400 bg-gray-100/50 cursor-not-allowed'
                              : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>

                        {/* Page Numbers */}
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = index + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = index + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + index;
                            } else {
                              pageNumber = currentPage - 2 + index;
                            }

                            return (
                              <button
                                key={pageNumber}
                                onClick={() => goToPage(pageNumber)}
                                className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  currentPage === pageNumber
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={goToNext}
                          disabled={currentPage === totalPages}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            currentPage === totalPages
                              ? 'text-gray-400 bg-gray-100/50 cursor-not-allowed'
                              : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                          }`}
                        >
                          Next
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Quick Jump (for large datasets) */}
                    {totalPages > 10 && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <span className="text-gray-600">Jump to page:</span>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                              const page = parseInt(e.target.value);
                              if (page >= 1 && page <= totalPages) {
                                goToPage(page);
                              }
                            }}
                            className="w-16 px-2 py-1 text-center border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <span className="text-gray-600">of {totalPages}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Empty State */}
          {!loading && filteredContacts.length === 0 && contacts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No contacts found</h3>
                <p className="text-gray-600 mb-6">
                  No contacts match your current search criteria. Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={() => {
                    setSelectedPosition('all')
                    setSearchTerm('')
                    setCurrentPage(1)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loading && contacts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No contacts available</h3>
                <p className="text-gray-600 mb-6">
                  It looks like you don't have any contacts yet. Contact data will appear here once available.
                </p>
                <button
                  onClick={() => fetchContacts('all')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Contacts