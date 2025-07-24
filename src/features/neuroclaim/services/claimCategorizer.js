// services/claimCategorizer.js
export class ClaimCategorizer {
  constructor(geminiClient) {
    this.client = geminiClient;
  }

  // Helper method to clean and parse JSON responses
  parseJSONResponse(content) {
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Remove any text before the first { or [
      const jsonStart = Math.min(
        cleanContent.indexOf('{') !== -1 ? cleanContent.indexOf('{') : Infinity,
        cleanContent.indexOf('[') !== -1 ? cleanContent.indexOf('[') : Infinity
      );
      if (jsonStart !== Infinity && jsonStart > 0) {
        cleanContent = cleanContent.substring(jsonStart);
      }
      
      // Remove any text after the last } or ]
      const lastBrace = cleanContent.lastIndexOf('}');
      const lastBracket = cleanContent.lastIndexOf(']');
      const jsonEnd = Math.max(lastBrace, lastBracket);
      if (jsonEnd !== -1 && jsonEnd < cleanContent.length - 1) {
        cleanContent = cleanContent.substring(0, jsonEnd + 1);
      }
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('JSON parsing failed:', error);
      console.error('Content was:', content);
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }
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

    const prompt = `As a claims processing manager, categorize and prioritize this claim based on the information and fraud assessment:

Claim Data:
${JSON.stringify(claimData, null, 2)}

Fraud Assessment:
${JSON.stringify(fraudAssessment, null, 2)}

Provide categorization and prioritization in this JSON format:
{
  "category": {
    "primary": "auto_collision|auto_comprehensive|health_medical|health_dental|property_damage|property_theft|life|other",
    "secondary": "specific subcategory",
    "complexity": "simple|standard|complex|exceptional"
  },
  "priority": {
    "level": "urgent|high|normal|low",
    "score": 7,
    "reasoning": "explanation for priority assignment"
  },
  "routing": {
    "department": "auto_claims|health_claims|property_claims|special_investigations|fraud_unit",
    "assignmentType": "automated|junior_adjuster|senior_adjuster|specialist|investigation_team",
    "estimatedHandlingTime": "1-2 hours|1-2 days|3-5 days|1-2 weeks|extended_investigation"
  },
  "processingRecommendations": [
    "specific recommendations for processing this claim"
  ],
  "nextSteps": [
    "immediate actions required"
  ]
}

Rules:
- Base priority on fraud risk, claim amount, complexity, and urgency
- Route high-risk claims to appropriate investigation teams
- Consider workload distribution and expertise requirements
- Provide actionable next steps

Return ONLY valid JSON, no other text.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are an experienced claims manager who excels at efficient claim routing and prioritization. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ]);

      const categorization = this.parseJSONResponse(response.choices[0].message.content);

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
        error: `Categorization failed: ${error.message}`
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

    const prompt = `Based on this claim description, determine the claim type:

Description: ${claimDescription}

Return a JSON object:
{
  "primaryType": "auto|health|property|life|liability|workers_comp|other",
  "subType": "specific subcategory",
  "confidence": "high|medium|low",
  "keywords": ["relevant keywords identified"],
  "requiresSpecialist": true|false
}

Return ONLY valid JSON.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a claim type classification expert. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ]);

      const typeInfo = this.parseJSONResponse(response.choices[0].message.content);

      return {
        success: true,
        typeInfo: typeInfo
      };
    } catch (error) {
      console.error('Claim type determination failed:', error);
      return {
        success: false,
        error: `Claim type determination failed: ${error.message}`
      };
    }
  }
}