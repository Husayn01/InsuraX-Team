// utils/geminiClient.js
import { GEMINI_CONFIG } from '../config/gemini.js';

class GeminiClient {
  constructor(config = GEMINI_CONFIG) {
    this.config = config;
    this.isConfigValid = this.validateConfig();
  }

  validateConfig() {
    if (!this.config.apiKey) {
      console.warn('Gemini API key is not configured. Set VITE_GEMINI_API_KEY environment variable.');
      return false;
    }
    if (!this.config.apiKey.includes('AI')) {
      console.warn('Gemini API key format appears invalid.');
      return false;
    }
    return true;
  }

  // Convert OpenAI-style messages to Gemini format
  convertMessagesToGeminiFormat(messages) {
    const contents = [];
    
    for (const message of messages) {
      if (message.role === 'system') {
        // Gemini doesn't have a system role, so we prepend it to the first user message
        if (contents.length === 0 || contents[0].role !== 'user') {
          contents.unshift({
            role: 'user',
            parts: [{ text: `System: ${message.content}\n\nUser: ` }]
          });
        } else {
          contents[0].parts[0].text = `System: ${message.content}\n\n${contents[0].parts[0].text}`;
        }
      } else if (message.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: message.content }]
        });
      } else if (message.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: message.content }]
        });
      }
    }
    
    return contents;
  }

  async makeRequest(endpoint, payload) {
    if (!this.isConfigValid) {
      throw new Error('Gemini API key is not configured or invalid. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }

    try {
      console.log(`Making Gemini request to ${endpoint}...`);
      
      const url = `${this.config.baseURL}${endpoint}?key=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Gemini API Error:', errorMessage);
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Gemini request successful');
      return data;
    } catch (error) {
      console.error('Gemini API request failed:', error);
      
      // Provide more specific error messages
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Gemini API. Check your internet connection.');
      }
      if (error.message.includes('403')) {
        throw new Error('Authentication failed: Please check your Gemini API key.');
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded: Please try again later.');
      }
      
      throw error;
    }
  }

  async generateContent(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    // Convert messages to Gemini format
    const contents = this.convertMessagesToGeminiFormat(messages);

    const payload = {
      contents,
      generationConfig: {
        ...this.config.generationConfig,
        temperature: options.temperature || this.config.generationConfig.temperature,
        maxOutputTokens: options.maxTokens || this.config.generationConfig.maxOutputTokens,
      },
      safetySettings: this.config.safetySettings
    };

    const endpoint = `/models/${this.config.model}:generateContent`;
    const response = await this.makeRequest(endpoint, payload);
    
    // Format response to match OpenAI structure for easier migration
    return {
      choices: [{
        message: {
          content: response.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
      }]
    };
  }

  // Compatibility method to match OpenAI's chatCompletion
  async chatCompletion(messages, options = {}) {
    return this.generateContent(messages, options);
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

export const geminiClient = new GeminiClient();
export { GeminiClient };