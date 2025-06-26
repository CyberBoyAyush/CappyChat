/**
 * Memory Extraction Utility
 *
 * Simple heuristics to extract potential memories from user messages.
 * Focuses on personal information that would be useful for future conversations.
 */

// Patterns that indicate personal information worth remembering
const MEMORY_PATTERNS = [
  // Personal details
  /(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+)/i,
  /(?:i work at|i work for|my company is|my employer is)\s+([a-zA-Z\s&.,]+)/i,
  /(?:i live in|i'm from|i'm based in|my location is)\s+([a-zA-Z\s,]+)/i,
  /(?:i'm a|i am a|my job is|my role is|i work as)\s+([a-zA-Z\s]+)/i,
  /(?:my birthday is|i was born on|my birth date is)\s+([a-zA-Z0-9\s,/.-]+)/i,
  /(?:my age is|i'm|i am)\s+(\d+)\s+years?\s+old/i,
  
  // Preferences and interests
  /(?:i love|i enjoy|i like|i'm interested in|my hobby is|my hobbies are)\s+([a-zA-Z\s,]+)/i,
  /(?:i hate|i dislike|i don't like|i can't stand)\s+([a-zA-Z\s,]+)/i,
  /(?:my favorite|my favourite)\s+([a-zA-Z\s]+)\s+is\s+([a-zA-Z\s]+)/i,
  
  // Skills and education
  /(?:i know|i'm skilled in|i can|i'm good at|i'm experienced in)\s+([a-zA-Z\s,+#.-]+)/i,
  /(?:i studied|i graduated from|my degree is in|i have a degree in)\s+([a-zA-Z\s,]+)/i,
  /(?:i speak|i'm fluent in|my languages are)\s+([a-zA-Z\s,]+)/i,
  
  // Goals and projects
  /(?:i'm working on|my project is|i'm building|i'm developing)\s+([a-zA-Z\s,.-]+)/i,
  /(?:my goal is|i want to|i plan to|i'm trying to)\s+([a-zA-Z\s,.-]+)/i,
  
  // Family and relationships
  /(?:my wife|my husband|my partner|my spouse)\s+([a-zA-Z\s]+)/i,
  /(?:my child|my son|my daughter|my kids?)\s+([a-zA-Z\s,]+)/i,
  /(?:my pet|my dog|my cat)\s+([a-zA-Z\s]+)/i,
];

// Keywords that indicate important personal information
const IMPORTANT_KEYWORDS = [
  'name', 'work', 'job', 'company', 'live', 'from', 'age', 'birthday',
  'love', 'like', 'enjoy', 'hate', 'dislike', 'favorite', 'favourite',
  'skill', 'know', 'good at', 'studied', 'degree', 'graduated',
  'speak', 'language', 'fluent', 'project', 'building', 'developing',
  'goal', 'want', 'plan', 'trying', 'wife', 'husband', 'partner',
  'child', 'son', 'daughter', 'pet', 'dog', 'cat'
];

export interface ExtractedMemory {
  text: string;
  confidence: number; // 0-1 score indicating how likely this is important
  category: string;
}

/**
 * Extract potential memories from a user message
 */
export function extractMemories(message: string): ExtractedMemory[] {
  const memories: ExtractedMemory[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Skip very short messages
  if (message.length < 10) {
    return memories;
  }
  
  // Skip messages that are questions or commands
  if (message.trim().endsWith('?') || 
      lowerMessage.startsWith('what') || 
      lowerMessage.startsWith('how') || 
      lowerMessage.startsWith('when') || 
      lowerMessage.startsWith('where') || 
      lowerMessage.startsWith('why') ||
      lowerMessage.startsWith('can you') ||
      lowerMessage.startsWith('could you') ||
      lowerMessage.startsWith('please')) {
    return memories;
  }
  
  // Check for pattern matches first (higher priority)
  let patternMatched = false;
  for (const pattern of MEMORY_PATTERNS) {
    const matches = message.match(pattern);
    if (matches && matches[1]) {
      const extractedInfo = matches[1].trim();
      if (extractedInfo.length > 2 && extractedInfo.length < 100) {
        memories.push({
          text: formatMemory(matches[0].trim()),
          confidence: 0.9,
          category: getCategoryFromPattern(pattern)
        });
        patternMatched = true;
        break; // Only process the first pattern match to prevent duplicates
      }
    }
  }

  // Only check for keyword-based extraction if no specific patterns matched
  if (!patternMatched) {
    const sentences = message.split(/[.!;]/).filter(s => s.trim().length > 10);
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const keywordCount = IMPORTANT_KEYWORDS.filter(keyword =>
        lowerSentence.includes(keyword)
      ).length;

      if (keywordCount >= 2 && sentence.trim().length < 150) {
        // Check if it's a personal statement (contains "I" or "my")
        if (lowerSentence.includes(' i ') || lowerSentence.includes('my ') ||
            lowerSentence.startsWith('i ')) {
          memories.push({
            text: formatMemory(sentence.trim()),
            confidence: Math.min(0.6 + (keywordCount * 0.1), 0.8),
            category: 'general'
          });
        }
      }
    }
  }

  // Remove duplicates with improved similarity detection
  const uniqueMemories = removeDuplicateMemories(memories);

  return uniqueMemories
    .sort((a: ExtractedMemory, b: ExtractedMemory) => b.confidence - a.confidence)
    .slice(0, 1); // Limit to top 1 memory per message to prevent duplicates
}

/**
 * Format extracted memory for storage
 */
function formatMemory(text: string): string {
  // Clean up the text
  let formatted = text.trim();
  
  // Ensure it starts with a capital letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  // Ensure it ends with a period if it doesn't have punctuation
  if (formatted.length > 0 && !/[.!?]$/.test(formatted)) {
    formatted += '.';
  }
  
  return formatted;
}

/**
 * Get category from pattern match
 */
function getCategoryFromPattern(pattern: RegExp): string {
  const patternStr = pattern.toString();
  
  if (patternStr.includes('name') || patternStr.includes('call me')) return 'identity';
  if (patternStr.includes('work') || patternStr.includes('job') || patternStr.includes('company')) return 'work';
  if (patternStr.includes('live') || patternStr.includes('from') || patternStr.includes('location')) return 'location';
  if (patternStr.includes('love') || patternStr.includes('like') || patternStr.includes('favorite')) return 'preferences';
  if (patternStr.includes('skill') || patternStr.includes('know') || patternStr.includes('studied')) return 'skills';
  if (patternStr.includes('goal') || patternStr.includes('project') || patternStr.includes('building')) return 'goals';
  if (patternStr.includes('wife') || patternStr.includes('husband') || patternStr.includes('child')) return 'family';
  
  return 'general';
}

/**
 * Remove duplicate memories with improved similarity detection
 */
function removeDuplicateMemories(memories: ExtractedMemory[]): ExtractedMemory[] {
  const unique: ExtractedMemory[] = [];

  for (const memory of memories) {
    let isDuplicate = false;

    for (const existing of unique) {
      // Check for exact match
      if (memory.text.toLowerCase() === existing.text.toLowerCase()) {
        isDuplicate = true;
        break;
      }

      // Check for high similarity (60% word overlap) - more strict to prevent duplicates
      const similarity = calculateSimilarity(memory.text.toLowerCase(), existing.text.toLowerCase());
      if (similarity > 0.6) {
        // Keep the one with higher confidence
        if (memory.confidence > existing.confidence) {
          // Replace existing with new one
          const index = unique.indexOf(existing);
          unique[index] = memory;
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(memory);
    }
  }

  return unique;
}

/**
 * Check if a memory should be added (not duplicate, high enough confidence)
 */
export function shouldAddMemory(
  newMemory: ExtractedMemory, 
  existingMemories: string[]
): boolean {
  // Check confidence threshold
  if (newMemory.confidence < 0.7) {
    return false;
  }
  
  // Check for duplicates or very similar memories
  const newMemoryLower = newMemory.text.toLowerCase();
  for (const existing of existingMemories) {
    const existingLower = existing.toLowerCase();
    
    // Exact match
    if (newMemoryLower === existingLower) {
      return false;
    }
    
    // Very similar (60% overlap) - more strict to prevent duplicates
    const similarity = calculateSimilarity(newMemoryLower, existingLower);
    if (similarity > 0.6) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate similarity between two strings (simple word overlap)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}
