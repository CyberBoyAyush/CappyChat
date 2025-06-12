export const AI_MODELS = [
  'Gemini 2.5 Flash',
  'Gemini 2.5 Pro',
  'OpenAI 4.1',
  'OpenAI 4.1 Mini',
  'Claude Sonnet 4',
  'Claude Sonnet 3.5 Haiku',
  'DeepSeek R1 (Free)',
  'DeepSeek V3 (Free)',
  'Sarvam M'
] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: 'openrouter';
  displayName: string;
  iconType: 'google' | 'openai' | 'anthropic' | 'deepseek' | 'huggingface';
  company: string;
  isPremium: boolean;
  isSuperPremium: boolean;
  hasReasoning: boolean;
  description: string;
};

export const MODEL_CONFIGS = {
  'Gemini 2.5 Flash': {
    modelId: 'google/gemini-2.5-flash-preview-05-20',
    provider: 'openrouter',
    displayName: 'Gemini 2.5 Flash',
    iconType: 'google',
    company: 'Google',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: true,
    description: 'Fast and efficient model with reasoning capabilities',
  },
  'Gemini 2.5 Pro': {
    modelId: 'google/gemini-2.5-pro-preview-05-06',
    provider: 'openrouter',
    displayName: 'Gemini 2.5 Pro',
    iconType: 'google',
    company: 'Google',
    isPremium: false,
    isSuperPremium: true,
    hasReasoning: true,
    description: 'Advanced reasoning and complex problem solving',
  },
  'OpenAI 4.1': {
    modelId: 'openai/gpt-4o',
    provider: 'openrouter',
    displayName: 'OpenAI 4.1',
    iconType: 'openai',
    company: 'OpenAI',
    isPremium: true,
    isSuperPremium: false,
    hasReasoning: false,
    description: 'Latest OpenAI flagship model',
  },
  'OpenAI 4.1 Mini': {
    modelId: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    displayName: 'OpenAI 4.1 Mini',
    iconType: 'openai',
    company: 'OpenAI',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: false,
    description: 'Efficient and cost-effective model',
  },
  'Claude Sonnet 4': {
    modelId: 'anthropic/claude-sonnet-4',
    provider: 'openrouter',
    displayName: 'Claude Sonnet 4',
    iconType: 'anthropic',
    company: 'Anthropic',
    isPremium: false,
    isSuperPremium: true,
    hasReasoning: true,
    description: 'Advanced coding and reasoning capabilities',
  },
  'Claude Sonnet 3.5 Haiku': {
    modelId: 'anthropic/claude-3.5-sonnet',
    provider: 'openrouter',
    displayName: 'Claude Sonnet 3.5 Haiku',
    iconType: 'anthropic',
    company: 'Anthropic',
    isPremium: true,
    isSuperPremium: false,
    hasReasoning: false,
    description: 'Balanced performance and capability',
  },
  'DeepSeek R1 (Free)': {
    modelId: 'deepseek/deepseek-r1-0528:free',
    provider: 'openrouter',
    displayName: 'DeepSeek R1 (Free)',
    iconType: 'deepseek',
    company: 'DeepSeek',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: true,
    description: 'Free reasoning model with chain-of-thought',
  },
  'DeepSeek V3 (Free)': {
    modelId: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter',
    displayName: 'DeepSeek V3 (Free)',
    iconType: 'deepseek',
    company: 'DeepSeek',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: false,
    description: 'Free general-purpose chat model',
  },
  'Sarvam M': {
    modelId: 'sarvamai/sarvam-m:free',
    provider: 'openrouter',
    displayName: 'Sarvam M',
    iconType: 'huggingface',
    company: 'Sarvam',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: true,
    description: 'Free general-purpose chat model',
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  const config = MODEL_CONFIGS[modelName];
  if (!config) {
    console.error(`Model config not found for: ${modelName}. Available models:`, Object.keys(MODEL_CONFIGS));
    // Return a fallback config for the first available model
    return MODEL_CONFIGS['Gemini 2.5 Flash'];
  }
  return config;
};
