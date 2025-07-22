import React from 'react'

export const StatsCard = ({ title, value, icon: Icon, trend, trendValue, className = '' }) => {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className="p-3 bg-gray-700 rounded-lg">
            <Icon className="w-6 h-6 text-cyan-400" />
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? '↑' : '↓'}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-100 mt-1">{value}</p>
    </div>
  )
}