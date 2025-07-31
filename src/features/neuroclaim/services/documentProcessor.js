// features/neuroclaim/services/DocumentProcessor.js
import { JSONParser } from '../utils/jsonParser.js';

export class DocumentProcessor {
  constructor(geminiClient) {
    this.client = geminiClient;
  }

  /**
   * Extract structured claim information from document text
   * Enhanced version that better handles various document formats
   */
  async extractClaimInformation(documentText) {
    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false,
        error: 'No document text provided'
      };
    }

   const prompt = `Extract claim information from the following document text. Return ONLY a valid JSON object with the extracted information.

Document text:
${documentText}

Return a JSON object with these fields (use null for missing information):
{
  "claimType": "auto|health|property|general|null",
  "dateOfIncident": "MM-DD-YYYY format or null",
  "incidentLocation": "location string or null", 
  "incidentDescription": "detailed description or null",
  "claimAmount": number or null,
  "estimatedAmount": number or null,
  "claimantName": "full name or null",
  "claimantAddress": "address or null",
  "contactPhone": "phone number or null",
  "contactEmail": "email or null",
  "policyNumber": "policy number or null",
  "claimNumber": "claim number or null",
  "vehicleInfo": {
    "make": "string or null",
    "model": "string or null",
    "year": "string or null",
    "plateNumber": "string or null"
  },
  "injuries": ["list of injuries"] or [],
  "witnesses": ["list of witness names"] or [],
  "policeReportNumber": "report number or null",
  "additionalInfo": "any other relevant information"
}

Important:
- Extract the claim number if present (usually starts with CLM- or similar)
- For claimType, determine based on content: auto (vehicle-related), health (medical), property (home/building), or general (other)
- Extract dates in YYYY-MM-DD format
- Extract monetary amounts as numbers without currency symbols (remove ₦, NGN, Naira, commas, etc.)
- Look for amounts in fields like "Estimated Repair Cost", "claim amount", "damage estimate", etc.
- Include all relevant information found in the document

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a document analyzer that extracts structured information from insurance claim documents. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { 
        expectJSON: true,
        temperature: 0.1 // Lower temperature for more consistent extraction
      });

      const extractedData = JSONParser.parseAIResponse(response.choices[0].message.content);

      // Validate and clean the extracted data
      const cleanedData = this.validateAndCleanExtractedData(extractedData);

      return {
        success: true,
        claimData: cleanedData,
        confidence: this.calculateExtractionConfidence(cleanedData)
      };
    } catch (error) {
      console.error('Information extraction failed:', error);
      return {
        success: false,
        error: error.message,
        claimData: null
      };
    }
  }

  /**
   * Validate and clean extracted data
   */
  validateAndCleanExtractedData(data) {
  const cleaned = {};

  // Claim type validation
  const validClaimTypes = ['auto', 'health', 'property', 'general'];
  cleaned.claimType = validClaimTypes.includes(data.claimType) ? data.claimType : null;

  // Date validation and formatting - CHANGED FIELD NAME
  cleaned.dateOfIncident = this.parseDate(data.dateOfIncident);

  // Location cleaning
  cleaned.incidentLocation = this.cleanString(data.incidentLocation);

  // Description cleaning
  cleaned.incidentDescription = this.cleanString(data.incidentDescription);

  // Amount validation - CHANGED FIELD NAME
  cleaned.estimatedAmount = this.parseAmount(data.estimatedAmount);

  // Claim number - NEW FIELD
  cleaned.claimNumber = this.cleanString(data.claimNumber);

  // Contact information
  cleaned.claimantName = this.cleanString(data.claimantName);
  cleaned.claimantAddress = this.cleanString(data.claimantAddress);
  cleaned.contactPhone = this.cleanPhone(data.contactPhone);
  cleaned.contactEmail = this.validateEmail(data.contactEmail);

  // Policy number
  cleaned.policyNumber = this.cleanString(data.policyNumber);

  // Vehicle info (for auto claims)
  if (data.vehicleInfo && typeof data.vehicleInfo === 'object') {
    cleaned.vehicleInfo = {
      make: this.cleanString(data.vehicleInfo.make),
      model: this.cleanString(data.vehicleInfo.model),
      year: this.cleanString(data.vehicleInfo.year),
      plateNumber: this.cleanString(data.vehicleInfo.plateNumber)
    };
  }

  // Arrays
  cleaned.injuries = Array.isArray(data.injuries) ? data.injuries.filter(i => i && typeof i === 'string') : [];
  cleaned.witnesses = Array.isArray(data.witnesses) ? data.witnesses.filter(w => w && typeof w === 'string') : [];

  // Other fields
  cleaned.policeReportNumber = this.cleanString(data.policeReportNumber);
  cleaned.additionalInfo = this.cleanString(data.additionalInfo);

  return cleaned;
}

  /**
   * Parse date string to YYYY-MM-DD format
   */
  parseDate(dateString) {
    if (!dateString) return null;

    try {
      // Try to parse various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;

      // Return in YYYY-MM-DD format
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Parse amount from various formats
   */
parseAmount(value) {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Remove currency symbols (including Naira), commas, and spaces
    const cleaned = value
      .replace(/[₦$£€¥,\s]/g, '')
      .replace(/NGN/gi, '') // Remove NGN text
      .replace(/naira/gi, '') // Remove 'naira' text
      .trim();
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

  /**
   * Clean string values
   */
  cleanString(str) {
    if (!str || typeof str !== 'string') return null;
    const cleaned = str.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  /**
   * Clean and validate phone number
   */
  cleanPhone(phone) {
    if (!phone) return null;
    
    // Remove non-numeric characters except + for international
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Basic validation - at least 10 digits
    if (cleaned.replace(/\D/g, '').length < 10) return null;
    
    return cleaned;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) ? email.trim().toLowerCase() : null;
  }

  /**
   * Calculate confidence score for extracted data
   */
calculateExtractionConfidence(data) {
  let score = 0;
  let fields = 0;

  // Critical fields (weighted higher)
  const criticalFields = [
    { field: 'claimType', weight: 2 },
    { field: 'dateOfIncident', weight: 2 },  // CHANGED from incidentDate
    { field: 'incidentDescription', weight: 2 },
    { field: 'estimatedAmount', weight: 1.5 }  // CHANGED from claimAmount
  ];

  // Regular fields
  const regularFields = [
    'incidentLocation',
    'claimantName',
    'contactPhone',
    'policyNumber',
    'claimNumber'  // ADDED
  ];
    // Check critical fields
    criticalFields.forEach(({ field, weight }) => {
      if (data[field] !== null && data[field] !== undefined) {
        score += weight;
      }
      fields += weight;
    });

    // Check regular fields
    regularFields.forEach(field => {
      if (data[field] !== null && data[field] !== undefined) {
        score += 1;
      }
      fields += 1;
    });

    return score / fields; // Returns a value between 0 and 1
  }

  /**
   * Extract text from various file types
   * This is a placeholder - in production, use appropriate libraries
   */
  async extractTextFromFile(file) {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return this.extractFromTextFile(file);
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractFromPDF(file);
    } else if (fileType.includes('image/')) {
      return this.extractFromImage(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
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
    // In production, use pdf.js or similar
    return `[PDF Content - ${file.name}]\n\nPDF extraction would happen here in production using libraries like pdf.js`;
  }

  async extractFromImage(file) {
    // In production, use OCR service
    return `[Image Content - ${file.name}]\n\nOCR extraction would happen here in production using services like Google Vision API or Tesseract`;
  }

  /**
   * Merge multiple extraction results
   */
  mergeExtractionResults(results) {
    const merged = {};
    
    // Priority order for fields (later results override earlier ones if not null)
    results.forEach(result => {
      if (!result || !result.claimData) return;
      
      Object.keys(result.claimData).forEach(key => {
        const value = result.claimData[key];
        
        // Only override if new value is not null and current is null
        // or if new value has higher confidence
        if (value !== null && value !== undefined) {
          if (merged[key] === null || merged[key] === undefined) {
            merged[key] = value;
          }
        }
      });
    });
    
    return merged;
  }

  /**
   * Intelligent form pre-filling based on extraction confidence
   */
  generatePreFillRecommendations(extractedData, confidence) {
    const recommendations = {
      autoFill: [],
      requireConfirmation: [],
      manualEntry: []
    };

    Object.entries(extractedData).forEach(([field, value]) => {
      if (value === null || value === undefined) {
        recommendations.manualEntry.push(field);
      } else if (confidence > 0.8) {
        recommendations.autoFill.push(field);
      } else {
        recommendations.requireConfirmation.push(field);
      }
    });

    return recommendations;
  }
}

export default DocumentProcessor;