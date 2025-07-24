// services/chatInterface.js
export class ClaimsChatInterface {
  constructor(geminiClient) {
    this.client = geminiClient;
    this.conversationHistory = [];
  }

  async processQuery(userQuery, claimContext = null) {
    const systemPrompt = `
You are an intelligent claims processing assistant. You help users understand claim status, explain decisions, and provide guidance on claim-related matters.

${claimContext ? `Current Claim Context: ${JSON.stringify(claimContext, null, 2)}` : ''}

Guidelines:
- Be helpful and professional
- Provide clear explanations
- Suggest practical next steps
- Ask clarifying questions when needed
- Reference specific claim details when available
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory,
      { role: 'user', content: userQuery }
    ];

    try {
      const response = await this.client.chatCompletion(messages);
      const assistantMessage = response.choices[0].message.content;

      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userQuery },
        { role: 'assistant', content: assistantMessage }
      );

      // Keep conversation history manageable
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return {
        success: true,
        response: assistantMessage,
        conversationId: Date.now() // Simple conversation tracking
      };
    } catch (error) {
      console.error('Chat query failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateClaimExplanation(claimData, decision, userFriendly = true) {
    const complexityLevel = userFriendly ? 'simple terms' : 'technical detail';
    
    const prompt = `Explain this claim decision in ${complexityLevel}:

Claim: ${JSON.stringify(claimData, null, 2)}
Decision: ${JSON.stringify(decision, null, 2)}

Provide a clear explanation that:
- Explains why this decision was made
- What factors were considered
- What happens next
- Any actions the claimant needs to take

Use ${complexityLevel} appropriate for the audience.`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: `You are a claims expert who explains complex insurance decisions in ${complexityLevel}.` 
        },
        { role: 'user', content: prompt }
      ]);

      return {
        success: true,
        explanation: response.choices[0].message.content
      };
    } catch (error) {
      console.error('Explanation generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async answerFAQ(question, claimType = null) {
    const prompt = `Answer this insurance claim question:

Question: ${question}
${claimType ? `Claim Type: ${claimType}` : ''}

Provide a helpful, accurate answer that:
- Directly addresses the question
- Provides relevant examples if helpful
- Suggests where to find more information
- Mentions any important caveats or exceptions`;

    try {
      const response = await this.client.chatCompletion([
        { 
          role: 'system', 
          content: 'You are an insurance expert who provides clear, helpful answers to claim-related questions.' 
        },
        { role: 'user', content: prompt }
      ]);

      return {
        success: true,
        answer: response.choices[0].message.content
      };
    } catch (error) {
      console.error('FAQ answer generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }
}