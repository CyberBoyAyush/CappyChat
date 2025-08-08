import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, smoothStream } from 'ai';
import { getModelConfig, AIModel } from '@/lib/models';
import { getConversationStyleConfig, ConversationStyle, DEFAULT_CONVERSATION_STYLE } from '@/lib/conversationStyles';
import { NextRequest, NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits, getUserCustomProfileServer, getProjectPromptServer } from '@/lib/tierSystem';
import { Client, Databases, Query } from 'node-appwrite';

export const maxDuration = 60;

/**
 * Get user's global memory using server-side API (for API routes)
 */
const getGlobalMemoryServer = async (userId: string): Promise<{ memories: string[]; enabled: boolean } | null> => {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);

    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_GLOBAL_MEMORY_COLLECTION_ID || 'global_memory',
      [Query.equal('userId', userId)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0] as any;
    return {
      memories: doc.memories || [],
      enabled: doc.enabled || false,
    };
  } catch (error) {
    console.error('[Server] Failed to get global memory:', error);
    return null;
  }
};



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, conversationStyle, userApiKey, experimental_attachments, userId, threadId, isGuest } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!model || typeof model !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Model is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guest user restrictions - force OpenAI 4.1 Mini for guest users
    let actualModel = model;
    if (isGuest) {
      // Force guest users to use OpenAI 4.1 Mini regardless of what model is sent
      actualModel = 'OpenAI 4.1 Mini';
    }

    const modelConfig = getModelConfig(actualModel as AIModel);

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid model specified' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Additional guest user restrictions
    if (isGuest) {
      // Disable attachments for guest users
      if (experimental_attachments && experimental_attachments.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'File attachments are not available for guest users. Please sign up to use this feature.',
            code: 'GUEST_ATTACHMENTS_RESTRICTED'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Disable conversation styles for guest users (except default)
      if (conversationStyle && conversationStyle !== DEFAULT_CONVERSATION_STYLE) {
        return new Response(
          JSON.stringify({
            error: 'Conversation styles are not available for guest users. Please sign up to use this feature.',
            code: 'GUEST_STYLES_RESTRICTED'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Skip tier validation and credit consumption for guest users
    if (!isGuest) {
      // Check if user can use this model (tier validation)
      const usingBYOK = !!userApiKey;

      const tierValidation = await canUserUseModel(actualModel as AIModel, usingBYOK, userId, isGuest);

      if (!tierValidation.canUseModel) {
        return new Response(
          JSON.stringify({
            error: tierValidation.message || 'Model access denied',
            code: 'TIER_LIMIT_EXCEEDED'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Consume credits before making the API call
      const creditsConsumed = await consumeCredits(actualModel as AIModel, usingBYOK, userId, isGuest);
      if (!creditsConsumed && !usingBYOK) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient credits for this model',
            code: 'INSUFFICIENT_CREDITS'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Use user's API key if provided, otherwise fall back to system key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured. Please add your API key in Settings → Application.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // All models now use OpenRouter with app identification headers
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': 'https://avchat.xyz/',
        'X-Title': 'AVChat - AI Chat Application',
        'User-Agent': 'AVChat/1.0.0'
      }
    });
    const aiModel = openrouter(modelConfig.modelId);

    // Get conversation style configuration
    const styleConfig = getConversationStyleConfig(
      (conversationStyle as ConversationStyle) || DEFAULT_CONVERSATION_STYLE
    );

    // Get user custom profile for personalization (skip for guest users)
    let customProfile = null;
    let projectPrompt = null;
    let globalMemory = null;
    if (userId && !isGuest) {
      try {
        customProfile = await getUserCustomProfileServer(userId);
        if (threadId) {
          projectPrompt = await getProjectPromptServer(userId, threadId);
        }
        // Get global memory if enabled
        globalMemory = await getGlobalMemoryServer(userId);
      } catch (error) {
        console.error('Failed to get custom profile, project prompt, or global memory:', error);
      }
    }

    // Collect all files from the conversation history for context
    const conversationFiles: any[] = [];

    // First pass: collect all files from all messages in the conversation
    messages.forEach((message: Record<string, unknown>) => {
      if (message.experimental_attachments && Array.isArray(message.experimental_attachments)) {
        message.experimental_attachments.forEach((attachment: Record<string, unknown>) => {
          const fileType = attachment.fileType as string;
          if ((fileType === 'text' || fileType === 'document') && attachment.textContent) {
            conversationFiles.push({
              fileName: attachment.originalName as string,
              fileType: fileType,
              textContent: attachment.textContent as string,
              messageRole: message.role as string
            });
          }
        });
      }
    });

    console.log(`📂 Collected ${conversationFiles.length} files from conversation history:`,
      conversationFiles.map(f => ({ fileName: f.fileName, fileType: f.fileType, contentLength: f.textContent.length }))
    );

    // Process messages to handle experimental_attachments
    const processedMessages = messages.map((message: Record<string, unknown>) => {
      if (message.experimental_attachments && Array.isArray(message.experimental_attachments) && message.experimental_attachments.length > 0) {
        console.log('Processing message with experimental_attachments:', message.experimental_attachments.length);

        // Separate text/document attachments from other attachments
        const textAttachments: any[] = [];
        const otherAttachments: any[] = [];

        message.experimental_attachments.forEach((attachment: Record<string, unknown>) => {
          const fileType = attachment.fileType as string;

          if (fileType === 'text' || fileType === 'document') {
            textAttachments.push(attachment);
          } else {
            otherAttachments.push(attachment);
          }
        });

        // Build message content with text attachments included
        let messageContent = message.content as string;

        if (textAttachments.length > 0) {
          // For the current message, just indicate that files were uploaded
          // The actual content is already in the system prompt for context
          const fileNames = textAttachments.map((attachment: Record<string, unknown>) => {
            const fileName = attachment.originalName as string;
            const fileType = attachment.fileType as string;
            const fileTypeLabel = fileType === 'text' ? 'text file' : 'document';
            return `${fileTypeLabel} "${fileName}"`;
          });

          messageContent = messageContent + `\n\n[User uploaded: ${fileNames.join(', ')}]`;
        }

        // Convert remaining attachments to AI SDK format (only non-text files)
        const aiSdkAttachments = otherAttachments.map((attachment: Record<string, unknown>) => ({
          name: (attachment.originalName || attachment.filename) as string,
          contentType: (attachment.mimeType || attachment.contentType) as string,
          url: attachment.url as string,
        }));



        return {
          ...message,
          content: messageContent,
          // Only pass non-text attachments to the AI model
          experimental_attachments: aiSdkAttachments.length > 0 ? aiSdkAttachments : undefined,
        };
      }
      return message;
    }) as Parameters<typeof streamText>[0]['messages'];

    console.log('Final processed messages:', processedMessages?.length);

    console.log('Sending request to AI SDK with model:', modelConfig.modelId);
    console.log('Number of processed messages:', processedMessages?.length);

    // Build system prompt with custom profile information
    let systemPrompt = `
      ${styleConfig.systemPrompt}

      You are AVChat, an ai assistant that can answer questions and help with tasks.
      Your developer's name are Ayush Sharma and Vranda Garg
      Be helpful and provide relevant information about any documents, images, or files that are shared with you.
      Be respectful and polite in all interactions.
      Always use LaTeX for mathematical expressions -
      Inline math must be wrapped in single dollar signs: $content$
      Display math must be wrapped in double dollar signs: $$content$$
      Display math should be placed on its own line, with nothing else on that line.
      Do not nest math delimiters or mix styles.
      Examples:
      - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
      - Display:
      $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$

      When analyzing documents or files, provide detailed and helpful information about their contents.

      IMPORTANT: When displaying file/directory structures, tree diagrams, or any ASCII art with tree characters (├──, └──, │), always wrap them in code blocks with "text" language identifier to preserve formatting:

      \`\`\`text
      ├── public/
      │   └── index.html
      ├── src/
      │   ├── components/
      │   │   └── Button.jsx
      │   └── App.jsx
      └── package.json
      \`\`\`

      This ensures proper monospace formatting and preserves the visual structure.`;

    // Add custom profile information if available
    if (customProfile && (customProfile.customName || customProfile.aboutUser)) {
      systemPrompt += `\n\n--- USER PROFILE ---`;

      if (customProfile.customName) {
        systemPrompt += `\nUser's preferred name: ${customProfile.customName}`;
        systemPrompt += `\nPlease address the user as "${customProfile.customName}" in your responses.`;
      }

      if (customProfile.aboutUser) {
        systemPrompt += `\nAbout the user: ${customProfile.aboutUser}`;
        systemPrompt += `\nUse this information to provide more personalized and relevant responses that align with the user's background, interests, and context.`;
      }

      systemPrompt += `\n--- END USER PROFILE ---`;
    }

    // Add global memory if enabled
    if (globalMemory && globalMemory.enabled && globalMemory.memories.length > 0) {
      systemPrompt += `\n\n--- MEMORY ---`;
      systemPrompt += `\nRemember these important details about the user:`;
      globalMemory.memories.forEach((memory: string) => {
        systemPrompt += `\n• ${memory}`;
      });
      systemPrompt += `\n--- END MEMORY ---`;
    }

    // Add project prompt if available
    if (projectPrompt) {
      systemPrompt += `\n\n--- PROJECT CONTEXT ---`;
      systemPrompt += `\n${projectPrompt}`;
      systemPrompt += `\n--- END PROJECT CONTEXT ---`;
    }

    // Add conversation file context if there are uploaded files
    if (conversationFiles.length > 0) {
      console.log(`📁 Adding ${conversationFiles.length} files to conversation context`);

      systemPrompt += `\n\n--- UPLOADED FILES IN THIS CONVERSATION ---`;
      systemPrompt += `\nThe user has uploaded the following files in this conversation:`;

      conversationFiles.forEach((file, index) => {
        const fileTypeLabel = file.fileType === 'text' ? 'text file' : 'document';
        systemPrompt += `\n\n${index + 1}. ${fileTypeLabel}: "${file.fileName}"`;
        systemPrompt += `\nContent:\n${file.textContent}`;
      });

      systemPrompt += `\n\nWhen the user refers to "this file", "the file", "uploaded file", or mentions a specific filename, they are referring to one of these uploaded files. You can directly reference and work with the content shown above.`;
      systemPrompt += `\n--- END UPLOADED FILES ---`;
    }

    const result = streamText({
      model: aiModel,
      messages: processedMessages,
      onError: (error) => {
        console.error('OpenRouter API error:', error);
      },
      system: systemPrompt,
      experimental_transform: [smoothStream({ chunking: 'word' })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    console.log('error', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
