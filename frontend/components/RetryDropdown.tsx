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
  message?: any; // The message being retried to determine context
}

export default function RetryDropdown({
  onRetry,
  disabled = false,
  message,
}: RetryDropdownProps) {
  const { selectedModel } = useModelStore();
  const { isGuest } = useAuth();

  // Determine if the original message was for image generation
  const isImageGenerationContext = useMemo(() => {
    if (!message) return false;

    // Check various indicators that this was an image generation message
    const isImageGeneration = message.isImageGeneration;
    const isImageGenerationLoading = message.isImageGenerationLoading;
    const hasImageUrl = !!message.imgurl;
    const messageText = message.content || "";
    const hasImageGenText =
      messageText.includes("🎨 Generating your image") ||
      messageText.includes("Generating your image");

    // Check if the model used was an image generation model
    const messageModel = message.model;
    const isImageGenModel = messageModel
      ? getModelConfig(messageModel as AIModel)?.isImageGeneration
      : false;

    return (
      isImageGeneration ||
      isImageGenerationLoading ||
      hasImageUrl ||
      hasImageGenText ||
      isImageGenModel
    );
  }, [message]);

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
      // Guest users can only use Gemini 2.5 Flash Lite
      if (isGuest) {
        return model === "Gemini 2.5 Flash Lite";
      }

      const modelConfig = getModelConfig(model);

      // Filter based on context: if original was image generation, show only image models
      // If original was text generation, show only text models
      if (isImageGenerationContext) {
        // Show only image generation models
        return !!modelConfig.isImageGeneration;
      } else {
        // Show only non-image generation models (text models)
        return !modelConfig.isImageGeneration;
      }
    },
    [isGuest, isImageGenerationContext]
  );

  // Define recommended models based on context
  const recommendedModels: AIModel[] = useMemo(() => {
    if (isImageGenerationContext) {
      // Recommended image generation models
      return [
        "FLUX.1 [schnell]",
        "FLUX.1 Dev",
        "Stable Defusion 3",
        "Juggernaut Pro",
      ];
    } else {
      // Recommended text generation models
      return [
        "Gemini 2.5 Flash Lite",
        "Gemini 2.5 Flash",
        "OpenAI o4-mini",
        "DeepSeek R1 Fast",
      ];
    }
  }, [isImageGenerationContext]);

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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-72 max-h-[600px] main-chat-scrollbar bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl",
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

        <div className="flex items-center justify-center my-2">
          <div className="h-px bg-muted-foreground/10 mx-2 my-1 w-full" />
          <span className="text-sm text-muted-foreground px-2">OR</span>
          <div className="h-px bg-muted-foreground/10 mx-2 my-1 w-full" />
        </div>

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
