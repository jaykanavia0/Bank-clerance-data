import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Mail, Phone, User, Building, ArrowRight, RotateCcw, Send, Star, Clock } from 'lucide-react';
import EmailTemplate from '../components/EmailTemplate';

// SEBI API service functions
const sebiApiService = {
  getSebiEntities: async (filters = {}) => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);
    
    const queryString = params.toString();
    const response = await fetch(`${API_URL}/api/sebi/entities${queryString ? '?' + queryString : ''}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch SEBI entities');
    }
    
    return await response.json();
  },

  getSebiCategories: async () => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_URL}/api/sebi/categories`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return await response.json();
  },

  routeSebiIssue: async (formData) => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_URL}/api/sebi/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to route issue');
    }
    
    return await response.json();
  }
};

const SebiRouting = () => {
  const [entities, setEntities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    sebi_id: '',
    issue_category: '',
    severity: 'Medium',
    description: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email functionality state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactedEntities, setContactedEntities] = useState(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [filteredEntities, setFilteredEntities] = useState([]);

  useEffect(() => {
    loadInitialData();
    loadContactedEntities();
  }, []);

  // Update filtered entities when entities or search term changes
  useEffect(() => {
    applyFilters();
  }, [entities, searchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Apply search filter to entities
  const applyFilters = () => {
    let filtered = [...entities];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entity =>
        entity.name.toLowerCase().includes(searchLower) ||
        entity.registration_no.toLowerCase().includes(searchLower) ||
        (entity.contact_person && entity.contact_person.toLowerCase().includes(searchLower))
      );
    }

    setFilteredEntities(filtered);
  };

  // Get current page entities
  const getCurrentPageEntities = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEntities.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredEntities.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of entity list
      document.getElementById('entity-list-section')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pageNumbers = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (startPage > 1) {
          pageNumbers.push(1);
          if (startPage > 2) pageNumbers.push('...');
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i);
        }
        
        if (endPage < totalPages) {
          if (endPage < totalPages - 1) pageNumbers.push('...');
          pageNumbers.push(totalPages);
        }
      }
      
      return pageNumbers;
    };

    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEntities.length)} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredEntities.length)} of {filteredEntities.length} entities
        </div>
        
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...'}
                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : page === '...'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Load contacted entities from localStorage
  const loadContactedEntities = () => {
    try {
      const stored = localStorage.getItem('contactedSebiEntities');
      if (stored) {
        setContactedEntities(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading contacted entities:', error);
    }
  };

  // Save contacted entities to localStorage
  const saveContactedEntities = (entities) => {
    try {
      localStorage.setItem('contactedSebiEntities', JSON.stringify([...entities]));
    } catch (error) {
      console.error('Error saving contacted entities:', error);
    }
  };

  // Handle email sending
  const handleEmailSent = (contact, emailData) => {
    const newContactedEntities = new Set(contactedEntities);
    newContactedEntities.add(contact.sebi_id || contact.id);
    setContactedEntities(newContactedEntities);
    saveContactedEntities(newContactedEntities);
    
    setIsEmailModalOpen(false);
    setSelectedContact(null);
  };

  // Open email modal for the routed contact
  const openEmailModalForResult = () => {
    if (result && selectedEntity) {
      const contact = {
        sebi_id: selectedEntity.sebi_id,
        id: selectedEntity.sebi_id,
        name: result.contact_name,
        bank_name: result.entity_name,
        email: result.contact_email !== "Not Available" ? result.contact_email : null,
        position: result.route_type,
        type: 'sebi'
      };
      
      if (contact.email) {
        setSelectedContact(contact);
        setIsEmailModalOpen(true);
      }
    }
  };

  // Check if entity has been contacted
  const isContactContacted = (entityId) => {
    return contactedEntities.has(entityId);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [entitiesRes, categoriesRes] = await Promise.all([
        sebiApiService.getSebiEntities(),
        sebiApiService.getSebiCategories()
      ]);
      
      if (entitiesRes.success) {
        setEntities(entitiesRes.entities);
        setFilteredEntities(entitiesRes.entities); // Initialize filtered entities
      } else {
        throw new Error(entitiesRes.error || 'Failed to load entities');
      }
      
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories);
      } else {
        throw new Error(categoriesRes.error || 'Failed to load categories');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sebi_id || !formData.issue_category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await sebiApiService.routeSebiIssue(formData);
      
      if (response.success) {
        setResult(response.result);
        setStep(3);
      } else {
        throw new Error(response.error || 'Failed to route issue');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to route issue');
      console.error('Routing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sebi_id: '',
      issue_category: '',
      severity: 'Medium',
      description: ''
    });
    setResult(null);
    setError('');
    setStep(1);
    setSearchTerm('');
  };

  const selectedEntity = entities.find(e => e.sebi_id.toString() === formData.sebi_id);

  // Get contact status for an entity
  const getContactStatus = (entity) => {
    if (!entity.primary_contact?.email && !entity.secondary_contact?.email) {
      return { status: 'no-email', text: 'No Email', color: 'gray' };
    }
    
    if (isContactContacted(entity.sebi_id)) {
      return { status: 'contacted', text: 'Contacted', color: 'green' };
    }
    
    return { status: 'not-contacted', text: 'Available', color: 'blue' };
  };

  const getStepStatus = (stepNumber) => {
    if (stepNumber < step) return 'completed';
    if (stepNumber === step) return 'active';
    return 'upcoming';
  };

  const StepIndicator = ({ stepNumber, title, status }) => (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
        status === 'completed' 
          ? 'bg-green-500 border-green-500 text-white' 
          : status === 'active'
          ? 'bg-purple-500 border-purple-500 text-white'
          : 'border-gray-300 text-gray-400'
      }`}>
        {status === 'completed' ? (
          <CheckCircle size={16} />
        ) : (
          <span className="text-sm font-semibold">{stepNumber}</span>
        )}
      </div>
      <span className={`ml-2 text-sm font-medium ${
        status === 'active' ? 'text-purple-600' : status === 'completed' ? 'text-green-600' : 'text-gray-400'
      }`}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-purple-100">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              SEBI Issue Routing
            </h1>
            <p className="text-gray-600 mb-6">Route your concerns to the appropriate SEBI registered entity</p>
            
            {/* Campaign Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <div className="text-xl font-bold text-purple-600">{entities.length}</div>
                <div className="text-xs text-purple-600">Total Entities</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-xl font-bold text-blue-600">
                  {entities.filter(e => e.primary_contact?.email || e.secondary_contact?.email).length}
                </div>
                <div className="text-xs text-blue-600">With Email</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="text-xl font-bold text-green-600">{contactedEntities.size}</div>
                <div className="text-xs text-green-600">Contacted</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-xl font-bold text-orange-600">
                  {entities.filter(e => (e.primary_contact?.email || e.secondary_contact?.email) && !contactedEntities.has(e.sebi_id)).length}
                </div>
                <div className="text-xs text-orange-600">Available</div>
              </div>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between max-w-md">
              <StepIndicator stepNumber={1} title="Select Entity" status={getStepStatus(1)} />
              <ArrowRight size={16} className="text-gray-300" />
              <StepIndicator stepNumber={2} title="Issue Details" status={getStepStatus(2)} />
              <ArrowRight size={16} className="text-gray-300" />
              <StepIndicator stepNumber={3} title="Contact Info" status={getStepStatus(3)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
              <AlertTriangle size={20} />
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Step 1: Entity Selection */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Select SEBI Entity</h2>
                  <p className="text-gray-600 mt-1">Choose the entity you want to route your issue to</p>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredEntities.length} entities found
                  {totalPages > 1 && (
                    <span className="ml-2">• Page {currentPage} of {totalPages}</span>
                  )}
                </div>
              </div>
              
              {/* Search and Stats */}
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Search by entity name, registration number, or contact person..."
                    />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{filteredEntities.length}</div>
                    <div className="text-xs text-purple-600">Available</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {filteredEntities.filter(e => e.primary_contact?.email || e.secondary_contact?.email).length}
                    </div>
                    <div className="text-xs text-blue-600">With Email</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {filteredEntities.filter(e => isContactContacted(e.sebi_id)).length}
                    </div>
                    <div className="text-xs text-green-600">Contacted</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {filteredEntities.filter(e => 
                        (e.primary_contact?.email || e.secondary_contact?.email) && 
                        !isContactContacted(e.sebi_id)
                      ).length}
                    </div>
                    <div className="text-xs text-orange-600">Available for Contact</div>
                  </div>
                </div>
              </div>

              {/* Entity List */}
              <div id="entity-list-section">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading entities...</p>
                  </div>
                ) : getCurrentPageEntities().length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getCurrentPageEntities().map((entity) => {
                      const contactStatus = getContactStatus(entity);
                      return (
                        <div
                          key={entity.sebi_id}
                          onClick={() => {
                            setFormData({...formData, sebi_id: entity.sebi_id.toString()});
                            setStep(2);
                          }}
                          className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            formData.sebi_id === entity.sebi_id.toString()
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{entity.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">Registration: {entity.registration_no}</p>
                              
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {entity.contact_person && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <User size={12} />
                                    {entity.contact_person}
                                  </span>
                                )}
                                
                                {/* Contact Status Badge */}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  contactStatus.status === 'contacted' 
                                    ? 'bg-green-100 text-green-800'
                                    : contactStatus.status === 'no-email'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {contactStatus.status === 'contacted' && <CheckCircle size={10} className="mr-1" />}
                                  {contactStatus.status === 'no-email' && <AlertTriangle size={10} className="mr-1" />}
                                  {contactStatus.status === 'not-contacted' && <Clock size={10} className="mr-1" />}
                                  {contactStatus.text}
                                </span>
                              </div>
                              
                              {/* Email indicator */}
                              {(entity.primary_contact?.email || entity.secondary_contact?.email) && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <Mail size={12} />
                                  <span>Email available</span>
                                </div>
                              )}
                            </div>
                            <ArrowRight size={20} className="text-gray-400 mt-2" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No entities found</p>
                    <p className="text-sm">
                      {searchTerm 
                        ? 'Try adjusting your search terms or clear the search to see all entities.'
                        : 'No SEBI entities are currently available.'
                      }
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                {!loading && getCurrentPageEntities().length > 0 && (
                  <Pagination />
                )}
              </div>
            </div>
          )}

          {/* Step 2: Issue Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Issue Details</h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  ← Back to Selection
                </button>
              </div>

              {/* Selected Entity Preview */}
              {selectedEntity && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h3 className="font-semibold text-purple-900 mb-1">Selected Entity</h3>
                  <p className="text-purple-800">{selectedEntity.name}</p>
                  <p className="text-sm text-purple-600">Registration: {selectedEntity.registration_no}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Issue Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Category *
                  </label>
                  <select
                    value={formData.issue_category}
                    onChange={(e) => setFormData({...formData, issue_category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({...formData, severity: level})}
                        className={`p-3 text-center rounded-xl border transition-all ${
                          formData.severity === level
                            ? level === 'Critical'
                              ? 'bg-red-500 text-white border-red-500'
                              : level === 'High'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : level === 'Medium'
                              ? 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-green-500 text-white border-green-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">{level}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send size={18} />
                    )}
                    {loading ? 'Routing Issue...' : 'Route Issue'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={18} />
                    Reset
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Issue Routed Successfully</h2>
                <p className="text-gray-600">Your issue has been directed to the appropriate contact</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entity Details */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Building size={20} />
                    Entity Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {result.entity_name}</div>
                    <div><strong>Registration:</strong> {result.registration_no}</div>
                    <div><strong>Route Type:</strong> {result.route_type}</div>
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{result.confidence}%</span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">Routing Confidence</p>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <User size={20} />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-green-600" />
                      <div>
                        <div className="font-medium">{result.contact_name}</div>
                      </div>
                    </div>
                    
                    {result.contact_email !== "Not Available" && (
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-blue-600" />
                        <a 
                          href={`mailto:${result.contact_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {result.contact_email}
                        </a>
                      </div>
                    )}
                    
                    {result.contact_phone !== "Not Available" && (
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-green-600" />
                        <a 
                          href={`tel:${result.contact_phone}`}
                          className="text-green-600 hover:underline"
                        >
                          {result.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Route Another Issue
                </button>
                
                {/* Email Button */}
                {result.contact_email !== "Not Available" && (
                  <button
                    onClick={openEmailModalForResult}
                    disabled={isContactContacted(selectedEntity?.sebi_id)}
                    className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                      isContactContacted(selectedEntity?.sebi_id)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border border-purple-300 text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Mail size={18} />
                    {isContactContacted(selectedEntity?.sebi_id) ? 'Already Contacted' : 'Send Email'}
                  </button>
                )}
                
                {/* Fallback mailto link */}
                {result.contact_email !== "Not Available" && !isContactContacted(selectedEntity?.sebi_id) && (
                  <a
                    href={`mailto:${result.contact_email}?subject=SEBI Issue - ${formData.issue_category}&body=Dear ${result.contact_name},%0D%0A%0D%0A${formData.description}%0D%0A%0D%0ABest regards`}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Mail size={18} />
                    Quick Email
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Template Modal */}
      <EmailTemplate
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
        onSend={handleEmailSent}
      />
    </div>
  );
};

export default SebiRouting;