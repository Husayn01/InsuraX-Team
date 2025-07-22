const getOpenAIConfig = () => {
  // Use Vite's import.meta.env instead of process.env
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  
  return {
    apiKey,
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2000
  };
};

export const OPENAI_CONFIG = getOpenAIConfig();
export { getOpenAIConfig };