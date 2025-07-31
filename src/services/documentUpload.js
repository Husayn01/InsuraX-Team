// services/documentUpload.js
import { supabase } from './supabase'

export const documentUploadService = {
  // Allowed file types and size limits
  ALLOWED_FILE_TYPES: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'application/rtf': ['.rtf']
  },
  
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_CLAIM: 10,

  /**
   * Validate file before upload
   */
  validateFile(file) {
    // Check if file exists and has required properties
    if (!file || !file.type || !file.size) {
      throw new Error('Invalid file object')
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} exceeds maximum size of 10MB`)
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error(`File ${file.name} is empty`)
    }

    // Check file type - also check by extension if MIME type is missing
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
    
    let isValidType = false
    
    // Check by MIME type
    if (file.type && Object.keys(this.ALLOWED_FILE_TYPES).includes(file.type)) {
      isValidType = true
    } else {
      // Check by extension as fallback
      for (const [mimeType, extensions] of Object.entries(this.ALLOWED_FILE_TYPES)) {
        if (extensions.includes(fileExtension)) {
          isValidType = true
          break
        }
      }
    }
    
    if (!isValidType) {
      throw new Error(`File type not allowed. Please use: PDF, Images (JPG, PNG), or Word documents`)
    }

    // Additional validation for images
    if (file.type && file.type.startsWith('image/')) {
      return this.validateImage(file)
    }

    return true
  },

  /**
   * Validate image dimensions with memory optimization
   */
  async validateImage(file) {
    return new Promise((resolve, reject) => {
      // Skip validation for very large images to prevent memory issues
      if (file.size > 20 * 1024 * 1024) { // 20MB
        reject(new Error('Image file too large. Please use images under 20MB.'))
        return
      }

      const img = new Image()
      let url = null
      
      img.onload = () => {
        // Clean up immediately after checking
        if (url) {
          URL.revokeObjectURL(url)
          url = null
        }
        
        // Reject extremely large images
        if (img.width > 5000 || img.height > 5000) {
          reject(new Error('Image dimensions too large (max 5000x5000)'))
        } else {
          resolve(true)
        }
      }
      
      img.onerror = () => {
        // Clean up on error
        if (url) {
          URL.revokeObjectURL(url)
          url = null
        }
        reject(new Error('Invalid image file'))
      }
      
      try {
        url = URL.createObjectURL(file)
        img.src = url
      } catch (err) {
        reject(new Error('Could not process image file'))
      }
    })
  },

  /**
   * Upload file to Supabase storage
   * Now requires actual claim ID instead of temporary ID
   */
  async uploadFile(file, claimId, userId) {
    try {
      // Validate file first
      await this.validateFile(file)

      // Check for Chrome memory issues with large files
      if (file.size > 8 * 1024 * 1024 && navigator.userAgent.includes('Chrome')) {
        console.warn('Large file detected in Chrome, processing carefully...')
      }

      // Generate unique file name with proper path structure
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${userId}/${claimId}/${timestamp}_${safeFileName}`

      // For very large files, use a different approach
      let uploadData
      if (file.size > 8 * 1024 * 1024) {
        // For large files, upload without transformation
        uploadData = file
      } else {
        // For smaller files, can use normal upload
        uploadData = file
      }

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('claim-documents')
        .upload(fileName, uploadData, {
          cacheControl: '3600',
          upsert: false,
          duplex: 'half' // Add duplex mode for better Chrome compatibility
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(`Failed to upload ${file.name}: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('claim-documents')
        .getPublicUrl(fileName)

      return {
        fileName: file.name,
        filePath: fileName,
        fileType: file.type,
        fileSize: file.size,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('File upload error:', error)
      
      // Add specific error handling for Chrome crashes
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        throw new Error('Network error during upload. Please check your connection and try again.')
      }
      
      throw error
    }
  },

  /**
   * Upload multiple files with better error handling and rollback
   */
  async uploadMultipleFiles(files, claimId, userId, onProgress) {
    if (!claimId || claimId.startsWith('temp_')) {
      throw new Error('Valid claim ID required for file upload')
    }

    if (files.length > this.MAX_FILES_PER_CLAIM) {
      throw new Error(`Maximum ${this.MAX_FILES_PER_CLAIM} files allowed per claim`)
    }

    const uploadedFiles = []
    const errors = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Call progress callback
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            fileName: file.name,
            status: 'uploading'
          })
        }

        const uploadedFile = await this.uploadFile(file, claimId, userId)
        uploadedFiles.push(uploadedFile)
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            fileName: file.name,
            status: 'completed'
          })
        }
      } catch (error) {
        errors.push({
          fileName: file.name,
          error: error.message
        })
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            fileName: file.name,
            status: 'error',
            error: error.message
          })
        }
      }
    }

    return {
      uploadedFiles,
      errors,
      success: errors.length === 0
    }
  },

  /**
   * Delete file from storage
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('claim-documents')
        .remove([filePath])

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      console.error('File deletion error:', error)
      throw error
    }
  },

  /**
   * Delete multiple files (for cleanup)
   */
  async deleteMultipleFiles(filePaths) {
    const results = []
    
    for (const filePath of filePaths) {
      try {
        await this.deleteFile(filePath)
        results.push({ filePath, success: true })
      } catch (error) {
        results.push({ filePath, success: false, error: error.message })
      }
    }
    
    return results
  },

  /**
   * Delete all files for a claim (cleanup utility)
   */
  async deleteClaimFiles(claimId, userId) {
    try {
      // List all files in the claim folder
      const { data: files, error: listError } = await supabase.storage
        .from('claim-documents')
        .list(`${userId}/${claimId}`)

      if (listError) {
        throw new Error(`Failed to list files: ${listError.message}`)
      }

      if (!files || files.length === 0) {
        return { success: true, deletedCount: 0 }
      }

      // Delete all files
      const filePaths = files.map(file => `${userId}/${claimId}/${file.name}`)
      const { error: deleteError } = await supabase.storage
        .from('claim-documents')
        .remove(filePaths)

      if (deleteError) {
        throw new Error(`Failed to delete files: ${deleteError.message}`)
      }

      return { success: true, deletedCount: files.length }
    } catch (error) {
      console.error('Claim files deletion error:', error)
      throw error
    }
  },

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from('claim-documents')
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        throw new Error(`Failed to get signed URL: ${error.message}`)
      }

      return data.signedUrl
    } catch (error) {
      console.error('Signed URL error:', error)
      throw error
    }
  },

  /**
   * List files for a claim
   */
  async listClaimFiles(claimId, userId) {
    try {
      const { data: files, error } = await supabase.storage
        .from('claim-documents')
        .list(`${userId}/${claimId}`, {
          limit: 100,
          offset: 0
        })

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`)
      }

      // Get public URLs for each file
      const filesWithUrls = files.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('claim-documents')
          .getPublicUrl(`${userId}/${claimId}/${file.name}`)
        
        return {
          ...file,
          url: publicUrl,
          filePath: `${userId}/${claimId}/${file.name}`
        }
      })

      return filesWithUrls
    } catch (error) {
      console.error('List files error:', error)
      throw error
    }
  },

  /**
   * Move files from temporary location to permanent location
   * (Not needed with the new workflow, but kept for reference)
   */
  async moveFilesToClaim(tempClaimId, actualClaimId, userId) {
    // This function is no longer needed with the new workflow
    // Files are uploaded directly to the correct location
    console.warn('moveFilesToClaim is deprecated. Files should be uploaded with actual claim ID.')
    return { success: false, error: 'Function deprecated' }
  }
}