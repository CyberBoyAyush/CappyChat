/**
 * SearchTypeSelector Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Dropdown selector for choosing between Web Search, Reddit Search, and Study Mode.
 * Mobile-friendly with icon-only display on small screens.
 */

import { ChevronDown, Check, Globe, MessageCircle, GraduationCap } from "lucide-react";
import { FaRedditAlien } from "react-icons/fa6";
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
  SearchTypeConfig,
} from "@/frontend/stores/SearchTypeStore";

interface SearchTypeSelectorProps {
  className?: string;
}

// Icon mapping for dynamic icon rendering
const IconMap = {
  Globe,
  MessageCircle,
  FaRedditAlien,
  GraduationCap,
};

function PureSearchTypeSelector({ className }: SearchTypeSelectorProps) {
  const { selectedSearchType, setSearchType, getSearchConfig } =
    useSearchTypeStore();
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
          variant="ghost"
          size="sm"
          title={`Select mode - Current: ${currentConfig.name}`}
          className={cn(
            "flex items-center text-primary h-10 sm:h-9 md:h-8 gap-1.5 text-xs font-medium transition-all duration-200",
            "hover:bg-accent hover:text-primary ",
            "sm:min-w-[100px] sm:justify-between",
            "justify-center min-w-[32px]",
            className
          )}
          aria-label={`Current mode: ${currentConfig.name}`}
        >
          <CurrentIcon className={cn("h-3.5 w-3.5")} />
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
        className={cn(
          "w-48 max-h-72 p-0",
          "border border-border/50 bg-background/95 backdrop-blur-xl",
          "shadow-xl rounded-xl"
        )}
        sideOffset={8}
      >
        <div className="p-2 space-y-2">
          {searchTypes.map((config) => {
            const ConfigIcon = IconMap[config.icon as keyof typeof IconMap];
            const isSelected = selectedSearchType === config.id;

            return (
              <button
                key={config.id}
                onClick={() => handleSearchTypeSelect(config.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all duration-200",
                  "hover:bg-accent/30",
                  isSelected && "bg-primary/15"
                )}
                aria-label={`Select ${config.name} mode`}
              >
                <ConfigIcon
                  className={cn("h-3.5 text-primary w-3.5 flex-shrink-0")}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-medium text-sm truncate text-primary"
                      )}
                    >
                      {config.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                  {/* <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {config.description}
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

export const SearchTypeSelector = memo(PureSearchTypeSelector);
