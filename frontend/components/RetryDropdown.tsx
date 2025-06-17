/**
 * RetryDropdown Component
 *
 * Used in: frontend/components/ChatMessageControls.tsx
 * Purpose: Provides a dropdown for retry functionality with model selection options.
 * Shows "Retry with same model" and categorized model groups for regenerating responses.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { RefreshCcw, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { AIModel, AI_MODELS, getModelConfig } from "@/lib/models";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { useAuth } from "@/frontend/contexts/AuthContext";

import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { getModelIcon } from "./ui/ModelComponents";

interface RetryDropdownProps {
  onRetry: (model?: AIModel) => void;
  disabled?: boolean;
}

export default function RetryDropdown({ onRetry, disabled = false }: RetryDropdownProps) {
  const { selectedModel } = useModelStore();
  const { isGuest } = useAuth();
  const { openRouterApiKey } = useBYOKStore();

  // State for collapsible categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    recommended: false,
    budget: false,
    premium: false,
    superPremium: false,
  });

  // For client-side, we'll use a simpler approach to determine available models
  const isModelAvailable = useCallback((model: AIModel) => {
    // Guest users can only use Gemini 2.5 Flash
    if (isGuest) {
      return model === "Gemini 2.5 Flash";
    }

    // For authenticated users, allow all models
    // The server will handle the actual tier validation during the API call
    return true;
  }, [isGuest]);

  // Define recommended models
  const recommendedModels: AIModel[] = [
    'Gemini 2.5 Flash',
    'OpenAI 4.1 Mini',
    'OpenAI o4-mini',
    'DeepSeek R1-0528'
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
  const filterAvailableModels = useCallback((models: AIModel[]) => {
    return models.filter(model => isModelAvailable(model));
  }, [isModelAvailable]);

  const handleRetryWithModel = useCallback((model?: AIModel) => {
    onRetry(model);
  }, [onRetry]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  const ModelIcon = ({ model }: { model: AIModel }) => {
    const modelConfig = getModelConfig(model);
    return getModelIcon(modelConfig.iconType, 16, "h-4 w-4");
  };

  // Category header component
  const CategoryHeader = ({
    category,
    icon,
    label,
    count
  }: {
    category: string;
    icon: string;
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
        "flex items-center justify-between cursor-pointer px-2 py-1.5 rounded-md",
        "hover:bg-orange-500/10 transition-colors duration-200 mx-1 my-0.5",
        "border border-transparent hover:border-orange-500/20"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-orange-500">{icon}</span>
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      {expandedCategories[category] ? (
        <ChevronDown className="h-3 w-3 text-orange-500" />
      ) : (
        <ChevronRight className="h-3 w-3 text-orange-500" />
      )}
    </div>
  );

  const availableRecommended = filterAvailableModels(recommendedModels);
  const availableFree = filterAvailableModels(categorizeModels.freeModels);
  const availablePremium = filterAvailableModels(categorizeModels.premiumModels);
  const availableSuperPremium = filterAvailableModels(categorizeModels.superPremiumModels);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "relative group h-7 w-7 p-0 rounded-md hover:bg-accent/50 transition-all duration-200",
            "border border-border/30 hover:border-border/60 bg-card/30 backdrop-blur-sm"
          )}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <ChevronDown className="w-2 h-2 absolute -bottom-0.5 -right-0.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64 bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg",
          "animate-in slide-in-from-top-2 duration-200"
        )}
      >
        {/* Retry with same model */}
        <DropdownMenuItem
          onClick={() => handleRetryWithModel()}
          className={cn(
            "hover:bg-orange-500/10 transition-colors duration-200 mx-1 my-0.5 rounded-md",
            "border border-transparent hover:border-orange-500/20"
          )}
        >
          <RefreshCcw className="w-4 h-4 mr-2 text-orange-500" />
          <span className="font-medium text-foreground">Retry with {getModelConfig(selectedModel).displayName}</span>
        </DropdownMenuItem>

        <div className="h-px bg-border/50 mx-2 my-1" />
        
        {/* Recommended Models */}
        {availableRecommended.length > 0 && (
          <>
            <CategoryHeader
              category="recommended"
              icon="⭐"
              label="Recommended"
              count={availableRecommended.length}
            />
            {expandedCategories.recommended && availableRecommended.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => handleRetryWithModel(model)}
                className={cn(
                  "flex items-center gap-2 pl-6 mx-1 my-0.5 rounded-md",
                  "hover:bg-orange-500/10 transition-colors duration-200",
                  "border border-transparent hover:border-orange-500/20"
                )}
              >
                <ModelIcon model={model} />
                <span className="text-sm text-foreground">{getModelConfig(model).displayName}</span>
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
              icon="✴️"
              label="Budget"
              count={availableFree.length}
            />
            {expandedCategories.budget && availableFree.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => handleRetryWithModel(model)}
                className={cn(
                  "flex items-center gap-2 pl-6 mx-1 my-0.5 rounded-md",
                  "hover:bg-orange-500/10 transition-colors duration-200",
                  "border border-transparent hover:border-orange-500/20"
                )}
              >
                <ModelIcon model={model} />
                <span className="text-sm text-foreground">{getModelConfig(model).displayName}</span>
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
              icon="💎"
              label="Premium"
              count={availablePremium.length}
            />
            {expandedCategories.premium && availablePremium.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => handleRetryWithModel(model)}
                className={cn(
                  "flex items-center gap-2 pl-6 mx-1 my-0.5 rounded-md",
                  "hover:bg-orange-500/10 transition-colors duration-200",
                  "border border-transparent hover:border-orange-500/20"
                )}
              >
                <ModelIcon model={model} />
                <span className="text-sm text-foreground">{getModelConfig(model).displayName}</span>
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
              icon="💎💎"
              label="Super Premium"
              count={availableSuperPremium.length}
            />
            {expandedCategories.superPremium && availableSuperPremium.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => handleRetryWithModel(model)}
                className={cn(
                  "flex items-center gap-2 pl-6 mx-1 my-0.5 rounded-md",
                  "hover:bg-orange-500/10 transition-colors duration-200",
                  "border border-transparent hover:border-orange-500/20"
                )}
              >
                <ModelIcon model={model} />
                <span className="text-sm text-foreground">{getModelConfig(model).displayName}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
