// services/documentProcessor.js
import { JSONParser } from '../utils/jsonParser.js';

export class DocumentProcessor {
  constructor(geminiClient) {
    this.client = geminiClient;
  }

  async extractClaimInformation(documentText) {
    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false,
        error: 'Document text is empty or invalid',
        data: null
      };
    }

    const prompt = `You must respond with ONLY valid JSON, no other text.

Extract claim information from this document:
${documentText.substring(0, 8000)}

Required JSON structure:
{
  "claimNumber": "string or null",
  "policyNumber": "string or null",
  "claimantName": "string or null",
  "dateOfIncident": "YYYY-MM-DD or null",
  "dateOfClaim": "YYYY-MM-DD or null",
  "claimType": "auto|health|property|life|other",
  "incidentLocation": "string or null",
  "damageDescription": "string",
  "estimatedAmount": number or null,
  "witnessInformation": "string or null",
  "medicalTreatment": "string or null",
  "vehicleInformation": {
    "make": "string or null",
    "model": "string or null",
    "year": number or null,
    "licensePlate": "string or null"
  },
  "extractedFields": ["field1", "field2"],
  "missingFields": ["field1", "field2"],
  "confidence": "high|medium|low"
}

Start your response with { and end with }`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a JSON-only responder. Never include any text outside of the JSON structure. Always start with { and end with }.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const extractedData = JSONParser.parseAIResponse(response.choices[0].message.content);
      
      // Validate the response structure
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('Invalid response structure');
      }

      return {
        success: true,
        data: extractedData,
        processingTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Document extraction failed:', error);
      return {
        success: false,
        error: `Document extraction failed: ${error.message}`,
        data: null
      };
    }
  }

  async validateClaimInformation(claimData) {
    if (!claimData || typeof claimData !== 'object') {
      return {
        success: false,
        error: 'Invalid claim data provided'
      };
    }

    const prompt = `Validate this claim data and return ONLY a valid JSON object.

Required JSON format:
{
  "validationStatus": "valid",
  "validationScore": 85,
  "issues": [
    {
      "field": "fieldName",
      "issue": "description",
      "severity": "warning"
    }
  ],
  "recommendations": ["recommendation 1"],
  "requiredActions": ["action 1"],
  "estimatedProcessingTime": "1-3 days"
}

Claim data to validate:
${JSON.stringify(claimData, null, 2)}

Rules:
- validationStatus: valid, incomplete, or invalid
- validationScore: 0-100
- severity: critical, warning, or info
- estimatedProcessingTime: immediate, 1-3 days, 3-7 days, or investigation required

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a claims validator that returns only valid JSON.'
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const validation = JSONParser.parseAIResponse(response.choices[0].message.content);

      return {
        success: true,
        validation: validation
      };
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        success: false,
        error: `Validation failed: ${error.message}`
      };
    }
  }
}