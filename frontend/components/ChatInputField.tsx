/**
 * ChatInputField Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main chat input field with model selection dropdown and send button.
 * Handles message composition, auto-resize, model switching, and message submission.
 * Creates new threads when needed and manages chat state.
 */

import { ChevronDown, Check, ArrowUpIcon } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import useTextAreaAutoResize from "@/hooks/useTextAreaAutoResize";
import { UseChatHelpers } from "@ai-sdk/react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { createMessage, createThread } from "@/frontend/database/chatQueries";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { AI_MODELS, AIModel, getModelConfig } from "@/lib/models";
import {
  ModelBadge,
  getModelIcon,
} from "@/frontend/components/ui/ModelComponents";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { StopIcon } from "./ui/UIComponents";
import { useChatMessageSummary } from "../hooks/useChatMessageSummary";

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

    if (!id) {
      navigate(`/chat/${threadId}`);
      await createThread(threadId);
      complete(currentInput.trim(), {
        body: { threadId, messageId, isTitle: true },
      });
    } else {
      complete(currentInput.trim(), { body: { messageId, threadId } });
    }

    const userMessage = createUserMessage(messageId, currentInput.trim());
    await createMessage(threadId, userMessage);

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
  ]);

  // Removed API key check since we now use environment variables

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
    <div className="fixed bottom-0 z-40 w-auto mx-auto left-1/2 transform -translate-x-1/2">
      <div className="w-full max-w-sm sm:min-w-md md:min-w-lg lg:min-w-2xl xl:min-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-t-2xl shadow-lg p-2 md:p-3 pb-2 w-full backdrop-blur-sm mx-auto">
          <div className="relative">
            <div className="flex flex-col">
              <div className="bg-transparent overflow-y-auto max-h-[300px] rounded-lg">
                <Textarea
                  id="message-input"
                  value={input}
                  placeholder="What can I do for you?"
                  className={cn(
                    "w-full px-4 py-1.5 md:py-3 border-none shadow-none bg-transparent",
                    "placeholder:text-muted-foreground resize-none text-foreground",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
                    "scrollbar-thumb-rounded-full",
                    "min-h-[10px] text-sm sm:text-base",
                    // Better light mode styling and mobile optimization
                    "selection:bg-primary selection:text-primary-foreground",
                    // Mobile-specific improvements
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

              <div className="h-14 flex items-center px-2 border-t border-border/50">
                <div className="flex items-center justify-between w-full">
                  <ModelDropdown />

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
    </div>
  );
}

const InputField = memo(PureInputField, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.status !== nextProps.status) return false;
  return true;
});

const PureModelDropdown = () => {
  const { selectedModel, setModel } = useModelStore();
  const selectedModelConfig = getModelConfig(selectedModel);

  const isModelEnabled = useCallback((_model: AIModel) => {
    // All models are enabled since we use environment API key
    return true;
  }, []);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-8 pl-2 pr-2 text-xs rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus-enhanced"
            aria-label={`Selected model: ${selectedModel}`}
          >
            <div className="flex max-w-[180px] md:max-w-sm items-center gap-2">
              {getModelIcon(selectedModelConfig.iconType, 16)}
              <span className="mobile-text truncate max-w-sm">
                {selectedModelConfig.displayName}
              </span>
              <div className="flex items-center gap-1">
                {selectedModelConfig.isSuperPremium && <ModelBadge type="super-premium" />}
                {selectedModelConfig.isPremium && !selectedModelConfig.isSuperPremium && <ModelBadge type="premium" />}
                {selectedModelConfig.hasReasoning && (
                  <ModelBadge type="reasoning" />
                )}
              </div>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            "max-w-[300px] sm:max-w-[400px] lg:max-w-[500px]",
            "mx-4",
            "border-border",
            "bg-popover",
            "max-h-[60vh] overflow-y-auto",
            "sm:max-h-[70vh]",
            "lg:max-h-[80vh]",
            "scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent scrollbar-thumb-rounded-full"
          )}
          align="end"
          sideOffset={8}
        >
          {AI_MODELS.map((model) => {
            const isEnabled = isModelEnabled(model);
            const modelConfig = getModelConfig(model);
            return (
              <DropdownMenuItem
                key={model}
                onSelect={() => isEnabled && setModel(model)}
                disabled={!isEnabled}
                className={cn(
                  "flex items-center justify-between gap-3 p-3",
                  "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getModelIcon(modelConfig.iconType, 20)}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {modelConfig.displayName}
                      </span>
                      <div className="flex items-center gap-1">
                        {modelConfig.isSuperPremium && <ModelBadge type="super-premium" />}
                        {modelConfig.isPremium && !modelConfig.isSuperPremium && <ModelBadge type="premium" />}
                        {modelConfig.hasReasoning && (
                          <ModelBadge type="reasoning" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {modelConfig.description}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {modelConfig.company}
                    </span>
                  </div>
                </div>
                {selectedModel === model && (
                  <Check
                    className="w-4 h-4 text-primary"
                    aria-label="Selected"
                  />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const ModelDropdown = memo(PureModelDropdown);

function PureStopButton({ stop }: StopButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
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
