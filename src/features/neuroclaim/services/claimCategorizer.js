// services/claimCategorizer.js
import { JSONParser } from '../utils/jsonParser.js';

export class ClaimCategorizer {
  constructor(geminiClient) {
    this.client = geminiClient;
  }

  async categorizeAndPrioritize(claimData, fraudAssessment) {
    if (!claimData || typeof claimData !== 'object') {
      return {
        success: false,
        error: 'Invalid claim data provided for categorization'
      };
    }

    if (!fraudAssessment || typeof fraudAssessment !== 'object') {
      return {
        success: false,
        error: 'Invalid fraud assessment provided for categorization'
      };
    }

    const prompt = `Categorize and prioritize this claim. Return ONLY a valid JSON object.

Required JSON format:
{
  "category": {
    "primary": "auto_collision",
    "secondary": "rear_end",
    "complexity": "standard"
  },
  "priority": {
    "level": "high",
    "score": 7,
    "reasoning": "high amount claim"
  },
  "routing": {
    "department": "auto_claims",
    "assignmentType": "senior_adjuster",
    "estimatedHandlingTime": "3-5 days"
  },
  "processingRecommendations": ["recommendation 1"],
  "nextSteps": ["step 1"]
}

Claim data:
${JSON.stringify(claimData, null, 2)}

Fraud assessment:
${JSON.stringify(fraudAssessment, null, 2)}

Rules:
- primary: auto_collision, auto_comprehensive, health_medical, health_dental, property_damage, property_theft, life, or other
- complexity: simple, standard, complex, or exceptional
- level: urgent, high, normal, or low
- score: 1-10
- department: auto_claims, health_claims, property_claims, special_investigations, or fraud_unit
- assignmentType: automated, junior_adjuster, senior_adjuster, specialist, or investigation_team
- estimatedHandlingTime: 1-2 hours, 1-2 days, 3-5 days, 1-2 weeks, or extended_investigation

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a claims categorization expert that returns only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const categorization = JSONParser.parseAIResponse(response.choices[0].message.content);

      // Validate the response structure
      if (!categorization || !categorization.category || !categorization.priority) {
        throw new Error('Invalid categorization structure');
      }

      return {
        success: true,
        categorization: categorization
      };
    } catch (error) {
      console.error('Categorization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async determineClaimType(claimDescription) {
    if (!claimDescription || typeof claimDescription !== 'string') {
      return {
        success: false,
        error: 'Invalid claim description provided'
      };
    }

    const prompt = `Determine claim type from description. Return ONLY a valid JSON object.

Required JSON format:
{
  "primaryType": "auto",
  "subType": "collision",
  "confidence": "high",
  "keywords": ["accident", "collision"],
  "requiresSpecialist": false
}

Description:
${claimDescription}

Rules:
- primaryType: auto, health, property, life, liability, workers_comp, or other
- confidence: high, medium, or low
- requiresSpecialist: true or false

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a claim classification expert that returns only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const typeInfo = JSONParser.parseAIResponse(response.choices[0].message.content);

      return {
        success: true,
        typeInfo: typeInfo
      };
    } catch (error) {
      console.error('Claim type determination failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}