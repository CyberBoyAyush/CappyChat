/**
 * ChatInputField Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main chat input field with model selection dropdown and send button.
 * Handles message composition, auto-resize, model switching, and message submission.
 * Creates new threads when needed and manages chat state.
 */

import { ArrowUpIcon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo } from "react";
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
import { useIsMobile } from "@/hooks/useMobileDetection";
import { useWebSearchStore } from "@/frontend/stores/WebSearchStore";
import { useModelStore } from "@/frontend/stores/ChatModelStore";

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

const createUserMessage = (id: string, text: string): UIMessage => ({
  id,
  parts: [{ type: "text", text }],
  role: "user",
  content: text,
  createdAt: new Date(),
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

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const isHomePage = location.pathname === "/chat";

  const isDisabled = useMemo(
    () => !input.trim() || status === "streaming" || status === "submitted",
    [input, status]
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

  const handleSubmit = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      !currentInput.trim() ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const messageId = uuidv4();
    const userMessage = createUserMessage(messageId, currentInput.trim());

    // Handle new vs existing conversations
    if (!id) {
      // New conversation - navigate first
      navigate(`/chat/${threadId}`);

      // Create thread instantly with local update + async backend sync
      HybridDB.createThread(threadId);

      // Start completion immediately for better UX
      complete(currentInput.trim(), {
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

    // The message will be persisted to database in ChatInterface's onFinish callback
    append(userMessage);
    setInput("");
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

  return (
    <div className="w-full">
      <div className="border-t-[1px] border-x-[1px] border-primary/30 rounded-t-2xl shadow-lg w-full backdrop-blur-md">
        <div className="flex flex-col bg-background/55 border-t-8 rounded-t-2xl border-x-8 border-zinc-900/50">
          <div className="bg-transparent overflow-y-auto max-h-[300px] rounded-t-xl">
            <Textarea
              id="message-input"
              value={input}
              placeholder={
                isHomePage ? "Ask me anything..." : "What can I do for you?"
              }
              className={cn(
                "w-full px-3 sm:px-4 py-2 sm:py-1.5 md:pt-4 border-none shadow-none ",
                "placeholder:text-muted-foreground resize-none text-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
                "scrollbar-thumb-rounded-full",
                "min-h-[40px] sm:min-h-[10px] text-sm sm:text-base",
                "selection:bg-primary selection:text-primary-foreground",
                "mobile-input leading-relaxed"
              )}
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
              aria-label="Message input field"
              aria-describedby="input-field-description"
            />
            <span id="input-field-description" className="sr-only">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>

          <div className="h-16 sm:h-14 flex bg-transparent items-center px-3 sm:px-2 border-t border-border/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ModelSelector />
                <WebSearchToggle
                  isEnabled={isWebSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className="hidden sm:flex"
                />
              </div>

              <div className="flex items-center gap-2">
                <WebSearchToggle
                  isEnabled={isWebSearchEnabled}
                  onToggle={setWebSearchEnabled}
                  className="flex sm:hidden"
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
      className="h-9 w-9 sm:h-8 sm:w-8"
      onClick={stop}
      aria-label="Stop generating response"
    >
      <StopIcon size={20} />
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
      className="h-9 w-9 sm:h-8 sm:w-8"
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
