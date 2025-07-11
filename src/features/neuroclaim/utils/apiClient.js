// utils/apiClient.js
import { OPENAI_CONFIG } from '../config/openai.js';

class OpenAIClient {
  constructor(config = OPENAI_CONFIG) {
    this.config = config;
    this.isConfigValid = this.validateConfig();
  }

  validateConfig() {
    if (!this.config.apiKey) {
      console.warn('OpenAI API key is not configured. Set REACT_APP_OPENAI_API_KEY environment variable.');
      return false;
    }
    if (!this.config.apiKey.startsWith('sk-')) {
      console.warn('OpenAI API key format appears invalid.');
      return false;
    }
    return true;
  }

  async makeRequest(endpoint, payload) {
    if (!this.isConfigValid) {
      throw new Error('OpenAI API key is not configured or invalid. Please set REACT_APP_OPENAI_API_KEY in your environment variables.');
    }

    try {
      console.log(`Making OpenAI request to ${endpoint}...`);
      
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('OpenAI API Error:', errorMessage);
        throw new Error(`OpenAI API error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('OpenAI request successful');
      return data;
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      
      // Provide more specific error messages
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to OpenAI API. Check your internet connection.');
      }
      if (error.message.includes('401')) {
        throw new Error('Authentication failed: Please check your OpenAI API key.');
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded: Please try again later.');
      }
      
      throw error;
    }
  }

  async chatCompletion(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    const payload = {
      model: options.model || this.config.model,
      messages,
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      ...options
    };

    return this.makeRequest('/chat/completions', payload);
  }

  // Health check method
  async testConnection() {
    try {
      const response = await this.chatCompletion([
        { role: 'user', content: 'Hello' }
      ]);
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const openAIClient = new OpenAIClient();
export { OpenAIClient };