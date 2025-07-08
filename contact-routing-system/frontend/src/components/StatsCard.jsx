import { useState, useEffect } from 'react'
import { 
  FiBarChart2, 
  FiGlobe, 
  FiCreditCard, 
  FiBriefcase, 
  FiUsers, 
  FiTrendingUp, 
  FiTrendingDown 
} from 'react-icons/fi'

function StatsCard({ title, value, icon, color, trend, timeFrame, previousValue }) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)
  
  // Calculate percentage change if trend data is provided
  const percentChange = previousValue ? ((value - previousValue) / previousValue * 100).toFixed(1) : null
  const isPositiveTrend = percentChange > 0
  
  // Animate value counting up on mount
  useEffect(() => {
    setIsAnimated(true)
    
    const duration = 1500 // animation duration in ms
    const frameDuration = 16 // duration of one frame (60fps)
    const frames = duration / frameDuration
    const increment = value / frames
    
    let currentValue = 0
    let currentFrame = 0
    
    const timer = setInterval(() => {
      currentFrame++
      currentValue += increment
      
      if (currentFrame <= frames) {
        setDisplayValue(Math.floor(currentValue))
      } else {
        setDisplayValue(value)
        clearInterval(timer)
      }
    }, frameDuration)
    
    return () => clearInterval(timer)
  }, [value])
  
  const getIcon = () => {
    switch (icon) {
      case 'bank':
        return <FiBriefcase size={24} />
      case 'globe':
        return <FiGlobe size={24} />
      case 'ticket':
        return <FiCreditCard size={24} />
      case 'users':
        return <FiUsers size={24} />
      default:
        return <FiBarChart2 size={24} />
    }
  }
  
  const getColorClass = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'border-blue-200',
          light: 'text-blue-500',
          gradient: 'from-blue-500 to-blue-600'
        }
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          border: 'border-green-200',
          light: 'text-green-500',
          gradient: 'from-green-500 to-green-600'
        }
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          border: 'border-purple-200',
          light: 'text-purple-500',
          gradient: 'from-purple-500 to-purple-600'
        }
      case 'orange':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-600',
          border: 'border-orange-200',
          light: 'text-orange-500',
          gradient: 'from-orange-500 to-orange-600'
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          border: 'border-gray-200',
          light: 'text-gray-500',
          gradient: 'from-gray-500 to-gray-600'
        }
    }
  }
  
  const colorClasses = getColorClass()
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-3 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
            {getIcon()}
          </div>
          
          {trend && (
            <div className={`flex items-center text-sm font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveTrend ? (
                <FiTrendingUp className="mr-1" />
              ) : (
                <FiTrendingDown className="mr-1" />
              )}
              <span>{isPositiveTrend ? '+' : ''}{percentChange}%</span>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h3 className={`text-3xl font-bold ${isAnimated ? colorClasses.text : 'text-gray-300'} transition-colors duration-300`}>
            {displayValue.toLocaleString()}
          </h3>
          <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
          
          {timeFrame && (
            <p className="text-xs text-gray-400 mt-1">{timeFrame}</p>
          )}
        </div>
      </div>
      
      {/* Optional decorative element */}
      <div className="h-1 w-full bg-gradient-to-r opacity-90 rounded-b" 
           style={{ 
             background: `linear-gradient(to right, var(--tw-gradient-stops))`,
             '--tw-gradient-from': `var(--${color}-500, #6B7280)`,
             '--tw-gradient-to': `var(--${color}-600, #4B5563)`,
           }}></div>
    </div>
  )
}

export default StatsCard