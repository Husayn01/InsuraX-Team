import React from 'react'
import { 
  X, AlertCircle, CheckCircle, Info, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, Search
} from 'lucide-react'

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/25 focus:ring-cyan-500',
    secondary: 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-white focus:ring-gray-500',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/25 focus:ring-emerald-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-red-500/25 focus:ring-red-500',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-amber-500/25 focus:ring-amber-500',
    ghost: 'hover:bg-gray-800/50 text-gray-400 hover:text-white focus:ring-gray-500'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${!isDisabled && 'transform hover:scale-105'}`}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}

// Input Component
export const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  inputClassName = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        )}
        <input
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border ${
            error ? 'border-red-500' : 'border-gray-700'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500' : 'focus:ring-cyan-500'
          } focus:border-transparent transition-all duration-300 ${inputClassName}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Select Component
export const Select = ({ 
  label, 
  error, 
  options = [], 
  className = '', 
  selectClassName = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full px-4 py-3 pr-10 bg-gray-800/50 backdrop-blur-sm border ${
            error ? 'border-red-500' : 'border-gray-700'
          } rounded-lg text-white appearance-none focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500' : 'focus:ring-cyan-500'
          } focus:border-transparent transition-all duration-300 ${selectClassName}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Card Component
export const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div 
      className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl ${
        hover ? 'hover:shadow-xl transition-all duration-300' : ''
      } ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
}

export const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Alert Component
export const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  onClose, 
  className = '' 
}) => {
  const types = {
    info: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-500/50',
      icon: Info,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-400',
      textColor: 'text-blue-300'
    },
    success: {
      bg: 'bg-emerald-900/20',
      border: 'border-emerald-500/50',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-400',
      textColor: 'text-emerald-300'
    },
    warning: {
      bg: 'bg-amber-900/20',
      border: 'border-amber-500/50',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-400',
      textColor: 'text-amber-300'
    },
    error: {
      bg: 'bg-red-900/20',
      border: 'border-red-500/50',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      titleColor: 'text-red-400',
      textColor: 'text-red-300'
    }
  }
  
  const config = types[type]
  const Icon = config.icon
  
  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-300 focus:outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

// Badge Component
export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-700/50 text-gray-300 border-gray-600',
    primary: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full border backdrop-blur-sm ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        <div className={`relative bg-gray-800 rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden border border-gray-700 ${className}`}>
          {title && (
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// LoadingSpinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className={`${sizes[size]} rounded-full border-4 border-gray-700/50`}></div>
      <div className={`${sizes[size]} rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0`}></div>
      <div className={`w-[75%] h-[75%] rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animation-delay-150`}></div>
      <div className={`w-[50%] h-[50%] rounded-full border-4 border-pink-500 border-t-transparent animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animation-delay-300`}></div>
    </div>
  )
}

// EmptyState Component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="mx-auto w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-600" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  )
}

// SearchInput Component
export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
      />
    </div>
  )
}

// Tabs Component
export const Tabs = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex space-x-1 p-1 bg-gray-800/50 backdrop-blur-sm rounded-xl ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Export all components
export default {
  Button,
  Input,
  Select,
  Card,
  CardBody,
  Alert,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  SearchInput,
  Tabs
}