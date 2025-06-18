import React from "react";
import { AI_MODELS, getModelConfig } from "@/lib/models";
import { getModelIcon } from "@/frontend/components/ui/ModelComponents";

interface LLMItem {
  name: string;
  company: string;
  iconType:
    | "google"
    | "openai"
    | "anthropic"
    | "deepseek"
    | "huggingface"
    | "qwen"
    | "meta"
    | "x-ai"
    | "runware";
  description: string;
}

const LLMMarquee: React.FC = () => {
  // Create LLM items from the models configuration
  const llmItems: LLMItem[] = AI_MODELS.map((modelName) => {
    const config = getModelConfig(modelName);
    return {
      name: config.displayName,
      company: config.company,
      iconType: config.iconType,
      description: config.description,
    };
  });

  // Remove duplicates based on company to avoid showing same provider multiple times
  const uniqueLLMs = llmItems.filter(
    (llm, index, self) =>
      index === self.findIndex((item) => item.company === llm.company)
  );

  // Create the marquee item component
  const MarqueeItem = ({ llm }: { llm: LLMItem }) => (
    <div className="flex flex-col items-center min-w-[120px] flex-shrink-0 mx-6 md:mx-14">
      <div className="p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm transition-all duration-300 ">
        {getModelIcon(llm.iconType, 32)}
      </div>
      <p className="text-xs md:text-sm font-semibold mt-2 md:mt-3 text-center text-foreground/80 transition-colors duration-300">
        {llm.company}
      </p>
    </div>
  );

  return (
    <section className="py-8  md:py-16 bg-gradient-to-r from-background via-muted/20 to-background border-y-[1px] border-primary/15">
      <h2 className="text-xl md:text-3xl text-center mb-8 md:mb-16 font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent px-4">
        Powered by Leading AI Models
      </h2>

      <div className="relative w-full overflow-hidden">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 w-16 md:w-24 h-full bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute right-0 top-0 w-16 md:w-24 h-full bg-gradient-to-l from-background to-transparent z-10"></div>

        {/* Infinite Marquee */}
        <div className="marquee-wrapper">
          <div className="marquee-content">
            {/* Render multiple sets for seamless infinite scroll */}
            {Array.from({ length: 8 }).map((_, setIndex) =>
              uniqueLLMs.map((llm, itemIndex) => (
                <MarqueeItem
                  key={`set-${setIndex}-${llm.company}-${itemIndex}`}
                  llm={llm}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LLMMarquee;
