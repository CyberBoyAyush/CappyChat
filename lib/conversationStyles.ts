/**
 * Conversation Styles Configuration
 * 
 * Defines different conversation styles that modify AI behavior and response tone.
 * Each style includes a system prompt that guides the AI's responses.
 */

import {
  User,
  Sparkles,
  Building2,
  MessageCircle,
  Terminal,
  Zap,
  BookOpen,
  LucideIcon
} from "lucide-react";

export type ConversationStyle = 
  | 'Normal'
  | 'Creative' 
  | 'Professional'
  | 'Casual'
  | 'Technical'
  | 'Concise'
  | 'Educational';

export interface ConversationStyleConfig {
  id: ConversationStyle;
  name: string;
  description: string;
  icon: LucideIcon;
  systemPrompt: string;
  color: string;
}

export const CONVERSATION_STYLES: Record<ConversationStyle, ConversationStyleConfig> = {
  Normal: {
    id: 'Normal',
    name: 'Normal',
    description: 'Balanced and helpful responses',
    icon: User,
    systemPrompt: 'You are a helpful AI assistant. Provide clear, accurate, and balanced responses to user questions.',
    color: 'text-blue-500'
  },

  Creative: {
    id: 'Creative',
    name: 'Creative',
    description: 'Imaginative and innovative responses',
    icon: Sparkles,
    systemPrompt: 'You are a creative AI assistant. Provide imaginative, innovative, and artistic responses. Use metaphors, creative examples, and think outside the box while maintaining accuracy.',
    color: 'text-purple-500'
  },

  Professional: {
    id: 'Professional',
    name: 'Professional',
    description: 'Formal and business-oriented',
    icon: Building2,
    systemPrompt: 'You are a professional AI assistant. Provide formal, business-oriented responses with proper structure, professional terminology, and maintain a respectful, corporate tone.',
    color: 'text-gray-600'
  },

  Casual: {
    id: 'Casual',
    name: 'Casual',
    description: 'Friendly and conversational',
    icon: MessageCircle,
    systemPrompt: 'You are a friendly AI assistant. Use a casual, conversational tone like talking to a friend. Be warm, approachable, and use everyday language while staying helpful and accurate.',
    color: 'text-orange-500'
  },

  Technical: {
    id: 'Technical',
    name: 'Technical',
    description: 'Detailed technical explanations',
    icon: Terminal,
    systemPrompt: 'You are a technical AI assistant. Provide detailed, precise technical explanations with specific terminology, code examples when relevant, and in-depth analysis of technical concepts.',
    color: 'text-green-500'
  },

  Concise: {
    id: 'Concise',
    name: 'Concise',
    description: 'Brief and to-the-point',
    icon: Zap,
    systemPrompt: 'You are a concise AI assistant. Provide brief, direct answers that get straight to the point. Avoid unnecessary elaboration while ensuring accuracy and completeness.',
    color: 'text-yellow-500'
  },

  Educational: {
    id: 'Educational',
    name: 'Educational',
    description: 'Teaching-focused with explanations',
    icon: BookOpen,
    systemPrompt: 'You are an educational AI assistant. Focus on teaching and explaining concepts clearly. Break down complex topics, provide examples, and help users understand the "why" behind information.',
    color: 'text-indigo-500'
  }
};

export const DEFAULT_CONVERSATION_STYLE: ConversationStyle = 'Normal';

export const getConversationStyleConfig = (style: ConversationStyle): ConversationStyleConfig => {
  return CONVERSATION_STYLES[style];
};

export const getAllConversationStyles = (): ConversationStyleConfig[] => {
  return Object.values(CONVERSATION_STYLES);
};
