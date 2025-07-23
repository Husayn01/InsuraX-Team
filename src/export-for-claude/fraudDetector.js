export class FraudDetector {
  constructor(openAIClient) {
    this.client = openAIClient;
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
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('JSON parsing failed:', error);
      console.error('Content was:', content);
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }
  }

  async assessFraudRisk(claimData, additionalContext = '') {
    if (!claimData || typeof claimData !== 'object') {
      return {
        success: false,
        error: 'Invalid claim data provided for fraud assessment'
      };
    }

    const prompt = `You are an expert insurance fraud analyst. Analyze the following claim for potential fraud indicators:

Claim Information:
${JSON.stringify(claimData, null, 2)}

Additional Context:
${additionalContext}

Provide a fraud risk assessment in the following JSON format:
{
  "riskLevel": "low|medium|high|critical",
  "riskScore": 25,
  "fraudIndicators": [
    {
      "indicator": "description of suspicious element",
      "weight": "low|medium|high", 
      "explanation": "why this is concerning"
    }
  ],
  "legitimacyIndicators": [
    {
      "indicator": "description of legitimate element",
      "explanation": "why this supports legitimacy"
    }
  ],
  "recommendedActions": [
    "immediate approval|standard processing|additional verification|investigation|rejection"
  ],
  "investigationAreas": ["areas that need further investigation"],
  "overallAssessment": "detailed explanation of the fraud risk assessment",
  "confidence": "high|medium|low"
}

Consider factors like:
- Timing patterns and incident details
- Claim amounts vs typical patterns  
- Documentation quality and completeness
- Incident circumstances and plausibility
- Geographic and temporal factors

Return ONLY valid JSON, no other text.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a meticulous fraud detection specialist with years of experience. Return only valid JSON without any explanatory text.' 
        },
        { role: 'user', content: prompt }
      ]);

      const assessment = this.parseJSONResponse(response.choices[0].message.content);

      // Validate assessment structure
      if (!assessment.riskLevel || !assessment.riskScore) {
        throw new Error('Invalid assessment structure received');
      }

      return {
        success: true,
        assessment: assessment,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Fraud assessment failed:', error);
      return {
        success: false,
        error: `Fraud assessment failed: ${error.message}`
      };
    }
  }
}