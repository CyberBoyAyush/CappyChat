/**
 * Enhanced Model Selector Component
 *
 * Purpose: Modern, grid-based model selector with improved UI/UX
 * Features: Responsive grid layout, enhanced badges, better visual hierarchy
 */

import { ChevronDown, Check, Search, Lock, Key } from "lucide-react";
import { memo, useCallback, useState, useMemo, useEffect, useRef } from "react";
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
  onHover?: (model: AIModel | null) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  onSelect,
  showKeyIcon = false,
  tierValidation,
  onHover,
}) => {
  const modelConfig = getModelConfig(model);
  const isDisabled = tierValidation && !tierValidation.canUseModel;

  return (
    <div
      onClick={() => !isDisabled && onSelect(model)}
      onMouseEnter={() => onHover?.(model)}
      className={cn(
        "relative group mx-2 px-1 my-0.5  transition-all duration-300 cursor-pointer",
        "flex items-center justify-between rounded-lg border border-transparent",
        isDisabled
          ? "cursor-not-allowed opacity-40"
          : isSelected
          ? "bg-primary/15 border-primary/40"
          : "hover:bg-accent/30 hover:border-primary/20"
      )}
      // title={isDisabled ? tierValidation?.message : modelConfig.description}
    >
      <div className="flex items-center md:gap-2 flex-1">
        {/* Provider Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-4 h-8  rounded-full",
            "transition-all duration-300"
          )}
        >
          {getModelIcon(modelConfig.iconType, 12)}
        </div>

        {/* Model Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-semibold max-w-32 md:max-w-none text-[12px] truncate text-primary"
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
      <div className="flex items-center gap-1 ">
        {/* Model Badges */}
        <div className="flex items-center gap-0.5 md:hidden">
          {modelConfig.isSuperPremium && (
            <div className="relative">
              <div className="absolute -top-4 -left-5 z-10">
                <ModelBadge type="super-premium" size={16} />
              </div>
            </div>
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
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
          )}
        </div>
      </div>
    </div>
  );
};

// Provider Header Component
const ProviderHeader: React.FC<{ company: string }> = ({ company }) => (
  <div className="px-4 py-2 mt-3 first:mt-0">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {company}
    </h4>
  </div>
);

// Model Description Panel Component (shown on md+ screens)
const ModelDescriptionPanel = ({ model }: { model: AIModel }) => {
  const modelConfig = getModelConfig(model);

  return (
    <div className="hidden md:block p-4 border border-border/50 bg-background/95 backdrop-blur-xl w-[280px] rounded-xl h-fit">
      {/* Model Icon and Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/30">
          {getModelIcon(modelConfig.iconType, 17)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-primary truncate">
            {modelConfig.displayName}
          </h3>
          <p className="text-xs text-muted-foreground">{modelConfig.company}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground/90 leading-relaxed mb-4">
        {modelConfig.description}
      </p>

      {/* Capabilities */}
      <div>
        <h4 className="text-xs font-semibold text-primary mb-2">
          Capabilities
        </h4>
        <div className="flex flex-col gap-1.5">
          {modelConfig.isSuperPremium && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span>Super Premium Model</span>
            </div>
          )}
          {modelConfig.isPremium && !modelConfig.isSuperPremium && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span>Premium Model</span>
            </div>
          )}
          {modelConfig.hasReasoning && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>Advanced Reasoning</span>
            </div>
          )}
          {modelConfig.isFast && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span>Fast Response</span>
            </div>
          )}
          {modelConfig.isFileSupported && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>File Upload Support</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// BYOK Status Indicator Component
const BYOKIndicator = ({ className }: { className?: string }) => {
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
        "h-8 px-2 text-xs font-medium rounded-lg transition-all duration-200 border flex items-center gap-1.5",
        hasByok
          ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
          : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
        className
      )}
      title={
        hasByok
          ? "BYOK is ON - Unlimited access to all models"
          : "Configure your own API key for unlimited access"
      }
    >
      <Key className="w-3 h-3 " />
      <span className="text-xs">{hasByok ? "BYOK ON" : "BYOK"}</span>
    </Button>
  );
};

interface ModelSelectorProps {
  isImageGenMode?: boolean;
  isPlanMode?: boolean;
}

const PureModelSelector = ({
  isImageGenMode = false,
  isPlanMode = false,
}: ModelSelectorProps) => {
  const { selectedModel, setModel } = useModelStore();
  const [isOpen, setIsOpen] = useState(false);
  const { hasOpenRouterKey } = useBYOKStore();
  const { isGuest } = useAuth();
  const selectedModelConfig = getModelConfig(selectedModel);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredModel, setHoveredModel] = useState<AIModel | null>(null);
  const [tierValidations, setTierValidations] = useState<
    Record<AIModel, TierValidationResult>
  >({} as Record<AIModel, TierValidationResult>);

  // For guest users, lock to Gemini 2.5 Flash Lite
  const isLocked = isGuest;
  const usingBYOK = hasOpenRouterKey();

  // Track previous modes to prevent infinite loops
  const previousModeRef = useRef(isImageGenMode);
  const previousPlanModeRef = useRef(isPlanMode);
  const isInitialMount = useRef(true);

  // Plan Mode allowed models constant
  const PLAN_MODE_ALLOWED_MODELS: AIModel[] = [
    "Claude Haiku 4.5",
    "Claude Sonnet 4.5",
    // "Gemini 2.5 Flash",
    // "OpenAI 5 Mini",
  ];

  // Force guest users to use Gemini 2.5 Flash Lite
  useEffect(() => {
    if (isGuest && selectedModel !== "Gemini 2.5 Flash Lite") {
      console.log(
        "[ModelSelector] Guest user detected, forcing model to Gemini 2.5 Flash Lite"
      );
      setModel("Gemini 2.5 Flash Lite");
    }
  }, [isGuest, selectedModel, setModel]);

  // Force image generation mode to use image generation models
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousModeRef.current = isImageGenMode;
      return;
    }

    // Only run if mode actually changed
    if (previousModeRef.current === isImageGenMode) {
      return;
    }

    const currentConfig = getModelConfig(selectedModel);

    // Only switch models if there's a mode mismatch
    if (isImageGenMode && !currentConfig.isImageGeneration) {
      console.log(
        "[ModelSelector] Image generation mode detected, switching to Gemini Nano Banana"
      );
      setModel("Gemini Nano Banana");
    } else if (!isImageGenMode && currentConfig.isImageGeneration) {
      console.log(
        "[ModelSelector] Not in image generation mode, switching to Gemini 2.5 Flash Lite"
      );
      setModel("Gemini 2.5 Flash Lite");
    }

    // Update previous mode ref
    previousModeRef.current = isImageGenMode;
  }, [isImageGenMode, selectedModel, setModel]);

  // Force Plan Mode to use only Claude Haiku 4.5 and Claude Sonnet 4.5
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      previousPlanModeRef.current = isPlanMode;
      return;
    }

    // Only run if Plan Mode state actually changed
    if (previousPlanModeRef.current === isPlanMode) {
      return;
    }

    // If entering Plan Mode
    if (isPlanMode) {
      const currentConfig = getModelConfig(selectedModel);
      if (!PLAN_MODE_ALLOWED_MODELS.includes(selectedModel)) {
        console.log(
          "[ModelSelector] Plan Mode detected, switching to Claude Haiku 4.5"
        );
        setModel("Claude Haiku 4.5");
      }
    }

    // Update previous Plan Mode ref
    previousPlanModeRef.current = isPlanMode;
  }, [isPlanMode, selectedModel, setModel, PLAN_MODE_ALLOWED_MODELS]);

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
        return model === "Gemini 2.5 Flash Lite";
      }
      if (isImageGenMode) {
        const config = getModelConfig(model);
        if (!config.isImageGeneration) return false;
      }
      if (isPlanMode) {
        if (!PLAN_MODE_ALLOWED_MODELS.includes(model)) return false;
      }
      return true;
    },
    [isGuest, isImageGenMode, isPlanMode, PLAN_MODE_ALLOWED_MODELS]
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

  // Get filtered models grouped by provider
  const groupedModels = useMemo(() => {
    const models = AI_MODELS.filter((model) => {
      const config = getModelConfig(model);

      // Image generation mode filter
      if (isImageGenMode && !config.isImageGeneration) return false;
      if (!isImageGenMode && config.isImageGeneration) return false;

      // Plan Mode filter
      if (isPlanMode && !PLAN_MODE_ALLOWED_MODELS.includes(model)) return false;

      // Guest user filter
      if (isGuest && model !== "Gemini 2.5 Flash Lite") return false;

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

    // Group models by company
    const grouped = models.reduce((acc, model) => {
      const config = getModelConfig(model);
      const company = config.company;

      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(model);
      return acc;
    }, {} as Record<string, AIModel[]>);

    // Sort companies and models within each company
    const sortedGrouped = Object.keys(grouped)
      .sort()
      .reduce((acc, company) => {
        acc[company] = grouped[company].sort((a, b) => {
          const configA = getModelConfig(a);
          const configB = getModelConfig(b);
          return configA.displayName.localeCompare(configB.displayName);
        });
        return acc;
      }, {} as Record<string, AIModel[]>);

    return sortedGrouped;
  }, [
    isImageGenMode,
    isGuest,
    searchQuery,
    isPlanMode,
    PLAN_MODE_ALLOWED_MODELS,
  ]);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild disabled={isLocked}>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2 h-11 sm:h-10 md:h-9 pl-3 pr-2 text-sm rounded-xl min-w-0 ",
              "text-primary hover:bg-accent/40 hover:text-foreground",
              "transition-all duration-200 mobile-touch shadow-sm",
              isLocked && "opacity-75 cursor-not-allowed hover:bg-transparent"
            )}
            aria-label={`Selected model: ${selectedModel}${
              isLocked ? " (locked for guest users)" : ""
            }`}
            disabled={isLocked}
            title={isLocked ? "Locked for guest users" : "Select AI Model"}
          >
            <div className="flex max-w-[150px] sm:max-w-[160px] md:max-w-sm items-center gap-1 sm:gap-1.5">
              {isGuest && (
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60 flex-shrink-0" />
              )}
              <span className="mobile-text truncate font-medium text-xs sm:text-sm min-w-0">
                {selectedModelConfig.displayName}
              </span>
              {!isLocked && (
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-primary transition-transform duration-200 block",
                    isOpen && "rotate-180"
                  )}
                />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            "w-[270px]  md:w-[580px] max-w-[90vw] p-0",
            "bg-transparent border-transparent",
            "overflow-hidden shadow-none"
          )}
          align="start"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions={true}
        >
          {/* Container with flex layout for md+ screens - Fixed height prevents layout shift */}
          <div className="flex flex-col gap-2 md:flex-row md:h-[40vh]">
            {/* Left side: Search, BYOK, and Models List */}
            <div className="flex flex-col rounded-xl flex-1 max-h-[40vh] min-w-0 border border-border/50 bg-background/95 backdrop-blur-xl">
              {/* Search and BYOK */}
              <div className="p-2.5 border-b border-border/50 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[100px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        "pl-8 pr-4 py-4 text-sm  border-b border-border/50 bg-background/70",
                        "placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-primary/40"
                      )}
                    />
                  </div>
                  <BYOKIndicator className="h-8 px-4 text-xs sm:text-sm" />
                </div>
              </div>

              {/* Models List */}
              <div
                className="flex-1 overflow-y-auto min-h-0 no-scrollbar"
                onMouseLeave={() => setHoveredModel(null)}
              >
                {Object.keys(groupedModels).length > 0 ? (
                  <div className="">
                    {Object.entries(groupedModels).map(([company, models]) => (
                      <div key={company}>
                        <ProviderHeader company={company} />
                        {models.map((model) => (
                          <ModelCard
                            key={model}
                            model={model}
                            isSelected={selectedModel === model}
                            onSelect={handleModelSelect}
                            showKeyIcon={hasOpenRouterKey()}
                            tierValidation={tierValidations[model]}
                            onHover={setHoveredModel}
                          />
                        ))}
                      </div>
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
            </div>

            {/* Right side: Model Description Panel (md+ only) */}
            <div className="hidden md:flex md:w-[280px] flex-shrink-0">
              {hoveredModel && <ModelDescriptionPanel model={hoveredModel} />}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ModelSelector = memo(PureModelSelector);
