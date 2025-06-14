/**
 * ConversationStyleSelector Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Minimal dropdown selector for choosing conversation styles that modify AI behavior.
 * Mobile-friendly with icon-only display on small screens.
 */

import { ChevronDown, Check } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { useConversationStyleStore } from "@/frontend/stores/ConversationStyleStore";
import { getAllConversationStyles, ConversationStyleConfig } from "@/lib/conversationStyles";

interface ConversationStyleSelectorProps {
  className?: string;
}

function PureConversationStyleSelector({ className }: ConversationStyleSelectorProps) {
  const { selectedStyle, setStyle, getStyleConfig } = useConversationStyleStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentStyleConfig = getStyleConfig();
  const allStyles = getAllConversationStyles();

  const handleStyleSelect = useCallback((style: ConversationStyleConfig) => {
    setStyle(style.id);
    setIsOpen(false);
  }, [setStyle]);

  const CurrentIcon = currentStyleConfig.icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
            "hover:bg-muted border-border/50 h-8",
            // Mobile: icon only, minimal width
            "sm:min-w-[90px] sm:justify-between",
            // Desktop: show text
            "justify-center min-w-[32px]",
            className
          )}
          aria-label={`Current conversation style: ${currentStyleConfig.name}`}
        >
          <CurrentIcon className={cn("h-3.5 w-3.5", currentStyleConfig.color)} />
          <span className="hidden sm:inline text-xs truncate">{currentStyleConfig.name}</span>
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
        className="w-56 p-1.5"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {allStyles.map((style) => {
            const StyleIcon = style.icon;
            const isSelected = selectedStyle === style.id;

            return (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-md text-left transition-all duration-150",
                  "hover:bg-muted/80 focus:bg-muted/80 focus:outline-none",
                  isSelected && "bg-muted"
                )}
                aria-label={`Select ${style.name} conversation style`}
              >
                <StyleIcon className={cn("h-3.5 w-3.5 flex-shrink-0", style.color)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">
                      {style.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {style.description}
                  </p>
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
