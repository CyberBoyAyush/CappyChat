import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Compare } from "@/frontend/components/ui/compare";
import { useTheme } from "next-themes";
import { Badge } from "@/frontend/components/ui/badge";

function CompareDemo() {
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
  const imageLoadRef = useRef<HTMLImageElement | null>(null);

  // Memoize images based on theme to prevent unnecessary recalculations
  const { lightImage, darkImage } = useMemo(() => {
    const isCapybaraTheme =
      theme === "capybara-light" || theme === "capybara-dark";

    if (isCapybaraTheme) {
      return {
        lightImage:
          "https://res.cloudinary.com/dyetf2h9n/image/upload/v1758194374/image2_ospigx.png", // light theme capybara
        darkImage:
          "https://res.cloudinary.com/dyetf2h9n/image/upload/v1758194374/image1_r8heb4.png", // dark theme capybara
      };
    } else {
      return {
        lightImage:
          "https://res.cloudinary.com/dyetf2h9n/image/upload/v1758194374/image4_v6bsyd.png", // light theme monochromatic
        darkImage:
          "https://res.cloudinary.com/dyetf2h9n/image/upload/v1758194374/image3_jbdmr4.png", // dark theme monochromatic
      };
    }
  }, [theme]);

  // Memoize the container dimensions update function
  const updateContainerDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({
        width: rect.width,
        height: window.innerHeight - 200, // Keep some margin for header
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

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
  }, [updateContainerDimensions]);

  useEffect(() => {
    // Cleanup previous image loading if any
    if (imageLoadRef.current) {
      imageLoadRef.current.onload = null;
      imageLoadRef.current.onerror = null;
    }

    // Load the first image to get its dimensions
    const img = new Image();
    imageLoadRef.current = img;

    img.onload = () => {
      // Check if this is still the current image loading operation
      if (imageLoadRef.current === img) {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };

    img.onerror = () => {
      // Handle error case
      if (imageLoadRef.current === img) {
        console.warn(`Failed to load image: ${lightImage}`);
        setImageDimensions(null);
      }
    };

    img.src = lightImage;

    // Cleanup function
    return () => {
      if (imageLoadRef.current === img) {
        img.onload = null;
        img.onerror = null;
        imageLoadRef.current = null;
      }
    };
  }, [lightImage]); // Depend on lightImage to reload when theme changes

  // Memoize responsive dimensions calculation
  const responsiveDimensions = useMemo(() => {
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
  }, [imageDimensions, containerDimensions]);

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

// Memoize the component to prevent unnecessary re-renders
export default React.memo(CompareDemo);
