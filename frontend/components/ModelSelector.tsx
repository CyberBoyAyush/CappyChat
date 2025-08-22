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
        "relative group p-1.5 sm:p-2 transition-all duration-300 cursor-pointer",
        "min-h-[60px] flex items-center justify-between",
        "hover:bg-accent/20",
        isDisabled
          ? "cursor-not-allowed opacity-40"
          : isSelected
          ? "bg-primary/5"
          : "hover:bg-accent/30"
      )}
      title={isDisabled ? tierValidation?.message : modelConfig.description}
    >
      <div className="flex items-center gap-2 flex-1">
        {/* Provider Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full",
            "transition-all duration-300"
          )}
        >
          {getModelIcon(modelConfig.iconType, 16)}
        </div>

        {/* Model Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-semibold text-[13px] md:text-sm truncate",
                isSelected ? "text-primary" : "text-foreground"
              )}
            >
              {modelConfig.displayName}
            </h3>
            {showKeyIcon && !isDisabled && (
              <Key className="w-3 h-3 text-primary flex-shrink-0" />
            )}
          </div>
          {isDisabled && tierValidation?.message && (
            <p className="text-xs text-red-500 mt-0.5 font-medium">
              Credits exhausted
            </p>
          )}
        </div>
      </div>

      {/* Right side - Badges and Selection */}
      <div className="flex items-center gap-1 md:gap-1.5">
        {/* Model Badges */}
        <div className="flex items-center gap-0.5">
          {modelConfig.isSuperPremium && (
            <ModelBadge type="super-premium" size={12} />
          )}
          {modelConfig.isPremium && !modelConfig.isSuperPremium && (
            <ModelBadge type="premium" size={12} />
          )}
          {modelConfig.hasReasoning && (
            <ModelBadge type="reasoning" size={12} />
          )}
          {modelConfig.isFast && <ModelBadge type="fast" size={12} />}
          {modelConfig.isFileSupported && (
            <ModelBadge type="file-support" size={12} />
          )}
        </div>

        {/* Selection Indicator */}
        <div
          className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            isSelected
              ? "border-primary bg-primary"
              : "border-border/50 group-hover:border-primary/50"
          )}
        >
          {isSelected && (
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
          )}
        </div>
      </div>
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
        "h-8 px-3 text-xs font-medium rounded-md transition-all duration-200",
        hasByok
          ? "bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20"
          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
      )}
      title={
        hasByok
          ? "BYOK is ON - Unlimited access to all models"
          : "Configure your own API key for unlimited access"
      }
    >
      <Key className="w-3 h-3 mr-1.5" />
      <span>{hasByok ? "BYOK ON" : "BYOK"}</span>
    </Button>
  );
};

interface ModelSelectorProps {
  isImageGenMode?: boolean;
}

const PureModelSelector = ({ isImageGenMode = false }: ModelSelectorProps) => {
  const { selectedModel, setModel } = useModelStore();
  const [isOpen, setIsOpen] = useState(false);
  const { hasOpenRouterKey } = useBYOKStore();
  const { isGuest } = useAuth();
  const selectedModelConfig = getModelConfig(selectedModel);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierValidations, setTierValidations] = useState<
    Record<AIModel, TierValidationResult>
  >({} as Record<AIModel, TierValidationResult>);

  // Provider filter state
  type ProviderId =
    | "all"
    | "openai"
    | "google"
    | "anthropic"
    | "x-ai"
    | "deepseek"
    | "qwen"
    | "runware";
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("all");

  // Definitions for provider UI chips - filtered based on mode
  const PROVIDER_OPTIONS: Array<{ id: ProviderId; label: string }> =
    useMemo(() => {
      const baseProviders = [
        { id: "anthropic" as ProviderId, label: "Anthropic" },
        { id: "google" as ProviderId, label: "Google" },
        { id: "x-ai" as ProviderId, label: "Grok" },
        { id: "openai" as ProviderId, label: "OpenAI" },
        { id: "deepseek" as ProviderId, label: "DeepSeek" },
        { id: "qwen" as ProviderId, label: "Qwen" },
        { id: "runware" as ProviderId, label: "Runware" },
      ];

      // Filter providers based on current mode
      return baseProviders.filter((provider) => {
        // Check if this provider has any models for the current mode
        const hasRelevantModels = AI_MODELS.some((model) => {
          const config = getModelConfig(model);
          const matchesProvider =
            (config.iconType as string).toLowerCase() === provider.id;

          if (isImageGenMode) {
            return matchesProvider && config.isImageGeneration;
          } else {
            return matchesProvider && !config.isImageGeneration;
          }
        });

        return hasRelevantModels;
      });
    }, [isImageGenMode]);

  // For guest users, lock to OpenAI 5 Mini
  const isLocked = isGuest;
  const usingBYOK = hasOpenRouterKey();

  // Force guest users to use OpenAI 5 Mini
  useEffect(() => {
    if (isGuest && selectedModel !== "OpenAI 5 Mini") {
      console.log(
        "[ModelSelector] Guest user detected, forcing model to OpenAI 5 Mini"
      );
      setModel("OpenAI 5 Mini");
    }
  }, [isGuest, selectedModel, setModel]);

  // Force image generation mode to use image generation models
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
      const currentConfig = getModelConfig(selectedModel);
      if (currentConfig.isImageGeneration) {
        console.log(
          "[ModelSelector] Not in image generation mode, switching to OpenAI 5 Mini"
        );
        setModel("OpenAI 5 Mini");
      }
    }
  }, [isImageGenMode, selectedModel, setModel]);

  // Reset provider filter when switching modes if current provider has no models in new mode
  useEffect(() => {
    if (selectedProvider !== "all") {
      const hasModelsInCurrentMode = AI_MODELS.some((model) => {
        const config = getModelConfig(model);
        const matchesProvider =
          (config.iconType as string).toLowerCase() === selectedProvider;

        if (isImageGenMode) {
          return matchesProvider && config.isImageGeneration;
        } else {
          return matchesProvider && !config.isImageGeneration;
        }
      });

      if (!hasModelsInCurrentMode) {
        console.log(
          "[ModelSelector] Resetting provider filter - no models in current mode"
        );
        setSelectedProvider("all");
      }
    }
  }, [isImageGenMode, selectedProvider]);

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
        return model === "OpenAI 5 Mini";
      }
      if (isImageGenMode) {
        const config = getModelConfig(model);
        if (!config.isImageGeneration) return false;
      }
      // Provider filter check
      if (selectedProvider !== "all") {
        const cfg = getModelConfig(model);
        if ((cfg.iconType as string).toLowerCase() !== selectedProvider) {
          return false;
        }
      }
      return true;
    },
    [isGuest, isImageGenMode, selectedProvider]
  );

  const handleModelSelect = useCallback(
    (model: AIModel) => {
      if (isModelEnabled(model)) {
        setModel(model);
        setSearchQuery("");
        setIsOpen(false);
      }
    },
    [isModelEnabled, setModel, setIsOpen]
  );

  // Get filtered models based on provider and search
  const filteredModels = useMemo(() => {
    let models = AI_MODELS.filter((model) => {
      const config = getModelConfig(model);

      // Provider filter
      if (selectedProvider !== "all") {
        if ((config.iconType as string).toLowerCase() !== selectedProvider) {
          return false;
        }
      }

      // Image generation mode filter
      if (isImageGenMode && !config.isImageGeneration) return false;
      if (!isImageGenMode && config.isImageGeneration) return false;

      // Guest user filter
      if (isGuest && model !== "OpenAI 5 Mini") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          config.displayName.toLowerCase().includes(query) ||
          config.company.toLowerCase().includes(query) ||
          config.description.toLowerCase().includes(query)
        );
      }

      return true;
    });

    return models;
  }, [selectedProvider, isImageGenMode, isGuest, searchQuery]);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200 hidden sm:block",
                    isOpen && "rotate-180"
                  )}
                />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            "w-[320px] sm:w-[420px] lg:w-[480px] max-w-[90vw] p-0",
            "border border-border/50 bg-background/95 backdrop-blur-xl",
            "max-h-[60vh] overflow-hidden flex flex-col",
            "shadow-2xl shadow-black/10 dark:shadow-black/30",
            "rounded-2xl"
          )}
          align="end"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions={true}
        >
          {/* Search and BYOK */}
          <div className="p-3 sm:p-5 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-10 pr-4 py-3 text-sm rounded-xl",
                    "border-0 bg-background/50",

                    "placeholder:text-muted-foreground/70"
                  )}
                />
              </div>
              <BYOKIndicator />
            </div>
          </div>

          {/* Providers Filter */}
          <div className="p-3 sm:p-5 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Providers
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => setSelectedProvider("all")}
              >
                Show all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_OPTIONS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setSelectedProvider(provider.id)}
                  className={cn(
                    "flex items-center gap-1 md:gap-2.5 px-1 py-1.5 md:px-3 md:py-2 rounded-full transition-all duration-200",
                    "border border-border/50 bg-background/50 backdrop-blur-sm",
                    "text-xs md:text-sm font-medium",
                    selectedProvider === provider.id
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "hover:border-primary/30 hover:bg-accent/50 text-foreground/80 hover:text-foreground"
                  )}
                  title={`Filter by ${provider.label}`}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background/80 border border-border/30">
                    {getModelIcon(provider.id, 12)}
                  </span>
                  <span>{provider.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {filteredModels.length > 0 ? (
              <div className="">
                {filteredModels.map((model) => (
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
            ) : (
              <div className="text-center py-8">
                <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  No models found
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Try adjusting your provider or search terms
                </p>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ModelSelector = memo(PureModelSelector);
