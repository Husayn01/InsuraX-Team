import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Upload, ChevronRight, ChevronLeft, 
  User, Phone, Mail, MapPin, Calendar, DollarSign,
  AlertCircle, CheckCircle, X, Loader2, FileImage,
  Car, Heart, Home, Shield, File, Trash2, Eye,
  Brain, Sparkles, Info, RefreshCw, CheckSquare,
  AlertTriangle, Zap, FileCheck
} from 'lucide-react'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Alert, Badge, 
  LoadingSpinner, Modal
} from '@shared/components'
import { FormInput, FormTextArea, FormSelect, FormGroup } from '@shared/components/FormComponents'
import { NairaIcon } from '@shared/components'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers, supabase } from '@services/supabase'
import { ClaimsProcessingSystem } from '@features/neuroclaim/services/claimsOrchestrator'
import { documentUploadService } from '@services/documentUpload'

export const NewClaim = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [showAIPreview, setShowAIPreview] = useState(false)
  const [aiPreviewResult, setAiPreviewResult] = useState(null)
  const [isRunningPreview, setIsRunningPreview] = useState(false)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const generateClaimNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.random().toString(36).substr(2, 6).toUpperCase()
    return `CLM-${year}${month}${day}-${random}`
  }
  
  const [formData, setFormData] = useState({
    claimType: '',
    description: '',
    dateOfIncident: '',
    location: '',
    estimatedAmount: '',
    // Personal info
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: ''
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [fieldsConfirmed, setFieldsConfirmed] = useState({})

  // Initialize the claims processing system
  const claimsSystem = new ClaimsProcessingSystem()

  const steps = [
    { number: 1, title: 'Upload Documents', icon: Upload },
    { number: 2, title: 'Review Information', icon: FileCheck },
    { number: 3, title: 'AI Pre-Review', icon: Brain },
    { number: 4, title: 'Submit Claim', icon: CheckSquare }
  ]

  const claimTypes = [
    { value: 'auto', label: 'Auto Insurance', icon: Car, description: 'Vehicle accidents, theft, damage' },
    { value: 'health', label: 'Health Insurance', icon: Heart, description: 'Medical expenses, procedures' },
    { value: 'property', label: 'Property Insurance', icon: Home, description: 'Home damage, theft, disasters' },
    { value: 'general', label: 'General Insurance', icon: Shield, description: 'Other insurance claims' }
  ]

  // Extract information from uploaded documents
  const extractInformationFromDocuments = async () => {
    if (uploadedDocuments.length === 0) return

    setIsExtracting(true)
    setError(null)

    try {
      // Combine all document text
      const documentTexts = []
      
      for (const doc of uploadedDocuments) {
        if (doc.text) {
          documentTexts.push(doc.text)
        } else {
          // Try to extract text from file
          try {
            const text = await claimsSystem.extractTextFromFile(doc.file)
            documentTexts.push(text)
          } catch (err) {
            console.warn(`Could not extract text from ${doc.name}:`, err)
          }
        }
      }

      if (documentTexts.length === 0) {
        setError('Could not extract text from documents. Please fill in the information manually.')
        return
      }

      const combinedText = documentTexts.join('\n\n---\n\n')
      
      // Use the claims system to extract information
      const extractionResult = await claimsSystem.documentProcessor.extractClaimInformation(combinedText)
      
      if (extractionResult.success && extractionResult.claimData) {
        const extracted = extractionResult.claimData
        setExtractedData(extracted)
        
        // Pre-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          claimType: extracted.claimType || prev.claimType || '',
          description: extracted.incidentDescription || prev.description || '',
          dateOfIncident: extracted.incidentDate ? formatDateForInput(extracted.incidentDate) : prev.dateOfIncident || '',
          location: extracted.incidentLocation || prev.location || '',
          estimatedAmount: extracted.claimAmount?.toString() || prev.estimatedAmount || '',
          fullName: extracted.claimantName || prev.fullName || '',
          phone: extracted.contactPhone || prev.phone || '',
          address: extracted.claimantAddress || prev.address || ''
        }))

        // Mark extracted fields as unconfirmed
        const unconfirmedFields = {}
        Object.keys(extracted).forEach(key => {
          unconfirmedFields[key] = false
        })
        setFieldsConfirmed(unconfirmedFields)

        // Move to review step
        setCurrentStep(2)
      } else {
        setError('Could not extract claim information. Please fill in the details manually.')
        // Still move to review step so user can fill manually
        setCurrentStep(2)
      }
    } catch (err) {
      console.error('Extraction error:', err)
      setError('Error processing documents. Please fill in the information manually.')
      setCurrentStep(2)
    } finally {
      setIsExtracting(false)
    }
  }

  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Mark field as confirmed when user edits it
    setFieldsConfirmed(prev => ({
      ...prev,
      [name]: true
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateStep = (step) => {
    const errors = {}

    switch (step) {
      case 1:
        if (uploadedDocuments.length === 0) {
          errors.documents = 'Please upload at least one supporting document'
        }
        break
      case 2:
        if (!formData.claimType) errors.claimType = 'Please select a claim type'
        if (!formData.description) errors.description = 'Please describe the incident'
        if (!formData.dateOfIncident) errors.dateOfIncident = 'Please select the date of incident'
        if (!formData.location) errors.location = 'Please provide the location'
        if (!formData.estimatedAmount) errors.estimatedAmount = 'Please provide an estimated amount'
        else if (isNaN(formData.estimatedAmount)) errors.estimatedAmount = 'Amount must be a number'
        if (!formData.fullName) errors.fullName = 'Full name is required'
        if (!formData.email) errors.email = 'Email is required'
        if (!formData.phone) errors.phone = 'Phone number is required'
        if (!formData.address) errors.address = 'Address is required'
        break
      case 3:
        // AI preview is optional
        break
      case 4:
        // Final confirmation
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleStepChange = async (newStep) => {
    // Validate current step before moving forward
    if (newStep > currentStep) {
      if (!validateStep(currentStep)) {
        setError('Please complete all required fields')
        return
      }
      
      // If moving from step 1 to 2, extract information
      if (currentStep === 1 && newStep === 2) {
        await extractInformationFromDocuments()
        return // extractInformationFromDocuments will set the step
      }
    }
    
    setError(null)
    setCurrentStep(newStep)
  }

  // File handling functions
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    await processFiles(files)
    e.target.value = '' // Clear input
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    await processFiles(files)
  }

  const processFiles = async (files) => {
    setError(null)
    setFileErrors([])

    // Check files limit
    if (uploadedDocuments.length + files.length > documentUploadService.MAX_FILES_PER_CLAIM) {
      setError(`Maximum ${documentUploadService.MAX_FILES_PER_CLAIM} files allowed per claim`)
      return
    }

    const validFiles = []
    const errors = []

    for (const file of files) {
      try {
        await documentUploadService.validateFile(file)
        
        let preview = null
        if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
          try {
            preview = URL.createObjectURL(file)
          } catch (err) {
            console.warn('Could not create preview')
          }
        }
        
        validFiles.push({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          text: null // Will be populated during extraction
        })
      } catch (err) {
        errors.push({
          fileName: file.name,
          error: err.message
        })
      }
    }

    if (validFiles.length > 0) {
      setUploadedDocuments(prev => [...prev, ...validFiles])
    }

    if (errors.length > 0) {
      setFileErrors(errors)
    }
  }

  const removeDocument = (index) => {
    const doc = uploadedDocuments[index]
    
    if (doc.preview) {
      URL.revokeObjectURL(doc.preview)
    }
    
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index))
    
    // Reset to step 1 if no documents left
    if (uploadedDocuments.length === 1) {
      setCurrentStep(1)
      setExtractedData(null)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      
      if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
        setDragActive(false)
      }
    }
  }

  // AI Pre-Review
  const runAIPreReview = async () => {
    setIsRunningPreview(true)
    setAiPreviewResult(null)
    
    try {
      const claimText = `
        Claim Type: ${formData.claimType}
        Date: ${formData.dateOfIncident}
        Location: ${formData.location}
        Amount: $${formData.estimatedAmount}
        Description: ${formData.description}
      `
      
      const result = await claimsSystem.processClaimComplete(claimText, {
        generateCustomerResponse: true,
        customerFriendly: true
      })
      
      if (result.success) {
        setAiPreviewResult(result)
      } else {
        throw new Error(result.error || 'AI preview failed')
      }
    } catch (err) {
      console.error('AI preview error:', err)
      setError('Could not complete AI preview. You can still submit your claim.')
    } finally {
      setIsRunningPreview(false)
    }
  }

  // Final submission with updated error handling and fallbacks
  const handleSubmit = async () => {
    console.log('Submit clicked, validating...')
    
    // Ensure we have data to submit
    let dataToSubmit = { ...formData }
    if (!dataToSubmit.claimType && extractedData) {
      dataToSubmit = {
        claimType: extractedData.claimType || '',
        description: extractedData.incidentDescription || '',
        dateOfIncident: extractedData.dateOfIncident || '',
        location: extractedData.incidentLocation || '',
        estimatedAmount: extractedData.estimatedAmount || extractedData.claimAmount || '',
        fullName: extractedData.claimantName || formData.fullName || '',
        email: extractedData.contactEmail || formData.email || '',
        phone: extractedData.contactPhone || formData.phone || '',
        address: extractedData.claimantAddress || formData.address || ''
      }
    }
    
    // Validate
    const errors = {}
    if (!dataToSubmit.claimType) errors.claimType = 'Claim type is required'
    if (!dataToSubmit.description) errors.description = 'Description is required'
    if (!dataToSubmit.dateOfIncident) errors.dateOfIncident = 'Date is required'
    if (!dataToSubmit.location) errors.location = 'Location is required'
    if (!dataToSubmit.estimatedAmount || isNaN(parseFloat(dataToSubmit.estimatedAmount))) {
      errors.estimatedAmount = 'Valid amount is required'
    }
    if (!dataToSubmit.fullName) errors.fullName = 'Full name is required'
    if (!dataToSubmit.email) errors.email = 'Email is required'
    if (!dataToSubmit.phone) errors.phone = 'Phone number is required'
    if (!dataToSubmit.address) errors.address = 'Address is required'
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors)
      setValidationErrors(errors)
      setError('Please complete all required fields')
      return
    }
    
    console.log('Validation passed, submitting...')
    setLoading(true)
    setError(null)
    
    try {
      // Generate claim number
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      console.log('Generated claim number:', claimNumber)
      
      // Create claim payload
      const claimPayload = {
        customer_id: user.id,
        status: 'submitted',
        claim_data: {
          claimNumber,
          claimType: dataToSubmit.claimType,
          dateOfIncident: dataToSubmit.dateOfIncident,
          incidentLocation: dataToSubmit.location,
          incidentDescription: dataToSubmit.description,
          estimatedAmount: parseFloat(dataToSubmit.estimatedAmount),
          claimantName: dataToSubmit.fullName,
          claimantAddress: dataToSubmit.address,
          contactPhone: dataToSubmit.phone,
          contactEmail: dataToSubmit.email,
          policyNumber: dataToSubmit.policyNumber || null,
          // Include AI results if available
          ...(aiPreviewResult && {
            fraudRiskLevel: aiPreviewResult.fraudAssessment?.riskLevel,
            fraudRiskScore: aiPreviewResult.fraudAssessment?.riskScore,
            categorization: aiPreviewResult.categorization,
            aiAnalyzed: true,
            aiAnalyzedAt: new Date().toISOString()
          })
        }
      }
      
      console.log('Creating claim with payload:', claimPayload)
      
      let result
      let createdClaimId
      
      // Method 1: Try the transactional method first
      try {
        if (uploadedDocuments.length > 0) {
          console.log(`Uploading ${uploadedDocuments.length} documents...`)
          result = await supabaseHelpers.createClaimWithDocuments(
            claimPayload,
            uploadedDocuments.map(doc => doc.file),
            user.id
          )
        } else {
          console.log('Creating claim without documents...')
          const { data, error } = await supabaseHelpers.createClaim(claimPayload)
          result = { success: !error, claim: data, error }
        }
        
        if (result.success) {
          createdClaimId = result.claim.id
        }
      } catch (methodError) {
        console.error('Primary submission method failed:', methodError)
        
        // Method 2: Direct Supabase call as fallback
        console.log('Trying direct Supabase insertion...')
        try {
          const { data: directClaim, error: directError } = await supabase
            .from('claims')
            .insert([{
              ...claimPayload,
              documents: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single()
          
          if (directError) {
            console.error('Direct insertion failed:', directError)
            throw directError
          }
          
          console.log('Direct insertion successful:', directClaim)
          result = { success: true, claim: directClaim }
          createdClaimId = directClaim.id
          
          // Upload documents separately if they exist
          if (directClaim && uploadedDocuments.length > 0) {
            console.log('Uploading documents separately...')
            try {
              const uploadPromises = uploadedDocuments.map(async (doc, index) => {
                try {
                  const uploadResult = await documentUploadService.uploadFile(
                    doc.file,
                    directClaim.id,
                    user.id
                  )
                  return uploadResult
                } catch (uploadErr) {
                  console.error(`Failed to upload document ${index + 1}:`, uploadErr)
                  return null
                }
              })
              
              const uploadResults = await Promise.allSettled(uploadPromises)
              const successfulUploads = uploadResults
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => r.value)
              
              if (successfulUploads.length > 0) {
                // Update claim with successful uploads
                await supabase
                  .from('claims')
                  .update({
                    documents: successfulUploads.map(u => u.url),
                    claim_data: {
                      ...directClaim.claim_data,
                      documents: successfulUploads
                    },
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', directClaim.id)
              }
            } catch (uploadError) {
              console.error('Document upload failed:', uploadError)
              // Don't fail the entire submission if just documents failed
            }
          }
        } catch (directError) {
          throw new Error('All submission methods failed. Please try again.')
        }
      }
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to submit claim')
      }
      
      console.log('Claim created successfully:', result.claim)
      
      // Create notification
      try {
        await supabaseHelpers.createNotification({
          user_id: user.id,
          type: 'claim_submitted',
          title: 'Claim Submitted Successfully',
          message: `Your claim ${claimNumber} has been submitted and is being reviewed.`,
          color: 'green',
          icon: 'check-circle',
          data: {
            claimId: createdClaimId,
            claimNumber: claimNumber
          }
        })
      } catch (notifError) {
        console.error('Failed to create notification:', notifError)
        // Don't fail the submission if notification fails
      }
      
      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/customer/claims')
      }, 2000)
      
    } catch (err) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return FileImage
    return File
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      uploadedDocuments.forEach(doc => {
        if (doc.preview) {
          try {
            URL.revokeObjectURL(doc.preview)
          } catch (err) {
            console.warn('Cleanup error:', err)
          }
        }
      })
    }
  }, [])

  return (
    <DashboardLayout>
      <PageHeader 
        title="New Claim"
        description="Submit a new insurance claim"
      />

      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div 
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${currentStep >= step.number 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                    }
                    ${currentStep === step.number ? 'ring-2 ring-cyan-300' : ''}
                    transition-all duration-200
                  `}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      w-full h-1 mx-2
                      ${currentStep > step.number 
                        ? 'bg-cyan-500' 
                        : 'bg-gray-700'
                      }
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span 
                key={step.number}
                className={`
                  text-sm font-medium
                  ${currentStep >= step.number 
                    ? 'text-cyan-400' 
                    : 'text-gray-500'
                  }
                `}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="w-4 h-4" />
            Claim submitted successfully! Redirecting...
          </Alert>
        )}

        {/* Step 1: Document Upload */}
        {currentStep === 1 && (
          <Card>
            <CardBody className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Upload Claim Documents</h3>
                <p className="text-gray-400">
                  Start by uploading your claim documents. We'll extract information to help fill out your claim form.
                </p>
              </div>

              {/* Document Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative rounded-lg transition-all duration-200 mb-6
                  ${dragActive ? 'scale-[1.02]' : ''}
                `}
              >
                <label 
                  htmlFor="file-upload"
                  className={`
                    block w-full p-12 border-2 border-dashed rounded-lg text-center cursor-pointer
                    transition-all duration-200
                    ${dragActive
                      ? 'border-cyan-400 bg-cyan-500/20' 
                      : uploadedDocuments.length > 0 
                        ? 'border-cyan-500 bg-cyan-500/10' 
                        : 'border-gray-700 hover:border-cyan-500 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${
                    dragActive ? 'text-cyan-400 animate-bounce' : 
                    uploadedDocuments.length > 0 ? 'text-cyan-400' : 'text-gray-400'
                  }`} />
                  <p className="text-xl font-medium text-white mb-2">
                    {dragActive
                      ? 'Drop files here...'
                      : uploadedDocuments.length > 0 
                        ? 'Add more documents'
                        : 'Upload your claim documents'
                    }
                  </p>
                  <p className="text-gray-400 mb-4">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('file-upload').click()
                    }}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Select Files
                  </Button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported: PDF, Images, Word documents (max {documentUploadService.MAX_FILE_SIZE / (1024 * 1024)}MB each)
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept={Object.keys(documentUploadService.ALLOWED_FILE_TYPES).join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading || isExtracting}
                  />
                </label>
                
                {/* Drag overlay */}
                {dragActive && (
                  <div className="absolute inset-0 rounded-lg bg-cyan-500/10 pointer-events-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="w-20 h-20 mx-auto mb-2 text-cyan-400 animate-bounce" />
                        <p className="text-xl font-medium text-white">Drop files here</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Errors */}
              {fileErrors.length > 0 && (
                <Alert variant="error" className="mb-6">
                  <AlertCircle className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Some files could not be added:</p>
                    <ul className="list-disc list-inside mt-1">
                      {fileErrors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error.fileName}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Uploaded Documents */}
              {uploadedDocuments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-400">
                    Uploaded documents ({uploadedDocuments.length}/{documentUploadService.MAX_FILES_PER_CLAIM})
                  </h4>
                  {uploadedDocuments.map((doc, index) => {
                    const FileIcon = getFileIcon(doc.type)
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        {doc.preview ? (
                          <div className="relative w-12 h-12">
                            <img 
                              src={doc.preview} 
                              alt={doc.name}
                              className="w-full h-full rounded object-cover"
                            />
                          </div>
                        ) : (
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                        <Badge variant="success" size="sm">
                          <FileCheck className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          disabled={loading || isExtracting}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Continue Button */}
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => handleStepChange(2)}
                  disabled={uploadedDocuments.length === 0 || isExtracting}
                  size="lg"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Extracting Information...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step 2: Review Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Extraction Status */}
            {extractedData && (
              <Alert variant="success" className="mb-6">
                <Sparkles className="w-4 h-4" />
                <div>
                  <p className="font-medium">Information extracted from documents!</p>
                  <p className="text-sm mt-1">Please review and complete any missing information below.</p>
                </div>
              </Alert>
            )}

            {/* Claim Type */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">Claim Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {claimTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => handleInputChange({ 
                        target: { name: 'claimType', value: type.value } 
                      })}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.claimType === type.value
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <type.icon className={`
                          w-8 h-8
                          ${formData.claimType === type.value
                            ? 'text-cyan-400'
                            : 'text-gray-400'
                          }
                        `} />
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {type.label}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {type.description}
                          </p>
                        </div>
                        {formData.claimType === type.value && (
                          <CheckCircle className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {validationErrors.claimType && (
                  <p className="text-red-400 text-sm mt-2">
                    {validationErrors.claimType}
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Incident Details */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">Incident Details</h3>
                <div className="space-y-4">
                  <FormTextArea
                    label="Description of Incident"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Please provide a detailed description of what happened..."
                    rows={4}
                    error={validationErrors.description}
                    required
                    hint={extractedData?.incidentDescription ? "Extracted from your documents" : null}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Date of Incident"
                      name="dateOfIncident"
                      type="date"
                      value={formData.dateOfIncident}
                      onChange={handleInputChange}
                      icon={Calendar}
                      error={validationErrors.dateOfIncident}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      hint={extractedData?.incidentDate ? "Extracted from your documents" : null}
                    />

                    <FormInput
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Where did this occur?"
                      icon={MapPin}
                      error={validationErrors.location}
                      required
                      hint={extractedData?.incidentLocation ? "Extracted from your documents" : null}
                    />
                  </div>

                  <FormInput
                    label="Estimated Amount (₦)"
                    name="estimatedAmount"
                    type="number"
                    value={formData.estimatedAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    icon={NairaIcon}
                    error={validationErrors.estimatedAmount}
                    required
                    min="0"
                    step="0.01"
                    hint={extractedData?.claimAmount ? "Extracted from your documents" : null}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <FormInput
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    icon={User}
                    error={validationErrors.fullName}
                    required
                    hint={extractedData?.claimantName ? "Extracted from your documents" : null}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      icon={Mail}
                      error={validationErrors.email}
                      required
                    />

                    <FormInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                      icon={Phone}
                      error={validationErrors.phone}
                      required
                      hint={extractedData?.contactPhone ? "Extracted from your documents" : null}
                    />
                  </div>

                  <FormTextArea
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full address"
                    rows={2}
                    error={validationErrors.address}
                    required
                    hint={extractedData?.claimantAddress ? "Extracted from your documents" : null}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep(1)}
                disabled={loading}
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>

              <Button
                onClick={() => handleStepChange(3)}
                disabled={loading}
                size="lg"
              >
                Continue to AI Preview
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: AI Pre-Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardBody className="p-8 text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-6">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4">AI Pre-Review (Optional)</h3>
                  
                  <p className="text-gray-400 mb-6">
                    Get an instant AI analysis of your claim before submission. This can help identify any potential issues or missing information.
                  </p>

                  {/* Disclaimer */}
                  <Alert variant="info" className="mb-6 text-left">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Important Notice:</p>
                      <p>
                        This AI pre-review is for informational purposes only. It does not represent a final decision. 
                        All claims will still undergo manual review by an authorized insurer representative before final approval or rejection.
                      </p>
                    </div>
                  </Alert>

                  {!aiPreviewResult && !isRunningPreview && (
                    <div className="space-y-4">
                      <Button
                        onClick={runAIPreReview}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Run AI Pre-Review
                      </Button>
                      
                      <div className="text-sm text-gray-500">
                        or
                      </div>
                      
                      <button
                        onClick={() => handleStepChange(4)}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Skip and proceed to submission
                      </button>
                    </div>
                  )}

                  {isRunningPreview && (
                    <div className="py-8">
                      <div className="relative inline-flex">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-700/50"></div>
                        <div className="w-20 h-20 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin absolute inset-0"></div>
                      </div>
                      <p className="mt-4 text-gray-400">Analyzing your claim...</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* AI Preview Results */}
            {aiPreviewResult && (
              <Card className="border-cyan-500/30">
                <CardBody className="p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    AI Analysis Results
                  </h4>

                  {/* Risk Assessment */}
                  {aiPreviewResult.fraudAssessment && (
                    <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                      <h5 className="font-medium mb-2">Risk Assessment</h5>
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={
                            aiPreviewResult.fraudAssessment.riskLevel === 'low' ? 'success' :
                            aiPreviewResult.fraudAssessment.riskLevel === 'medium' ? 'warning' : 'danger'
                          }
                        >
                          {aiPreviewResult.fraudAssessment.riskLevel} Risk
                        </Badge>
                        <span className="text-sm text-gray-400">
                          Score: {aiPreviewResult.fraudAssessment.riskScore || 0}%
                        </span>
                      </div>
                      {aiPreviewResult.fraudAssessment.flags?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-400 mb-1">Potential Issues:</p>
                          <ul className="list-disc list-inside text-sm text-gray-500">
                            {aiPreviewResult.fraudAssessment.flags.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category & Priority */}
                  {aiPreviewResult.categorization && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Category</p>
                        <p className="font-medium">
                          {aiPreviewResult.categorization.category?.primary || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {aiPreviewResult.categorization.category?.secondary && 
                            `Type: ${aiPreviewResult.categorization.category.secondary}`}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Priority</p>
                        <p className="font-medium capitalize">
                          {aiPreviewResult.categorization.priority?.level || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Score: {aiPreviewResult.categorization.priority?.score || 'N/A'}/10
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {aiPreviewResult.summary && (
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h5 className="font-medium mb-2">Summary</h5>
                      <p className="text-sm text-gray-300">
                        {aiPreviewResult.summary.executiveSummary}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={() => handleStepChange(4)}
                      size="lg"
                    >
                      Continue to Submit
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Navigation */}
            {!aiPreviewResult && (
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep(2)}
                  disabled={loading || isRunningPreview}
                  size="lg"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={() => handleStepChange(4)}
                  disabled={loading || isRunningPreview}
                  size="lg"
                >
                  Skip to Submit
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Final Submission */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardBody className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4">
                    <CheckSquare className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Submit</h3>
                  <p className="text-gray-400">
                    Your claim is ready for submission. Please review the summary below.
                  </p>
                </div>

                {/* Claim Summary */}
                <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-4">Claim Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Type</span>
                      <span className="font-medium capitalize">{formData.claimType || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Date of Incident</span>
                      <span className="font-medium">{formData.dateOfIncident || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Location</span>
                      <span className="font-medium">{formData.location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Estimated Amount</span>
                      <span className="font-medium text-cyan-400">
                        ₦{formData.estimatedAmount || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Documents</span>
                      <span className="font-medium">{uploadedDocuments.length} file(s)</span>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <Alert variant="info" className="mb-6">
                  <Info className="w-5 h-5" />
                  <div>
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Your claim will be submitted to our review team</li>
                      <li>You'll receive a confirmation email with your claim number</li>
                      <li>An insurer representative will review your claim within 24-48 hours</li>
                      <li>You'll be notified of any updates or decisions via email and in-app notifications</li>
                    </ul>
                  </div>
                </Alert>

                {/* Submit Button */}
                {error && (
                  <Alert type="error" className="mb-4">
                    {error}
                    {Object.keys(validationErrors).length > 0 && (
                      <ul className="mt-2 text-sm">
                        {Object.entries(validationErrors).map(([field, error]) => (
                          <li key={field}>• {field}: {error}</li>
                        ))}
                      </ul>
                    )}
                  </Alert>
                )}
                  
                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {processingStatus || 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Submit Claim
                      </>
                    )}
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Navigation */}
            {!loading && (
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep(3)}
                  disabled={loading}
                  size="lg"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}