import React, { useState, useRef } from 'react'
import { 
  Eye, EyeOff, Calendar, Upload, X, Check, 
  AlertCircle, Info, FileText, Image, File,
  Plus, Minus, Search, ChevronDown
} from 'lucide-react'

// Enhanced Input Component
// Enhanced Input Component with consistent styling
export const FormInput = ({ 
  label, 
  error, 
  hint,
  icon: Icon, 
  type = 'text',
  required = false,
  className = '', 
  inputClassName = '',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-12' : 'pr-4'} py-3 bg-gray-800/50 backdrop-blur-sm border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-cyan-500'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300
          [-webkit-text-fill-color:theme(colors.white)]
          [&:-webkit-autofill]:bg-gray-800/50
          [&:-webkit-autofill]:[-webkit-text-fill-color:theme(colors.white)]
          [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(31_41_55_/_0.5)_inset]
          [&:-webkit-autofill]:border-gray-700
          [&:-webkit-autofill:hover]:border-gray-600
          [&:-webkit-autofill:focus]:border-transparent
          [&:-webkit-autofill:focus]:ring-2
          [&:-webkit-autofill:focus]:ring-cyan-500
          ${inputClassName}`}
          style={{
            colorScheme: 'dark'
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}
// TextArea Component
export const FormTextArea = ({ 
  label, 
  error, 
  hint,
  required = false,
  rows = 4,
  className = '', 
  textareaClassName = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-cyan-500'
        } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 resize-none ${textareaClassName}`}
        {...props}
      />
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Enhanced Select Component
export const FormSelect = ({ 
  label, 
  error, 
  hint,
  required = false,
  options = [], 
  icon: Icon,
  className = '', 
  selectClassName = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        )}
        <select
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 bg-gray-800/50 backdrop-blur-sm border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-cyan-500'
          } rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${selectClassName}`}
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
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Checkbox Component
export const FormCheckbox = ({ 
  label, 
  checked, 
  onChange, 
  error,
  className = '' 
}) => {
  return (
    <div className={className}>
      <label className="flex items-start cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-5 h-5 mt-0.5 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2 transition-all duration-300"
        />
        <span className="ml-3 text-gray-300 group-hover:text-white transition-colors">
          {label}
        </span>
      </label>
      {error && (
        <p className="mt-2 ml-8 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Radio Button Component
export const FormRadio = ({ 
  label, 
  name,
  value,
  checked, 
  onChange, 
  className = '' 
}) => {
  return (
    <label className={`flex items-center cursor-pointer group ${className}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 text-cyan-600 bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:ring-2"
      />
      <span className="ml-3 text-gray-300 group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  )
}

// Toggle Switch Component
export const FormToggle = ({ 
  label, 
  checked, 
  onChange, 
  className = '' 
}) => {
  return (
    <label className={`flex items-center justify-between cursor-pointer ${className}`}>
      <span className="text-gray-300">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${
          checked ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gray-700'
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
            checked ? 'translate-x-5' : ''
          }`} />
        </div>
      </div>
    </label>
  )
}

// File Upload Component
export const FormFileUpload = ({ 
  label, 
  accept, 
  multiple = false,
  maxSize = 10, // MB
  onFilesSelected,
  error,
  hint,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      const sizeValid = file.size <= maxSize * 1024 * 1024
      const typeValid = !accept || accept.split(',').some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type.match(type.trim())
      })
      return sizeValid && typeValid
    })

    const newFiles = multiple ? [...files, ...validFiles] : validFiles.slice(0, 1)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-500/10' 
            : error 
            ? 'border-red-500 bg-red-500/5'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300 font-medium mb-2">
          Drop files here or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          {accept ? `Accepts: ${accept}` : 'All file types'} • Max {maxSize}MB
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-gray-400">
                  {getFileIcon(file)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Date Picker Component
export const FormDatePicker = ({ 
  label, 
  name,  // Make sure name is destructured
  value, 
  onChange, 
  min,
  max,
  error,
  hint,
  required = false,
  className = '' 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        <input
          type="date"
          name={name}  // Add the name attribute here
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          className={`w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-cyan-500'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert`}
        />
      </div>
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Number Input Component
export const FormNumberInput = ({ 
  label, 
  name,  // Make sure name is destructured
  value, 
  onChange, 
  min,
  max,
  step = 1,
  showControls = true,
  prefix,
  suffix,
  error,
  hint,
  required = false,
  className = '',
  placeholder  // Add placeholder prop
}) => {
  const increment = () => {
    const newValue = parseFloat(value || 0) + step
    if (max === undefined || newValue <= max) {
      // Create a proper event object with name
      onChange({ 
        target: { 
          name: name, 
          value: newValue.toString() 
        } 
      })
    }
  }

  const decrement = () => {
    const newValue = parseFloat(value || 0) - step
    if (min === undefined || newValue >= min) {
      // Create a proper event object with name
      onChange({ 
        target: { 
          name: name, 
          value: newValue.toString() 
        } 
      })
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          name={name}  // Add the name attribute here
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}  // Add placeholder
          className={`w-full ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-16' : showControls ? 'pr-20' : 'pr-4'} py-3 bg-gray-800/50 backdrop-blur-sm border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-cyan-500'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {suffix && (
          <span className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500">
            {suffix}
          </span>
        )}
        {showControls && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
            <button
              type="button"
              onClick={increment}
              className="px-2 py-1 text-gray-400 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={decrement}
              className="px-2 py-1 text-gray-400 hover:text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4" />
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Search Input Component
export const FormSearchInput = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  onSearch,
  className = '' 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
      />
    </div>
  )
}

// Form Group Component for consistent spacing
export const FormGroup = ({ children, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}

// Form Section Component
export const FormSection = ({ title, description, children, className = '' }) => {
  return (
    <div className={`${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// Export all form components
export default {
  FormInput,
  FormTextArea,
  FormSelect,
  FormCheckbox,
  FormRadio,
  FormToggle,
  FormFileUpload,
  FormDatePicker,
  FormNumberInput,
  FormSearchInput,
  FormGroup,
  FormSection
}

export * from './FormComponents'