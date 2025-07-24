// Add this to your shared/components folder as Tabs.jsx

import React, { useState } from 'react'

export const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, setActiveTab })
        }
        if (child.type === TabsContent) {
          return React.cloneElement(child, { activeTab })
        }
        return child
      })}
    </div>
  )
}

export const TabsList = ({ children, className = '', activeTab, setActiveTab }) => {
  return (
    <div className={`flex space-x-1 rounded-lg bg-gray-800/50 p-1 ${className}`}>
      {React.Children.map(children, child => {
        return React.cloneElement(child, { activeTab, setActiveTab })
      })}
    </div>
  )
}

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => {
  const isActive = activeTab === value
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`
        flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all
        ${isActive 
          ? 'bg-gray-700 text-white shadow-sm' 
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }
      `}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, children, activeTab, className = '' }) => {
  if (activeTab !== value) return null
  
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  )
}