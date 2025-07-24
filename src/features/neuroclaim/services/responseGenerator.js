// services/responseGenerator.js
export class ResponseGenerator {
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

  async generateClaimSummary(claimData, fraudAssessment, categorization) {
    if (!claimData || !fraudAssessment || !categorization) {
      return {
        success: false,
        error: 'Missing required data for summary generation'
      };
    }

    const prompt = `Create a comprehensive but concise claim summary for internal use:

Claim Data: ${JSON.stringify(claimData, null, 2)}
Fraud Assessment: ${JSON.stringify(fraudAssessment, null, 2)}
Categorization: ${JSON.stringify(categorization, null, 2)}

Generate a summary in this format:
{
  "executiveSummary": "2-3 sentence overview of the claim situation and key points",
  "keyDetails": {
    "claimant": "name and basic info",
    "incident": "what happened in clear terms", 
    "damages": "description and estimated amount",
    "riskFactors": "main concerns or risk indicators"
  },
  "processingStatus": "current status and next steps",
  "recommendations": [
    "actionable recommendations for claim handlers"
  ],
  "timeline": "expected processing timeline based on complexity",
  "specialNotes": "any special considerations or flags"
}

Return ONLY valid JSON, no other text.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a professional claims summarizer who creates clear, actionable summaries. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ]);

      const summary = this.parseJSONResponse(response.choices[0].message.content);

      return {
        success: true,
        summary: summary
      };
    } catch (error) {
      console.error('Summary generation failed:', error);
      return {
        success: false,
        error: `Summary generation failed: ${error.message}`
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
        error: `Customer response generation failed: ${error.message}`
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

    const prompt = `Create an internal memo about this claim for management review:

Claim Data: ${JSON.stringify(claimData, null, 2)}
Findings: ${JSON.stringify(findings, null, 2)}
Recommendations: ${JSON.stringify(recommendations, null, 2)}

Generate a structured internal memo with:
{
  "to": "Claims Management Team",
  "from": "AI Claims Processing System",
  "date": "${new Date().toLocaleDateString()}",
  "subject": "concise subject line",
  "priority": "urgent|high|normal|low",
  "summary": "executive summary paragraph",
  "keyFindings": [
    "important finding 1",
    "important finding 2"
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "requiredActions": [
    {
      "action": "specific action needed",
      "responsible": "department or role",
      "deadline": "timeframe"
    }
  ],
  "attachments": ["list of relevant documents or reports"]
}

Return ONLY valid JSON.

JSON:`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are a professional memo writer who creates clear, actionable internal communications. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ]);

      const memo = this.parseJSONResponse(response.choices[0].message.content);

      return {
        success: true,
        memo: memo
      };
    } catch (error) {
      console.error('Internal memo generation failed:', error);
      return {
        success: false,
        error: `Internal memo generation failed: ${error.message}`
      };
    }
  }
}