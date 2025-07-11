import React from 'react'

export const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-100">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          )}
        </div>
        {actions && (
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}