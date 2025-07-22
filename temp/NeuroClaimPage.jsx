// import React from 'react'
// import { Brain, Zap, Shield, BarChart3 } from 'lucide-react'
// import { DashboardLayout, PageHeader } from '@shared/layouts'
// import { Card, Alert } from '@shared/components'

// // Import the existing NeuroClaim demo component
// // In a real implementation, you would import your actual NeuroClaim component
// const NeuroClaimDemo = () => {
//   return (
//     <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8">
//       <div className="text-center mb-8">
//         <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
//           <Brain className="w-8 h-8 text-white" />
//         </div>
//         <h2 className="text-2xl font-bold text-gray-900 mb-2">NeuroClaim AI System</h2>
//         <p className="text-gray-600">
//           Your existing NeuroClaim component would be integrated here
//         </p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card className="p-6">
//           <div className="flex items-start gap-4">
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <Zap className="w-6 h-6 text-blue-600" />
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-900 mb-1">AI Processing</h3>
//               <p className="text-sm text-gray-600">
//                 Automatic claim analysis and data extraction
//               </p>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-6">
//           <div className="flex items-start gap-4">
//             <div className="p-2 bg-red-100 rounded-lg">
//               <Shield className="w-6 h-6 text-red-600" />
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-900 mb-1">Fraud Detection</h3>
//               <p className="text-sm text-gray-600">
//                 Advanced fraud risk assessment
//               </p>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-6">
//           <div className="flex items-start gap-4">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <BarChart3 className="w-6 h-6 text-green-600" />
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
//               <p className="text-sm text-gray-600">
//                 Real-time insights and reporting
//               </p>
//             </div>
//           </div>
//         </Card>
//       </div>
//     </div>
//   )
// }

// export const NeuroClaimPage = () => {
//   return (
//     <DashboardLayout>
//       <PageHeader
//         title="NeuroClaim AI"
//         description="AI-powered claim processing and fraud detection system"
//       />

//       <Alert type="info" title="Integration Note" className="mb-6">
//         This is where your existing NeuroClaim component from ClaimsProcessingDemo.jsx would be integrated.
//         The component has been designed to work seamlessly within the InsuraX platform.
//       </Alert>

//       {/* 
//         In production, replace this with:
//         import ClaimsProcessingDemo from '@features/neuroclaim/components/ClaimsProcessingDemo'
//         <ClaimsProcessingDemo />
//       */}
//       <NeuroClaimDemo />
//     </DashboardLayout>
//   )
// }

// export default NeuroClaimPage

import React from 'react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { Alert } from '@shared/components'
import ClaimsProcessingDemo from './components/ClaimsProcessingDemo'

export const NeuroClaimPage = () => {
  return (
    <DashboardLayout>
      <PageHeader
        title="NeuroClaim AI"
        description="AI-powered claim processing and fraud detection system"
      />
      
      {/* Optional: Add a welcome message or instructions */}
      <Alert 
        type="info" 
        title="AI-Powered Processing" 
        className="mb-6 bg-blue-900/20 border-blue-500/50 text-blue-400"
      >
        NeuroClaim uses advanced AI to automatically process insurance claims, detect fraud patterns, 
        and provide intelligent routing recommendations. Upload your claim documents to get started.
      </Alert>
      
      {/* Use the actual NeuroClaim component */}
      <ClaimsProcessingDemo />
    </DashboardLayout>
  )
}

export default NeuroClaimPage