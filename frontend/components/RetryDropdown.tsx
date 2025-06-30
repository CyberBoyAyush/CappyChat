/**
 * RetryDropdown Component
 *
 * Used in: frontend/components/ChatMessageControls.tsx
 * Purpose: Provides a dropdown for retry functionality with model selection options.
 * Shows "Retry with same model" and categorized model groups for regenerating responses.
 */

import { useState, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Star,
  DollarSign,
  Gem,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { AIModel, AI_MODELS, getModelConfig } from "@/lib/models";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { useAuth } from "@/frontend/contexts/AuthContext";

import { getModelIcon } from "./ui/ModelComponents";

interface RetryDropdownProps {
  onRetry: (model?: AIModel) => void;
  disabled?: boolean;
}

export default function RetryDropdown({
  onRetry,
  disabled = false,
}: RetryDropdownProps) {
  const { selectedModel } = useModelStore();
  const { isGuest } = useAuth();

  // State for collapsible categories
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    recommended: false,
    budget: false,
    premium: false,
    superPremium: false,
  });

  // For client-side, we'll use a simpler approach to determine available models
  const isModelAvailable = useCallback(
    (model: AIModel) => {
      // Guest users can only use OpenAI 4.1 Mini
      if (isGuest) {
        return model === "OpenAI 4.1 Mini";
      }

      // For authenticated users, allow all models
      // The server will handle the actual tier validation during the API call
      return true;
    },
    [isGuest]
  );

  // Define recommended models
  const recommendedModels: AIModel[] = [
    "OpenAI 4.1 Mini",
    "Gemini 2.5 Flash",
    "OpenAI o4-mini",
    "DeepSeek R1 Fast",
  ];

  // Categorize models
  const categorizeModels = useMemo(() => {
    const freeModels: AIModel[] = [];
    const premiumModels: AIModel[] = [];
    const superPremiumModels: AIModel[] = [];

    AI_MODELS.forEach((model) => {
      const config = getModelConfig(model);
      if (config.isSuperPremium) {
        superPremiumModels.push(model);
      } else if (config.isPremium) {
        premiumModels.push(model);
      } else {
        freeModels.push(model);
      }
    });

    return { freeModels, premiumModels, superPremiumModels };
  }, []);

  // Filter models based on availability
  const filterAvailableModels = useCallback(
    (models: AIModel[]) => {
      return models.filter((model) => isModelAvailable(model));
    },
    [isModelAvailable]
  );

  const handleRetryWithModel = useCallback(
    (model?: AIModel) => {
      onRetry(model);
    },
    [onRetry]
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const isCurrentlyExpanded = prev[category];

      // If clicking on an already expanded category, just close it
      if (isCurrentlyExpanded) {
        return {
          ...prev,
          [category]: false,
        };
      }

      // If opening a new category, close all others and open this one
      return {
        recommended: false,
        budget: false,
        premium: false,
        superPremium: false,
        [category]: true,
      };
    });
  }, []);

  const ModelIcon = ({ model }: { model: AIModel }) => {
    const modelConfig = getModelConfig(model);
    return getModelIcon(modelConfig.iconType, 16, "h-4 w-4");
  };

  // Category header component
  const CategoryHeader = ({
    category,
    icon: IconComponent,
    label,
    count,
  }: {
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
  }) => (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCategory(category);
      }}
      className={cn(
        "flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg",
        "hover:bg-primary/10 transition-all duration-200 mx-1 my-0.5",
        "border border-transparent hover:border-primary/20 group"
      )}
    >
      <div className="flex items-center gap-2.5">
        <IconComponent className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {expandedCategories[category] ? (
        <ChevronDown className="h-3.5 w-3.5 text-primary transition-transform duration-200" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-primary transition-transform duration-200" />
      )}
    </div>
  );

  const availableRecommended = filterAvailableModels(recommendedModels);
  const availableFree = filterAvailableModels(categorizeModels.freeModels);
  const availablePremium = filterAvailableModels(
    categorizeModels.premiumModels
  );
  const availableSuperPremium = filterAvailableModels(
    categorizeModels.superPremiumModels
  );

  // Reset all expanded categories when dropdown closes
  const handleDropdownOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setExpandedCategories({
        recommended: false,
        budget: false,
        premium: false,
        superPremium: false,
      });
    }
  }, []);

  return (
    <DropdownMenu onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "relative group h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-all duration-200",

            "shadow-sm hover:shadow-md"
          )}
        >
          <RefreshCcw className="w-4 h-4 text-foreground transition-colors" />
          <ChevronDown className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 opacity-60 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-72 bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl",
          "animate-in slide-in-from-top-2 duration-200 rounded-xl p-2"
        )}
      >
        {/* Retry with same model */}
        <DropdownMenuItem
          onClick={() => handleRetryWithModel()}
          className={cn(
            "hover:bg-primary/10 transition-all duration-200 mx-1 my-1 rounded-lg px-3 py-2.5",
            "border border-transparent hover:border-primary/20 group"
          )}
        >
          <RefreshCcw className="w-4 h-4 mr-3 text-primary" />
          <span className="font-medium text-foreground">
            Retry with {getModelConfig(selectedModel).displayName}
          </span>
        </DropdownMenuItem>

        <div className="h-px bg-border/50 mx-2 my-1" />

        {/* Recommended Models */}
        {availableRecommended.length > 0 && (
          <>
            <CategoryHeader
              category="recommended"
              icon={Star}
              label="Recommended"
              count={availableRecommended.length}
            />
            {expandedCategories.recommended &&
              availableRecommended.map((model) => (
                <DropdownMenuItem
                  key={model}
                  onClick={() => handleRetryWithModel(model)}
                  className={cn(
                    "flex items-center gap-2 pl-7 mx-1 my-0.5 rounded-lg",
                    "hover:bg-primary/10 transition-all duration-200",
                    "border border-transparent hover:border-primary/20"
                  )}
                >
                  <ModelIcon model={model} />
                  <span className="text-sm text-foreground">
                    {getModelConfig(model).displayName}
                  </span>
                </DropdownMenuItem>
              ))}
            <div className="h-px bg-border/50 mx-2 my-1" />
          </>
        )}

        {/* Budget Models */}
        {availableFree.length > 0 && (
          <>
            <CategoryHeader
              category="budget"
              icon={DollarSign}
              label="Budget"
              count={availableFree.length}
            />
            {expandedCategories.budget &&
              availableFree.map((model) => (
                <DropdownMenuItem
                  key={model}
                  onClick={() => handleRetryWithModel(model)}
                  className={cn(
                    "flex items-center gap-2 pl-7 mx-1 my-0.5 rounded-lg",
                    "hover:bg-primary/10 transition-all duration-200",
                    "border border-transparent hover:border-primary/20"
                  )}
                >
                  <ModelIcon model={model} />
                  <span className="text-sm text-foreground">
                    {getModelConfig(model).displayName}
                  </span>
                </DropdownMenuItem>
              ))}
            <div className="h-px bg-border/50 mx-2 my-1" />
          </>
        )}

        {/* Premium Models */}
        {availablePremium.length > 0 && (
          <>
            <CategoryHeader
              category="premium"
              icon={Gem}
              label="Premium"
              count={availablePremium.length}
            />
            {expandedCategories.premium &&
              availablePremium.map((model) => (
                <DropdownMenuItem
                  key={model}
                  onClick={() => handleRetryWithModel(model)}
                  className={cn(
                    "flex items-center gap-2 pl-7 mx-1 my-0.5 rounded-lg",
                    "hover:bg-primary/10 transition-all duration-200",
                    "border border-transparent hover:border-primary/20"
                  )}
                >
                  <ModelIcon model={model} />
                  <span className="text-sm text-foreground">
                    {getModelConfig(model).displayName}
                  </span>
                </DropdownMenuItem>
              ))}
            <div className="h-px bg-border/50 mx-2 my-1" />
          </>
        )}

        {/* Super Premium Models */}
        {availableSuperPremium.length > 0 && (
          <>
            <CategoryHeader
              category="superPremium"
              icon={Crown}
              label="Super Premium"
              count={availableSuperPremium.length}
            />
            {expandedCategories.superPremium &&
              availableSuperPremium.map((model) => (
                <DropdownMenuItem
                  key={model}
                  onClick={() => handleRetryWithModel(model)}
                  className={cn(
                    "flex items-center gap-2 pl-7 mx-1 my-0.5 rounded-lg",
                    "hover:bg-primary/10 transition-all duration-200",
                    "border border-transparent hover:border-primary/20"
                  )}
                >
                  <ModelIcon model={model} />
                  <span className="text-sm text-foreground">
                    {getModelConfig(model).displayName}
                  </span>
                </DropdownMenuItem>
              ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
