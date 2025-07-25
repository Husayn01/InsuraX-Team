// services/responseGenerator.js
import { JSONParser } from '../utils/jsonParser.js';

export class ResponseGenerator {
  constructor(geminiClient) {
    this.client = geminiClient;
  }

  async generateClaimSummary(claimData, fraudAssessment, categorization) {
    if (!claimData || !fraudAssessment || !categorization) {
      return {
        success: false,
        error: 'Missing required data for summary generation'
      };
    }

    const prompt = `Create a claim summary. Return ONLY a valid JSON object.

Required JSON format:
{
  "executiveSummary": "2-3 sentence overview",
  "keyDetails": {
    "claimant": "John Doe",
    "incident": "Rear-end collision",
    "damages": "$5000 vehicle damage",
    "riskFactors": "None identified"
  },
  "processingStatus": "Ready for standard processing",
  "recommendations": ["Approve claim"],
  "timeline": "3-5 business days",
  "specialNotes": "No special considerations"
}

Data to summarize:
Claim: ${JSON.stringify(claimData, null, 2)}
Fraud Assessment: ${JSON.stringify(fraudAssessment, null, 2)}
Categorization: ${JSON.stringify(categorization, null, 2)}

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a claims summarizer that returns only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const summary = JSONParser.parseAIResponse(response.choices[0].message.content);

      return {
        success: true,
        summary: summary
      };
    } catch (error) {
      console.error('Summary generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateCustomerResponse(claimData, processingDecision, customerFriendly = true) {
    if (!claimData || !processingDecision) {
      return {
        success: false,
        error: 'Missing required data for customer response generation'
      };
    }

    const tone = customerFriendly ? 'professional but warm and empathetic' : 'formal and professional';
    
    const prompt = `Generate a customer-facing response about their claim status:

Claim Information: ${JSON.stringify(claimData, null, 2)}
Processing Decision: ${processingDecision}

Create a ${tone} response that:
- Acknowledges their claim submission
- Explains the current status clearly
- Provides clear next steps they need to take
- Sets appropriate expectations for timing
- Includes contact information for questions
- Uses empathetic language appropriate for their situation

Format as a professional email/letter response. Be specific about their claim details where appropriate.

Return the response text directly, not as JSON.`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: `You are a skilled customer service representative who creates ${tone} communications that help customers understand their claim status clearly.` 
        },
        { role: 'user', content: prompt }
      ]);

      return {
        success: true,
        response: response.choices[0].message.content
      };
    } catch (error) {
      console.error('Customer response generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateInternalMemo(claimData, findings, recommendations) {
    if (!claimData || !findings || !recommendations) {
      return {
        success: false,
        error: 'Missing required data for internal memo generation'
      };
    }

    const prompt = `Create an internal memo. Return ONLY a valid JSON object.

Required JSON format:
{
  "to": "Claims Management Team",
  "from": "AI Claims Processing System",
  "date": "${new Date().toLocaleDateString()}",
  "subject": "Claim Review - CLM123",
  "priority": "normal",
  "summary": "Summary paragraph",
  "keyFindings": ["finding 1", "finding 2"],
  "recommendations": ["recommendation 1"],
  "requiredActions": [
    {
      "action": "Review claim",
      "responsible": "Claims dept",
      "deadline": "48 hours"
    }
  ],
  "attachments": ["claim_form.pdf"]
}

Data for memo:
Claim: ${JSON.stringify(claimData, null, 2)}
Findings: ${JSON.stringify(findings, null, 2)}
Recommendations: ${JSON.stringify(recommendations, null, 2)}

Rules:
- priority: urgent, high, normal, or low

JSON output:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a memo writer that returns only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], { expectJSON: true });

      const memo = JSONParser.parseAIResponse(response.choices[0].message.content);

      return {
        success: true,
        memo: memo
      };
    } catch (error) {
      console.error('Internal memo generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}