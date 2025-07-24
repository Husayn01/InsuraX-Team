// services/fraudDetector.js
export class FraudDetector {
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

      // Validate the response structure
      if (!assessment || typeof assessment !== 'object' || !assessment.riskLevel) {
        throw new Error('Invalid fraud assessment structure');
      }

      return {
        success: true,
        assessment: assessment
      };
    } catch (error) {
      console.error('Fraud assessment failed:', error);
      return {
        success: false,
        error: `Fraud assessment failed: ${error.message}`,
        assessment: null
      };
    }
  }

  async detectAnomalies(claimData, historicalData = []) {
    if (!claimData || typeof claimData !== 'object') {
      return {
        success: false,
        error: 'Invalid claim data provided for anomaly detection'
      };
    }

    const prompt = `As a fraud detection AI, identify anomalies in this claim compared to typical patterns:

Current Claim:
${JSON.stringify(claimData, null, 2)}

${historicalData.length > 0 ? `Historical Claims for Context:
${JSON.stringify(historicalData.slice(0, 5), null, 2)}` : 'No historical data available'}

Identify anomalies in JSON format:
{
  "anomaliesDetected": true|false,
  "anomalyScore": 0-100,
  "anomalies": [
    {
      "type": "timing|amount|pattern|behavior|documentation",
      "description": "specific anomaly description",
      "significance": "low|medium|high",
      "comparison": "how this differs from normal patterns"
    }
  ],
  "normalPatterns": [
    {
      "pattern": "description of normal pattern",
      "currentClaimAlignment": "matches|deviates|unclear"
    }
  ],
  "recommendations": ["specific recommendations based on anomalies"]
}

Return ONLY valid JSON.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are an advanced anomaly detection system. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ]);

      const anomalies = this.parseJSONResponse(response.choices[0].message.content);

      return {
        success: true,
        anomalies: anomalies
      };
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return {
        success: false,
        error: `Anomaly detection failed: ${error.message}`
      };
    }
  }
}