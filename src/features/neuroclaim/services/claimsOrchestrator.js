// services/claimsOrchestrator.js
import { geminiClient } from '../utils/geminiClient.js';
import { DocumentProcessor } from './documentProcessor.js';
import { FraudDetector } from './fraudDetector.js';
import { ClaimCategorizer } from './claimCategorizer.js';
import { ResponseGenerator } from './responseGenerator.js';
import { ClaimsChatInterface } from './chatInterface.js';
import { loadDocumentLibraries, loadTesseract, documentLibs } from '../utils/documentLibsLoader.js';

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

    // Initialize libraries
    this.librariesLoaded = false;
    this.tesseractWorker = null;
    this.initializeLibraries();
  }

  async initializeLibraries() {
    this.librariesLoaded = await loadDocumentLibraries();
    if (!this.librariesLoaded) {
      console.warn('Document processing libraries failed to load. Some features may be limited.');
    }
  }

  /**
   * Process a complete claim from document to final recommendation
   * @param {string} documentText - Raw claim document text
   * @param {Object} options - Processing options
   * @returns {Object} Complete processing result
   */
// Updated processClaimComplete method with better error handling and timeout prevention
  async processClaimComplete(documentText, options = {}) {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    try {
      console.log(`[${processingId}] Starting claim processing...`);

      // Step 1: Extract claim information
      console.log(`[${processingId}] Extracting claim information...`);
      const extractionResult = await this.documentProcessor.extractClaimInformation(documentText);
      
      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'Document extraction failed');
      }

      // Step 2: Detect fraud
      console.log(`[${processingId}] Running fraud detection...`);
      const fraudResult = await this.fraudDetector.assessFraudRisk(extractionResult.claimData);
      
      if (!fraudResult.success) {
        console.warn('Fraud detection failed, using default low risk');
        fraudResult.assessment = {
          riskLevel: 'low',
          riskScore: 0,
          confidence: 'low'
        };
      }

      // Step 3: Categorize the claim with fraud assessment
      console.log(`[${processingId}] Categorizing claim...`);
      const categorizationResult = await this.claimCategorizer.categorizeAndPrioritize(
        extractionResult.claimData,
        fraudResult.assessment
      );
      
      if (!categorizationResult.success) {
        throw new Error(categorizationResult.error || 'Categorization failed');
      }

      // Step 4: Generate action plan
      const actionPlan = this.generateActionPlan(
        { validationStatus: 'complete', requiredActions: [] },
        fraudResult.assessment,
        categorizationResult.categorization
      );

      // Step 5: Generate summary
      let summary = null;
      console.log(`[${processingId}] Generating claim summary...`);
      const summaryResult = await this.responseGenerator.generateClaimSummary(
        extractionResult.claimData,
        fraudResult.assessment,
        categorizationResult.categorization
      );
      
      if (summaryResult.success) {
        summary = summaryResult.summary;
      } else {
        // Fallback summary if AI generation fails
        summary = {
          executiveSummary: `${extractionResult.claimData.claimType || 'Insurance'} claim submitted for ${extractionResult.claimData.estimatedAmount ? `₦${extractionResult.claimData.estimatedAmount.toLocaleString()}` : 'unspecified amount'}. Risk level: ${fraudResult.assessment.riskLevel}.`,
          keyDetails: {
            claimant: extractionResult.claimData.claimantName || 'Unknown',
            incident: extractionResult.claimData.incidentDescription || 'No description',
            damages: extractionResult.claimData.estimatedAmount ? `₦${extractionResult.claimData.estimatedAmount.toLocaleString()}` : 'Not specified'
          }
        };
      }

      // Step 6: Generate customer response
      let customerResponse = null;
      console.log(`[${processingId}] Generating customer response...`);
      try {
        const responseResult = await this.responseGenerator.generateCustomerResponse(
          extractionResult.claimData,
          fraudResult.assessment,
          categorizationResult.categorization,
          actionPlan
        );
        
        if (responseResult.success) {
          customerResponse = responseResult.response;
        }
      } catch (error) {
        console.warn('Customer response generation failed:', error);
        customerResponse = 'Thank you for submitting your claim. We are processing it and will contact you shortly.';
      }

      // Step 7: Generate internal memo - WITH TIMEOUT AND ERROR HANDLING
      let internalMemo = null;
      console.log(`[${processingId}] Generating internal memo...`);
      try {
        // Add a timeout to prevent hanging
        const memoPromise = this.responseGenerator.generateInternalMemo(
          extractionResult.claimData,
          fraudResult.assessment,
          categorizationResult.categorization,
          actionPlan
        );
        
        // Set a 10-second timeout for the memo generation
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Memo generation timeout')), 10000)
        );
        
        const memoResult = await Promise.race([memoPromise, timeoutPromise]);
        
        if (memoResult?.success) {
          internalMemo = memoResult.memo;
        }
      } catch (error) {
        console.warn('Internal memo generation failed or timed out:', error);
        // Use fallback memo
        internalMemo = {
          summary: `Claim ${processingId} requires ${fraudResult.assessment.riskLevel} priority review.`,
          recommendations: actionPlan.recommendations || ['Process according to standard procedure'],
          riskFactors: fraudResult.assessment.fraudIndicators || []
        };
      }

      // Compile results
      const processingTime = Date.now() - startTime;
      const result = {
        processingId,
        timestamp: new Date().toISOString(),
        processingTime,
        status: 'completed',
        claimData: extractionResult.claimData,
        fraudAssessment: fraudResult.assessment,
        categorization: categorizationResult.categorization,
        validationResult: { validationStatus: 'complete', requiredActions: [] },
        actionPlan,
        summary,
        customerResponse,
        internalMemo
      };

      // Save to database - WITH ERROR HANDLING
      console.log(`[${processingId}] Saving to database...`);
      if (options.userId) {
          try {
            await this.saveToDatabase(result, options.userId, documentText);
          } catch (error) {
            console.error('Database save failed:', error);
            // Continue anyway - don't fail the whole process
          }
        }

      // Add to processing history (in memory)
      this.processingHistory.unshift(result);
      if (this.processingHistory.length > 100) {
        this.processingHistory = this.processingHistory.slice(0, 100);
      }

      console.log(`[${processingId}] Processing completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`[${processingId}] Processing failed:`, error);
      
      const processingTime = Date.now() - startTime;
      
      // Return partial result with error
      return {
        processingId,
        timestamp: new Date().toISOString(),
        processingTime,
        status: 'failed',
        error: error.message,
        claimData: null,
        fraudAssessment: null,
        categorization: null,
        validationResult: null,
        actionPlan: null,
        summary: null,
        customerResponse: null,
        internalMemo: null
      };
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

    try {
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
      } else if (fileType === 'application/json' || fileName.endsWith('.json')) {
        return await this.extractFromJSON(file);
      } else if (fileName.endsWith('.csv')) {
        return await this.extractFromCSV(file);
      } else {
        throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
      }
    } catch (error) {
      console.error('File extraction error:', error);
      throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
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
    // Ensure PDF.js is loaded
    if (!documentLibs.pdf) {
      await loadDocumentLibraries();
      if (!documentLibs.pdf) {
        throw new Error('PDF.js library failed to load');
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await documentLibs.pdf.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      // Add metadata
      const metadata = await pdf.getMetadata();
      let result = `PDF Document: ${file.name}\n`;
      
      if (metadata.info) {
        result += `Title: ${metadata.info.Title || 'N/A'}\n`;
        result += `Author: ${metadata.info.Author || 'N/A'}\n`;
        result += `Created: ${metadata.info.CreationDate || 'N/A'}\n`;
      }
      
      result += `Pages: ${pdf.numPages}\n\n`;
      result += `Content:\n${fullText}`;
      
      return result.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  async extractFromWord(file) {
    // Ensure Mammoth is loaded
    if (!documentLibs.mammoth) {
      await loadDocumentLibraries();
      if (!documentLibs.mammoth) {
        throw new Error('Mammoth.js library failed to load');
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await documentLibs.mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Word extraction warnings:', result.messages);
      }
      
      const text = result.value;
      
      // Add file metadata
      const extractedText = `Word Document: ${file.name}\n` +
                          `Size: ${(file.size / 1024).toFixed(2)} KB\n` +
                          `Last Modified: ${new Date(file.lastModified).toLocaleString()}\n\n` +
                          `Content:\n${text}`;
      
      return extractedText;
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error(`Word document extraction failed: ${error.message}`);
    }
  }

async extractFromImage(file) {
  try {
    // Load Tesseract on demand
    if (!this.tesseractWorker) {
      const Tesseract = await loadTesseract();
      if (!Tesseract) {
        throw new Error('Tesseract.js failed to load');
      }

      // Create worker without deprecated methods
      this.tesseractWorker = await Tesseract.createWorker();
      
      // Note: loadLanguage and initialize are deprecated in newer versions
      // The worker comes pre-loaded with language
    }

    // Convert file to data URL for Tesseract
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Perform OCR
    console.log(`Starting OCR for ${file.name}...`);
    const { data: { text, confidence } } = await this.tesseractWorker.recognize(dataUrl);
    
    console.log(`OCR completed. Confidence: ${confidence}%`);
    console.log(`Extracted text preview: ${text.substring(0, 200)}...`);
    
    // Return ONLY the extracted text, not the metadata
    // This is what was causing Gemini to return nulls
    if (!text || text.trim().length === 0) {
      throw new Error('No text found in image');
    }
    
    return text.trim(); // Return just the text, no metadata
    
  } catch (error) {
    console.error('OCR extraction error:', error);
    // Return empty string on failure so processing can continue
    return '';
  }
}
  

  async extractFromJSON(file) {
    try {
      const text = await this.extractFromTextFile(file);
      const jsonData = JSON.parse(text);
      
      // Convert JSON to readable format
      const formattedText = `JSON Document: ${file.name}\n\n` +
                          `Structured Data:\n` +
                          JSON.stringify(jsonData, null, 2);
      
      return formattedText;
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error.message}`);
    }
  }

  async extractFromCSV(file) {
    try {
      const text = await this.extractFromTextFile(file);
      
      // Basic CSV parsing (for more complex CSVs, use a library like PapaParse)
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim());
      
      let formattedText = `CSV Document: ${file.name}\n\n`;
      formattedText += `Headers: ${headers?.join(', ') || 'None'}\n`;
      formattedText += `Rows: ${lines.length - 1}\n\n`;
      formattedText += `Data:\n${text}`;
      
      return formattedText;
    } catch (error) {
      throw new Error(`CSV extraction failed: ${error.message}`);
    }
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
        totalAmount: 0, // Add this
        averageProcessingTime: 0,
        riskDistribution: {},
        claimTypeDistribution: {}, // Ensure consistent naming
        priorityDistribution: {},
        processingTrend: [] // Add this
      };
    }

    const analytics = {
      totalClaims: claims.length,
      totalAmount: claims.reduce((sum, claim) => 
        sum + (claim.claimData?.estimatedAmount || 0), 0
      ),
      averageProcessingTime: claims.reduce((sum, claim) => 
        sum + (claim.processingTime || 0), 0
      ) / claims.length,
      riskDistribution: {},
      claimTypeDistribution: {}, // Changed from claimTypeDistribution
      priorityDistribution: {},
      successfullyProcessed: claims.filter(c => c.status === 'completed').length,
      failedProcessing: claims.filter(c => c.status === 'failed').length,
      processingTrend: [] // Add this
    };

    // Calculate distributions
    claims.forEach(claim => {
      // Risk distribution
      if (claim.fraudAssessment?.riskLevel) {
        analytics.riskDistribution[claim.fraudAssessment.riskLevel] = 
          (analytics.riskDistribution[claim.fraudAssessment.riskLevel] || 0) + 1;
      }

      // Claim type distribution - ensure we're checking the right path
      const claimType = claim.claimData?.claimType || claim.claim_data?.claimType || 'unknown';
      analytics.claimTypeDistribution[claimType] = 
        (analytics.claimTypeDistribution[claimType] || 0) + 1;

      // Priority distribution
      if (claim.categorization?.priority?.level) {
        analytics.priorityDistribution[claim.categorization.priority.level] = 
          (analytics.priorityDistribution[claim.categorization.priority.level] || 0) + 1;
      }
    });

    console.log('Generated Analytics:', analytics); // Debug log

    return analytics;
  }
  generateProcessingId() {
    return `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }

  // Add this method to the ClaimsProcessingSystem class in claimsOrchestrator.js

async processClaimComplete(documentText, options = {}) {
  const processingId = this.generateProcessingId();
  const startTime = Date.now();

  try {
    console.log(`[${processingId}] Starting claim processing...`);

    // Step 1: Extract claim information
    console.log(`[${processingId}] Extracting claim information...`);
    const extractionResult = await this.documentProcessor.extractClaimInformation(documentText);
    
    if (!extractionResult.success) {
      throw new Error(extractionResult.error || 'Document extraction failed');
    }

    // Step 2: Detect fraud
    console.log(`[${processingId}] Running fraud detection...`);
    const fraudResult = await this.fraudDetector.assessFraudRisk(extractionResult.claimData);
    
    if (!fraudResult.success) {
      console.warn('Fraud detection failed, using default low risk');
      fraudResult.assessment = {
        riskLevel: 'low',
        riskScore: 0,
        confidence: 'low'
      };
    }

    // Step 3: Categorize the claim with fraud assessment
    console.log(`[${processingId}] Categorizing claim...`);
    const categorizationResult = await this.claimCategorizer.categorizeAndPrioritize(
      extractionResult.claimData,
      fraudResult.assessment
    );
    
    if (!categorizationResult.success) {
      throw new Error(categorizationResult.error || 'Categorization failed');
    }

    // Step 4: Generate action plan
    const actionPlan = this.generateActionPlan(
      { validationStatus: 'complete', requiredActions: [] },
      fraudResult.assessment,
      categorizationResult.categorization
    );

    // Step 5: Generate summary - NEW!
    let summary = null;
    console.log(`[${processingId}] Generating claim summary...`);
    const summaryResult = await this.responseGenerator.generateClaimSummary(
      extractionResult.claimData,
      fraudResult.assessment,
      categorizationResult.categorization
    );
    
    if (summaryResult.success) {
      summary = summaryResult.summary;
    } else {
      // Fallback summary if AI generation fails
      summary = {
        executiveSummary: `${extractionResult.claimData.claimType || 'Insurance'} claim submitted for ${extractionResult.claimData.estimatedAmount ? `₦${extractionResult.claimData.estimatedAmount.toLocaleString()}` : 'unspecified amount'}. Risk level: ${fraudResult.assessment.riskLevel}.`,
        keyDetails: {
          claimant: extractionResult.claimData.claimantName || 'Unknown',
          incident: extractionResult.claimData.incidentDescription || 'No description',
          damages: extractionResult.claimData.estimatedAmount ? `₦${extractionResult.claimData.estimatedAmount.toLocaleString()}` : 'Not specified',
          riskFactors: fraudResult.assessment.riskFactors?.join(', ') || 'None identified'
        },
        processingStatus: categorizationResult.categorization.priority,
        recommendations: actionPlan.recommendations || [],
        timeline: actionPlan.estimatedTimeline || 'Standard processing',
        specialNotes: actionPlan.specialHandling || 'No special considerations'
      };
    }

    // Step 6: Generate responses if requested
    let customerResponse = null;
    let internalMemo = null;

    if (options.generateCustomerResponse) {
      console.log(`[${processingId}] Generating customer response...`);
      const responseResult = await this.responseGenerator.generateCustomerResponse(
        extractionResult.claimData,
        { validationStatus: 'complete', requiredActions: [] },
        fraudResult.assessment,
        actionPlan
      );
      
      if (responseResult.success) {
        customerResponse = responseResult.response;
      }
    }

    if (options.generateInternalMemo) {
      console.log(`[${processingId}] Generating internal memo...`);
      const memoResult = await this.responseGenerator.generateInternalMemo(
        extractionResult.claimData,
        fraudResult.assessment,
        categorizationResult.categorization
      );
      
      if (memoResult.success) {
        internalMemo = memoResult.memo;
      }
    }

    // Step 7: Store the processed claim
    const processedClaim = {
      id: processingId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      claimData: extractionResult.claimData,
      categorization: categorizationResult.categorization,
      validation: { validationStatus: 'complete', requiredActions: [] },
      fraudAssessment: fraudResult.assessment,
      actionPlan,
      summary, // NEW!
      customerResponse,
      internalMemo,
      status: 'completed'
    };

    this.processedClaims.set(processingId, processedClaim);

    // Step 8: Save to database if user is authenticated - NEW!
    if (options.userId) {
      await this.saveToDatabase(processedClaim, options.userId, documentText);
    }

    console.log(`[${processingId}] Processing completed in ${processedClaim.processingTime}ms`);

    return {
      success: true,
      ...processedClaim
    };

  } catch (error) {
    console.error(`[${processingId}] Processing failed:`, error);
    
    const failedClaim = {
      id: processingId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message
    };
    
    this.processedClaims.set(processingId, failedClaim);
    
    return failedClaim;
  }
}

// In claimsOrchestrator.js, replace the saveToDatabase method with:
async saveToDatabase(processedClaim, userId, extractedText) {
  try {
    // Use the already imported supabaseHelpers instead of dynamic import
    const { supabaseHelpers } = await import('../../../services/supabase.js');
    
    const sessionData = {
      user_id: userId,
      processing_id: processedClaim.processingId || processedClaim.id,
      claim_data: processedClaim.claimData || {},
      fraud_assessment: processedClaim.fraudAssessment || {},
      categorization: processedClaim.categorization || {},
      validation: processedClaim.validationResult || processedClaim.validation || {},
      action_plan: processedClaim.actionPlan || {},
      summary: processedClaim.summary || {},
      customer_response: processedClaim.customerResponse || '',
      internal_memo: processedClaim.internalMemo || {},
      processing_time_ms: processedClaim.processingTime || 0,
      status: processedClaim.status || 'completed',
      extracted_text: extractedText || '',
      uploaded_files: processedClaim.uploadedFiles || []
    };

    console.log('Saving NeuroClaim session:', sessionData);
    
    const result = await supabaseHelpers.createNeuroClaimSession(sessionData);
    
    if (result.error) {
      console.error('Failed to save to database:', result.error);
      throw result.error;
    } else {
      console.log('Successfully saved to database:', result.data);
    }
    
    return result;
  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}

// Add these methods for fetching from database
async getHistoricalClaims(userId, limit = 50) {
  try {
    const { supabase } = await import('../../../services/supabase.js');
    
    const { data, error } = await supabase
      .from('neuroclaim_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch historical claims:', error);
    return [];
  }
}

async getAnalytics(userId) {
  try {
    const { supabaseHelpers } = await import('../../../services/supabase.js');
    
    // Get all claims for analytics
    const { data: claims, error } = await supabaseHelpers.getNeuroClaimSessions(userId, {
      status: 'completed'
    });

    if (error) throw error;

    if (!claims || claims.length === 0) {
      return {
        totalClaims: 0,
        totalAmount: 0,
        riskDistribution: {},
        averageProcessingTime: 0,
        claimTypeDistribution: {}, // Changed from claimTypes
        processingTrend: []
      };
    }

    // Calculate analytics
    const totalClaims = claims.length;
    const totalAmount = claims.reduce((sum, claim) => 
      sum + (claim.claim_data?.estimatedAmount || 0), 0
    );
    
    const riskDistribution = {
      high: claims.filter(c => c.fraud_assessment?.riskLevel === 'high').length,
      medium: claims.filter(c => c.fraud_assessment?.riskLevel === 'medium').length,
      low: claims.filter(c => c.fraud_assessment?.riskLevel === 'low').length
    };

    const averageProcessingTime = claims.reduce((sum, claim) => 
      sum + claim.processing_time_ms, 0
    ) / totalClaims || 0;

    // Fix: Ensure we're building claimTypeDistribution correctly
    const claimTypeDistribution = claims.reduce((acc, claim) => {
      const type = claim.claim_data?.claimType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('Claim Type Distribution:', claimTypeDistribution); // Debug log

    return {
      totalClaims,
      totalAmount,
      riskDistribution,
      averageProcessingTime,
      claimTypeDistribution, // Changed from claimTypes
      processingTrend: this.calculateProcessingTrend(claims)
    };
  } catch (error) {
    console.error('Failed to generate analytics:', error);
    // Return empty analytics structure
    return {
      totalClaims: 0,
      totalAmount: 0,
      riskDistribution: {},
      averageProcessingTime: 0,
      claimTypeDistribution: {},
      processingTrend: []
    };
  }
}
calculateProcessingTrend(claims) {
  // Group by date
  const trend = claims.reduce((acc, claim) => {
    const date = new Date(claim.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(trend).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}
}