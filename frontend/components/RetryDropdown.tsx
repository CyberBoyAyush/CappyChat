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
    <DropdownMenuItem
      onClick={() => toggleCategory(category)}
      className="flex items-center justify-between cursor-pointer hover:bg-accent/50"
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      {expandedCategories[category] ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </DropdownMenuItem>
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
          size="icon" 
          disabled={disabled}
          className="relative group"
        >
          <RefreshCcw className="w-4 h-4" />
          <ChevronDown className="w-2 h-2 absolute -bottom-0.5 -right-0.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Retry with same model */}
        <DropdownMenuItem onClick={() => handleRetryWithModel()}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Retry with {getModelConfig(selectedModel).displayName}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
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
                className="flex items-center gap-2 pl-6"
              >
                <ModelIcon model={model} />
                <span className="text-sm">{getModelConfig(model).displayName}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
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
                className="flex items-center gap-2 pl-6"
              >
                <ModelIcon model={model} />
                <span className="text-sm">{getModelConfig(model).displayName}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
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
                className="flex items-center gap-2 pl-6"
              >
                <ModelIcon model={model} />
                <span className="text-sm">{getModelConfig(model).displayName}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
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
                className="flex items-center gap-2 pl-6"
              >
                <ModelIcon model={model} />
                <span className="text-sm">{getModelConfig(model).displayName}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
