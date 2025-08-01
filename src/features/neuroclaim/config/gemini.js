// config/gemini.js
const getGeminiConfig = () => {
  // Use Vite's import.meta.env for environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  return {
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.5, // Increased from 0.3 for better JSON formatting consistency
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096, // Increased from 2048 to prevent truncation
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  };
};

export const GEMINI_CONFIG = getGeminiConfig();
export { getGeminiConfig };

// Add this configuration to your gemini.js config file
export const PROCESSING_CONFIG = {
  // Reduce the number of sequential API calls
  enableInternalMemo: false, // Disable internal memo generation for now
  enableCustomerResponse: true,
  enableSummary: true,
  
  // Add delays between API calls to avoid rate limiting
  apiCallDelay: 500, // 500ms delay between calls
  
  // Timeout settings
  individualCallTimeout: 15000, // 15 seconds per API call
  totalProcessingTimeout: 60000, // 1 minute total
  
  // Retry settings
  maxRetries: 2,
  retryDelay: 1000,
  
  // Batch processing settings
  batchAPICallsWhenPossible: true
};

// Helper function to add delays between API calls
export const delayBetweenAPICalls = async (ms = PROCESSING_CONFIG.apiCallDelay) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Update your claimsOrchestrator to use these settings:
// In processClaimComplete method, add delays between API calls:

// After extraction
await delayBetweenAPICalls();

// After fraud detection
await delayBetweenAPICalls();

// After categorization
await delayBetweenAPICalls();
