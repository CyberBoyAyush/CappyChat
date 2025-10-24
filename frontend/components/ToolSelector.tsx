/**
 * ToolSelector Component
 *
 * Purpose: Unified tools dropdown extracted from ChatInputField, styled similarly to ModelSelector (list-only, no side preview)
 * Features: Image Gen toggle + Aspect Ratio list when image mode; Conversation Style quick-pick + Search type toggles otherwise
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  Globe,
  GraduationCap,
  ListChecks,
  MessageCircle,
} from "lucide-react";
import { FaTools, FaRedditAlien } from "react-icons/fa";
import { Switch2 } from "@/frontend/components/ui/switch2";
import {
  ASPECT_RATIOS,
  AspectRatio,
} from "@/frontend/components/AspectRatioSelector";
import { useSearchTypeStore } from "@/frontend/stores/SearchTypeStore";
import { useConversationStyleStore } from "@/frontend/stores/ConversationStyleStore";
import { getAllConversationStyles } from "@/lib/conversationStyles";
import { RiQuillPenAiFill, RiImageAiFill } from "react-icons/ri";
import { IoGlobeOutline } from "react-icons/io5";
import { GiNotebook } from "react-icons/gi";
import { BsFillDiagram2Fill } from "react-icons/bs";
import { LuBrain } from "react-icons/lu";

type ModeKey = "image" | "web" | "reddit" | "study" | "plan" | "chat";

const MODE_INFO: Record<
  ModeKey,
  {
    title: string;
    description: string;
    icon: ReactNode;
    imageSrc: string;
    imageSrc2?: string;
  }
> = {
  image: {
    title: "Image Generation",
    description: "Generate images from your prompt. Choose an aspect ratio.",
    icon: <ImageIcon className="w-10 h-10 text-primary drop-shadow" />,
    imageSrc:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761305104/Generate_an_Image_vwwmth.png",
    imageSrc2:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304974/image_gen_2_sfflgo.png",
  },
  web: {
    title: "Web Search",
    description:
      "Pull in fresh, cited information from the web to augment responses.",
    icon: <Globe className="w-10 h-10 text-primary drop-shadow" />,
    imageSrc:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304976/web_search_h3grgd.png",
    imageSrc2:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304976/web_mode_2_ykxfqm.png",
  },
  reddit: {
    title: "Reddit Search",
    description:
      "Search Reddit threads and comments for community perspectives and references.",
    icon: <FaRedditAlien className="w-10 h-10 text-primary drop-shadow" />,
    imageSrc:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304975/reddit_search_hguiha.png",
    imageSrc2:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304975/reddit_mode_2_fquocy.png",
  },
  study: {
    title: "Study Mode",
    description:
      "Structured learning and explanations with step-by-step breakdowns and sources.",
    icon: <GraduationCap className="w-10 h-10 text-primary drop-shadow" />,
    imageSrc:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304976/study_mode_ir6rxo.png",
    imageSrc2:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304975/study_mode_2_slb3lv.png",
  },
  plan: {
    title: "Plan Mode",
    description:
      "Plan complex tasks with artifacts and iterative steps. Great for planning tasks.",
    icon: <ListChecks className="w-10 h-10 text-primary drop-shadow" />,
    imageSrc:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304975/plan_mode_rkdwtg.png",
    imageSrc2:
      "https://res.cloudinary.com/dyetf2h9n/image/upload/v1761304975/plan_mode_2_nigkmu.png",
  },
  chat: {
    title: "Chat Mode",
    description: "General conversation without external tools.",
    icon: <MessageCircle className="w-10 h-10 text-primary drop-shadow" />,
    imageSrc: "/logo.png",
  },
};

const ModePreviewPanel = ({ mode }: { mode: ModeKey }) => {
  const info = MODE_INFO[mode];
  const { theme } = useTheme();
  const useV2 = theme === "light" || theme === "dark"; // Bright or Dark
  const src = useV2 && info.imageSrc2 ? info.imageSrc2 : info.imageSrc;
  return (
    <div className="hidden md:block p-4 border border-border/50 bg-background/95 backdrop-blur-xl w-[260px] rounded-xl h-fit">
      <div className="h-28 rounded-lg relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
        <img
          src={src}
          alt={info.title}
          className="h-full w-full object-cover"
        />
      </div>
      {/* <h3 className="mt-3 font-semibold text-sm text-primary">{info.title}</h3> */}
      <p className="text-sm mt-3 text-muted-foreground/90 leading-relaxed">
        {info.description}
      </p>
    </div>
  );
};

import { getModelConfig } from "@/lib/models";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { AppwriteDB } from "@/lib/appwriteDB";
import { useAuth } from "../contexts/AuthContext";

export interface ToolSelectorProps {
  isImageGenMode: boolean;
  onToggleImageGenMode: (enabled: boolean) => void;
  selectedAspectRatio: AspectRatio;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
}

function PureToolSelector({
  isImageGenMode,
  onToggleImageGenMode,
  selectedAspectRatio,
  onSelectAspectRatio,
}: ToolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showStyleSubDropdown, setShowStyleSubDropdown] = useState(false);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  const { selectedSearchType, setSearchType } = useSearchTypeStore();
  const { selectedStyle, setStyle, getStyleConfig } =
    useConversationStyleStore();
  const { selectedModel, setModel } = useModelStore();
  const { user } = useAuth();

  const [hoveredMode, setHoveredMode] = useState<ModeKey | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [memoryMemories, setMemoryMemories] = useState<string[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryUpdating, setMemoryUpdating] = useState(false);

  // Load Global Memory state when menu opens
  useEffect(() => {
    const load = async () => {
      if (!isOpen || !user?.$id) return;
      try {
        setMemoryLoading(true);
        const mem = await AppwriteDB.getGlobalMemory(user.$id);
        setMemoryEnabled(!!mem?.enabled);
        setMemoryMemories(mem?.memories || []);
      } catch (e) {
        // noop
      } finally {
        setMemoryLoading(false);
      }
    };
    load();
  }, [isOpen, user?.$id]);

  const handleMemoryToggle = async (enabled: boolean) => {
    if (!user?.$id) return;
    try {
      setMemoryUpdating(true);
      await AppwriteDB.updateGlobalMemory(user.$id, memoryMemories, enabled);
      setMemoryEnabled(enabled);
    } catch (e) {
      // noop
    } finally {
      setMemoryUpdating(false);
    }
  };

  // Close style sub-menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showStyleSubDropdown &&
        styleDropdownRef.current &&
        !styleDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStyleSubDropdown(false);
      }
    };

    if (showStyleSubDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStyleSubDropdown]);

  // Toggle image gen + ensure model consistency
  const handleImageGenToggle = useCallback(
    (isSelected: boolean) => {
      onToggleImageGenMode(isSelected);
      const currentConfig = getModelConfig(selectedModel);
      if (isSelected) {
        if (!currentConfig.isImageGeneration) {
          setModel("Gemini Nano Banana");
        }
      } else {
        if (currentConfig.isImageGeneration) {
          setModel("Gemini 2.5 Flash Lite");
        }
      }
    },
    [onToggleImageGenMode, selectedModel, setModel]
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center rounded-lg text-xs font-medium transition-all duration-200",
              "hover:bg-accent hover:text-primary h-8 w-8 md:h-10 md:w-10"
            )}
            aria-label="Open tools menu"
            title="Tools"
          >
            <FaTools className="h-3 w-3 md:h-4 md:w-4 text-primary" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          className={cn(
            "w-[200px] md:w-[560px] max-w-[90vw] p-0",
            "bg-transparent border-transparent overflow-visible shadow-none"
          )}
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions
        >
          <div className="p-0">
            {isImageGenMode ? (
              <div className="flex flex-col gap-2 md:flex-row md:h-[34vh]">
                {/* Left: Image Gen controls */}
                <div
                  className="flex-1 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-3 md:p-4 min-w-0"
                  onMouseLeave={() => setHoveredMode(null)}
                >
                  {/* Image Generation Toggle */}
                  <div
                    className="flex items-center justify-between"
                    onMouseEnter={() => setHoveredMode("image")}
                    onMouseLeave={() => setHoveredMode(null)}
                  >
                    <span className="text-xs truncate mr-2.5 md:text-sm text-primary font-medium flex items-center gap-1">
                      <RiImageAiFill className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      Image Generation
                    </span>
                    <Switch2
                      isSelected={isImageGenMode}
                      onChange={handleImageGenToggle}
                    />
                  </div>

                  <div className="border-t border-border/50 my-2" />

                  <label className="text-[10px] md:text-xs text-primary font-semibold uppercase tracking-wide">
                    Aspect Ratio
                  </label>
                  <div className="space-y-1 mt-1">
                    {ASPECT_RATIOS.map((ratio) => {
                      const RatioIcon = ratio.icon;
                      const isSelected = selectedAspectRatio.id === ratio.id;
                      return (
                        <button
                          key={ratio.id}
                          onClick={() => onSelectAspectRatio(ratio)}
                          className={cn(
                            "w-full flex items-center gap-2 md:gap-2.5 p-1.5 md:p-2 rounded-lg text-left transition-all",
                            "hover:bg-accent/30",
                            isSelected && "bg-primary/15"
                          )}
                        >
                          <RatioIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary flex-shrink-0" />
                          <div className="flex-1 text-primary min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate text-xs md:text-sm ">
                                {ratio.name} ({ratio.ratio})
                              </span>
                              {isSelected && (
                                <Check className="h-2.5 w-2.5 md:h-3 md:w-3  flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Description Preview (md+) */}
                <div className="hidden md:flex md:w-[260px] flex-shrink-0">
                  {hoveredMode === "image" && <ModePreviewPanel mode="image" />}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 md:flex-row md:h-fit">
                  <div
                    className="flex-1 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-3 md:p-4 min-w-0"
                    onMouseLeave={() => setHoveredMode(null)}
                  >
                    {/* Conversation Style with Sub-dropdown */}
                    <div className="relative" ref={styleDropdownRef}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowStyleSubDropdown(!showStyleSubDropdown)
                        }
                        className="w-full cursor-pointer flex items-center justify-between  rounded-lg "
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs md:text-sm text-primary font-medium flex items-center gap-1">
                            <RiQuillPenAiFill className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            Style:
                          </span>
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {getStyleConfig().name}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground transition-transform duration-200",
                            showStyleSubDropdown && "-rotate-90"
                          )}
                        />
                      </button>

                      {/* Style Sub-dropdown */}
                      {showStyleSubDropdown && (
                        <div className="absolute top-0 max-h-44 md:max-h-56 no-scrollbar overflow-y-auto left-full ml-3 md:ml-4 w-32 md:w-48 rounded-xl border border-border/50 bg-background backdrop-blur-xl shadow-xl z-[110]">
                          <div className="p-1.5 md:p-2 space-y-1">
                            {getAllConversationStyles().map((style) => {
                              const StyleIcon = style.icon;
                              const isSelected = selectedStyle === style.id;
                              return (
                                <button
                                  key={style.id}
                                  onClick={() => {
                                    setStyle(style.id);
                                    setShowStyleSubDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full cursor-pointer flex items-center gap-2 md:gap-2.5 p-1.5 md:p-2 rounded-lg text-left transition-all",
                                    "hover:bg-accent/30",
                                    isSelected && "bg-primary/15"
                                  )}
                                >
                                  <StyleIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-[10px] md:text-[12px] text-primary">
                                        {style.name}
                                      </span>
                                      {isSelected && (
                                        <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border/50 my-2" />

                    {/* Image Generation Toggle */}
                    <div
                      className="flex items-center justify-between"
                      onMouseEnter={() => setHoveredMode("image")}
                      onMouseLeave={() => setHoveredMode(null)}
                    >
                      <span className="text-[12px]  truncate mr-2 py-2 md:text-sm text-primary font-medium flex items-center gap-1">
                        <RiImageAiFill className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        Image Generation
                      </span>
                      <Switch2
                        isSelected={isImageGenMode}
                        onChange={handleImageGenToggle}
                      />
                    </div>

                    {/* Search Type toggles */}
                    <div className="">
                      <div
                        className="flex items-center justify-between py-2"
                        onMouseEnter={() => setHoveredMode("web")}
                        onMouseLeave={() => setHoveredMode(null)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] md:text-sm text-primary font-medium flex items-center gap-1">
                            <IoGlobeOutline className="h-3.5 w-3.5 rotate-12 text-primary flex-shrink-0" />
                            Web Search
                          </span>
                        </div>
                        <Switch2
                          isSelected={selectedSearchType === "web"}
                          onChange={(isSelected) =>
                            setSearchType(isSelected ? "web" : "chat")
                          }
                        />
                      </div>

                      <div
                        className="flex items-center justify-between py-2"
                        onMouseEnter={() => setHoveredMode("reddit")}
                        onMouseLeave={() => setHoveredMode(null)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] md:text-sm text-primary font-medium flex items-center gap-1">
                            <FaRedditAlien className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            Reddit Search
                          </span>
                        </div>
                        <Switch2
                          isSelected={selectedSearchType === "reddit"}
                          onChange={(isSelected) =>
                            setSearchType(isSelected ? "reddit" : "chat")
                          }
                        />
                      </div>

                      <div
                        className="flex items-center justify-between py-2"
                        onMouseEnter={() => setHoveredMode("study")}
                        onMouseLeave={() => setHoveredMode(null)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] md:text-sm text-primary font-medium flex items-center gap-1">
                            <GiNotebook className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            Study Mode
                          </span>
                        </div>

                        <Switch2
                          isSelected={selectedSearchType === "study"}
                          onChange={(isSelected) =>
                            setSearchType(isSelected ? "study" : "chat")
                          }
                        />
                      </div>

                      <div
                        className="flex items-center justify-between pb-3 py-2"
                        onMouseEnter={() => setHoveredMode("plan")}
                        onMouseLeave={() => setHoveredMode(null)}
                      >
                        <div className="flex w-full items-center gap-3">
                          <span className="text-[12px] md:text-sm text-primary font-medium flex items-center gap-1">
                            <BsFillDiagram2Fill className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            Plan Mode
                          </span>
                        </div>
                        <Switch2
                          isSelected={selectedSearchType === "plan"}
                          onChange={(isSelected) =>
                            setSearchType(isSelected ? "plan" : "chat")
                          }
                        />
                      </div>

                      <div className="border-t border-border/50 pb-1" />

                      {/* Global Memory Toggle */}
                      <div
                        className="flex items-center justify-between pt-2"
                        onMouseEnter={() => setHoveredMode(null)}
                      >
                        <span className="text-[12px] md:text-sm text-primary font-medium flex items-center gap-1">
                          <LuBrain className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          Global Memory
                        </span>
                        <Switch2
                          isSelected={memoryEnabled}
                          onChange={handleMemoryToggle}
                          isDisabled={memoryLoading || memoryUpdating || !user}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Description Preview (md+) - only on hover */}
                  <div className="hidden md:flex md:w-[260px] flex-shrink-0">
                    {hoveredMode && <ModePreviewPanel mode={hoveredMode} />}
                  </div>
                </div>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const ToolSelector = memo(PureToolSelector);
