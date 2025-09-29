/**
 * AspectRatioSelector Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Dropdown selector for choosing aspect ratios for image generation.
 * Replaces ConversationStyleSelector and WebSearchToggle when in image generation mode.
 */

import {
  ChevronDown,
  Check,
  Square,
  RectangleHorizontal,
  Monitor,
  Smartphone,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";

export interface AspectRatio {
  id: string;
  name: string;
  ratio: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  // Model-specific dimensions
  fluxKontextDimensions?: { width: number; height: number };
  standardDimensions?: { width: number; height: number };
}

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: "1:1",
    name: "Square",
    ratio: "1:1",
    width: 1024, // Default/standard dimensions
    height: 1024,
    icon: Square,
    description: "Perfect for social media posts and avatars",
    fluxKontextDimensions: { width: 1024, height: 1024 }, // FLUX Kontext supported: '1024x1024'
    standardDimensions: { width: 1024, height: 1024 },
  },
  {
    id: "21:9",
    name: "Ultrawide",
    ratio: "21:9",
    width: 1568, // FLUX Kontext dimensions by default
    height: 672,
    icon: RectangleHorizontal,
    description: "Cinematic ultrawide format",
    fluxKontextDimensions: { width: 1568, height: 672 }, // FLUX Kontext supported: '1568x672'
    standardDimensions: { width: 1344, height: 576 }, // Standard for other models
  },
  {
    id: "16:9",
    name: "Widescreen",
    ratio: "16:9",
    width: 1392, // FLUX Kontext dimensions by default
    height: 752,
    icon: Monitor,
    description: "Standard widescreen format",
    fluxKontextDimensions: { width: 1392, height: 752 }, // FLUX Kontext supported: '1392x752'
    standardDimensions: { width: 1344, height: 768 }, // Standard for other models
  },
  {
    id: "4:3",
    name: "Classic",
    ratio: "4:3",
    width: 1248, // Updated to use FLUX Kontext supported dimensions
    height: 832,
    icon: Smartphone,
    description: "Traditional 4:3 aspect ratio",
    fluxKontextDimensions: { width: 1248, height: 832 }, // FLUX Kontext supported: '1248x832'
    standardDimensions: { width: 1024, height: 768 }, // Standard for other models
  },
];

/**
 * Get appropriate dimensions for a given aspect ratio and model
 */
export const getDimensionsForModel = (
  aspectRatio: AspectRatio,
  modelId: string
): { width: number; height: number } => {
  // Gemini image models use standard dimensions
  if (aspectRatio.standardDimensions) {
    return aspectRatio.standardDimensions;
  }

  // Fallback to the default width/height
  return { width: aspectRatio.width, height: aspectRatio.height };
};

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  className?: string;
}

function PureAspectRatioSelector({
  selectedRatio,
  onRatioChange,
  className,
}: AspectRatioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRatioSelect = useCallback(
    (ratio: AspectRatio) => {
      onRatioChange(ratio);
      setIsOpen(false);
    },
    [onRatioChange]
  );

  const CurrentIcon = selectedRatio.icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Select aspect ratio"
          className={cn(
            "flex items-center text-primary gap-1.5 text-xs font-medium transition-all duration-200",
            "hover:bg-accent hover:text-primary  h-8",
            "sm:min-w-[90px] sm:justify-between",
            "justify-center min-w-[32px]",
            className
          )}
          aria-label={`Current aspect ratio: ${selectedRatio.name}`}
        >
          <CurrentIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden sm:inline text-xs truncate">
            {selectedRatio.ratio}
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
          {ASPECT_RATIOS.map((ratio) => {
            const RatioIcon = ratio.icon;
            const isSelected = selectedRatio.id === ratio.id;

            return (
              <button
                key={ratio.id}
                onClick={() => handleRatioSelect(ratio)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all duration-200",
                  "hover:bg-accent/30",
                  isSelected && "bg-primary/15"
                )}
                aria-label={`Select ${ratio.name} aspect ratio`}
              >
                <RatioIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-medium text-sm truncate text-primary"
                      )}
                    >
                      {ratio.name} ({ratio.ratio})
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {ratio.description}
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

export const AspectRatioSelector = memo(PureAspectRatioSelector);
AspectRatioSelector.displayName = "AspectRatioSelector";
