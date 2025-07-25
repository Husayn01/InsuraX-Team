import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { Button, Card, CardBody, Alert, Badge, LoadingSpinner } from '@shared/components'
import { 
  FormInput, FormTextArea, FormSelect, FormFileUpload, 
  FormDatePicker, FormNumberInput, FormGroup, FormSection 
} from '@shared/components/FormComponents'
import { 
  Upload, FileText, X, Image, File, Plus, AlertCircle, 
  Calendar, MapPin, DollarSign, Shield, Brain, Sparkles,
  Car, Heart, Home, Briefcase, ChevronRight, CheckCircle,
  Info, Clock, ArrowRight, Loader2, Zap
} from 'lucide-react'
import { supabaseHelpers } from '@services/supabase'
import { claimsSystem } from '@features/neuroclaim/services/claimsOrchestrator'

export const NewClaim = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processingStatus, setProcessingStatus] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState({
    claimType: '',
    incidentDate: '',
    incidentLocation: '',
    damageDescription: '',
    estimatedAmount: ''
  })

  const claimTypeOptions = [
    { value: '', label: 'Select claim type' },
    { value: 'auto', label: 'Auto Insurance', icon: Car },
    { value: 'health', label: 'Health Insurance', icon: Heart },
    { value: 'property', label: 'Property Insurance', icon: Home },
    { value: 'life', label: 'Life Insurance', icon: Shield },
    { value: 'other', label: 'Other', icon: Briefcase }
  ]

  // Claim type cards for better UX
  const ClaimTypeCard = ({ type, icon: Icon, label, selected, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        selected 
          ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/25' 
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
      }`}
    >
      <Icon className={`w-8 h-8 mx-auto mb-2 ${selected ? 'text-cyan-400' : 'text-gray-400'}`} />
      <p className={`text-sm font-medium ${selected ? 'text-cyan-400' : 'text-gray-300'}`}>
        {label}
      </p>
    </button>
  )

  const steps = [
    { number: 1, title: 'Claim Type', icon: FileText },
    { number: 2, title: 'Details', icon: Info },
    { number: 3, title: 'Documents', icon: Upload }
  ]

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.number
        const isCompleted = currentStep > step.number
        
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25' 
                  : isCompleted 
                  ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                  : 'bg-gray-800/50 border-2 border-gray-700'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
              <p className={`text-xs mt-2 ${
                isActive ? 'text-cyan-400 font-medium' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                currentStep > step.number ? 'bg-emerald-500' : 'bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (files) => {
    setUploadedFiles(files)
  }

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.claimType) {
          setError('Please select a claim type')
          return false
        }
        break
      case 2:
        if (!formData.incidentDate || !formData.damageDescription) {
          setError('Please fill in all required fields')
          return false
        }
        break
    }
    setError('')
    return true
  }

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    
    setError('')
    setLoading(true)
    setProcessingStatus('Validating claim information...')

    try {
      // Upload files to Supabase storage
      setProcessingStatus('Uploading documents...')
      const fileUrls = []
      for (const file of uploadedFiles) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { data, error } = await supabaseHelpers.uploadFile('claim-documents', fileName, file)
        
        if (error) throw error
        
        const url = supabaseHelpers.getFileUrl('claim-documents', fileName)
        fileUrls.push(url)
      }

      // Create initial claim data
      const claimData = {
        customer_id: user.id,
        status: 'submitted',
        claim_data: {
          claimType: formData.claimType,
          incidentDate: formData.incidentDate,
          damageDescription: formData.damageDescription,
          estimatedAmount: parseFloat(formData.estimatedAmount) || 0,
          incidentLocation: formData.incidentLocation,
          claimNumber: `CLM-${Date.now()}`,
          aiProcessingStatus: 'pending'
        },
        documents: fileUrls,
        created_at: new Date().toISOString()
      }

      // Submit claim to database
      setProcessingStatus('Creating claim record...')
      const { data: createdClaim, error: claimError } = await supabaseHelpers.createClaim(claimData)
      
      if (claimError) throw claimError

      // Create notification for claim submission
      await supabaseHelpers.createClaimNotification(
        user.id,
        createdClaim.id,
        'claim_update',
        'Claim Submitted Successfully',
        `Your claim ${createdClaim.claim_data.claimNumber} has been submitted and is being processed by our AI system.`,
        { status: 'submitted' }
      )

      // Process with NeuroClaim AI if files were uploaded
      if (uploadedFiles.length > 0) {
        setProcessingStatus('Processing with NeuroClaim AI...')
        
        try {
          const aiResult = await claimsSystem.processClaimRequest({
            claimData: {
              ...formData,
              claimNumber: createdClaim.claim_data.claimNumber
            },
            documents: uploadedFiles
          })

          if (aiResult && aiResult.success) {
            // Update claim with AI results
            const updatedClaimData = {
              claim_data: {
                ...createdClaim.claim_data,
                aiProcessingStatus: 'completed',
                aiAnalysis: aiResult
              },
              status: aiResult.fraudAssessment?.riskLevel === 'high' ? 'flagged' : 'processing'
            }

            await supabaseHelpers.updateClaim(createdClaim.id, updatedClaimData)

            // Create notification for AI processing completion
            await supabaseHelpers.createClaimNotification(
              user.id,
              createdClaim.id,
              'claim_update',
              'AI Analysis Complete',
              `Your claim has been analyzed by our AI system. Risk level: ${aiResult.fraudAssessment.riskLevel}`,
              { 
                status: 'ai_processed',
                riskLevel: aiResult.fraudAssessment.riskLevel 
              }
            )
          }
        } catch (aiError) {
          console.error('AI processing error:', aiError)
          // Update claim to indicate AI processing failed but claim is still submitted
          await supabaseHelpers.updateClaim(createdClaim.id, {
            claim_data: {
              ...createdClaim.claim_data,
              aiProcessingStatus: 'failed',
              aiError: aiError.message
            }
          })
        }
      }

      setSuccess(true)
      setProcessingStatus('')
      setTimeout(() => {
        navigate('/customer/claims')
      }, 2000)

    } catch (err) {
      console.error('Error submitting claim:', err)
      setError(err.message || 'Failed to submit claim')
      setProcessingStatus('')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Select Claim Type
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Choose the type of insurance claim you want to file
              </p>
            </div>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {claimTypeOptions.slice(1, -1).map((option) => (
                  <ClaimTypeCard
                    key={option.value}
                    type={option.value}
                    icon={option.icon}
                    label={option.label}
                    selected={formData.claimType === option.value}
                    onClick={() => setFormData({ ...formData, claimType: option.value })}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        )
        
      case 2:
        return (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                Claim Details
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Provide information about your claim
              </p>
            </div>
            <CardBody>
              <FormGroup>
                <FormDatePicker
                  label="Date of Incident"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  hint="When did the incident occur?"
                />

                <FormInput
                  label="Location of Incident"
                  icon={MapPin}
                  name="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={handleChange}
                  placeholder="e.g., Third Mainland Bridge, Lagos"
                  hint="Where did the incident happen?"
                />

                <FormTextArea
                  label="Description of Damage/Loss"
                  name="damageDescription"
                  value={formData.damageDescription}
                  onChange={handleChange}
                  placeholder="Please describe what happened in detail..."
                  rows={5}
                  required
                  hint="The more details you provide, the faster we can process your claim"
                />

                <FormNumberInput
                  label="Estimated Amount"
                  name="estimatedAmount"
                  value={formData.estimatedAmount}
                  onChange={handleChange}
                  min={0}
                  prefix="₦"
                  placeholder="0.00"
                  hint="Approximate value of the claim"
                />
              </FormGroup>
            </CardBody>
          </Card>
        )
        
      case 3:
        return (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Supporting Documents
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Upload photos, receipts, or other documents
              </p>
            </div>
            <CardBody>
              {/* AI Processing Notice */}
              <Alert type="info" className="mb-6">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">AI-Powered Processing</p>
                    <p className="text-sm">
                      Upload your documents and our NeuroClaim AI will automatically analyze them for faster processing.
                    </p>
                  </div>
                </div>
              </Alert>

              <FormFileUpload
                label="Upload Documents"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                maxSize={10}
                onFilesSelected={handleFileUpload}
                hint="Images, PDFs, Word documents (max 10MB each)"
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-cyan-400 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <p className="font-medium">Documents ready for AI processing</p>
                  </div>
                  <p className="text-sm text-cyan-300">
                    {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} will be analyzed by NeuroClaim AI
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )
    }
  }

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Submit New Claim
          </span>
        }
        description="File a new insurance claim with AI-powered processing"
        actions={
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/claims')}
            className="hover:bg-gray-700"
          >
            Cancel
          </Button>
        }
      />

      {success && (
        <Alert type="success" title="Claim submitted successfully!" className="mb-6 bg-emerald-900/20 border-emerald-500/50">
          Your claim has been submitted and is being processed by our AI system.
        </Alert>
      )}

      {error && (
        <Alert type="error" title="Error" className="mb-6 bg-red-900/20 border-red-500/50">
          {error}
        </Alert>
      )}

      {/* Progress Steps */}
      <StepIndicator />

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={currentStep === 1 ? 'invisible' : ''}
          >
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 group"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading || uploadedFiles.length === 0}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {processingStatus || 'Submitting...'}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Submit Claim
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Processing Status Modal */}
      {loading && processingStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
            <div className="text-center">
              <div className="relative inline-flex mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-gray-700/50"></div>
                <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0"></div>
                <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin absolute inset-2 animation-delay-150"></div>
                <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin absolute inset-4 animation-delay-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Processing Your Claim</h3>
              <p className="text-gray-400">{processingStatus}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default NewClaim