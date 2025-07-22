/**
 * SearchTypeSelector Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Dropdown selector for choosing between Web Search and Reddit Search.
 * Mobile-friendly with icon-only display on small screens.
 */

import { ChevronDown, Check, Globe, MessageSquare, MessageCircle } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { 
  useSearchTypeStore, 
  SearchType, 
  SEARCH_TYPE_CONFIGS,
  SearchTypeConfig 
} from "@/frontend/stores/SearchTypeStore";

interface SearchTypeSelectorProps {
  className?: string;
}

// Icon mapping for dynamic icon rendering
const IconMap = {
  Globe,
  MessageSquare,
  MessageCircle,
};

function PureSearchTypeSelector({ className }: SearchTypeSelectorProps) {
  const {
    selectedSearchType,
    setSearchType,
    getSearchConfig
  } = useSearchTypeStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = getSearchConfig();
  const CurrentIcon = IconMap[currentConfig.icon as keyof typeof IconMap];

  const handleSearchTypeSelect = useCallback(
    (type: SearchType) => {
      setSearchType(type);
      setIsOpen(false);
    },
    [setSearchType]
  );

  const searchTypes = Object.values(SEARCH_TYPE_CONFIGS);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title={`Select mode - Current: ${currentConfig.name}`}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
            "hover:bg-muted border-border/50 h-8",
            // Mobile: icon only, minimal width
            "sm:min-w-[100px] sm:justify-between",
            // Desktop: show text
            "justify-center min-w-[32px]",
            className
          )}
          aria-label={`Current mode: ${currentConfig.name}`}
        >
          <CurrentIcon
            className={cn("h-3.5 w-3.5", currentConfig.color)}
          />
          <span className="hidden sm:inline text-xs truncate">
            {currentConfig.name}
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
        className="w-56 max-h-72 p-1.5"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {searchTypes.map((config) => {
            const ConfigIcon = IconMap[config.icon as keyof typeof IconMap];
            const isSelected = selectedSearchType === config.id;

            return (
              <button
                key={config.id}
                onClick={() => handleSearchTypeSelect(config.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-md text-left transition-all duration-150",
                  "hover:bg-muted/80 focus:bg-muted/80 focus:outline-none",
                  isSelected && "bg-muted"
                )}
                aria-label={`Select ${config.name} mode`}
              >
                <ConfigIcon
                  className={cn("h-3.5 w-3.5 flex-shrink-0", config.color)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">
                      {config.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {config.description}
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

export const SearchTypeSelector = memo(PureSearchTypeSelector);
