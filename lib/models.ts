export const AI_MODELS = [
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash Search',
  'OpenAI 4.1 Mini',
  'OpenAI o4-mini',
  'OpenAI 4.1',
  'Claude Sonnet 3.5 Haiku',
  'DeepSeek R1-0528',
  'DeepSeek V3',
  'Qwen3 235B A22B',
  'Claude Sonnet 4',
  'Gemini 2.5 Pro',
  'Meta: Llama 4 Maverick',
  'OpenAI 4.1 Nano'
] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: 'openrouter';
  displayName: string;
  iconType: 'google' | 'openai' | 'anthropic' | 'deepseek' | 'huggingface' | 'qwen' | 'meta';
  company: string;
  isPremium: boolean;
  isSuperPremium: boolean;
  hasReasoning: boolean;
  isFileSupported: boolean;
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
    isFileSupported: true,
    description: 'Fast and efficient model from Google',
  },
  'Gemini 2.5 Flash Search': {
    modelId: 'google/gemini-2.5-flash-preview-05-20:online',
    provider: 'openrouter',
    displayName: 'Gemini 2.5 Flash Search',
    iconType: 'google',
    company: 'Google',
    isPremium: false,
    isSuperPremium: true,
    hasReasoning: true,
    isFileSupported: true,
    description: 'Fast and efficient model from Google with web search capabilities',
  },
  'OpenAI 4.1': {
    modelId: 'openai/gpt-4.1',
    provider: 'openrouter',
    displayName: 'OpenAI 4.1',
    iconType: 'openai',
    company: 'OpenAI',
    isPremium: true,
    isSuperPremium: false,
    hasReasoning: false,
    isFileSupported: true,
    description: 'Latest OpenAI flagship model',
  },
  'OpenAI 4.1 Mini': {
    modelId: 'openai/gpt-4.1-mini',
    provider: 'openrouter',
    displayName: 'OpenAI 4.1 Mini',
    iconType: 'openai',
    company: 'OpenAI',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: false,
    isFileSupported: true,
    description: 'Efficient mini version of OpenAI 4.1',
  },
  'OpenAI o4-mini': {
    modelId: 'openai/o4-mini',
    provider: 'openrouter',
    displayName: 'OpenAI o4-mini',
    iconType: 'openai',
    company: 'OpenAI',
    isPremium: true,
    isSuperPremium: false,
    hasReasoning: true,
    isFileSupported: true,
    description: 'OpenAI\'s latest mini model with advanced reasoning capabilities and coding capabilities',
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
    isFileSupported: true,
    description: 'Anthropic\'s lightest model for fast responses',
  },
  'DeepSeek R1-0528': {
    modelId: 'deepseek/deepseek-r1-0528:free',
    provider: 'openrouter',
    displayName: 'DeepSeek R1-0528',
    iconType: 'deepseek',
    company: 'DeepSeek',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: true,
    isFileSupported: false,
    description: 'Deepseek Best in the class latest advanced reasoning model',
  },
  'DeepSeek V3': {
    modelId: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter',
    displayName: 'DeepSeek V3',
    iconType: 'deepseek',
    company: 'DeepSeek',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: false,
    isFileSupported: false,
    description: 'Deepseek Top in the class model for coding and fast responses',
  },
  'Qwen3 235B A22B': {
    modelId: 'qwen/qwen3-235b-a22b:free',
    provider: 'openrouter',
    displayName: 'Qwen3 235B A22B',
    iconType: 'qwen',
    company: 'Alibaba',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: true,
    isFileSupported: false,
    description: 'Qwen3 235B A22B is a powerful model with advanced reasoning capabilities',
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
    isFileSupported: true,
    description: 'Best in the class OpenAI model with advanced reasoning',
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
    isFileSupported: true,
    description: 'Best in the class Google model with advanced reasoning and coding capabilities',
  },
  'Meta: Llama 4 Maverick': {
    modelId: 'meta-llama/llama-4-maverick',
    provider: 'openrouter',
    displayName: 'Meta: Llama 4 Maverick',
    iconType: 'meta',
    company: 'meta',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: false,
    isFileSupported: true,
    description: 'Best in the class Google model with advanced reasoning and coding capabilities',
  },
  'OpenAI 4.1 Nano': {
    modelId: 'openai/gpt-4.1-nano',
    provider: 'openrouter',
    displayName: 'OpenAI 4.1 Nano',
    iconType: 'openai',
    company: 'OpenAI',
    isPremium: false,
    isSuperPremium: false,
    hasReasoning: false,
    isFileSupported: true,
    description: 'Best in the class Google model with advanced reasoning and coding capabilities',
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
