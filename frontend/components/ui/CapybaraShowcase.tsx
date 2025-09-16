/**
 * CapybaraShowcase Component
 * 
 * Purpose: Demonstrates all available sizes of the CapybaraIcon component
 * Usage: For development/testing purposes to see all size variations
 */

import * as React from "react";
import CapybaraIcon from "./CapybaraIcon";

const sizes = [
  { size: "xs", label: "Extra Small (24px)", description: "Inline text, badges" },
  { size: "sm", label: "Small (48px)", description: "Buttons, navigation" },
  { size: "md", label: "Medium (80px)", description: "Cards, tooltips" },
  { size: "lg", label: "Large (112px)", description: "Default size" },
  { size: "xl", label: "Extra Large (144px)", description: "Prominent displays" },
  { size: "2xl", label: "2X Large (176px)", description: "Welcome screens" },
  { size: "3xl", label: "3X Large (240px)", description: "Hero sections" },
  { size: "4xl", label: "4X Large (320px)", description: "Large heroes" },
  { size: "5xl", label: "5X Large (384px)", description: "Full-screen displays" },
  { size: "6xl", label: "6X Large (448px)", description: "Ultra-large displays" },
] as const;

export function CapybaraShowcase() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">CapybaraIcon Size Showcase</h2>
        <p className="text-muted-foreground">All available sizes with and without animation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sizes.map(({ size, label, description }) => (
          <div key={size} className="border rounded-lg p-6 text-center space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{label}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            
            <div className="flex justify-center items-center gap-8">
              <div className="space-y-2">
                <CapybaraIcon 
                  size={size as any} 
                  animated={true} 
                  showLoader={false}
                />
                <p className="text-xs text-muted-foreground">Animated</p>
              </div>
              
              <div className="space-y-2">
                <CapybaraIcon 
                  size={size as any} 
                  animated={false} 
                  showLoader={false}
                />
                <p className="text-xs text-muted-foreground">Static</p>
              </div>
              
              {(size === "lg" || size === "xl" || size === "2xl" || size === "3xl") && (
                <div className="space-y-2">
                  <CapybaraIcon 
                    size={size as any} 
                    animated={true} 
                    showLoader={true}
                  />
                  <p className="text-xs text-muted-foreground">With Loader</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          All sizes automatically adapt to your current theme colors
        </p>
      </div>
    </div>
  );
}

export default CapybaraShowcase;