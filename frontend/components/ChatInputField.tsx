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
import { useIsMobile } from "@/hooks/useMobileDetection";
import { useWebSearchStore } from "@/frontend/stores/WebSearchStore";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import VoiceInputButton from "./ui/VoiceInputButton";
import FileUpload from "./FileUpload";
import { FileAttachment } from "@/lib/appwriteDB";
import { X, FileImage, FileText } from "lucide-react";

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

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const isHomePage = location.pathname === "/chat";

  const isDisabled = useMemo(
    () => (!input.trim() && attachments.length === 0) || status === "streaming" || status === "submitted",
    [input, status, attachments]
  );

  const { complete } = useChatMessageSummary();

  // Web search state
  const { isWebSearchEnabled, setWebSearchEnabled } = useWebSearchStore();
  const { selectedModel } = useModelStore();

  // Lock model selector when web search is enabled
  const isModelLocked = isWebSearchEnabled;

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

  return (
    <div className="w-full">
      <div className="border-t-[1px] border-x-[1px] border-primary/30 rounded-t-2xl shadow-lg w-full backdrop-blur-md">
        <div className="flex flex-col bg-background/55 border-t-4 sm:border-t-8 rounded-t-2xl border-x-4 sm:border-x-8 border-primary/10 dark:border-zinc-900/50">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-2 border-b border-border/50">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-1.5 sm:gap-2 bg-muted rounded-lg px-2 py-1.5 text-xs mobile-touch"
                  >
                    {attachment.fileType === 'image' ? (
                      <FileImage className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="truncate max-w-16 sm:max-w-24 md:max-w-32">{attachment.originalName}</span>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0 mobile-touch"
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
                isHomePage ? "Ask me anything..." : "What can I do for you?"
              }
              className={cn(
                "w-full px-3 sm:px-4 py-3 sm:py-2 md:pt-4 pr-12 border-none shadow-none",
                "placeholder:text-muted-foreground resize-none text-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
                "scrollbar-thumb-rounded-full",
                "min-h-[44px] sm:min-h-[40px] text-base sm:text-base",
                "selection:bg-primary selection:text-primary-foreground",
                "mobile-input leading-relaxed"
              )}
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
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
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>

          <div className="min-h-[60px] sm:h-14 flex bg-transparent items-center px-2 sm:px-3 border-t border-border/50">
            <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink min-w-0">
                <div className="min-w-0 flex-shrink">
                  <ModelSelector />
                </div>
                <ConversationStyleSelector className="hidden sm:flex flex-shrink-0" />
                <WebSearchToggle
                  isEnabled={isWebSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className="hidden sm:flex flex-shrink-0"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <ConversationStyleSelector className="flex sm:hidden" />
                <WebSearchToggle
                  isEnabled={isWebSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className="flex sm:hidden"
                />
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
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
