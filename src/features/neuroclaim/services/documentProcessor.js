export class DocumentProcessor {
  constructor(openAIClient) {
    this.client = openAIClient;
  }

  // Helper method to clean and parse JSON from AI responses
  parseJSONResponse(content) {
    try {
      // Remove any markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('JSON parsing failed:', error);
      console.error('Content was:', content);
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }
  }

  async extractClaimInformation(documentText) {
    if (!documentText || documentText.trim().length === 0) {
      return {
        success: false,
        error: 'Document text is empty or invalid',
        data: null
      };
    }

    const prompt = `You are an expert insurance claims processor. Extract structured information from the following claim document.

Document Text:
${documentText.substring(0, 8000)} ${documentText.length > 8000 ? '...(truncated)' : ''}

Please extract and return a JSON object with the following structure:
{
  "claimNumber": "string or null",
  "policyNumber": "string or null", 
  "claimantName": "string or null",
  "dateOfIncident": "YYYY-MM-DD or null",
  "dateOfClaim": "YYYY-MM-DD or null",
  "claimType": "auto|health|property|life|other",
  "incidentLocation": "string or null",
  "damageDescription": "string",
  "estimatedAmount": "number or null",
  "witnessInformation": "string or null",
  "medicalTreatment": "string or null",
  "vehicleInformation": {
    "make": "string or null",
    "model": "string or null", 
    "year": "number or null",
    "licensePlate": "string or null"
  },
  "extractedFields": ["array of field names successfully extracted"],
  "missingFields": ["array of required fields that are missing"],
  "confidence": "high|medium|low"
}

Rules:
- Only include fields that are clearly present in the document
- For amounts, extract only numbers (no currency symbols)
- Mark confidence as high if most key info is present, medium if some is unclear, low if very little is extractable
- Return ONLY valid JSON, no other text

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a precise document processing assistant that returns only valid JSON. Never include explanatory text before or after the JSON.' 
        },
        { role: 'user', content: prompt }
      ]);

      const extractedData = this.parseJSONResponse(response.choices[0].message.content);
      
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

    const prompt = `As an insurance claims validator, review the following extracted claim information for completeness and validity:

Claim Data:
${JSON.stringify(claimData, null, 2)}

Provide validation results in the following JSON format:
{
  "validationStatus": "valid|incomplete|invalid",
  "validationScore": 85,
  "issues": [
    {
      "field": "fieldName",
      "issue": "description of the issue",
      "severity": "critical|warning|info"
    }
  ],
  "recommendations": ["array of recommendations to improve claim"],
  "requiredActions": ["array of actions needed before processing"],
  "estimatedProcessingTime": "immediate|1-3 days|3-7 days|investigation required"
}

Return ONLY valid JSON, no other text.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a thorough claims validation specialist who returns only valid JSON.'
        },
        { role: 'user', content: prompt }
      ]);

      const validation = this.parseJSONResponse(response.choices[0].message.content);

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