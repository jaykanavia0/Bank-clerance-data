import React, { useState, useEffect, cloneElement } from 'react'
import { FiAlertCircle, FiClock, FiDatabase, FiChevronDown, FiCheck, FiArrowRight, FiHelpCircle } from 'react-icons/fi'

function RoutingForm({ banks = [], categories = [], severities = [], onSubmit, disabled }) {
  const [formData, setFormData] = useState({
    bank_id: '',
    issue_category: '',
    severity: '',
    time_sensitivity: 5
  })
  
  const [formCompletion, setFormCompletion] = useState(0)
  const [timeSensitivityColor, setTimeSensitivityColor] = useState('bg-amber-400')
  const [currentStep, setCurrentStep] = useState(0)
  const [showTooltip, setShowTooltip] = useState(null)
  
  // Calculate form completion percentage
  useEffect(() => {
    let completed = 0
    if (formData.bank_id) completed++
    if (formData.issue_category) completed++
    if (formData.severity) completed++
    
    const percentage = Math.floor((completed / 3) * 100)
    setFormCompletion(percentage)
    setCurrentStep(completed)
  }, [formData])
  
  // Set time sensitivity color and description based on value
  useEffect(() => {
    const value = parseInt(formData.time_sensitivity)
    if (value <= 3) setTimeSensitivityColor('bg-emerald-500')
    else if (value <= 7) setTimeSensitivityColor('bg-amber-500')
    else setTimeSensitivityColor('bg-red-500')
  }, [formData.time_sensitivity])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = () => {
    onSubmit(formData)
  }
  
  const getTimeSensitivityLabel = () => {
    const value = parseInt(formData.time_sensitivity)
    if (value <= 2) return 'Low Priority'
    if (value <= 4) return 'Normal'
    if (value <= 6) return 'Important'
    if (value <= 8) return 'Urgent'
    return 'Critical'
  }
  
  const getTimeSensitivityDescription = () => {
    const value = parseInt(formData.time_sensitivity)
    if (value <= 2) return 'Can wait several days'
    if (value <= 4) return 'Should be addressed within 1-2 days'
    if (value <= 6) return 'Needs attention within hours'
    if (value <= 8) return 'Requires immediate attention'
    return 'Emergency - needs instant response'
  }
  
  // Helper function to determine icon size based on screen width
  const getIconSize = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 12 : 14
    }
    return 14 // default size for SSR
  }
  
  const FormField = ({ name, label, icon, children, isCompleted, tooltip }) => (
    <div className={`relative transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-95'}`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <label className="flex items-center text-sm sm:text-base font-semibold text-gray-800">
          <div className={`p-1 sm:p-1.5 rounded-lg mr-2 transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            {isCompleted ? (
              <FiCheck size={getIconSize()} />
            ) : (
              cloneElement(icon, { size: getIconSize() })
            )}
          </div>
          <span className="leading-tight">{label}</span>
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              onMouseEnter={() => setShowTooltip(name)}
              onMouseLeave={() => setShowTooltip(null)}
              onTouchStart={() => setShowTooltip(showTooltip === name ? null : name)}
            >
              <FiHelpCircle size={getIconSize()} />
            </button>
            {showTooltip === name && (
              <div className="absolute right-0 top-6 sm:top-8 bg-gray-900 text-white text-xs rounded-lg px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap z-10 shadow-lg max-w-xs">
                <div className="break-words">{tooltip}</div>
                <div className="absolute -top-1 right-2 sm:right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  )
  
  const SelectWrapper = ({ children, isCompleted }) => (
    <div className="relative">
      {children}
      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 transition-colors ${isCompleted ? 'text-emerald-500' : 'text-gray-400'}`}>
        {isCompleted ? (
          <FiCheck size={typeof window !== 'undefined' && window.innerWidth < 640 ? 14 : 16} />
        ) : (
          <FiChevronDown size={typeof window !== 'undefined' && window.innerWidth < 640 ? 14 : 16} />
        )}
      </div>
    </div>
  )
  
  const ProgressStep = ({ step, isActive, isCompleted, label }) => (
    <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300 mb-1 sm:mb-0 ${
        isCompleted ? 'bg-emerald-500 text-white' : 
        isActive ? 'bg-blue-500 text-white' : 
        'bg-gray-200 text-gray-500'
      }`}>
        {isCompleted ? (
          <FiCheck size={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 14} />
        ) : (
          step
        )}
      </div>
      <span className={`sm:ml-2 text-xs sm:text-sm font-medium transition-colors leading-tight ${
        isCompleted ? 'text-emerald-600' : 
        isActive ? 'text-blue-600' : 
        'text-gray-500'
      }`}>
        {label}
      </span>
    </div>
  )
  
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Banking Issue Router</h2>
          <p className="text-sm sm:text-base text-gray-600">Help us connect you with the right specialist</p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <ProgressStep step={1} isActive={currentStep === 0} isCompleted={currentStep > 0} label="Bank" />
            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${currentStep > 0 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
            <ProgressStep step={2} isActive={currentStep === 1} isCompleted={currentStep > 1} label="Issue" />
            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${currentStep > 1 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
            <ProgressStep step={3} isActive={currentStep === 2} isCompleted={currentStep > 2} label="Severity" />
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div 
              className="h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out" 
              style={{ width: `${formCompletion}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-1 sm:mt-2">
            <span>Getting started</span>
            <span>{formCompletion}% complete</span>
          </div>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <FormField 
            name="bank_id" 
            label="Select Your Bank" 
            icon={<FiDatabase />}
            isCompleted={!!formData.bank_id}
            tooltip="Choose the bank you need assistance with"
          >
            <SelectWrapper isCompleted={!!formData.bank_id}>
              <select
                name="bank_id"
                value={formData.bank_id}
                onChange={handleChange}
                className={`w-full p-3 sm:p-4 pr-8 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-800 appearance-none transition-all duration-200 text-sm sm:text-base ${
                  formData.bank_id ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                required
                disabled={disabled}
              >
                <option value="">Choose your bank...</option>
                {banks.map(bank => (
                  <option key={bank.Bank_ID} value={bank.Bank_ID}>
                    {bank.Bank_Name}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </FormField>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <FormField 
              name="issue_category" 
              label="Issue Category" 
              icon={<FiAlertCircle />}
              isCompleted={!!formData.issue_category}
              tooltip="What type of issue are you experiencing?"
            >
              <SelectWrapper isCompleted={!!formData.issue_category}>
                <select
                  name="issue_category"
                  value={formData.issue_category}
                  onChange={handleChange}
                  className={`w-full p-3 sm:p-4 pr-8 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-800 appearance-none transition-all duration-200 text-sm sm:text-base ${
                    formData.issue_category ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  required
                  disabled={disabled}
                >
                  <option value="">What's the issue about?</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </FormField>
            
            <FormField 
              name="severity" 
              label="Severity Level" 
              icon={<FiAlertCircle />}
              isCompleted={!!formData.severity}
              tooltip="How severe is this issue for you?"
            >
              <SelectWrapper isCompleted={!!formData.severity}>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className={`w-full p-3 sm:p-4 pr-8 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-800 appearance-none transition-all duration-200 text-sm sm:text-base ${
                    formData.severity ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  required
                  disabled={disabled}
                >
                  <option value="">How severe is it?</option>
                  {severities.map(severity => (
                    <option key={severity.id} value={severity.id}>
                      {severity.name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </FormField>
          </div>
          
          <FormField 
            name="time_sensitivity" 
            label="Time Sensitivity" 
            icon={<FiClock />}
            isCompleted={true}
            tooltip="How quickly do you need this resolved?"
          >
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">{getTimeSensitivityLabel()}</div>
                  <div className="text-xs sm:text-sm text-gray-600 break-words">{getTimeSensitivityDescription()}</div>
                </div>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full ${timeSensitivityColor} text-white font-bold text-base sm:text-lg shadow-lg transition-all duration-300 flex-shrink-0 self-center sm:self-auto`}>
                  {formData.time_sensitivity}
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  name="time_sensitivity"
                  min="1"
                  max="10"
                  value={formData.time_sensitivity}
                  onChange={handleChange}
                  className="w-full h-2 sm:h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 rounded-lg appearance-none cursor-pointer"
                  disabled={disabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                  <span>Not Urgent</span>
                  <span className="hidden sm:inline">Moderate</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          </FormField>
          
          <div className="pt-4 sm:pt-6">
            <button
              onClick={handleSubmit}
              className={`w-full font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center text-base sm:text-lg ${
                disabled || formCompletion < 100
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:transform-none hover:shadow-lg'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              }`}
              disabled={disabled || formCompletion < 100}
            >
              {disabled ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-400 border-t-transparent mr-2 sm:mr-3"></div>
                  <span className="text-sm sm:text-base">Finding Your Contact...</span>
                </>
              ) : (
                <>
                  <span>Find My Banking Specialist</span>
                  <FiArrowRight className="ml-2" size={typeof window !== 'undefined' && window.innerWidth < 640 ? 16 : 20} />
                </>
              )}
            </button>
            
            {formCompletion < 100 && !disabled && (
              <div className="text-center mt-4">
                <p className="text-xs sm:text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <FiAlertCircle className="inline mr-1" size={14} />
                  Please complete all required fields to continue
                </p>
              </div>
            )}
            
            {formCompletion === 100 && !disabled && (
              <div className="text-center mt-4">
                <p className="text-xs sm:text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <FiCheck className="inline mr-1" size={14} />
                  All set! Ready to find your perfect contact
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sample data for demo
const sampleBanks = [
  { Bank_ID: 'chase', Bank_Name: 'Chase Bank' },
  { Bank_ID: 'bofa', Bank_Name: 'Bank of America' },
  { Bank_ID: 'wells', Bank_Name: 'Wells Fargo' },
  { Bank_ID: 'citi', Bank_Name: 'Citibank' },
  { Bank_ID: 'usbank', Bank_Name: 'U.S. Bank' },
  { Bank_ID: 'pnc', Bank_Name: 'PNC Bank' }
]

const sampleCategories = [
  { id: 'account', name: 'Account Issues' },
  { id: 'cards', name: 'Credit/Debit Cards' },
  { id: 'loans', name: 'Loans & Mortgages' },
  { id: 'online', name: 'Online Banking' },
  { id: 'fraud', name: 'Fraud Protection' },
  { id: 'investment', name: 'Investment Services' }
]

const sampleSeverities = [
  { id: 'low', name: 'Low - General inquiry' },
  { id: 'medium', name: 'Medium - Needs resolution' },
  { id: 'high', name: 'High - Urgent matter' },
  { id: 'critical', name: 'Critical - Account compromised' }
]

// Demo component with proper export
function RoutingFormDemo() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = (formData) => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert('Form submitted! Data: ' + JSON.stringify(formData, null, 2))
    }, 2000)
  }
  
  return (
    <RoutingForm 
      banks={sampleBanks}
      categories={sampleCategories}
      severities={sampleSeverities}
      onSubmit={handleSubmit}
      disabled={loading}
    />
  )
}

export { RoutingForm, RoutingFormDemo }
export default RoutingForm