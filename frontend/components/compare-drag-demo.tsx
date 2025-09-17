import React, { useState, useEffect, useRef } from "react";
import { Compare } from "@/frontend/components/ui/compare";
import { useTheme } from "next-themes";
import { Badge } from "@/frontend/components/ui/badge";

export default function CompareDemo() {
  const { theme } = useTheme();
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Determine which images to use based on current theme
  const getImages = () => {
    const isCapybaraTheme =
      theme === "capybara-light" || theme === "capybara-dark";

    if (isCapybaraTheme) {
      return {
        lightImage: "/image2.png", // light theme capybara
        darkImage: "/image1.png", // dark theme capybara
      };
    } else {
      return {
        lightImage: "/image4.png", // light theme monochromatic
        darkImage: "/image3.png", // dark theme monochromatic
      };
    }
  };

  const { lightImage, darkImage } = getImages();

  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: window.innerHeight - 200, // Keep some margin for header
        });
      }
    };

    // Initial measurement
    updateContainerDimensions();

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateContainerDimensions);
    resizeObserver.observe(containerRef.current);

    // Also listen to window resize as backup
    window.addEventListener("resize", updateContainerDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateContainerDimensions);
    };
  }, []);

  useEffect(() => {
    // Load the first image to get its dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = lightImage;
  }, []);

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (!imageDimensions || !containerDimensions) return {};

    const maxWidth = containerDimensions.width - 80; // Account for padding
    const maxHeight = containerDimensions.height;

    const imageAspectRatio = imageDimensions.width / imageDimensions.height;

    let width = imageDimensions.width;
    let height = imageDimensions.height;

    // Scale down if image is too wide
    if (width > maxWidth) {
      width = maxWidth;
      height = width / imageAspectRatio;
    }

    // Scale down if image is too tall
    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageAspectRatio;
    }

    return { width, height };
  };

  const responsiveDimensions = getResponsiveDimensions();

  return (
    <div ref={containerRef} className="w-full mx-auto px-4">
      {/* Compare Component - Dynamic Sizing */}
      <div className="flex justify-center items-center">
        {imageDimensions && containerDimensions && (
          <div className="bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm border border-border/50 rounded-lg md:rounded-3xl p-2 md:p-4 shadow-lg">
            <Compare
              firstImage={lightImage}
              secondImage={darkImage}
              firstImageClassName="object-contain select-none w-full h-full rounded-lg md:rounded-xl"
              secondImageClassname="object-contain select-none w-full h-full rounded-lg md:rounded-xl"
              className="rounded-lg md:rounded-xl overflow-hidden shadow-md"
              style={responsiveDimensions}
              slideMode="drag"
              autoplay={false}
            />
          </div>
        )}
        {(!imageDimensions || !containerDimensions) && (
          <div className="w-full max-w-5xl bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm border border-border/50 rounded-lg md:rounded-3xl p-2 md:p-4 shadow-lg">
            <div className="h-[200px] md:h-[500px] w-full rounded-lg md:rounded-xl bg-muted/20 animate-pulse flex items-center justify-center">
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
