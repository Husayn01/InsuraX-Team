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