import React from "react";
import { Compare } from "@/frontend/components/ui/compare";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

export default function CompareDemo() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Theme Demo Header */}
      <div className="text-center mb-8">
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Drag the slider to seamlessly switch between light and dark modes and
          see how AVChat adapts to your preference
        </p>
      </div>

      {/* Compare Component - No Tilting */}
      <div className="flex justify-center items-center">
        <div className="w-full max-w-5xl bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm border border-border/50 rounded-lg md:rounded-3xl p-2 md:p-4 shadow-lg">
          <Compare
            firstImage="/compareFirst.png"
            secondImage="/compareSecond.png"
            firstImageClassName="object-cover select-none object-center w-full rounded-lg md:rounded-xl"
            secondImageClassname="object-cover select-none object-center w-full rounded-lg md:rounded-xl"
            className="h-[200px] md:h-[500px] w-full rounded-lg md:rounded-xl overflow-hidden shadow-md"
            slideMode="drag"
            autoplay={false}
          />
        </div>
      </div>
    </div>
  );
}
