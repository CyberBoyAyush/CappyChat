/**
 * ConversationStyleSelector Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Minimal dropdown selector for choosing conversation styles that modify AI behavior.
 * Mobile-friendly with icon-only display on small screens.
 */

import { ChevronDown, Check, WandSparkles } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { useConversationStyleStore } from "@/frontend/stores/ConversationStyleStore";
import {
  getAllConversationStyles,
  ConversationStyleConfig,
} from "@/lib/conversationStyles";

interface ConversationStyleSelectorProps {
  className?: string;
}

function PureConversationStyleSelector({
  className,
}: ConversationStyleSelectorProps) {
  const { selectedStyle, setStyle, getStyleConfig } =
    useConversationStyleStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentStyleConfig = getStyleConfig();
  const allStyles = getAllConversationStyles();

  const handleStyleSelect = useCallback(
    (style: ConversationStyleConfig) => {
      setStyle(style.id);
      setIsOpen(false);
    },
    [setStyle]
  );

  const CurrentIcon = currentStyleConfig.icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Select conversation style"
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
            "hover:bg-accent/20 h-8",
            "sm:min-w-[90px] sm:justify-between",
            "justify-center min-w-[32px]",
            className
          )}
          aria-label={`Current conversation style: ${currentStyleConfig.name}`}
        >
          <WandSparkles className="h-3.5 w-3.5 flex-shrink-0 " />
          <span className="hidden sm:inline text-xs truncate">
            {currentStyleConfig.name}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200 hidden sm:block",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className={cn(
          "w-56 max-h-72 no-scrollbar p-0",
          "border border-border/50 bg-background/95 backdrop-blur-xl",
          "shadow-xl rounded-xl"
        )}
        sideOffset={8}
      >
        <div className="p-2 space-y-2">
          {allStyles.map((style) => {
            const StyleIcon = style.icon;
            const isSelected = selectedStyle === style.id;

            return (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all duration-200",
                  "hover:bg-accent/30",
                  isSelected && "bg-primary/5"
                )}
                aria-label={`Select ${style.name} conversation style`}
              >
                <StyleIcon className={cn("h-3.5 w-3.5 flex-shrink-0")} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-medium text-sm truncate text-foreground"
                      )}
                    >
                      {style.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-white flex-shrink-0 ml-2" />
                    )}
                  </div>
                  {/* <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {style.description}
                  </p> */}
                </div>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const ConversationStyleSelector = memo(PureConversationStyleSelector);
ConversationStyleSelector.displayName = "ConversationStyleSelector";
