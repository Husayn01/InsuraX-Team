import React from 'react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { Alert } from '@shared/components'
import ClaimsProcessing from './components/ClaimsProcessing'

export const NeuroClaimPage = () => {
  return (
    <DashboardLayout>
      
      {/* Use the actual NeuroClaim component */}
      <ClaimsProcessing />
    </DashboardLayout>
  )
}

export default NeuroClaimPage