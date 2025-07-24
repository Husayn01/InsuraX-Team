// services/claimsOrchestrator.js
import { geminiClient } from '../utils/geminiClient.js';
import { DocumentProcessor } from './documentProcessor.js';
import { FraudDetector } from './fraudDetector.js';
import { ClaimCategorizer } from './claimCategorizer.js';
import { ResponseGenerator } from './responseGenerator.js';
import { ClaimsChatInterface } from './chatInterface.js';

export class ClaimsProcessingSystem {
  constructor() {
    this.documentProcessor = new DocumentProcessor(geminiClient);
    this.fraudDetector = new FraudDetector(geminiClient);
    this.claimCategorizer = new ClaimCategorizer(geminiClient);
    this.responseGenerator = new ResponseGenerator(geminiClient);
    this.chatInterface = new ClaimsChatInterface(geminiClient);
    
    this.processedClaims = new Map(); // In-memory storage for demo
    this.supportedFileTypes = [
      '.txt', '.pdf', '.doc', '.docx', '.rtf', 
      '.jpg', '.jpeg', '.png', '.gif', '.bmp',
      '.json', '.xml', '.csv'
    ];
  }

  /**
   * Process a complete claim from document to final recommendation
   * @param {string} documentText - Raw claim document text
   * @param {Object} options - Processing options
   * @returns {Object} Complete processing result
   */
  async processClaimComplete(documentText, options = {}) {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    try {
      console.log(`[${processingId}] Starting claim processing...`);

      // Step 1: Extract claim information
      console.log(`[${processingId}] Extracting claim information...`);
      const extractionResult = await this.documentProcessor.extractClaimInformation(documentText);
      
      if (!extractionResult.success) {
        throw new Error(`Document extraction failed: ${extractionResult.error}`);
      }

      const claimData = extractionResult.data;

      // Step 2: Validate extracted information
      console.log(`[${processingId}] Validating claim information...`);
      const validationResult = await this.documentProcessor.validateClaimInformation(claimData);
      
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      // Step 3: Assess fraud risk
      console.log(`[${processingId}] Assessing fraud risk...`);
      const fraudAssessment = await this.fraudDetector.assessFraudRisk(
        claimData, 
        options.additionalContext || ''
      );
      
      if (!fraudAssessment.success) {
        throw new Error(`Fraud assessment failed: ${fraudAssessment.error}`);
      }

      // Step 4: Categorize and prioritize
      console.log(`[${processingId}] Categorizing and prioritizing claim...`);
      const categorizationResult = await this.claimCategorizer.categorizeAndPrioritize(
        claimData, 
        fraudAssessment.assessment
      );
      
      if (!categorizationResult.success) {
        throw new Error(`Categorization failed: ${categorizationResult.error}`);
      }

      // Step 5: Generate summary and recommendations
      console.log(`[${processingId}] Generating summary and recommendations...`);
      const summaryResult = await this.responseGenerator.generateClaimSummary(
        claimData,
        fraudAssessment.assessment,
        categorizationResult.categorization
      );

      if (!summaryResult.success) {
        throw new Error(`Summary generation failed: ${summaryResult.error}`);
      }

      // Step 6: Generate customer response if requested
      let customerResponse = null;
      if (options.generateCustomerResponse) {
        console.log(`[${processingId}] Generating customer response...`);
        const responseResult = await this.responseGenerator.generateCustomerResponse(
          claimData,
          summaryResult.summary,
          options.customerFriendly !== false
        );
        
        if (!responseResult.success) {
          console.warn(`Customer response generation failed: ${responseResult.error}`);
        } else {
          customerResponse = responseResult.response;
        }
      }

      // Step 7: Generate action plan
      console.log(`[${processingId}] Generating action plan...`);
      const actionPlan = this.generateActionPlan(
        validationResult.validation,
        fraudAssessment.assessment,
        categorizationResult.categorization
      );

      // Compile final result
      const processingTimeMs = Date.now() - startTime;
      const result = {
        processingId,
        status: 'completed',
        processingTimeMs,
        timestamp: new Date().toISOString(),
        extractedData: claimData,
        validation: validationResult.validation,
        fraudAssessment: fraudAssessment.assessment,
        categorization: categorizationResult.categorization,
        summary: summaryResult.summary,
        customerResponse,
        actionPlan,
        metadata: {
          documentLength: documentText.length,
          processingOptions: options
        }
      };

      // Store result
      this.processedClaims.set(processingId, result);
      console.log(`[${processingId}] Processing completed in ${processingTimeMs}ms`);

      return result;
    } catch (error) {
      console.error(`[${processingId}] Processing failed:`, error);
      
      const failedResult = {
        processingId,
        status: 'failed',
        error: error.message,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      this.processedClaims.set(processingId, failedResult);
      return failedResult;
    }
  }

  /**
   * Extract text from various file types
   * @param {File} file - File to extract text from
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromFile(file) {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await this.extractFromTextFile(file);
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractFromPDF(file);
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
               fileType.includes('msword') || fileType.includes('wordprocessingml')) {
      return await this.extractFromWord(file);
    } else if (fileType.startsWith('image/') || 
               ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].some(ext => fileName.endsWith(ext))) {
      return await this.extractFromImage(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
    }
  }

  async extractFromTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  async extractFromPDF(file) {
    // In a real implementation, this would use a library like pdf.js
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(`EXTRACTED FROM PDF: ${file.name}
        
This is simulated text extraction from a PDF file. In a real implementation,
this would use libraries like pdf.js or pdf-parse to extract actual text content.

File: ${file.name}
Size: ${file.size} bytes
Type: ${file.type}

[Actual PDF content would be extracted here using PDF parsing libraries]`);
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async extractFromWord(file) {
    // In a real implementation, this would use a library like mammoth.js
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(`EXTRACTED FROM WORD DOCUMENT: ${file.name}
          
This is simulated text extraction from a Word document. In a real implementation,
this would use libraries like mammoth.js to extract actual text content from 
.doc and .docx files.

File: ${file.name}
Size: ${file.size} bytes
Type: ${file.type}

[Actual document content would be extracted here using mammoth.js or similar library]`);
        } catch (error) {
          reject(new Error('Word document processing failed'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Word document'));
      reader.readAsArrayBuffer(file);
    });
  }

  async extractFromImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            resolve(`EXTRACTED FROM IMAGE: ${file.name}
            
This is simulated OCR text extraction from an image. In a real implementation,
this would use libraries like Tesseract.js or cloud-based OCR services to extract
text from images.

Image Details:
- File: ${file.name}
- Size: ${file.size} bytes
- Type: ${file.type}
- Dimensions: ${img.width}x${img.height}

[OCR extracted text would appear here after real image processing]`);
          };
          img.onerror = () => reject(new Error('Invalid image file'));
          img.src = e.target.result;
        } catch (error) {
          reject(new Error('Image processing failed'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate action plan based on processing results
   */
  generateActionPlan(validation, fraudAssessment, categorization) {
    const actions = [];

    // Validation-based actions
    if (validation.validationStatus === 'incomplete') {
      actions.push({
        type: 'validation',
        priority: 'high',
        action: 'Request additional documentation',
        details: validation.requiredActions || ['Additional documentation needed']
      });
    }

    // Fraud-based actions
    if (fraudAssessment.riskLevel === 'high' || fraudAssessment.riskLevel === 'critical') {
      actions.push({
        type: 'fraud_review',
        priority: 'urgent',
        action: 'Conduct fraud investigation',
        details: fraudAssessment.investigationAreas || ['Requires fraud investigation']
      });
    }

    // Routing actions
    actions.push({
      type: 'routing',
      priority: categorization.priority.level,
      action: `Route to ${categorization.routing.department}`,
      details: [`Assign to: ${categorization.routing.assignmentType}`]
    });

    return actions;
  }

  /**
   * Chat interface for querying about claims
   */
  async chatQuery(query, claimId = null) {
    let claimContext = null;
    
    if (claimId && this.processedClaims.has(claimId)) {
      claimContext = this.processedClaims.get(claimId);
    }

    return await this.chatInterface.processQuery(query, claimContext);
  }

  /**
   * Get processed claim by ID
   */
  getClaim(processingId) {
    return this.processedClaims.get(processingId) || null;
  }

  /**
   * Get all processed claims
   */
  getAllClaims() {
    return Array.from(this.processedClaims.values());
  }

  /**
   * Generate analytics for processed claims
   */
  generateAnalytics() {
    const claims = this.getAllClaims();
    
    if (claims.length === 0) {
      return {
        totalClaims: 0,
        averageProcessingTime: 0,
        riskDistribution: {},
        claimTypeDistribution: {},
        priorityDistribution: {}
      };
    }

    const analytics = {
      totalClaims: claims.length,
      averageProcessingTime: claims.reduce((sum, claim) => sum + (claim.processingTimeMs || 0), 0) / claims.length,
      riskDistribution: {},
      claimTypeDistribution: {},
      priorityDistribution: {},
      successfullyProcessed: claims.filter(c => c.status === 'completed').length,
      failedProcessing: claims.filter(c => c.status === 'failed').length
    };

    // Calculate distributions
    claims.forEach(claim => {
      // Risk distribution
      const riskLevel = claim.fraudAssessment?.riskLevel || 'unknown';
      analytics.riskDistribution[riskLevel] = (analytics.riskDistribution[riskLevel] || 0) + 1;

      // Claim type distribution
      const claimType = claim.extractedData?.claimType || 'unknown';
      analytics.claimTypeDistribution[claimType] = (analytics.claimTypeDistribution[claimType] || 0) + 1;

      // Priority distribution
      const priority = claim.categorization?.priority?.level || 'unknown';
      analytics.priorityDistribution[priority] = (analytics.priorityDistribution[priority] || 0) + 1;
    });

    return analytics;
  }

  /**
   * Utility function to generate unique processing IDs
   */
  generateProcessingId() {
    return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all processed claims (useful for testing)
   */
  clearAllClaims() {
    this.processedClaims.clear();
    this.chatInterface.clearHistory();
  }
}

// Export singleton instance
export const claimsSystem = new ClaimsProcessingSystem();

// Export class for custom instances
export default ClaimsProcessingSystem;