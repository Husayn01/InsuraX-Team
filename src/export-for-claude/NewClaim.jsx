import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Upload, AlertCircle, CheckCircle, 
  X, File, Image, Paperclip
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { supabaseHelpers } from '@services/supabase'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, 
  Alert, LoadingSpinner 
} from '@shared/components'

export const NewClaim = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    claimType: '',
    incidentDate: '',
    damageDescription: '',
    estimatedAmount: '',
    incidentLocation: '',
    documents: []
  })

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

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

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB limit
    })

    if (validFiles.length !== fileArray.length) {
      setError('Some files were skipped. Only images, PDFs, and Word documents under 10MB are allowed.')
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

    try {
      // Validate form
      if (!formData.claimType || !formData.incidentDate || !formData.damageDescription) {
        throw new Error('Please fill in all required fields')
      }

      // Upload files to Supabase storage
      const fileUrls = []
      for (const file of uploadedFiles) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { data, error } = await supabaseHelpers.uploadFile('claim-documents', fileName, file)
        
        if (error) throw error
        
        const url = supabaseHelpers.getFileUrl('claim-documents', fileName)
        fileUrls.push(url)
      }

      // Create claim data
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
          confidence: 'high'
        },
        documents: fileUrls,
        created_at: new Date().toISOString()
      }

      // Submit claim
      const { data, error } = await supabaseHelpers.createClaim(claimData)
      
      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        navigate('/customer/claims')
      }, 2000)

    } catch (err) {
      console.error('Error submitting claim:', err)
      setError(err.message || 'Failed to submit claim')
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
          Your claim has been submitted and will be processed by our AI system. Redirecting to claims page...
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
                label="Estimated Amount"
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
                Upload photos, receipts, police reports, or other relevant documents
              </p>
            </div>
            <CardBody>
              {/* Drag and Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-gray-700 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-100 font-medium mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Images, PDFs, and Word documents up to 10MB
                  </p>
                </div>
              </div>

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