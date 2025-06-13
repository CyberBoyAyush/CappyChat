/**
 * ChatInputField Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main chat input field with model selection dropdown and send button.
 * Handles message composition, auto-resize, model switching, and message submission.
 * Creates new threads when needed and manages chat state.
 */

import { ArrowUpIcon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import useTextAreaAutoResize from "@/hooks/useTextAreaAutoResize";
import { UseChatHelpers } from "@ai-sdk/react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { StopIcon } from "./ui/UIComponents";
import { AppwriteDB } from "@/lib/appwriteDB";
import { HybridDB } from "@/lib/hybridDB";
import { useChatMessageSummary } from "../hooks/useChatMessageSummary";
import { ModelSelector } from "./ModelSelector";
import { useIsMobile } from "@/hooks/useMobileDetection";

interface InputFieldProps {
  threadId: string;
  input: UseChatHelpers["input"];
  status: UseChatHelpers["status"];
  setInput: UseChatHelpers["setInput"];
  append: UseChatHelpers["append"];
  stop: UseChatHelpers["stop"];
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
}: InputFieldProps) {
  const { textareaRef, adjustHeight } = useTextAreaAutoResize({
    minHeight: 72,
    maxHeight: 200,
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();

  const isDisabled = useMemo(
    () => !input.trim() || status === "streaming" || status === "submitted",
    [input, status]
  );

  const { complete } = useChatMessageSummary();

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

    // Create message instantly with local update + async backend sync
    HybridDB.createMessage(threadId, userMessage);

    // Update UI immediately for better responsiveness
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
      <div className="bg-card border border-border rounded-t-3xl shadow-lg w-full backdrop-blur-sm">
        <div className="flex flex-col">
          <div className="bg-transparent overflow-y-auto max-h-[300px] rounded-lg">
            <Textarea
              id="message-input"
              value={input}
              placeholder="What can I do for you?"
              className={cn(
                "w-full px-3 sm:px-4 py-2 sm:py-1.5 md:py-3 border-none shadow-none bg-transparent",
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

          <div className="h-16 sm:h-14 flex items-center px-3 sm:px-2 border-t border-border/50">
            <div className="flex items-center justify-between w-full">
              <ModelSelector />

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
