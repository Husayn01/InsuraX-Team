import React from 'react'
import { Loader2 } from 'lucide-react'

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
    secondary: 'bg-gray-700/50 text-gray-200 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg',
    ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-gray-800/50 focus:ring-gray-500',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const disabledStyles = disabled || loading ? 'opacity-60 cursor-not-allowed transform-none' : ''
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}

// Card Component
export const Card = ({ children, className = '', elevated = false, hoverable = false }) => {
  const elevatedStyles = elevated ? 'shadow-2xl' : 'shadow-lg'
  const hoverableStyles = hoverable ? 'hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer' : ''
  
  return (
    <div className={`bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl ${elevatedStyles} ${hoverableStyles} ${className}`}>
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-700 ${className}`}>
    {children}
  </div>
)

export const CardBody = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

// Input Component
export const Input = ({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  ...props 
}) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <input
        type={type}
        className={`w-full px-3 py-2 bg-gray-700/50 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 text-white placeholder-gray-400 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'
        }`}
        {...props}
      />
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// Select Component
export const Select = ({ 
  label, 
  error, 
  options = [], 
  className = '', 
  ...props 
}) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2 bg-gray-700/50 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 text-white ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// Badge Component
export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    success: 'bg-green-900/50 text-green-400 border border-green-500/50',
    warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50',
    error: 'bg-red-900/50 text-red-400 border border-red-500/50',
    info: 'bg-blue-900/50 text-blue-400 border border-blue-500/50',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Loading Spinner
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-cyan-400`} />
    </div>
  )
}

// Empty State
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      {action}
    </div>
  )
}

// Alert Component
export const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  className = '' 
}) => {
  const types = {
    info: 'bg-blue-900/20 border-blue-500/50 text-blue-400',
    success: 'bg-green-900/20 border-green-500/50 text-green-400',
    warning: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400',
    error: 'bg-red-900/20 border-red-500/50 text-red-400',
  }
  
  return (
    <div className={`border rounded-lg p-4 ${types[type]} ${className}`}>
      {title && <h4 className="font-medium mb-1">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  )
}

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div 
          className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className={`relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl ${sizes[size]} w-full animate-in`}>
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          </div>
          <div className="px-6 py-4 text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}