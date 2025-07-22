import { openAIClient } from '../utils/apiClient.js';
import { DocumentProcessor } from './documentProcessor.js';
import { FraudDetector } from './fraudDetector.js';
import { ClaimCategorizer } from './claimCategorizer.js';
import { ResponseGenerator } from './responseGenerator.js';
import { ClaimsChatInterface } from './chatInterface.js';

export class ClaimsProcessingSystem {
  constructor() {
    this.documentProcessor = new DocumentProcessor(openAIClient);
    this.fraudDetector = new FraudDetector(openAIClient);
    this.claimCategorizer = new ClaimCategorizer(openAIClient);
    this.responseGenerator = new ResponseGenerator(openAIClient);
    this.chatInterface = new ClaimsChatInterface(openAIClient);
    
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
          categorizationResult.categorization.routing.assignmentType,
          options.customerFriendly !== false
        );
        
        if (responseResult.success) {
          customerResponse = responseResult.response;
        }
      }

      // Compile complete result
      const processingResult = {
        processingId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        status: 'completed',
        originalDocument: documentText,
        extractedData: claimData,
        validation: validationResult.validation,
        fraudAssessment: fraudAssessment.assessment,
        categorization: categorizationResult.categorization,
        summary: summaryResult.summary,
        customerResponse,
        recommendedActions: this.generateActionPlan(
          validationResult.validation,
          fraudAssessment.assessment,
          categorizationResult.categorization
        )
      };

      // Store for future reference
      this.processedClaims.set(processingId, processingResult);

      console.log(`[${processingId}] Claim processing completed successfully`);
      return {
        success: true,
        result: processingResult
      };

    } catch (error) {
      console.error(`[${processingId}] Claim processing failed:`, error);
      
      const errorResult = {
        processingId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        status: 'failed',
        error: error.message,
        originalDocument: documentText
      };

      return {
        success: false,
        result: errorResult,
        error: error.message
      };
    }
  }

  /**
   * File extraction methods
   */
  async extractTextFromFile(file) {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    try {
      switch (fileExtension) {
        case '.txt':
        case '.rtf':
        case '.json':
        case '.xml':
        case '.csv':
          return await this.readTextFile(file);
        
        case '.pdf':
          return await this.extractFromPDF(file);
        
        case '.doc':
        case '.docx':
          return await this.extractFromWord(file);
        
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.bmp':
          return await this.extractFromImage(file);
        
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
    }
  }

  async readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async extractFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          const header = String.fromCharCode(...uint8Array.slice(0, 4));
          if (header !== '%PDF') {
            reject(new Error('Invalid PDF file'));
            return;
          }
          
          resolve(`EXTRACTED FROM PDF: ${file.name}
          
This is simulated text extraction from a PDF document. In a real implementation, 
this would use libraries like PDF.js or server-side PDF processing tools to extract 
actual text content from the PDF file.

File: ${file.name}
Size: ${file.size} bytes
Type: ${file.type}

[Simulated claim content would appear here after real PDF processing]`);
        } catch (error) {
          reject(new Error('PDF processing failed'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async extractFromWord(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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