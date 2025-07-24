import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { Button, Card, CardBody, Input, Select, Alert } from '@shared/components'
import { Upload, FileText, X, Image, File, Plus, AlertCircle } from 'lucide-react'
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
  
  const [formData, setFormData] = useState({
    claimType: '',
    incidentDate: '',
    incidentLocation: '',
    damageDescription: '',
    estimatedAmount: ''
  })

  const claimTypeOptions = [
    { value: '', label: 'Select claim type' },
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'health', label: 'Health Insurance' },
    { value: 'property', label: 'Property Insurance' },
    { value: 'life', label: 'Life Insurance' },
    { value: 'other', label: 'Other' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Only images, PDFs, and Word documents under 10MB are allowed.')
      setTimeout(() => setError(''), 5000)
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setProcessingStatus('Validating claim information...')

    try {
      // Validate form
      if (!formData.claimType || !formData.incidentDate || !formData.damageDescription) {
        throw new Error('Please fill in all required fields')
      }

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
              claimNumber: createdClaim.claim_data.claimNumber,
              submittedBy: user.email,
              submissionDate: new Date().toISOString()
            },
            documents: uploadedFiles
          })

          // Update claim with AI results
          if (aiResult.status === 'completed') {
            setProcessingStatus('Saving AI analysis results...')
            
            const updatedClaimData = {
              claim_data: {
                ...createdClaim.claim_data,
                aiProcessingStatus: 'completed',
                aiAnalysis: {
                  processingId: aiResult.processingId,
                  extractedData: aiResult.extractedData,
                  fraudAssessment: {
                    score: aiResult.fraudAssessment.score,
                    riskLevel: aiResult.fraudAssessment.riskLevel,
                    flags: aiResult.fraudAssessment.flags,
                    confidence: aiResult.fraudAssessment.confidence
                  },
                  categorization: aiResult.categorization,
                  validationStatus: aiResult.validationStatus,
                  processingTime: aiResult.processingTimeMs,
                  recommendations: aiResult.recommendations
                }
              },
              status: aiResult.fraudAssessment.riskLevel === 'critical' ? 'flagged' : 'processing'
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
      } else {
        // No documents uploaded, update status to indicate manual review needed
        await supabaseHelpers.updateClaim(createdClaim.id, {
          claim_data: {
            ...createdClaim.claim_data,
            aiProcessingStatus: 'no_documents'
          }
        })
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

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-400" />
    } else if (file.type === 'application/pdf') {
      return <File className="w-5 h-5 text-red-400" />
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Submit New Claim"
        description="File a new insurance claim with supporting documents"
      />

      {success && (
        <Alert type="success" title="Claim submitted successfully!" className="mb-6 bg-green-900/20 border-green-500/50">
          Your claim has been submitted and is being processed by our AI system. Redirecting to claims page...
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl space-y-6">
          {/* Basic Information */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Claim Information</h2>
            </div>
            <CardBody className="space-y-6">
              {error && (
                <Alert type="error" title="Submission Error" className="bg-red-900/20 border-red-500/50">
                  {error}
                </Alert>
              )}

              {processingStatus && (
                <div className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                  <span className="text-sm font-medium text-blue-400">{processingStatus}</span>
                </div>
              )}

              <Select
                label="Claim Type *"
                name="claimType"
                value={formData.claimType}
                onChange={handleChange}
                options={claimTypeOptions}
                required
                className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
              />

              <Input
                label="Incident Date *"
                type="date"
                name="incidentDate"
                value={formData.incidentDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
                className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
              />

              <Input
                label="Incident Location"
                type="text"
                name="incidentLocation"
                value={formData.incidentLocation}
                onChange={handleChange}
                placeholder="e.g., 123 Main St, City, State"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Damage Description *
                </label>
                <textarea
                  name="damageDescription"
                  value={formData.damageDescription}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  placeholder="Please provide a detailed description of the damage or incident..."
                  required
                />
              </div>

              <Input
                label="Estimated Amount ($)"
                type="number"
                name="estimatedAmount"
                value={formData.estimatedAmount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
              />
            </CardBody>
          </Card>

          {/* Document Upload */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Supporting Documents</h2>
              <p className="text-sm text-gray-400 mt-1">
                Upload photos, receipts, or other documents (AI processing available)
              </p>
            </div>
            <CardBody>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium mb-1">
                    Click to upload documents
                  </p>
                  <p className="text-sm text-gray-500">
                    Images, PDFs, Word docs (max 10MB each)
                  </p>
                </label>
              </div>

              {/* AI Processing Notice */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-cyan-300">
                      <p className="font-medium mb-1">AI Processing Available</p>
                      <p className="text-cyan-400/80">
                        Your documents will be automatically analyzed by NeuroClaim AI for faster processing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file)}
                          <div>
                            <p className="text-sm font-medium text-gray-100">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/customer/claims')}
              disabled={loading}
              className="text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

export default NewClaim