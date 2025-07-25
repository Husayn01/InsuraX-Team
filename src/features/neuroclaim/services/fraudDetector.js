// services/fraudDetector.js
import { JSONParser } from '../utils/jsonParser.js';

export class FraudDetector {
  constructor(geminiClient) {
    this.client = geminiClient;
  }

  async assessFraudRisk(claimData, additionalContext = '') {
    if (!claimData || typeof claimData !== 'object') {
      return {
        success: false,
        error: 'Invalid claim data provided for fraud assessment'
      };
    }

    const prompt = `Analyze this insurance claim for fraud risk and return ONLY a valid JSON object.

Required JSON format:
{
  "riskLevel": "low",
  "riskScore": 25,
  "fraudIndicators": [
    {
      "indicator": "description",
      "weight": "low",
      "explanation": "why concerning"
    }
  ],
  "legitimacyIndicators": [
    {
      "indicator": "description",
      "explanation": "why legitimate"
    }
  ],
  "recommendedActions": ["standard processing"],
  "investigationAreas": ["area 1"],
  "overallAssessment": "detailed explanation",
  "confidence": "high"
}

Claim to analyze:
${JSON.stringify(claimData, null, 2)}

Additional context:
${additionalContext}

Rules:
- riskLevel: low, medium, high, or critical
- riskScore: 0-100
- weight: low, medium, or high
- confidence: high, medium, or low
- recommendedActions: immediate approval, standard processing, additional verification, investigation, or rejection

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a fraud detection specialist that returns only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const assessment = JSONParser.parseAIResponse(response.choices[0].message.content);

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
        error: error.message,
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

    const prompt = `Detect anomalies in this claim and return ONLY a valid JSON object.

Required JSON format:
{
  "anomaliesDetected": true,
  "anomalyScore": 75,
  "anomalies": [
    {
      "type": "timing",
      "description": "specific anomaly",
      "significance": "high",
      "comparison": "differs from normal"
    }
  ],
  "normalPatterns": [
    {
      "pattern": "normal pattern description",
      "currentClaimAlignment": "matches"
    }
  ],
  "recommendations": ["recommendation 1"]
}

Current claim:
${JSON.stringify(claimData, null, 2)}

${historicalData.length > 0 ? `Historical data:
${JSON.stringify(historicalData.slice(0, 5), null, 2)}` : ''}

Rules:
- anomaliesDetected: true or false
- anomalyScore: 0-100
- type: timing, amount, pattern, behavior, or documentation
- significance: low, medium, or high
- currentClaimAlignment: matches, deviates, or unclear

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are an anomaly detection system that returns only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const anomalies = JSONParser.parseAIResponse(response.choices[0].message.content);

      return {
        success: true,
        anomalies: anomalies
      };
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}