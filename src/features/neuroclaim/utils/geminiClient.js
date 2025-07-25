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
    // Fixed: Removed invalid API key validation
    if (this.config.apiKey.length < 20) {
      console.warn('Gemini API key appears too short.');
      return false;
    }
    return true;
  }

  // Convert OpenAI-style messages to Gemini format
  convertMessagesToGeminiFormat(messages) {
    const contents = [];
    let systemContext = '';
    
    // First, extract all system messages
    for (const message of messages) {
      if (message.role === 'system') {
        systemContext += message.content + '\n\n';
      }
    }
    
    // Then process user and assistant messages
    for (const message of messages) {
      if (message.role === 'user') {
        let content = message.content;
        // Prepend system context to the first user message
        if (systemContext && contents.length === 0) {
          content = `Context: ${systemContext.trim()}\n\n${content}`;
        }
        contents.push({
          role: 'user',
          parts: [{ text: content }]
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

  async makeRequest(endpoint, payload, retryCount = 0) {
    if (!this.isConfigValid) {
      throw new Error('Gemini API key is not configured or invalid. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }

    try {
      console.log(`Making Gemini request to ${endpoint}...`);
      
      const url = `${this.config.baseURL}${endpoint}?key=${this.config.apiKey}`;
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Gemini API Error:', errorMessage);
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Gemini request successful');
      
      // Debug logging for JSON responses
      if (payload.contents && payload.contents[0] && payload.contents[0].parts[0].text.includes('JSON')) {
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('AI Response Preview:', responseText.substring(0, 200) + '...');
      }
      
      return data;
    } catch (error) {
      console.error('Gemini API request failed:', error);
      
      // Retry logic for transient failures
      if (retryCount < 2 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
        console.log(`Retrying request... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeRequest(endpoint, payload, retryCount + 1);
      }
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Gemini API took too long to respond.');
      }
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

  // Helper to validate and clean JSON responses
  validateJSONResponse(text, expectJSON = false) {
    if (!expectJSON) return text;
    
    let cleanText = '';
    try {
      // Try to parse as-is first
      JSON.parse(text);
      return text;
    } catch (e) {
      // If parsing fails, try to extract and clean JSON
      cleanText = text.trim();
      
      // Remove markdown code blocks
      cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Extract JSON from mixed content
      const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      // Basic JSON fixes
      cleanText = cleanText
        .replace(/,\s*}/g, '}') // Remove trailing commas in objects
        .replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays
      
      try {
        JSON.parse(cleanText);
        return cleanText;
      } catch (error) {
        console.error('Failed to extract valid JSON from response:', text);
        throw new Error('AI did not return valid JSON format');
      }
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
    
    let responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Validate JSON if expected
    if (options.expectJSON) {
      responseText = this.validateJSONResponse(responseText, true);
    }
    
    // Format response to match OpenAI structure for easier migration
    return {
      choices: [{
        message: {
          content: responseText
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