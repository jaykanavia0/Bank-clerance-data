import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Share2, 
  Copy,
  Building2,
  TrendingUp,
  Shield,
  Star,
  Zap,
  Award,
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
  ExternalLink,
  Briefcase
} from 'lucide-react'

function ResultCard({ result }) {
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [activeTab, setActiveTab] = useState('contact')
  
  const getConfidenceConfig = (confidence) => {
    if (confidence < 50) return {
      bgColor: 'bg-red-500',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-red-600',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      shadowColor: 'shadow-red-500/20',
      icon: X,
      text: 'Needs Review',
      bgLight: 'bg-red-50',
      hoverBg: 'hover:bg-red-100',
      rating: 'Poor',
      color: 'red'
    }
    if (confidence < 75) return {
      bgColor: 'bg-amber-500',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      shadowColor: 'shadow-amber-500/20',
      icon: AlertTriangle,
      text: 'Good Match',
      bgLight: 'bg-amber-50',
      hoverBg: 'hover:bg-amber-100',
      rating: 'Good',
      color: 'amber'
    }
    return {
      bgColor: 'bg-emerald-500',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-500',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      shadowColor: 'shadow-emerald-500/20',
      icon: CheckCircle,
      text: 'Perfect Match',
      bgLight: 'bg-emerald-50',
      hoverBg: 'hover:bg-emerald-100',
      rating: 'Excellent',
      color: 'emerald'
    }
  }

  const confidenceConfig = getConfidenceConfig(result.confidence)
  const ConfidenceIcon = confidenceConfig.icon

  const copyContactInfo = () => {
    const contactInfo = `
Banking Contact Information
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Contact: ${result.contact_name}
🏢 Bank: ${result.bank}
📧 Email: ${result.contact_email}
📞 Phone: ${result.contact_phone}
🎯 Level: ${result.level_name.replace('_', ' ')}
📊 Confidence: ${result.confidence.toFixed(1)}%
⭐ Rating: ${confidenceConfig.rating}
━━━━━━━━━━━━━━━━━━━━━━━━
Generated via Banking Router
    `.trim()
    
    navigator.clipboard.writeText(contactInfo)
    setShowCopyNotification(true)
    
    setTimeout(() => {
      setShowCopyNotification(false)
    }, 3000)
  }

  const shareContact = () => {
    if (navigator.share) {
      navigator.share({
        title: `Banking Contact - ${result.bank}`,
        text: `Contact information for ${result.contact_name} at ${result.bank}`,
        url: window.location.href
      })
    }
  }

  const formatLevelName = (level) => {
    return level.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getLevelIcon = (level) => {
    const levelLower = level.toLowerCase()
    if (levelLower.includes('executive') || levelLower.includes('senior')) return Award
    if (levelLower.includes('manager') || levelLower.includes('lead')) return TrendingUp
    if (levelLower.includes('specialist') || levelLower.includes('analyst')) return Shield
    return User
  }

  const LevelIcon = getLevelIcon(result.level_name)

  const tabs = [
    { id: 'contact', label: 'Contact Info', icon: User },
    { id: 'details', label: 'Details', icon: Briefcase },
    { id: 'confidence', label: 'Analysis', icon: TrendingUp }
  ]

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className={`relative bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-300 ${isHovered ? 'shadow-xl' : ''}`}
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-20 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-full translate-y-12 -translate-x-12" />
        </div>

        {/* Header Content */}
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Bank Info */}
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${confidenceConfig.gradientFrom} ${confidenceConfig.gradientTo} shadow-lg transform transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                <Building2 size={28} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  {result.bank}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${confidenceConfig.bgLight} border ${confidenceConfig.borderColor}`}>
                    <LevelIcon size={16} className={confidenceConfig.textColor} />
                    <span className={`text-sm font-semibold ${confidenceConfig.textColor}`}>
                      {formatLevelName(result.level_name)}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200`}>
                    <Clock size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Available Now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button 
                onClick={copyContactInfo}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-gray-200 hover:border-blue-200"
                title="Copy contact information"
              >
                <Copy size={16} />
                <span className="text-sm font-medium hidden sm:inline">Copy</span>
              </button>
              <button 
                onClick={shareContact}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-gray-200 hover:border-purple-200"
                title="Share this contact"
              >
                <Share2 size={16} />
                <span className="text-sm font-medium hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-lg border-2 ${confidenceConfig.borderColor}`}>
            <ConfidenceIcon size={16} className={confidenceConfig.textColor} />
            <span className={`text-sm font-bold ${confidenceConfig.textColor}`}>
              {result.confidence.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-blue-50 text-blue-700 border-b-2 border-blue-600`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <TabIcon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {/* Contact Name */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:border-blue-200 transition-colors duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold mb-1">Contact Person</p>
                        <p className="text-lg font-bold text-gray-800">{result.contact_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{formatLevelName(result.level_name)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-300 text-sm">
                          <MessageCircle size={14} />
                          <span className="hidden sm:inline">Message</span>
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-300 text-sm">
                          <Calendar size={14} />
                          <span className="hidden sm:inline">Schedule</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 hover:border-emerald-200 transition-colors duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                      <Mail size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold mb-1">Email Address</p>
                      <a 
                        href={`mailto:${result.contact_email}`}
                        className="font-semibold text-gray-800 hover:text-emerald-700 transition-colors duration-300 break-all text-sm hover:underline"
                      >
                        {result.contact_email}
                      </a>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Shield size={12} />
                          <span>Verified</span>
                        </div>
                        <a 
                          href={`mailto:${result.contact_email}`}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <ExternalLink size={12} />
                          <span>Send Email</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:border-purple-200 transition-colors duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-600 uppercase tracking-wide font-semibold mb-1">Phone Number</p>
                      <a 
                        href={`tel:${result.contact_phone}`}
                        className="font-semibold text-gray-800 hover:text-purple-700 transition-colors duration-300 hover:underline"
                      >
                        {result.contact_phone}
                      </a>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          <span>Direct line</span>
                        </div>
                        <a 
                          href={`tel:${result.contact_phone}`}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          <ExternalLink size={12} />
                          <span>Call Now</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Bank Information */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  Bank Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Institution Name</p>
                    <p className="font-semibold text-gray-800">{result.bank}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="font-semibold text-gray-800">{formatLevelName(result.level_name)}</p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Contact Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Full Name</span>
                    <span className="font-semibold text-gray-800">{result.contact_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Position Level</span>
                    <span className="font-semibold text-gray-800">{formatLevelName(result.level_name)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Availability</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-green-700">Available Now</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-purple-600" />
                  Quick Actions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <Mail size={16} className="text-purple-600" />
                    <span className="font-medium text-gray-800">Send Email</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <Phone size={16} className="text-purple-600" />
                    <span className="font-medium text-gray-800">Make Call</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <Calendar size={16} className="text-purple-600" />
                    <span className="font-medium text-gray-800">Schedule Meeting</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <MessageCircle size={16} className="text-purple-600" />
                    <span className="font-medium text-gray-800">Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'confidence' && (
            <div className="space-y-6">
              {/* Confidence Meter */}
              <div className={`bg-gradient-to-r ${confidenceConfig.bgLight} rounded-xl p-6 border ${confidenceConfig.borderColor}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${confidenceConfig.gradientFrom} ${confidenceConfig.gradientTo} shadow-lg`}>
                      <Zap size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">Routing Confidence</h4>
                      <p className="text-sm text-gray-600">Match accuracy analysis</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white ${confidenceConfig.borderColor} border-2`}>
                    <ConfidenceIcon size={18} className={confidenceConfig.textColor} />
                    <span className={`font-bold ${confidenceConfig.textColor}`}>
                      {confidenceConfig.text}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-4 rounded-full bg-gradient-to-r ${confidenceConfig.gradientFrom} ${confidenceConfig.gradientTo} transition-all duration-1000 ease-out shadow-lg relative overflow-hidden`}
                      style={{ width: `${result.confidence}%` }}
                    >
                      <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <div className="absolute -top-10 right-0">
                    <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${confidenceConfig.gradientFrom} ${confidenceConfig.gradientTo} text-white font-bold shadow-lg`}>
                      {result.confidence.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Confidence Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star size={16} className="text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Match Quality</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{confidenceConfig.rating}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <TrendingUp size={16} className="text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Response Rate</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">95%</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Avg Response</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">2-4 hours</p>
                  </div>
                </div>
              </div>

              {/* Match Factors */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  Match Factors
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Issue Category Alignment</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Severity Level Match</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">88%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Authority Level</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Availability Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">95%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Copy Notification Toast */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
            <div className="flex-shrink-0">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="font-medium">Contact information copied!</p>
              <p className="text-sm text-gray-300">Ready to paste anywhere</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        @keyframes slide-in-right {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ResultCard