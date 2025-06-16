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
import { useWebSearchStore } from "@/frontend/stores/WebSearchStore";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { AI_MODELS, AIModel, getModelConfig } from "@/lib/models";
import { canUserUseModel, TierValidationResult } from "@/lib/tierSystem";
import {
  ModelBadge,
  getModelIcon,
} from "@/frontend/components/ui/ModelComponents";

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
                isSelected && !isDisabled ? "text-primary" :
                isDisabled ? "text-muted-foreground" : "text-foreground"
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
          <p className={cn(
            "text-xs mt-0.5 sm:mt-1 font-medium hidden sm:block",
            isDisabled ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
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
      <div className="flex items-center gap-0.5 sm:gap-1.5 flex-wrap">
        {modelConfig.isSuperPremium && (
          <div className="flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-primary/10 border border-primary/20">
            <ModelBadge type="super-premium" size={8} />
            <span className="text-xs font-medium text-primary hidden sm:inline">
              Super Premium
            </span>
          </div>
        )}
        {modelConfig.isPremium && !modelConfig.isSuperPremium && (
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-primary/10 border border-primary/20">
            <ModelBadge type="premium" size={8} />
            <span className="text-xs font-medium text-primary hidden sm:inline">
              Premium
            </span>
          </div>
        )}
        {modelConfig.hasReasoning && (
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-primary/10 border border-primary/20">
            <ModelBadge type="reasoning" size={8} />
            <span className="text-xs font-medium text-primary hidden sm:inline">
              Reasoning
            </span>
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
    navigate('/settings#settings');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "h-7 px-2 text-xs font-medium transition-all duration-200",
        hasByok
          ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      title={hasByok ? "BYOK is ON - Unlimited access to all models" : "Configure your own API key for unlimited access"}
    >
      <Key className="w-3 h-3 mr-1" />
      <span className="hidden sm:inline">
        {hasByok ? "BYOK ON" : "BYOK"}
      </span>
    </Button>
  );
};

const PureModelSelector = () => {
  const { selectedModel, setModel } = useModelStore();
  const { isWebSearchEnabled } = useWebSearchStore();
  const { hasOpenRouterKey } = useBYOKStore();
  const selectedModelConfig = getModelConfig(selectedModel);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierValidations, setTierValidations] = useState<Record<AIModel, TierValidationResult>>({} as Record<AIModel, TierValidationResult>);

  // When web search is enabled, lock to Gemini 2.5 Flash Search
  const isLocked = isWebSearchEnabled;
  const usingBYOK = hasOpenRouterKey();

  // Load tier validations for all models
  useEffect(() => {
    const loadTierValidations = async () => {
      const validations: Record<AIModel, TierValidationResult> = {} as Record<AIModel, TierValidationResult>;

      for (const model of AI_MODELS) {
        try {
          validations[model] = await canUserUseModel(model, usingBYOK);
        } catch (error) {
          console.error(`Error validating model ${model}:`, error);
          validations[model] = {
            canUseModel: false,
            remainingCredits: 0,
            message: 'Error checking model access',
          };
        }
      }

      setTierValidations(validations);
    };

    loadTierValidations();
  }, [usingBYOK]);

  const isModelEnabled = useCallback(
    (model: AIModel) => {
      if (isLocked) {
        return model === "Gemini 2.5 Flash Search";
      }
      return true;
    },
    [isLocked]
  );

  const handleModelSelect = useCallback(
    (model: AIModel) => {
      if (isModelEnabled(model) && !isLocked) {
        setModel(model);
        setSearchQuery(""); // Clear search when model is selected
      }
    },
    [isModelEnabled, setModel, isLocked]
  );

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return AI_MODELS;
    }

    const query = searchQuery.toLowerCase();
    return AI_MODELS.filter((model) => {
      const config = getModelConfig(model);
      return (
        config.displayName.toLowerCase().includes(query) ||
        config.company.toLowerCase().includes(query) ||
        config.description.toLowerCase().includes(query) ||
        (config.isPremium && "premium".includes(query)) ||
        (config.isSuperPremium && "super premium".includes(query)) ||
        (config.hasReasoning && "reasoning".includes(query))
      );
    });
  }, [searchQuery]);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLocked}>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-1 sm:gap-2 h-10 sm:h-9 md:h-8 pl-2 pr-1.5 sm:pr-2 text-xs rounded-md min-w-0",
              "text-foreground hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              "transition-all duration-200 mobile-touch",
              isLocked && "opacity-75 cursor-not-allowed hover:bg-transparent"
            )}
            aria-label={`Selected model: ${selectedModel}${
              isLocked ? " (locked for web search)" : ""
            }`}
            disabled={isLocked}
          >
            <div className="flex max-w-[120px] sm:max-w-[160px] md:max-w-sm items-center gap-1 sm:gap-1.5">
              {isLocked && (
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
            "w-[320px] sm:w-[480px] max-w-[95vw] p-3 sm:p-4",
            "border-border dark:bg-zinc-900/50 backdrop-blur-3xl",
            "max-h-[70vh] overflow-y-auto",
            "scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent scrollbar-thumb-rounded-full",
            "shadow-lg"
          )}
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Select AI Model
            </h2>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Choose the AI model that best fits your needs
            </p>
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

          {/* Grid of models */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <ModelCard
                  key={model}
                  model={model}
                  isSelected={selectedModel === model}
                  onSelect={handleModelSelect}
                  showKeyIcon={hasOpenRouterKey()}
                  tierValidation={tierValidations[model]}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No models found</p>
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
                Showing {filteredModels.length} of {AI_MODELS.length} models
              </p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <BYOKIndicator />
    </div>
  );
};

export const ModelSelector = memo(PureModelSelector);
