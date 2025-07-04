/**
 * Enhanced Model Selector Component
 *
 * Purpose: Modern, grid-based model selector with improved UI/UX
 * Features: Responsive grid layout, enhanced badges, better visual hierarchy
 */

import { ChevronDown, Check, Search, Lock, Key } from "lucide-react";
import { memo, useCallback, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { AI_MODELS, AIModel, getModelConfig } from "@/lib/models";
import { canUserUseModel, TierValidationResult } from "@/lib/tierSystem";
import {
  ModelBadge,
  getModelIcon,
} from "@/frontend/components/ui/ModelComponents";
import { useAuth } from "@/frontend/contexts/AuthContext";

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: (model: AIModel) => void;
  showKeyIcon?: boolean;
  tierValidation?: TierValidationResult;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  onSelect,
  showKeyIcon = false,
  tierValidation,
}) => {
  const modelConfig = getModelConfig(model);
  const isDisabled = tierValidation && !tierValidation.canUseModel;

  return (
    <div
      onClick={() => !isDisabled && onSelect(model)}
      className={cn(
        "relative group p-2 sm:p-4 rounded-lg border-2 transition-all duration-200",
        "flex flex-col gap-1.5 sm:gap-3 min-h-[80px] sm:min-h-[120px]",
        isDisabled
          ? "cursor-not-allowed opacity-50 border-muted bg-muted/20"
          : "cursor-pointer hover:shadow-md hover:border-primary/50 hover:bg-accent/50",
        isSelected && !isDisabled
          ? "border-primary bg-primary/5 shadow-sm"
          : !isDisabled
          ? "border-border bg-card hover:bg-accent/30"
          : "border-muted"
      )}
      title={isDisabled ? tierValidation?.message : undefined}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
          <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-2 h-2 sm:w-3 sm:h-3 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Header with icon and name */}
      <div className="flex items-start gap-1.5 sm:gap-3">
        <div className="flex-shrink-0 mt-0.5 sm:mt-1">
          {getModelIcon(modelConfig.iconType, 16)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3
              className={cn(
                "font-semibold text-xs sm:text-sm leading-tight truncate",
                isSelected && !isDisabled
                  ? "text-primary"
                  : isDisabled
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {modelConfig.displayName}
            </h3>
            {showKeyIcon && !isDisabled && (
              <div className="flex-shrink-0" title="Using your API key">
                <Key className="w-3 h-3 text-primary" />
              </div>
            )}
          </div>
          <p
            className={cn(
              "text-xs mt-0.5 sm:mt-1 font-medium hidden sm:block",
              isDisabled ? "text-muted-foreground/70" : "text-muted-foreground"
            )}
          >
            {modelConfig.company}
          </p>
          {isDisabled && tierValidation?.message && (
            <p className="text-xs text-red-500 mt-1 font-medium">
              Credits exhausted
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {modelConfig.isSuperPremium && (
          <div title="Super Premium Model" className="cursor-default">
            <ModelBadge type="super-premium" size={16} />
          </div>
        )}
        {modelConfig.isPremium && !modelConfig.isSuperPremium && (
          <div title="Premium Model" className="cursor-default">
            <ModelBadge type="premium" size={16} />
          </div>
        )}
        {modelConfig.hasReasoning && (
          <div
            title="Reasoning Model - Advanced problem-solving capabilities"
            className="cursor-default"
          >
            <ModelBadge type="reasoning" size={16} />
          </div>
        )}
        {modelConfig.isFast && (
          <div
            title="Fast Model - Optimized for speed and quick responses"
            className="cursor-default"
          >
            <ModelBadge type="fast" size={16} />
          </div>
        )}
        {modelConfig.isFileSupported && (
          <div
            title="File Support - Can analyze images, documents, and other file types"
            className="cursor-default"
          >
            <ModelBadge type="file-support" size={16} />
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block">
        {modelConfig.description}
      </p>

      {/* Hover effect overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-opacity duration-200",
          "bg-gradient-to-br from-primary/5 to-transparent opacity-0",
          "group-hover:opacity-100 pointer-events-none"
        )}
      />
    </div>
  );
};

// BYOK Status Indicator Component
const BYOKIndicator = () => {
  const { hasOpenRouterKey } = useBYOKStore();
  const navigate = useNavigate();
  const hasByok = hasOpenRouterKey();

  const handleClick = () => {
    navigate("/settings?section=application");
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className={cn(
        "h-7 px-2 text-xs font-medium bg-primary/15 transition-all duration-200",
        hasByok
          ? "text-green-600 bg-green-200 dark:bg-green-400  hover:text-green-700 hover:bg-green-300 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-600"
          : "text-muted-foreground hover:text-foreground hover:bg-primary/35"
      )}
      title={
        hasByok
          ? "BYOK is ON - Unlimited access to all models"
          : "Configure your own API key for unlimited access"
      }
    >
      <Key className="w-3 h-3 mr-1 text-primary" />
      <span className="hidden sm:inline text-foreground">
        {hasByok ? "BYOK ON" : "BYOK"}
      </span>
    </Button>
  );
};

interface ModelSelectorProps {
  isImageGenMode?: boolean;
}

const PureModelSelector = ({ isImageGenMode = false }: ModelSelectorProps) => {
  const { selectedModel, setModel } = useModelStore();
  const { hasOpenRouterKey } = useBYOKStore();
  const { isGuest } = useAuth();
  const selectedModelConfig = getModelConfig(selectedModel);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierValidations, setTierValidations] = useState<
    Record<AIModel, TierValidationResult>
  >({} as Record<AIModel, TierValidationResult>);

  // For guest users, lock to OpenAI 4.1 Mini
  // For image generation mode, allow selection but only among image generation models
  // Web search mode allows selection between search models
  const isLocked = isGuest;
  const usingBYOK = hasOpenRouterKey();

  // Force guest users to use OpenAI 4.1 Mini
  useEffect(() => {
    if (isGuest && selectedModel !== "OpenAI 4.1 Mini") {
      console.log(
        "[ModelSelector] Guest user detected, forcing model to OpenAI 4.1 Mini"
      );
      setModel("OpenAI 4.1 Mini");
    }
  }, [isGuest, selectedModel, setModel]);

  // Force image generation mode to use image generation models
  // Also prevent image generation models from being used outside image generation mode
  useEffect(() => {
    if (isImageGenMode) {
      const currentConfig = getModelConfig(selectedModel);
      if (!currentConfig.isImageGeneration) {
        console.log(
          "[ModelSelector] Image generation mode detected, switching to FLUX.1 [schnell]"
        );
        setModel("FLUX.1 [schnell]");
      }
    } else {
      // Not in image generation mode - switch away from image generation models
      const currentConfig = getModelConfig(selectedModel);
      if (currentConfig.isImageGeneration) {
        console.log(
          "[ModelSelector] Not in image generation mode, switching to OpenAI 4.1 Mini"
        );
        setModel("OpenAI 4.1 Mini");
      }
    }
  }, [isImageGenMode, selectedModel, setModel]);

  // Load tier validations for all models
  useEffect(() => {
    const loadTierValidations = async () => {
      const validations: Record<AIModel, TierValidationResult> = {} as Record<
        AIModel,
        TierValidationResult
      >;

      for (const model of AI_MODELS) {
        try {
          validations[model] = await canUserUseModel(model, usingBYOK);
        } catch (error) {
          console.error(`Error validating model ${model}:`, error);
          validations[model] = {
            canUseModel: false,
            remainingCredits: 0,
            message: "Error checking model access",
          };
        }
      }

      setTierValidations(validations);
    };

    loadTierValidations();
  }, [usingBYOK]);

  const isModelEnabled = useCallback(
    (model: AIModel) => {
      if (isGuest) {
        return model === "OpenAI 4.1 Mini";
      }
      if (isImageGenMode) {
        const config = getModelConfig(model);
        return config.isImageGeneration === true;
      }
      // With Tavily integration, all models support web search
      // No need to restrict models based on web search state
      return true;
    },
    [isGuest, isImageGenMode]
  );

  const handleModelSelect = useCallback(
    (model: AIModel) => {
      if (isModelEnabled(model)) {
        setModel(model);
        setSearchQuery(""); // Clear search when model is selected
      }
    },
    [isModelEnabled, setModel]
  );

  // Define recommended models
  const recommendedModels: AIModel[] = [
    "OpenAI 4.1 Mini",
    "OpenAI o4-mini",
    "DeepSeek R1 Fast",
    "Claude Sonnet 3.5",
  ];

  // Categorize models
  const categorizeModels = useMemo(() => {
    const freeModels: AIModel[] = [];
    const premiumModels: AIModel[] = [];
    const superPremiumModels: AIModel[] = [];
    const imageGenModels: AIModel[] = [];

    AI_MODELS.forEach((model) => {
      const config = getModelConfig(model);

      // If in image generation mode, only include image generation models
      if (isImageGenMode) {
        if (config.isImageGeneration) {
          imageGenModels.push(model);
        }
        return;
      }

      // For normal mode, exclude image generation models
      if (config.isImageGeneration) {
        return;
      }

      if (config.isSuperPremium) {
        superPremiumModels.push(model);
      } else if (config.isPremium) {
        premiumModels.push(model);
      } else {
        freeModels.push(model);
      }
    });

    return { freeModels, premiumModels, superPremiumModels, imageGenModels };
  }, [isImageGenMode]);

  // Filter models based on search query and availability
  const filteredModels = useMemo(() => {
    const filterByAvailability = (models: AIModel[]) =>
      models.filter((model) => isModelEnabled(model));

    if (!searchQuery.trim()) {
      return {
        recommended: isImageGenMode
          ? []
          : filterByAvailability(recommendedModels),
        freeModels: filterByAvailability(categorizeModels.freeModels),
        premiumModels: filterByAvailability(categorizeModels.premiumModels),
        superPremiumModels: filterByAvailability(
          categorizeModels.superPremiumModels
        ),
        imageGenModels: filterByAvailability(categorizeModels.imageGenModels),
      };
    }

    const query = searchQuery.toLowerCase();
    const filterModels = (models: AIModel[]) =>
      models.filter((model) => {
        // First check if model is enabled
        if (!isModelEnabled(model)) return false;

        const config = getModelConfig(model);
        return (
          config.displayName.toLowerCase().includes(query) ||
          config.company.toLowerCase().includes(query) ||
          config.description.toLowerCase().includes(query) ||
          (config.isPremium && "premium".includes(query)) ||
          (config.isSuperPremium && "super premium".includes(query)) ||
          (config.hasReasoning && "reasoning".includes(query)) ||
          (config.isFileSupported && "file".includes(query)) ||
          (config.isImageGeneration && "image".includes(query))
        );
      });

    return {
      recommended: isImageGenMode ? [] : filterModels(recommendedModels),
      freeModels: filterModels(categorizeModels.freeModels),
      premiumModels: filterModels(categorizeModels.premiumModels),
      superPremiumModels: filterModels(categorizeModels.superPremiumModels),
      imageGenModels: filterModels(categorizeModels.imageGenModels),
    };
  }, [
    searchQuery,
    recommendedModels,
    categorizeModels,
    isImageGenMode,
    isModelEnabled,
  ]);

  return (
    <div className="flex items-center gap-2 ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLocked}>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-1 sm:gap-2 h-10 sm:h-9 md:h-8 pl-2 pr-1.5 sm:pr-2 text-xs rounded-md min-w-0",
              "text-foreground hover:bg-accent hover:text-accent-foreground",

              "transition-all duration-200 mobile-touch",
              isLocked && "opacity-75 cursor-not-allowed hover:bg-transparent"
            )}
            aria-label={`Selected model: ${selectedModel}${
              isLocked ? " (locked for guest users)" : ""
            }`}
            disabled={isLocked}
            title={isLocked ? "Locked for guest users" : "Select AI Model"}
          >
            <div className="flex max-w-[120px] sm:max-w-[160px] md:max-w-sm items-center gap-1 sm:gap-1.5">
              {isGuest && (
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60 flex-shrink-0" />
              )}
              <span className="mobile-text truncate font-medium text-xs sm:text-sm min-w-0">
                {selectedModelConfig.displayName}
              </span>
              {!isLocked && (
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            "w-[320px] sm:w-[480px] max-w-[95vw] p-3 sm:p-4 main-chat-scrollbar",
            "border-border dark:bg-zinc-900/50 backdrop-blur-3xl",
            "max-h-[70vh] overflow-y-auto",
            "shadow-lg"
          )}
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-border flex gap-3.5 justify-between">
            <div className="">
              <h2 className="text-sm font-semibold text-foreground">
                Select AI Model
              </h2>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Choose the AI model that best fits your needs
              </p>
            </div>
            <BYOKIndicator />
          </div>

          {/* Search Input */}
          <div className="mb-3 sm:mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border-border bg-background focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Models organized by sections */}
          <div className="space-y-4">
            {/* Recommended Models */}
            {filteredModels.recommended.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">⭐</span>
                  Recommended
                </h3>
                <span className="text-xs text-muted-foreground block mb-2">
                  AVChat Recommened Models - Best Overall Performance
                </span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {filteredModels.recommended.map((model) => (
                    <ModelCard
                      key={model}
                      model={model}
                      isSelected={selectedModel === model}
                      onSelect={handleModelSelect}
                      showKeyIcon={hasOpenRouterKey()}
                      tierValidation={tierValidations[model]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Free Models */}
            {filteredModels.freeModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-green-500">✴️</span>
                  Budget Models
                </h3>
                <span className="text-xs text-muted-foreground block mb-2">
                  Best Price To Performance Ratio Models - Good For Most Of The
                  Tasks
                </span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {filteredModels.freeModels.map((model) => (
                    <ModelCard
                      key={model}
                      model={model}
                      isSelected={selectedModel === model}
                      onSelect={handleModelSelect}
                      showKeyIcon={hasOpenRouterKey()}
                      tierValidation={tierValidations[model]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Premium Models */}
            {filteredModels.premiumModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">💎</span>
                  Premium
                </h3>
                <span className="text-xs text-muted-foreground block mb-2">
                  Finest Models For Most of The Tasks
                </span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {filteredModels.premiumModels.map((model) => (
                    <ModelCard
                      key={model}
                      model={model}
                      isSelected={selectedModel === model}
                      onSelect={handleModelSelect}
                      showKeyIcon={hasOpenRouterKey()}
                      tierValidation={tierValidations[model]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Super Premium Models */}
            {filteredModels.superPremiumModels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">💎💎</span>
                  Super Premium
                </h3>
                <span className="text-xs text-muted-foreground block mb-2">
                  Super Advanced Models For Advanced Tasks
                </span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {filteredModels.superPremiumModels.map((model) => (
                    <ModelCard
                      key={model}
                      model={model}
                      isSelected={selectedModel === model}
                      onSelect={handleModelSelect}
                      showKeyIcon={hasOpenRouterKey()}
                      tierValidation={tierValidations[model]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Image Generation Models */}
            {filteredModels.imageGenModels &&
              filteredModels.imageGenModels.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="text-primary">🎨</span>
                    Image Generation
                  </h3>
                  <span className="text-xs text-muted-foreground block mb-2">
                    AI Models For Creating Images From Text Prompts
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {filteredModels.imageGenModels.map((model) => (
                      <ModelCard
                        key={model}
                        model={model}
                        isSelected={selectedModel === model}
                        onSelect={handleModelSelect}
                        showKeyIcon={hasOpenRouterKey()}
                        tierValidation={tierValidations[model]}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* No results */}
            {filteredModels.recommended.length === 0 &&
              filteredModels.freeModels.length === 0 &&
              filteredModels.premiumModels.length === 0 &&
              filteredModels.superPremiumModels.length === 0 &&
              (!filteredModels.imageGenModels ||
                filteredModels.imageGenModels.length === 0) && (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No models found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center hidden sm:block">
              Model capabilities and pricing may vary
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground text-center mt-1">
                Showing{" "}
                {filteredModels.recommended.length +
                  filteredModels.freeModels.length +
                  filteredModels.premiumModels.length +
                  filteredModels.superPremiumModels.length +
                  (filteredModels.imageGenModels?.length || 0)}{" "}
                of {AI_MODELS.length} models
              </p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ModelSelector = memo(PureModelSelector);
