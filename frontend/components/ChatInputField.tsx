/**
 * ChatInputField Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main chat input field with model selection dropdown and send button.
 * Handles message composition, auto-resize, model switching, and message submission.
 * Creates new threads when needed and manages chat state.
 */

import { ArrowUpIcon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import useTextAreaAutoResize from "@/hooks/useTextAreaAutoResize";
import { UseChatHelpers } from "@ai-sdk/react";
import { useParams } from "react-router";
import { useNavigate, useLocation } from "react-router";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { StopIcon, WebSearchToggle } from "./ui/UIComponents";
import { HybridDB } from "@/lib/hybridDB";
import { useChatMessageSummary } from "../hooks/useChatMessageSummary";
import { ModelSelector } from "./ModelSelector";
import { ConversationStyleSelector } from "./ConversationStyleSelector";
import { useWebSearchStore } from "@/frontend/stores/WebSearchStore";
import VoiceInputButton from "./ui/VoiceInputButton";
import FileUpload, { UploadingFile } from "./FileUpload";
import { FileAttachment } from "@/lib/appwriteDB";
import { X, FileImage, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

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
  stop: UseChatHelpers["stop"];
  pendingUserMessageRef: React.RefObject<UIMessage | null>;
  onWebSearchMessage?: (messageId: string) => void;
}

interface StopButtonProps {
  stop: UseChatHelpers["stop"];
}

interface SendButtonProps {
  onSubmit: () => void;
  disabled: boolean;
}

const createUserMessage = (id: string, text: string, attachments?: FileAttachment[]): ExtendedUIMessage => ({
  id,
  parts: [{ type: "text", text }],
  role: "user",
  content: text,
  createdAt: new Date(),
  attachments,
});

function PureInputField({
  threadId,
  input,
  status,
  setInput,
  append,
  stop,
  pendingUserMessageRef,
  onWebSearchMessage,
}: InputFieldProps) {
  const { textareaRef, adjustHeight } = useTextAreaAutoResize({
    minHeight: 72,
    maxHeight: 200,
  });

  // File attachments state
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOverTextarea, setIsDragOverTextarea] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isHomePage = location.pathname === "/chat";

  const isDisabled = useMemo(
    () => (!input.trim() && attachments.length === 0) || status === "streaming" || status === "submitted",
    [input, status, attachments]
  );

  const { complete } = useChatMessageSummary();

  // Web search state
  const { isWebSearchEnabled, setWebSearchEnabled } = useWebSearchStore();

  // Focus textarea when input changes (especially for prompt selections)
  useEffect(() => {
    if (input && textareaRef.current && isHomePage) {
      textareaRef.current.focus();

      // Set cursor at the end of the text
      const length = input.length;
      textareaRef.current.setSelectionRange(length, length);

      // Also adjust height for the new content
      adjustHeight();
    }
  }, [input, textareaRef, isHomePage, adjustHeight]);

  // Handle file uploads
  const handleFilesUploaded = useCallback((newAttachments: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);

  // Handle upload status changes
  const handleUploadStatusChange = useCallback((files: UploadingFile[]) => {
    setUploadingFiles(files);
  }, []);

  // Helper functions for file display
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-3 h-3 flex-shrink-0" />;
    }
    return <FileText className="w-3 h-3 flex-shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload pasted files
  const uploadPastedFiles = useCallback(async (files: File[]) => {
    // Initialize uploading state
    const uploadingFiles: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadingFiles(uploadingFiles);

    try {
      // Create form data
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Upload files
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Show success state briefly before clearing
      const successFiles = files.map(file => ({
        file,
        progress: 100,
        status: 'success' as const,
      }));
      setUploadingFiles(successFiles);

      // Handle successful uploads
      if (result.attachments && result.attachments.length > 0) {
        handleFilesUploaded(result.attachments);
        toast.success(`${result.attachments.length} pasted file(s) uploaded successfully`);
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
      console.error('Paste upload error:', error);

      // Show error state
      const errorFiles = files.map(file => ({
        file,
        progress: 0,
        status: 'error' as const,
        error: 'Upload failed'
      }));
      setUploadingFiles(errorFiles);

      toast.error('Failed to upload pasted files. Please try again.');

      // Clear error state after delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    }
  }, [handleFilesUploaded]);

  // Handle paste events for file uploads
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const fileItems = items.filter(item => item.kind === 'file');

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
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf'
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
      toast.error(`Cannot upload: ${rejectedFiles.join(', ')}`);
    }

    if (files.length > 0) {
      // Show immediate feedback with file details
      const fileNames = files.map(f => f.name).join(', ');
      toast.success(`📎 Pasted ${files.length} file${files.length > 1 ? 's' : ''}: ${fileNames.length > 50 ? fileNames.substring(0, 50) + '...' : fileNames}`);

      // Upload files using the same logic as FileUpload component
      await uploadPastedFiles(files);
    }
  }, [uploadPastedFiles]);

  const handleSubmit = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      (!currentInput.trim() && attachments.length === 0) ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const messageId = uuidv4();
    // Create user message without attachments for the message content
    const userMessage = createUserMessage(messageId, currentInput.trim(), attachments.length > 0 ? attachments : undefined);

    console.log('=== FRONTEND DEBUG ===');
    console.log('User message being sent:', JSON.stringify(userMessage, null, 2));
    console.log('Attachments count:', attachments.length);
    console.log('Attachments:', attachments);

    // Handle new vs existing conversations
    if (!id) {
      // New conversation - navigate first
      navigate(`/chat/${threadId}`);

      // Create thread instantly with local update + async backend sync
      HybridDB.createThread(threadId);

      // Start completion immediately for better UX
      // Include attachment information for better title generation
      const titlePrompt = attachments.length > 0
        ? `${currentInput.trim()}\n\n[User also attached ${attachments.length} file(s): ${attachments.map(att => `${att.originalName} (${att.fileType})`).join(', ')}]`
        : currentInput.trim();

      complete(titlePrompt, {
        body: { threadId, messageId, isTitle: true },
      });
    } else {
      // Existing conversation
      complete(currentInput.trim(), { body: { messageId, threadId } });
    }

    // Update UI immediately for better responsiveness - useChat handles the state
    // Store the user message in ref so it can be persisted in ChatInterface's onFinish callback
    pendingUserMessageRef.current = userMessage;

    // Track if this message was sent with web search enabled
    if (isWebSearchEnabled && onWebSearchMessage) {
      onWebSearchMessage(messageId);
    }

    // Store the user message immediately to the database
    console.log('💾 Storing user message immediately:', messageId, 'Has attachments:', !!userMessage.attachments);
    HybridDB.createMessage(threadId, userMessage);

    // The message will be persisted to database in ChatInterface's onFinish callback
    // Pass attachments using experimental_attachments parameter AND include in message object for immediate UI display
    append(
      {
        id: messageId,
        role: "user",
        content: currentInput.trim(),
        createdAt: new Date(),
        // Include attachments directly in the message object for immediate UI display
        attachments: attachments.length > 0 ? attachments : undefined,
      } as any,
      {
        experimental_attachments: attachments.length > 0 ? attachments : undefined,
      }
    );
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
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  function handleVoiceInput(text: string) {
    setInput((prev) => prev + (prev ? " " : "") + text);
    // optionally you can also focus the textarea here
  }

  // Handle drag and drop for textarea
  const handleTextareaDragOver = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverTextarea(true);
  }, []);

  const handleTextareaDragLeave = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverTextarea(false);
  }, []);

  const handleTextareaDrop = useCallback(async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverTextarea(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Show immediate feedback
      toast.success(`📎 Dropped ${files.length} file${files.length > 1 ? 's' : ''} - uploading...`);
      await uploadPastedFiles(files);
    }
  }, [uploadPastedFiles]);

  return (
    <div className="w-full max-w-full">
      <div className="border-t-[1px] border-x-[1px] border-primary/30 rounded-t-2xl shadow-lg w-full backdrop-blur-md overflow-hidden">
        <div className="flex flex-col bg-background/55 border-t-2 sm:border-t-4 md:border-t-8 rounded-t-2xl border-x-2 sm:border-x-4 md:border-x-8 border-primary/10 dark:border-zinc-900/50 overflow-hidden">
          {/* Upload Status - Enhanced responsive design */}
          {uploadingFiles.length > 0 && (
            <div className={cn(
              "px-3 sm:px-4 py-3 border-b border-border/50 bg-muted/30",
              uploadingFiles.every(f => f.status === 'success') && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
              uploadingFiles.some(f => f.status === 'error') && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  {uploadingFiles.some(f => f.status === 'uploading') && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {uploadingFiles.every(f => f.status === 'success') && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {uploadingFiles.some(f => f.status === 'error') && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {uploadingFiles.every(f => f.status === 'success')
                    ? `Successfully uploaded ${uploadingFiles.length} file${uploadingFiles.length > 1 ? 's' : ''}!`
                    : uploadingFiles.some(f => f.status === 'error')
                    ? `Upload failed for ${uploadingFiles.filter(f => f.status === 'error').length} file${uploadingFiles.filter(f => f.status === 'error').length > 1 ? 's' : ''}`
                    : `Uploading ${uploadingFiles.length} file${uploadingFiles.length > 1 ? 's' : ''}...`
                  }
                </div>
              </div>

              <div className="space-y-1">
                {uploadingFiles.map((uploadingFile, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
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
                      {uploadingFile.status === 'uploading' && (
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      )}
                      {uploadingFile.status === 'success' && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}
                      {uploadingFile.status === 'error' && (
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
            <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-border/50">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group flex items-center gap-2 bg-muted/70 hover:bg-muted rounded-xl px-3 py-2 text-xs transition-colors mobile-touch"
                  >
                    <div className="flex-shrink-0">
                      {attachment.fileType === 'image' ? (
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
                      className="flex-shrink-0 text-muted-foreground hover:text-red-500 opacity-70 group-hover:opacity-100 transition-all mobile-touch"
                      type="button"
                      aria-label={`Remove ${attachment.originalName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-transparent overflow-y-auto max-h-[250px] sm:max-h-[300px] rounded-t-xl relative">
            <Textarea
              id="message-input"
              value={input}
              placeholder={
                isHomePage ? "Ask me anything..." : "What can I do for you? (Copy Paste works here)"
              }
              className={cn(
                "w-full px-3 sm:px-4 py-3 sm:py-2 md:pt-4 pr-10 sm:pr-12 border-none shadow-none",
                "placeholder:text-muted-foreground resize-none text-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
                "scrollbar-thumb-rounded-full",
                "min-h-[44px] sm:min-h-[40px] text-base sm:text-base",
                "selection:bg-primary selection:text-primary-foreground",
                "mobile-input leading-relaxed overflow-hidden transition-colors",
                isDragOverTextarea && "bg-primary/5 border-primary/20"
              )}
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
              onPaste={handlePaste}
              onDragOver={handleTextareaDragOver}
              onDragLeave={handleTextareaDragLeave}
              onDrop={handleTextareaDrop}
              aria-label="Message input field"
              aria-describedby="input-field-description"
            />
            {/* Voice Input Button inside textarea */}
            <div className="absolute right-2 top-2">
              <VoiceInputButton
                onResult={handleVoiceInput}
                className="!bg-transparent hover:!bg-muted/50 !p-1.5 h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                disabled={status === "streaming" || status === "submitted"}
              />
            </div>
            <span id="input-field-description" className="sr-only">
              Press Enter to send, Shift+Enter for new line. Paste or drag images and PDFs to upload.
            </span>
          </div>

          <div className="min-h-[60px] sm:h-14 flex bg-transparent items-center px-2 sm:px-3 border-t border-border/50">
            <div className="flex items-center justify-between w-full gap-1 sm:gap-2 md:gap-3">
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink min-w-0 overflow-hidden">
                <div className="min-w-0 flex-shrink overflow-hidden">
                  <ModelSelector />
                </div>
                <ConversationStyleSelector className="hidden md:flex flex-shrink-0" />
                <WebSearchToggle
                  isEnabled={isWebSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className="hidden md:flex flex-shrink-0"
                />
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                <ConversationStyleSelector className="flex md:hidden" />
                <WebSearchToggle
                  isEnabled={isWebSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className="flex md:hidden"
                />
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  onUploadStatusChange={handleUploadStatusChange}
                  disabled={status === "streaming" || status === "submitted"}
                />
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
    </div>
  );
}

const InputField = memo(PureInputField, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.status !== nextProps.status) return false;
  return true;
});

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
  return (
    <Button
      onClick={onSubmit}
      variant="default"
      size="icon"
      className="h-10 w-10 sm:h-9 sm:w-9 mobile-touch"
      disabled={disabled}
      aria-label="Send message"
    >
      <ArrowUpIcon size={18} />
    </Button>
  );
};

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  return prevProps.disabled === nextProps.disabled;
});

export default InputField;
