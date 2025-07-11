export class ResponseGenerator {
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
}