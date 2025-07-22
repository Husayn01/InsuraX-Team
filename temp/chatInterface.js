export class ClaimsChatInterface {
  constructor(openAIClient) {
    this.client = openAIClient;
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

  clearHistory() {
    this.conversationHistory = [];
  }
}