/**
 * ChatInputField Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main chat input field with model selection dropdown and send button.
 * Handles message composition, auto-resize, model switching, and message submission.
 * Creates new threads when needed and manages chat state.
 */

import { ArrowUpIcon, Sparkles } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import useTextAreaAutoResize from "@/hooks/useTextAreaAutoResize";
import { UseChatHelpers } from "@ai-sdk/react";
import { useParams } from "react-router";
import { useNavigate, useLocation } from "react-router";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { StopIcon } from "./ui/UIComponents";
import { HybridDB } from "@/lib/hybridDB";
import { useChatMessageSummary } from "../hooks/useChatMessageSummary";
import { ModelSelector } from "./ModelSelector";
import { ConversationStyleSelector } from "./ConversationStyleSelector";
import { devLog, devError } from "@/lib/logger";
import {
  AspectRatioSelector,
  ASPECT_RATIOS,
  AspectRatio,
  getDimensionsForModel,
} from "./AspectRatioSelector";
import { SearchTypeSelector } from "./SearchTypeSelector";
import { useSearchTypeStore } from "@/frontend/stores/SearchTypeStore";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { getModelConfig } from "@/lib/models";
import VoiceInputButton from "./ui/VoiceInputButton";
import FileUpload, { UploadingFile } from "./FileUpload";
import { FileAttachment } from "@/lib/appwriteDB";
import {
  X,
  FileImage,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { RiImageAiFill } from "react-icons/ri";
import { toast } from "./ui/Toast";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useAuthDialog } from "@/frontend/hooks/useAuthDialog";
import AuthDialog from "./auth/AuthDialog";
import { extractMemories, shouldAddMemory } from "@/lib/memoryExtractor";
import { AppwriteDB } from "@/lib/appwriteDB";
import { SparklesIcon } from "./ui/icons/SparklesIcon";

// Extended UIMessage type to include attachments
type ExtendedUIMessage = UIMessage & {
  attachments?: FileAttachment[];
};

interface InputFieldProps {
  threadId: string;
  input: UseChatHelpers["input"];
  status: UseChatHelpers["status"];
  setInput: UseChatHelpers["setInput"];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
  stop: UseChatHelpers["stop"];
  pendingUserMessageRef: React.RefObject<UIMessage | null>;
  onWebSearchMessage?: (messageId: string, searchQuery?: string) => void;
  submitRef?: React.RefObject<(() => void) | null>;
  messages?: UIMessage[];
  onMessageAppended?: (messageId: string) => void;
  pendingAttachments?: FileAttachment[] | null;
  onPendingAttachmentsConsumed?: () => void;
}

interface StopButtonProps {
  stop: UseChatHelpers["stop"];
}

interface SendButtonProps {
  onSubmit: () => void;
  disabled: boolean;
}

const createUserMessage = (
  id: string,
  text: string,
  attachments?: FileAttachment[]
): ExtendedUIMessage => ({
  id,
  parts: [{ type: "text", text }],
  role: "user",
  content: text,
  createdAt: new Date(),
  attachments,
});

// Extract and store memories from user message
const extractAndStoreMemories = async (
  messageContent: string,
  userId?: string
) => {
  if (!userId || !messageContent.trim()) return;

  try {
    // Extract potential memories from the message
    const extractedMemories = extractMemories(messageContent);

    if (extractedMemories.length === 0) return;

    // Get current global memory to check for duplicates
    const currentMemory = await AppwriteDB.getGlobalMemory(userId);

    // Only proceed if memory is enabled
    if (!currentMemory?.enabled) return;

    const existingMemories = currentMemory?.memories || [];

    // Add new memories that pass the threshold and aren't duplicates
    for (const extractedMemory of extractedMemories) {
      if (shouldAddMemory(extractedMemory, existingMemories)) {
        try {
          await AppwriteDB.addMemory(userId, extractedMemory.text);
          devLog("🧠 Added memory:", extractedMemory.text);
        } catch (error) {
          devError("Failed to add memory:", error);
        }
      }
    }
  } catch (error) {
    devError("Error extracting memories:", error);
  }
};

function PureInputField({
  threadId,
  input,
  status,
  setInput,
  append,
  setMessages,
  stop,
  pendingUserMessageRef,
  onWebSearchMessage,
  submitRef,
  messages,
  onMessageAppended,
  pendingAttachments,
  onPendingAttachmentsConsumed,
}: InputFieldProps) {
  const { textareaRef, adjustHeight } = useTextAreaAutoResize({
    minHeight: 72,
    maxHeight: 200,
  });

  const {
    user,
    isGuest,
    canGuestSendMessage,
    incrementGuestMessages,
    loading: authLoading,
  } = useAuth();
  const authDialog = useAuthDialog();

  // File attachments state
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOverTextarea, setIsDragOverTextarea] = useState(false);

  useEffect(() => {
    if (!pendingAttachments) return;

    if (pendingAttachments.length > 0) {
      setAttachments(pendingAttachments);
    }

    onPendingAttachmentsConsumed?.();
  }, [pendingAttachments, onPendingAttachmentsConsumed]);

  // State for image generation mode
  const [isImageGenMode, setIsImageGenMode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isHomePage = location.pathname === "/chat";

  const isDisabled = useMemo(
    () =>
      (!input.trim() && attachments.length === 0) ||
      status === "streaming" ||
      status === "submitted",
    [input, status, attachments]
  );

  const { complete } = useChatMessageSummary();

  // Search state (Chat, Web Search, or Reddit Search)
  const { selectedSearchType } = useSearchTypeStore();

  // Model selection state
  const { selectedModel, setModel } = useModelStore();

  // Aspect ratio state for image generation
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(
    ASPECT_RATIOS[0]
  ); // Default to 1:1

  // Track if input change was from user typing vs external source (like prompt selection)
  const lastInputRef = useRef("");
  const isUserTypingRef = useRef(false);

  // Focus textarea when input changes from external sources (like prompt selections)
  useEffect(() => {
    if (input && textareaRef.current && isHomePage) {
      const lastInput = lastInputRef.current;
      const textareaHasFocus = document.activeElement === textareaRef.current;
      const isUserTyping = isUserTypingRef.current;

      // Skip cursor manipulation if this is from user typing
      if (isUserTyping) {
        adjustHeight();
        lastInputRef.current = input;
        return;
      }

      // Check if this is a complete replacement of text (prompt selection)
      // vs incremental changes (user typing)
      const isCompleteReplacement =
        lastInput.length > 0 &&
        !input.startsWith(lastInput) &&
        !lastInput.startsWith(input);

      // Check if textarea doesn't have focus (external input)
      const isExternalInput = !textareaHasFocus;

      // Check if this is likely a prompt selection (empty to full text)
      const isPromptSelection = lastInput === "" && input.length > 20;

      // Only interfere with cursor positioning for external inputs or prompt selections
      if (isCompleteReplacement || isExternalInput || isPromptSelection) {
        textareaRef.current.focus();

        // For prompt selections, put cursor at the end
        const length = input.length;
        textareaRef.current.setSelectionRange(length, length);
      }

      // Always adjust height for new content
      adjustHeight();

      // Update the last input
      lastInputRef.current = input;
    }
  }, [input, textareaRef, isHomePage, adjustHeight]);

  // Handle file uploads
  const handleFilesUploaded = useCallback(
    (newAttachments: FileAttachment[]) => {
      setAttachments((prev) => [...prev, ...newAttachments]);
    },
    []
  );

  // Remove attachment
  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  }, []);

  // Handle upload status changes
  const handleUploadStatusChange = useCallback((files: UploadingFile[]) => {
    setUploadingFiles(files);
  }, []);

  // Helper functions for file display
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="w-3 h-3 flex-shrink-0" />;
    }
    return <FileText className="w-3 h-3 flex-shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Upload pasted files
  const uploadPastedFiles = useCallback(
    async (files: File[]) => {
      // Initialize uploading state
      const uploadingFiles: UploadingFile[] = files.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));
      setUploadingFiles(uploadingFiles);

      try {
        // Create form data
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        // Upload files
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        // Show success state briefly before clearing
        const successFiles = files.map((file) => ({
          file,
          progress: 100,
          status: "success" as const,
        }));
        setUploadingFiles(successFiles);

        // Handle successful uploads
        if (result.attachments && result.attachments.length > 0) {
          handleFilesUploaded(result.attachments);
          toast.success(
            `${result.attachments.length} pasted file(s) uploaded successfully`
          );
        }

        // Handle partial failures
        if (result.failures && result.failures.length > 0) {
          result.failures.forEach((error: string) => {
            toast.error(`Upload failed: ${error}`);
          });
        }

        // Clear uploading state after a brief delay to show success
        setTimeout(() => {
          setUploadingFiles([]);
        }, 1500);
      } catch (error) {
        devError("Paste upload error:", error);

        // Show error state
        const errorFiles = files.map((file) => ({
          file,
          progress: 0,
          status: "error" as const,
          error: "Upload failed",
        }));
        setUploadingFiles(errorFiles);

        toast.error("Failed to upload pasted files. Please try again.");

        // Clear error state after delay
        setTimeout(() => {
          setUploadingFiles([]);
        }, 3000);
      }
    },
    [handleFilesUploaded]
  );

  // Handle paste events for file uploads
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = Array.from(clipboardData.items);
      const fileItems = items.filter((item) => item.kind === "file");

      if (fileItems.length === 0) return;

      // Prevent default paste behavior for files
      e.preventDefault();

      const files: File[] = [];
      const rejectedFiles: string[] = [];

      for (const item of fileItems) {
        const file = item.getAsFile();
        if (file) {
          // Validate file type
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];

          // Validate file size (5MB limit)
          const maxSize = 5 * 1024 * 1024;

          if (!allowedTypes.includes(file.type)) {
            rejectedFiles.push(`${file.name} (unsupported file type)`);
          } else if (file.size > maxSize) {
            rejectedFiles.push(`${file.name} (file too large - max 5MB)`);
          } else {
            files.push(file);
          }
        }
      }

      // Show feedback for rejected files
      if (rejectedFiles.length > 0) {
        toast.error(`Cannot upload: ${rejectedFiles.join(", ")}`);
      }

      if (files.length > 0) {
        // Show immediate feedback with file details
        const fileNames = files.map((f) => f.name).join(", ");
        toast.success(
          `📎 Pasted ${files.length} file${files.length > 1 ? "s" : ""}: ${
            fileNames.length > 50
              ? fileNames.substring(0, 50) + "..."
              : fileNames
          }`
        );

        // Upload files using the same logic as FileUpload component
        await uploadPastedFiles(files);
      }
    },
    [uploadPastedFiles]
  );

  const handleSubmit = useCallback(async () => {
    console.log("=== HANDLE SUBMIT CALLED ===");
    console.log("Attachments state at submit:", attachments);
    console.log("Attachments length at submit:", attachments.length);
    console.log("Auth loading state:", authLoading);

    // Wait for authentication to be fully loaded before proceeding
    if (authLoading) {
      console.log("=== SUBMIT BLOCKED - AUTH LOADING ===");
      return;
    }

    const currentInput = textareaRef.current?.value || input;

    if (
      (!currentInput.trim() && attachments.length === 0) ||
      status === "streaming" ||
      status === "submitted"
    ) {
      console.log("=== SUBMIT BLOCKED ===");
      console.log("Current input:", currentInput);
      console.log("Attachments length:", attachments.length);
      console.log("Status:", status);
      return;
    }

    // Check guest user limits
    if (isGuest) {
      if (!canGuestSendMessage()) {
        console.log("=== GUEST LIMIT REACHED ===");
        authDialog.showGuestLimitPage(); // Use faster page navigation
        return;
      }

      // Check for restricted features for guests
      if (attachments.length > 0 || isImageGenMode) {
        authDialog.showPremiumFeaturePage(); // Use faster page navigation
        return;
      }
    }

    // Use the input as-is without automatic file conversion
    let finalInput = currentInput.trim();
    let finalAttachments = [...attachments];

    console.log("=== PROCESSING SUBMIT ===");
    console.log("Final input:", finalInput);
    console.log("Final attachments:", finalAttachments);
    console.log("Final attachments length:", finalAttachments.length);

    const messageId = uuidv4();
    // Create user message with potentially updated content and attachments
    const userMessage = createUserMessage(
      messageId,
      finalInput,
      finalAttachments.length > 0 ? finalAttachments : undefined
    );

    console.log("=== FRONTEND DEBUG ===");
    console.log(
      "User message being sent:",
      JSON.stringify(userMessage, null, 2)
    );

    // Only handle chat completion for non-image generation mode
    if (!isImageGenMode) {
      // Handle new vs existing conversations
      // Check if this is a new conversation by looking at message count
      const isNewConversation = !id || (messages && messages.length === 0);

      if (isNewConversation) {
        // New conversation: hand off the first input to the thread page
        if (!id) {
          try {
            // Store pending input so the thread page can auto-submit after mount
            const attachmentsForStorage =
              finalAttachments.length > 0
                ? finalAttachments.map((attachment) => ({
                    ...attachment,
                    createdAt:
                      attachment.createdAt instanceof Date
                        ? attachment.createdAt.toISOString()
                        : new Date(attachment.createdAt).toISOString(),
                  }))
                : undefined;

            sessionStorage.setItem(
              "cappychat_pending_input",
              JSON.stringify({
                threadId,
                input: finalInput,
                attachments: attachmentsForStorage,
              })
            );
          } catch {}

          navigate(`/chat/${threadId}`);

          // Create thread in background for authenticated users
          if (!isGuest) {
            HybridDB.createThread(threadId).catch((error) => {
              console.log(
                "Thread creation handled or already exists:",
                error?.message || error
              );
            });
          }

          // Clear local UI state and stop here to avoid starting a stream
          setInput("");
          setAttachments([]);
          adjustHeight(true);
          return;
        }

        // Start completion immediately for better UX
        // Include attachment information for better title generation
        const titlePrompt =
          finalAttachments.length > 0
            ? `${finalInput}\n\n[User also attached ${
                finalAttachments.length
              } file(s): ${finalAttachments
                .map((att) => `${att.originalName} (${att.fileType})`)
                .join(", ")}]`
            : finalInput;

        // Generate title with fallback mechanism
        try {
          complete(titlePrompt, {
            body: { threadId, messageId, isTitle: true },
          });
        } catch (error) {
          console.error("[ChatInputField] Title generation failed:", error);
          // Fallback: Use a simplified title based on user input
          const fallbackTitle =
            finalInput.length > 50
              ? finalInput.substring(0, 47) + "..."
              : finalInput;

          // Update thread title with fallback if title generation fails
          if (!isGuest && fallbackTitle.trim()) {
            setTimeout(() => {
              HybridDB.updateThread(threadId, fallbackTitle.trim()).catch(
                (err) => console.error("Fallback title update failed:", err)
              );
            }, 1000); // Small delay to ensure thread exists
          }
        }
      } else {
        // Existing conversation
        complete(finalInput, { body: { messageId, threadId } });
      }

      // Update UI immediately for better responsiveness - useChat handles the state
      // Store the user message in ref so it can be persisted in ChatInterface's onFinish callback
      pendingUserMessageRef.current = userMessage;

      // Track if this message was sent with search enabled (web or reddit)
      if (
        (selectedSearchType === "web" || selectedSearchType === "reddit") &&
        onWebSearchMessage
      ) {
        onWebSearchMessage(messageId, finalInput);
      }
    } else {
      // For image generation mode, we need to handle thread creation manually
      // since we're not using the chat completion flow
      const isNewConversation = !id || (messages && messages.length === 0);

      if (isNewConversation) {
        if (!id) {
          navigate(`/chat/${threadId}`);
        }

        // Create thread for image generation and generate title
        if (!isGuest) {
          console.log("👤 Creating thread for image generation:", threadId);
          HybridDB.createThread(threadId)
            .then(() => {
              console.log(
                "✅ Thread created successfully for image generation:",
                threadId
              );
            })
            .catch((error) => {
              console.log(
                "Thread creation handled or already exists:",
                error.message || error
              );
            });

          // Generate title for the thread using the image prompt
          const titlePrompt = `Generate a short, descriptive title for an image generation request: "${finalInput}"`;
          try {
            complete(titlePrompt, {
              body: { threadId, messageId, isTitle: true },
            });
          } catch (error) {
            console.error(
              "[ChatInputField] Image title generation failed:",
              error
            );
            // Fallback: Use a simplified title based on image prompt
            const fallbackTitle =
              finalInput.length > 40
                ? "Image: " + finalInput.substring(0, 37) + "..."
                : "Image: " + finalInput;

            // Update thread title with fallback if title generation fails
            setTimeout(() => {
              HybridDB.updateThread(threadId, fallbackTitle.trim()).catch(
                (err) =>
                  console.error("Image fallback title update failed:", err)
              );
            }, 1000); // Small delay to ensure thread exists
          }
        }
      }
    }

    // Increment guest message count if guest user
    if (isGuest) {
      incrementGuestMessages();
      console.log("🎯 Guest message count incremented");
    }

    // Handle image generation mode
    if (isImageGenMode) {
      console.log("🎨 Image generation mode - calling image generation API");

      // Create user message first
      const userMessage = {
        id: messageId,
        role: "user" as const,
        content: finalInput,
        parts: [{ type: "text" as const, text: finalInput }],
        createdAt: new Date(),
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
      };

      // Add user message to UI immediately for fast response
      setMessages((prevMessages) => [...prevMessages, userMessage as any]);

      // Store user message to database immediately (skip for guest users)
      if (!isGuest) {
        HybridDB.createMessage(threadId, userMessage);
      }

      // Create a loading assistant message immediately for better UX
      const loadingAssistantMessage = {
        id: uuidv4(),
        role: "assistant" as const,
        content: `🎨 Generating your image [aspectRatio:${selectedAspectRatio.id}]`,
        parts: [
          {
            type: "text" as const,
            text: `🎨 Generating your image [aspectRatio:${selectedAspectRatio.id}]`,
          },
        ],
        createdAt: new Date(),
        isImageGenerationLoading: true, // Flag to identify loading state
        aspectRatio: selectedAspectRatio.id, // Store aspect ratio for loading component
      };

      // Add loading message to UI
      setMessages((prevMessages: any) => [
        ...prevMessages,
        loadingAssistantMessage as any,
      ]);

      // Store loading message to database to ensure proper sync (skip for guest users)
      if (!isGuest) {
        HybridDB.createMessage(threadId, loadingAssistantMessage);
      }

      // Get appropriate dimensions for the selected model and aspect ratio
      const modelConfig = getModelConfig(selectedModel);
      const dimensions = getDimensionsForModel(
        selectedAspectRatio,
        modelConfig.modelId
      );

      console.log(
        `🎯 Using dimensions for ${selectedModel}: ${dimensions.width}x${dimensions.height}`
      );

      // Call image generation API
      try {
        const response = await fetch("/api/image-generation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: finalInput,
            model: selectedModel,
            userId: isGuest ? null : user?.$id,
            isGuest: isGuest,
            width: dimensions.width,
            height: dimensions.height,
            attachments: finalAttachments,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Image generation failed");
        }

        console.log("✅ Image generated successfully:", result.imageUrl);

        // Update the existing loading message with the generated image
        let updatedMessage: any = null;

        setMessages((prevMessages: any) => {
          const updatedMessages = [...prevMessages];
          // Find and update the loading message (last assistant message with loading flag)
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            if (
              updatedMessages[i].role === "assistant" &&
              (updatedMessages[i].isImageGenerationLoading ||
                updatedMessages[i].content.includes("Generating your image"))
            ) {
              // Update the same message object to include image and remove loading state
              updatedMessages[i] = {
                ...updatedMessages[i], // Keep the same ID and other properties
                content: `[aspectRatio:${selectedAspectRatio.id}]`, // Store aspect ratio in content for persistence
                parts: [
                  {
                    type: "text" as const,
                    text: `[aspectRatio:${selectedAspectRatio.id}]`, // Store aspect ratio in parts for persistence
                  },
                ],
                imgurl: result.imageUrl,
                model: result.model,
                isImageGenerationLoading: false, // Remove loading flag
                isImageGeneration: true, // Flag to identify this as image generation result
                aspectRatio: selectedAspectRatio.id, // Preserve aspect ratio for display
              };

              // Keep reference for database storage
              updatedMessage = updatedMessages[i];
              break;
            }
          }
          return updatedMessages;
        });

        // Store updated message to database
        if (!isGuest && updatedMessage) {
          HybridDB.updateMessage(threadId, updatedMessage);
        }

        toast.success("Image generated successfully!");
      } catch (error) {
        console.error("❌ Image generation failed:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to generate image"
        );

        // Update the loading message with the error message
        setMessages((prevMessages: any) => {
          const updatedMessages = [...prevMessages];
          // Find and update the loading message (last assistant message with loading flag)
          for (let i = updatedMessages.length - 1; i >= 0; i--) {
            if (
              updatedMessages[i].role === "assistant" &&
              (updatedMessages[i].isImageGenerationLoading ||
                updatedMessages[i].content.includes("Generating your image"))
            ) {
              // Update the same message object with error content
              updatedMessages[i] = {
                ...updatedMessages[i], // Keep the same ID and other properties
                content: `Sorry, I couldn't generate an image. ${
                  error instanceof Error ? error.message : "Please try again."
                }`,
                parts: [
                  {
                    type: "text" as const,
                    text: `Sorry, I couldn't generate an image. ${
                      error instanceof Error
                        ? error.message
                        : "Please try again."
                    }`,
                  },
                ],
                isImageGenerationLoading: false, // Remove loading flag
              };
              break;
            }
          }
          return updatedMessages;
        });
      }
    } else {
      // Normal text message flow
      // First add to UI with append(), then store to database to prevent race condition
      append(
        {
          id: messageId,
          role: "user",
          content: finalInput,
          createdAt: new Date(),
          // Include attachments directly in the message object for immediate UI display
          attachments:
            finalAttachments.length > 0 ? finalAttachments : undefined,
        } as any,
        {
          experimental_attachments:
            finalAttachments.length > 0 ? finalAttachments : undefined,
        }
      );

      // Track that this message was just appended to prevent real-time sync from overwriting it
      if (onMessageAppended) {
        onMessageAppended(messageId);
      }

      // Store the user message to database after append() to prevent race condition
      if (!isGuest) {
        console.log(
          "💾 Storing user message after append():",
          messageId,
          "Has attachments:",
          !!finalAttachments.length
        );
        // Use setTimeout to ensure append() completes first
        setTimeout(() => {
          HybridDB.createMessage(threadId, userMessage);

          // Extract and store memories from user message
          extractAndStoreMemories(finalInput, user?.$id);
        }, 0);
      }
    }
    setInput("");
    setAttachments([]); // Clear attachments after sending
    adjustHeight(true);
  }, [
    input,
    status,
    setInput,
    adjustHeight,
    append,
    id,
    textareaRef,
    threadId,
    complete,
    navigate,
    pendingUserMessageRef,
    attachments,
    messages,
    selectedSearchType,
    onWebSearchMessage,
    isGuest,
    canGuestSendMessage,
    incrementGuestMessages,
    authDialog,
    authLoading,
    isImageGenMode,
    selectedModel,
    user,
    setMessages,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow normal navigation keys to work
    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight"
    ) {
      // Don't prevent default for arrow keys - let them work normally
      return;
    }

    if (
      e.key === "Home" ||
      e.key === "End" ||
      e.key === "PageUp" ||
      e.key === "PageDown"
    ) {
      // Don't prevent default for navigation keys
      return;
    }

    if (e.key === "Tab") {
      // Don't prevent default for tab key
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("=== ENTER KEY PRESSED ===");
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Mark that this change is from user typing
    isUserTypingRef.current = true;

    setInput(e.target.value);
    adjustHeight();

    // Reset the flag after a short delay to allow the effect to run
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 10);
  };

  // Expose handleSubmit function through ref for external access
  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit;
    }
  }, [submitRef, handleSubmit]);

  // State for voice input active status
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  // State for enhancement loading
  const [isEnhancing, setIsEnhancing] = useState(false);

  function handleVoiceInput(text: string) {
    setInput((prev) => prev + (prev ? " " : "") + text);
    // Focus the textarea after voice input
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  function handleVoiceInputError(error: string) {
    toast.error(error);
  }

  // Handle listening state changes from voice input button
  function handleListeningChange(isListening: boolean) {
    setIsVoiceInputActive(isListening);
  }

  // Handle prompt enhancement
  const handleEnhancePrompt = useCallback(async () => {
    if (!input.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      // Get last few messages for context (if available)
      // Only include text content, limit to 100 chars per message to avoid token limits
      const contextMessages = messages
        ?.slice(-6)
        .filter((m) => m.content && m.content.length > 0)
        .map((m) => {
          const content =
            m.content.length > 100
              ? m.content.substring(0, 100) + "..."
              : m.content;
          return `${m.role === "user" ? "User" : "Assistant"}: ${content}`;
        })
        .join("\n");

      const response = await fetch("/api/ai-text-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          isEnhancement: true,
          context: contextMessages || "", // Send empty string if no context
          userApiKey: null, // Will use system key for free enhancement
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Enhancement failed");
      }

      if (result.enhancedPrompt) {
        setInput(result.enhancedPrompt);
        toast.success("✨ Prompt enhanced!");
        // Focus the textarea after enhancement
        if (textareaRef.current) {
          textareaRef.current.focus();
          const length = result.enhancedPrompt.length;
          textareaRef.current.setSelectionRange(length, length);
        }
        adjustHeight();
      }
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
      toast.error("Failed to enhance prompt. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }, [input, isEnhancing, messages, setInput, textareaRef, adjustHeight]);

  // Handle drag and drop for textarea
  const handleTextareaDragOver = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverTextarea(true);
    },
    []
  );

  const handleTextareaDragLeave = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverTextarea(false);
    },
    []
  );

  const handleTextareaDrop = useCallback(
    async (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverTextarea(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        // Show immediate feedback
        toast.success(
          `📎 Dropped ${files.length} file${
            files.length > 1 ? "s" : ""
          } - uploading...`
        );
        await uploadPastedFiles(files);
      }
    },
    [uploadPastedFiles]
  );

  return (
    <div className="w-full max-w-full">
      <div className="border-[1px] border-primary/30 rounded-2xl shadow-lg w-full backdrop-blur-md overflow-hidden">
        <div className="flex flex-col bg-background/55 border-y-2 sm:border-y-4 md:border-y-8 rounded-2xl border-x-2 sm:border-x-4 md:border-x-8 border-primary/10 dark:border-zinc-800/50 overflow-hidden">
          {/* Upload Status - Enhanced responsive design */}
          {uploadingFiles.length > 0 && (
            <div
              className={cn(
                "px-3 sm:px-4 py-3 border-b border-border/50 bg-muted/30",
                uploadingFiles.every((f) => f.status === "success") &&
                  "bg-primary/5 border-ring/15 border rounded-t-md",
                uploadingFiles.some((f) => f.status === "error") &&
                  "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  {uploadingFiles.some((f) => f.status === "uploading") && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {uploadingFiles.every((f) => f.status === "success") && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {uploadingFiles.some((f) => f.status === "error") && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {uploadingFiles.every((f) => f.status === "success")
                    ? `Successfully uploaded ${uploadingFiles.length} file${
                        uploadingFiles.length > 1 ? "s" : ""
                      }!`
                    : uploadingFiles.some((f) => f.status === "error")
                    ? `Upload failed for ${
                        uploadingFiles.filter((f) => f.status === "error")
                          .length
                      } file${
                        uploadingFiles.filter((f) => f.status === "error")
                          .length > 1
                          ? "s"
                          : ""
                      }`
                    : `Uploading ${uploadingFiles.length} file${
                        uploadingFiles.length > 1 ? "s" : ""
                      }...`}
                </div>
              </div>

              <div className="space-y-1">
                {uploadingFiles.map((uploadingFile, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(uploadingFile.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-foreground">
                        {uploadingFile.file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(uploadingFile.file.size)}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {uploadingFile.status === "uploading" && (
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      )}
                      {uploadingFile.status === "success" && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}
                      {uploadingFile.status === "error" && (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Attachment Preview */}
          {attachments.length > 0 && (
            <div className="px-3 sm:px-4 pt-3 pb-2 bg-primary/5 border-b border-border/50">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group flex items-center gap-2 bg-primary/15 hover:bg-primary/20 rounded-xl px-3 py-2 text-xs transition-colors mobile-touch"
                  >
                    <div className="flex-shrink-0">
                      {attachment.fileType === "image" ? (
                        <div className="relative">
                          <FileImage className="w-4 h-4 text-blue-500" />
                        </div>
                      ) : (
                        <div className="relative">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate max-w-20 sm:max-w-28 md:max-w-36 text-foreground">
                        {attachment.originalName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="flex-shrink-0 flex justify-center items-center text-muted-foreground hover:text-red-500 opacity-70 group-hover:opacity-100 transition-all mobile-touch"
                      type="button"
                      aria-label={`Remove ${attachment.originalName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-transparent overflow-y-auto max-h-[250px] sm:max-h-[300px] rounded-t-xl relative">
            <div
              className={cn("relative", isVoiceInputActive && "animate-pulse")}
            >
              <Textarea
                id="message-input"
                value={input}
                placeholder={
                  isImageGenMode
                    ? "Describe the image you want to generate..."
                    : isHomePage
                    ? isVoiceInputActive
                      ? "Listening... speak now"
                      : "Ask me anything..."
                    : isVoiceInputActive
                    ? "Listening... speak now"
                    : "Ask CappyChat anything..."
                }
                className={cn(
                  "w-full px-3 sm:px-4 py-3 sm:py-2 md:pt-4 pr-10 sm:pr-12 border-none shadow-none scrollbar-none",
                  "placeholder:text-muted-foreground/40 resize-none text-foreground",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "min-h-[44px] sm:min-h-[40px] text-base sm:text-base",
                  "selection:bg-primary selection:text-primary-foreground",
                  "mobile-input leading-relaxed transition-colors",
                  "overflow-y-auto overflow-x-hidden",
                  isDragOverTextarea && "bg-primary/5 border-primary/20",
                  isVoiceInputActive &&
                    "bg-red-500/5 border-red-300/30 backdrop-blur-sm"
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onDragOver={handleTextareaDragOver}
                onDragLeave={handleTextareaDragLeave}
                onDrop={handleTextareaDrop}
                disabled={
                  isVoiceInputActive ||
                  status === "streaming" ||
                  status === "submitted"
                }
                aria-label={
                  isVoiceInputActive
                    ? "Voice input active"
                    : "Message input field"
                }
                aria-describedby="input-field-description"
              />
              {/* {isVoiceInputActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-red-500 animate-pulse flex flex-col items-center">
                    <div className="text-xs text-center text-muted-foreground/70">
                      Listening...
                    </div>
                  </div>
                </div>
              )} */}
            </div>

            {/* Enhance and Voice Input Buttons inside textarea */}
            <div className="absolute right-2 top-2 flex items-center gap-2">
              {/* Enhance Button */}
              {!isImageGenMode && input.trim().length > 0 && !isGuest && (
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={
                    isEnhancing ||
                    status === "streaming" ||
                    status === "submitted" ||
                    !input.trim()
                  }
                  className={cn(
                    "p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                    "bg-primary/10 hover:bg-primary/20 text-primary",
                    "border border-primary/20 hover:border-primary/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "shadow-sm hover:shadow-md"
                  )}
                  aria-label="Enhance prompt"
                  title="Enhance your prompt with AI"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SparklesIcon />
                  )}
                </button>
              )}

              {/* Voice Input Button */}
              <div
                className={cn(
                  "transition-transform duration-200",
                  isVoiceInputActive && "scale-110"
                )}
              >
                <VoiceInputButton
                  onResult={handleVoiceInput}
                  onError={handleVoiceInputError}
                  onListeningChange={handleListeningChange}
                  className={cn(
                    isVoiceInputActive
                      ? "text-red-500 hover:text-red-600"
                      : "text-foreground"
                  )}
                  size="md"
                  disabled={status === "streaming" || status === "submitted"}
                />
              </div>
            </div>
            {/* Character counter for long text warning */}
            {input.length > 800 && (
              <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                {input.length > 1000 ? (
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {input.length} chars - Will convert to .txt file
                  </span>
                ) : (
                  <span className="text-yellow-500">
                    {input.length}/1000 chars
                  </span>
                )}
              </div>
            )}

            <span id="input-field-description" className="sr-only">
              Press Enter to send, Shift+Enter for new line. Paste or drag
              images and PDFs to upload.
            </span>
          </div>

          <div className="min-h-[60px] sm:h-14 flex bg-transparent items-center px-2 sm:px-3 border-t border-border/50">
            <div className="flex items-center justify-between w-full gap-1 sm:gap-2 md:gap-3">
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink min-w-0 overflow-hidden">
                {!isGuest && (
                  <>
                    <div className="min-w-0 flex-shrink overflow-hidden">
                      <ModelSelector isImageGenMode={isImageGenMode} />
                    </div>
                    {isImageGenMode ? (
                      <AspectRatioSelector
                        selectedRatio={selectedAspectRatio}
                        onRatioChange={setSelectedAspectRatio}
                        className="hidden md:flex flex-shrink-0"
                      />
                    ) : (
                      <>
                        <ConversationStyleSelector className="hidden md:flex flex-shrink-0" />
                        <SearchTypeSelector className="hidden md:flex flex-shrink-0" />
                      </>
                    )}
                  </>
                )}
                {isGuest && (
                  <div className="text-xs text-muted-foreground">
                    Using Gemini 2.5 Flash Lite • Sign up for more models
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                {!isGuest && (
                  <>
                    {isImageGenMode ? (
                      <AspectRatioSelector
                        selectedRatio={selectedAspectRatio}
                        onRatioChange={setSelectedAspectRatio}
                        className="flex md:hidden"
                      />
                    ) : (
                      <>
                        <ConversationStyleSelector className="flex md:hidden" />
                        <SearchTypeSelector className="flex md:hidden" />
                      </>
                    )}
                    <Button
                      variant={isImageGenMode ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 mobile-touch relative"
                      onClick={() => {
                        const newImageGenMode = !isImageGenMode;
                        setIsImageGenMode(newImageGenMode);

                        // Handle model switching
                        if (newImageGenMode) {
                          // Entering image generation mode - switch to image generation model if not already
                          const currentConfig = getModelConfig(selectedModel);
                          if (!currentConfig.isImageGeneration) {
                            console.log(
                              "🎨 Switching to image generation model: FLUX.1 [schnell]"
                            );
                            setModel("FLUX.1 [schnell]");
                          }
                        } else {
                          // Exiting image generation mode - switch back to default model
                          const currentConfig = getModelConfig(selectedModel);
                          if (currentConfig.isImageGeneration) {
                            console.log(
                              "💬 Switching back to default model: Gemini 2.5 Flash Lite"
                            );
                            setModel("Gemini 2.5 Flash Lite");
                          }
                        }
                      }}
                      disabled={
                        status === "streaming" || status === "submitted"
                      }
                      aria-label={
                        isImageGenMode
                          ? "Switch to text mode"
                          : "Switch to image generation mode"
                      }
                      title={
                        isImageGenMode
                          ? "Switch to text mode"
                          : "Generate images with AI"
                      }
                    >
                      <RiImageAiFill
                        size={20}
                        className={cn(
                          isImageGenMode ? "text-background" : "text-primary"
                        )}
                      />
                    </Button>
                    <FileUpload
                      onFilesUploaded={handleFilesUploaded}
                      onUploadStatusChange={handleUploadStatusChange}
                      disabled={
                        status === "streaming" ||
                        status === "submitted" ||
                        (isImageGenMode &&
                          !getModelConfig(selectedModel).image2imageGen)
                      }
                      acceptedFileTypes={
                        isImageGenMode &&
                        getModelConfig(selectedModel).image2imageGen
                          ? "image/png,image/jpeg,image/jpg"
                          : "image/*,.pdf,.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      }
                    />
                  </>
                )}
                {status === "submitted" || status === "streaming" ? (
                  <StopButton stop={stop} />
                ) : (
                  <SendButton onSubmit={handleSubmit} disabled={isDisabled} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Dialog for guest users */}
      <AuthDialog
        isOpen={authDialog.isOpen}
        onClose={authDialog.closeDialog}
        initialMode={authDialog.mode}
        title={authDialog.title}
        description={authDialog.description}
      />
    </div>
  );
}

// Remove memo to prevent stale closure issues with internal state
const InputField = PureInputField;

function PureStopButton({ stop }: StopButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 sm:h-9 sm:w-9 mobile-touch"
      onClick={stop}
      aria-label="Stop generating response"
    >
      <StopIcon size={18} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

const PureSendButton = ({ onSubmit, disabled }: SendButtonProps) => {
  const handleClick = () => {
    console.log("=== SEND BUTTON CLICKED ===");
    onSubmit();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant="default"
      size="icon"
      className="h-8 w-8 sm:h-9 sm:w-9 mobile-touch "
      disabled={disabled}
      aria-label="Send message"
    >
      <ArrowUpIcon size={18} className="text-background" />
    </Button>
  );
};

// Remove memo to ensure SendButton always gets the latest onSubmit function
const SendButton = PureSendButton;

export default InputField;
