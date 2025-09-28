/**
 * BentoGrid Component
 *
 * Purpose: Beautiful animated bento grid showcasing CappyChat features
 * Features: Micro-interactive animated components, responsive design, theme support
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Image, Mic, Search, Globe } from "lucide-react";
import CapybaraIcon from "./CapybaraIcon";
import { ImageGenerationLoading } from "./UIComponents";

interface BentoGridProps {
  className?: string;
}

// Icons array moved outside component to prevent recreation on every render
const AI_ICONS = [
  {
    id: "anthropic",
    name: "Anthropic",
    isSvg: true,
    svg: (
      <svg
        fill="#000"
        fill-rule="evenodd"
        viewBox="0 0 24 24"
        width="20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Anthropic</title>
        <path
          fill="currentColor"
          d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"
        ></path>
      </svg>
    ),
  },
  {
    id: "gemini",
    name: "Gemini",
    isSvg: true,
    svg: (
      <svg
        viewBox="0 0 296 298"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
      >
        <mask
          id="gemini-a"
          width="296"
          height="298"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
        >
          <path
            fill="currentColor"
            d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"
          />
        </mask>
        <g mask="url(#gemini-a)">
          <g filter="url(#gemini-b)">
            <ellipse cx="163" cy="149" fill="currentColor" rx="196" ry="159" />
          </g>
          <g filter="url(#gemini-c)">
            <ellipse
              cx="33.5"
              cy="142.5"
              fill="currentColor"
              rx="68.5"
              ry="72.5"
            />
          </g>
          <g filter="url(#gemini-d)">
            <ellipse
              cx="19.5"
              cy="148.5"
              fill="currentColor"
              rx="68.5"
              ry="72.5"
            />
          </g>
          <g filter="url(#gemini-e)">
            <path
              fill="currentColor"
              d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z"
            />
          </g>
          <g filter="url(#gemini-f)">
            <path
              fill="currentColor"
              d="M190.5-12.5C168.5 59.5 62 111.333 19 112L140.5-89l50 76.5Z"
            />
          </g>
          <g filter="url(#gemini-g)">
            <path
              fill="currentColor"
              d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z"
            />
          </g>
          <g filter="url(#gemini-h)">
            <path
              fill="currentColor"
              d="M196.5 320.5C174.5 248.5 68 196.667 25 196l121.5 201 50-76.5Z"
            />
          </g>
        </g>
        <defs>
          <filter
            id="gemini-b"
            width="464"
            height="390"
            x="-69"
            y="-46"
            fill="none"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="18"
            />
          </filter>
          <filter
            id="gemini-c"
            width="265"
            height="273"
            x="-99"
            y="6"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="32"
            />
          </filter>
          <filter
            id="gemini-d"
            width="265"
            height="273"
            x="-113"
            y="12"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="32"
            />
          </filter>
          <filter
            id="gemini-e"
            width="299.5"
            height="329"
            x="-41.5"
            y="-130"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="32"
            />
          </filter>
          <filter
            id="gemini-f"
            width="299.5"
            height="329"
            x="-45"
            y="-153"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="32"
            />
          </filter>
          <filter
            id="gemini-g"
            width="299.5"
            height="329"
            x="-41"
            y="91"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="32"
            />
          </filter>
          <filter
            id="gemini-h"
            width="299.5"
            height="329"
            x="-39"
            y="132"
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              result="effect1_foregroundBlur_69_17998"
              stdDeviation="32"
            />
          </filter>
        </defs>
      </svg>
    ),
  },
  {
    id: "openai",
    name: "OpenAI",
    isSvg: true,
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        preserveAspectRatio="xMidYMid"
        viewBox="0 0 256 260"
        className="w-5 h-5"
      >
        <path
          fill="currentColor"
          d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
        />
      </svg>
    ),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    isSvg: true,
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 0 1-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 0 0-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 0 1-.465.137 9.597 9.597 0 0 0-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 0 0 1.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 0 1 1.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 0 1 .415-.287.302.302 0 0 1 .2.288.306.306 0 0 1-.31.307.303.303 0 0 1-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 0 1-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 0 1 .016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 0 1-.254-.078.253.253 0 0 1-.114-.358c.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
        />
      </svg>
    ),
  },
  { id: "CappyChat", name: "CappyChat", isSvg: false },
  {
    id: "qwen",
    name: "Qwen",
    isSvg: true,
    svg: (
      <svg
        fill="currentColor"
        fill-rule="evenodd"
        height="20"
        viewBox="0 0 24 24"
        width="20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Qwen</title>
        <path
          fill="currentColor"
          d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z"
        ></path>
      </svg>
    ),
  },
  {
    id: "grok",
    name: "Grok",
    isSvg: true,
    svg: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M395.479 633.828L735.91 381.105C752.599 368.715 776.454 373.548 784.406 392.792C826.26 494.285 807.561 616.253 724.288 699.996C641.016 783.739 525.151 802.104 419.247 760.277L303.556 814.143C469.49 928.202 670.987 899.995 796.901 773.282C896.776 672.843 927.708 535.937 898.785 412.476L899.047 412.739C857.105 231.37 909.358 158.874 1016.4 10.6326C1018.93 7.11771 1021.47 3.60279 1024 0L883.144 141.651V141.212L395.392 633.916"
          fill="currentColor"
        />
        <path
          d="M325.226 695.251C206.128 580.84 226.662 403.776 328.285 301.668C403.431 226.097 526.549 195.254 634.026 240.596L749.454 186.994C728.657 171.88 702.007 155.623 671.424 144.2C533.19 86.9942 367.693 115.465 255.323 228.382C147.234 337.081 113.244 504.215 171.613 646.833C215.216 753.423 143.739 828.818 71.7385 904.916C46.2237 931.893 20.6216 958.87 0 987.429L325.139 695.339"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "runware",
    name: "Runware",
    isSvg: true,
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="w-5 h-5"
      >
        <path
          fill="currentColor"
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        />
      </svg>
    ),
  },

  {
    id: "voice",
    name: "Voice",
    isSvg: true,
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="w-8 h-8"
      >
        <path
          fill="currentColor"
          d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6c0 3-2.54 5.1-5.3 5.1S6.7 11 6.7 8H5c0 3.41 2.72 6.23 6 6.72V17h2v-2.28c3.28-.49 6-3.31 6-6.72h-1.7z"
        />
      </svg>
    ),
  },
];

// AI & Tool Icons Demo Component
const AIIconsDemo = () => {
  const [isCapyHighlighted, setIsCapyHighlighted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsCapyHighlighted((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 place-items-center gap-2">
      {AI_ICONS.slice(0, 8).map((item) => (
        <motion.div
          key={item.id}
          className={cn(
            "relative w-16 h-16 rounded-xl flex items-center justify-center ring 1ransition-all duration-500",
            "bg-gradient-to-br  bg-muted/20 ring-ring/20"
          )}
          transition={{ duration: 0.3 }}
        >
          {item.name === "CappyChat" ? (
            <CapybaraIcon
              size="text-lg"
              animated={false}
              showLoader={true}
              className="w-5 h-5"
            />
          ) : (
            item.svg
          )}
        </motion.div>
      ))}

      {/* Voice and Text icons in remaining spots */}
      {AI_ICONS.slice(8).map((item) => (
        <motion.div
          key={item.id}
          className="relative w-16 h-16 rounded-xl flex items-center justify-center ring 1ransition-all duration-500 bg-gradient-to-br bg-muted/20 ring-ring/20 "
        >
          <Mic className="w-5 h-5 text-primary" />
        </motion.div>
      ))}
    </div>
  );
};

// Animated Image Generation Demo
const ImageGenDemo = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeoutsRef.current.push(timeout);
  }, []);

  useEffect(() => {
    const cycle = () => {
      // Start generating
      setIsGenerating(true);
      setShowResult(false);

      // After 3 seconds, show result
      const timeout1 = setTimeout(() => {
        setIsGenerating(false);
        setShowResult(true);

        // After 2 seconds showing result, reset
        const timeout2 = setTimeout(() => {
          setShowResult(false);
          // Wait 1 second before starting next cycle
          const timeout3 = setTimeout(cycle, 1000);
          addTimeout(timeout3);
        }, 2000);
        addTimeout(timeout2);
      }, 3000);
      addTimeout(timeout1);
    };

    // Start the cycle
    const initialTimeout = setTimeout(cycle, 1000);
    addTimeout(initialTimeout);

    return () => clearAllTimeouts();
  }, [addTimeout, clearAllTimeouts]);

  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-lg p-3 ring ring-ring/20 relative overflow-hidden">
        {/* Status indicator */}
        <div className="mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Image className="h-3 w-3" />
            <span>
              {isGenerating
                ? "Generating image..."
                : showResult
                ? "Image complete!"
                : "Ready to create"}
            </span>
            {isGenerating && (
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </div>
        {/* Image generation area */}
        <div className="w-full h-40 relative">
          {isGenerating ? (
            <ImageGenerationLoading aspectRatio="" />
          ) : showResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 rounded ring ring-ring/20 flex items-center justify-center"
            >
              <div className="text-center flex justify-center items-center gap-1 flex-col">
                <CapybaraIcon
                  size="text-lg"
                  animated={false}
                  showLoader={true}
                />

                <div className="text-xs text-muted-foreground">
                  Generated Image
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full bg-muted/20 rounded ring ring-ring/20 flex items-center justify-center">
              <div className="text-center">
                <Image className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  Ready to generate
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sample phrases moved outside component to prevent recreation
const VOICE_PHRASES = [
  "How's the weather today?",
  "Create a React component",
  "Generate an image of sunset",
  "Search for AI news",
  "Tell me a joke",
];

// Animated Voice Input Demo
const VoiceInputDemo = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0, 0, 0, 0, 0]);
  const [transcriptionText, setTranscriptionText] = useState("");
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach((interval) => clearInterval(interval));
    intervalsRef.current = [];
  }, []);

  const addTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeoutsRef.current.push(timeout);
  }, []);

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    intervalsRef.current.push(interval);
  }, []);

  useEffect(() => {
    const mainInterval = setInterval(() => {
      if (!isListening) {
        // Start listening
        setIsListening(true);
        setTranscriptionText("");
        setAudioLevels([0, 0, 0, 0, 0]);

        // Simulate audio levels during listening
        const audioInterval = setInterval(() => {
          setAudioLevels((prev) => prev.map(() => Math.random() * 100));
        }, 100);
        addInterval(audioInterval);

        // Stop listening after 3 seconds and show transcription
        const stopTimeout = setTimeout(() => {
          clearInterval(audioInterval);
          setIsListening(false);
          setAudioLevels([0, 0, 0, 0, 0]);

          // Simulate typing transcription
          const randomPhrase =
            VOICE_PHRASES[Math.floor(Math.random() * VOICE_PHRASES.length)];
          let currentText = "";
          const typeInterval = setInterval(() => {
            currentText += randomPhrase[currentText.length];
            setTranscriptionText(currentText);

            if (currentText === randomPhrase) {
              clearInterval(typeInterval);
              // Clear after showing for 2 seconds
              const clearTimeout = setTimeout(
                () => setTranscriptionText(""),
                2000
              );
              addTimeout(clearTimeout);
            }
          }, 50);
          addInterval(typeInterval);
        }, 3000);
        addTimeout(stopTimeout);
      }
    }, 8000);
    addInterval(mainInterval);

    return () => {
      clearAllTimeouts();
      clearAllIntervals();
    };
  }, [
    isListening,
    addTimeout,
    addInterval,
    clearAllTimeouts,
    clearAllIntervals,
  ]);

  return (
    <div className="space-y-4">
      {/* Microphone and audio visualizer */}
      <div className="flex flex-col items-center ">
        <motion.div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center ring-1 transition-all duration-300",
            isListening
              ? "bg-primary/10 ring-1rimary shadow-lg shadow-red-500/20"
              : "bg-muted/30 ring-ring 2over:ring-1rimary/50"
          )}
          animate={{
            scale: isListening ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: isListening ? Infinity : 0,
          }}
        >
          <Mic
            className={cn(
              "h-6 w-6 transition-colors",
              isListening ? "text-foreground/45" : "text-primary"
            )}
          />
        </motion.div>

        {/* Audio level visualizer */}
        <div className="flex items-end justify-center gap-1 h-8">
          {audioLevels.map((level, index) => (
            <motion.div
              key={index}
              className="w-1 bg-gradient-to-t from-primary to-primary/60 rounded-full"
              animate={{
                height: isListening ? `${Math.max(8, level * 0.24)}px` : "8px",
              }}
              transition={{
                duration: 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Status and transcription */}
      <div className="text-center space-y-2">
        <div className="text-xs font-medium">
          {isListening ? (
            <span className="text-primary flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Listening...
            </span>
          ) : transcriptionText ? (
            <span className="text-primary">Transcribing...</span>
          ) : (
            <span className="text-muted-foreground">Tap to speak</span>
          )}
        </div>

        {/* Transcription text */}
        {transcriptionText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/30 rounded-lg p-2 text-xs text-foreground ring ring-ring/20"
          >
            &ldquo;{transcriptionText}&rdquo;
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Real-time Sync Demo with Two Mobile Phones
const RealTimeSyncDemo = () => {
  const [phone1Messages, setPhone1Messages] = useState<
    Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: number;
    }>
  >([]);
  const [phone2Messages, setPhone2Messages] = useState<
    Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: number;
    }>
  >([]);
  const [isTyping, setIsTyping] = useState<{
    phone1: boolean;
    phone2: boolean;
  }>({ phone1: false, phone2: false });
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [animatedMessages, setAnimatedMessages] = useState<Set<string>>(
    new Set()
  );

  const sampleConversations = React.useMemo(
    () => [
      [
        { text: "Hello!", isUser: true },
        {
          text: "Hi! I am CappyChat! what can I help you with?",
          isUser: false,
        },
        {
          text: "What is the best way to learn AI?",
          isUser: true,
        },
        {
          text: "The best way to learn AI is to practice. Start with the basics and build your way up.",
          isUser: false,
        },
      ],
      [
        { text: "What is Weather like today?", isUser: true },
        {
          text: "Weather in your area is sunny with a high of 25°C.",
          isUser: false,
        },
        { text: "Can you show me the weather in New York?", isUser: true },
        { text: "Sure!", isUser: false },
      ],
      [
        { text: "What is the meaning of segmentation?", isUser: true },
        {
          text: "Segmentation is the process of dividing a market into distinct groups of consumers.",
          isUser: false,
        },
        { text: "How long does it take to learn AI?", isUser: true },
        { text: "It takes around 3-6 months to learn AI.", isUser: false },
      ],
    ],
    []
  );

  // Cleanup function to clear all timeouts
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeoutsRef.current.push(timeout);
  }, []);

  // Reset conversation state
  const resetConversation = useCallback(() => {
    setPhone1Messages([]);
    setPhone2Messages([]);
    setIsTyping({ phone1: false, phone2: false });
    setCurrentMessageIndex(0);
    setAnimatedMessages(new Set());
  }, []);

  // Send next message in conversation
  const sendNextMessage = useCallback(() => {
    const conversation = sampleConversations[currentConversationIndex];

    if (currentMessageIndex >= conversation.length) {
      // End of conversation - reset and move to next
      const resetTimeout = setTimeout(() => {
        resetConversation();
        setCurrentConversationIndex(
          (prev) => (prev + 1) % sampleConversations.length
        );
      }, 3000);
      addTimeout(resetTimeout);
      return;
    }

    const message = conversation[currentMessageIndex];
    const messageId = `${currentConversationIndex}-${currentMessageIndex}-${Date.now()}`;

    // Step 1: Show typing on phone 1 only if it's an AI message
    if (!message.isUser) {
      setIsTyping((prev) => ({ ...prev, phone1: true }));
    }

    const phone1Timeout = setTimeout(
      () => {
        // Step 2: Add message to phone 1 and stop typing
        const phone1MessageId = messageId + "-phone1";
        setPhone1Messages((prev) => [
          ...prev,
          {
            id: phone1MessageId,
            text: message.text,
            isUser: message.isUser,
            timestamp: Date.now(),
          },
        ]);
        setAnimatedMessages((prev) => new Set([...prev, phone1MessageId]));
        if (!message.isUser) {
          setIsTyping((prev) => ({ ...prev, phone1: false }));
        }

        // Step 3: Show sync delay and typing on phone 2 only if it's an AI message
        const syncDelayTimeout = setTimeout(() => {
          if (!message.isUser) {
            setIsTyping((prev) => ({ ...prev, phone2: true }));
          }

          const phone2Timeout = setTimeout(() => {
            // Step 4: Sync to phone 2 and stop typing
            const phone2MessageId = messageId + "-phone2";
            setPhone2Messages((prev) => [
              ...prev,
              {
                id: phone2MessageId,
                text: message.text,
                isUser: message.isUser,
                timestamp: Date.now(),
              },
            ]);
            setAnimatedMessages((prev) => new Set([...prev, phone2MessageId]));
            if (!message.isUser) {
              setIsTyping((prev) => ({ ...prev, phone2: false }));
            }

            // Step 5: Move to next message
            setCurrentMessageIndex((prev) => prev + 1);
          }, 800);
          addTimeout(phone2Timeout);
        }, 300);
        addTimeout(syncDelayTimeout);
      },
      message.isUser ? 800 : 1500
    ); // Shorter delay for user messages
    addTimeout(phone1Timeout);
  }, [
    currentConversationIndex,
    currentMessageIndex,
    addTimeout,
    resetConversation,
    sampleConversations,
  ]);

  // Effect to handle message sending
  useEffect(() => {
    const nextMessageTimeout = setTimeout(() => {
      sendNextMessage();
    }, 1500);
    addTimeout(nextMessageTimeout);

    return () => {
      clearTimeout(nextMessageTimeout);
    };
  }, [sendNextMessage, addTimeout]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  const MobilePhone = React.memo(
    ({
      phone,
      messages: phoneMessages,
      isTyping: phoneTyping,
      animatedMessageIds,
    }: {
      phone: 1 | 2;
      messages: Array<{
        id: string;
        text: string;
        isUser: boolean;
        timestamp: number;
      }>;
      isTyping: boolean;
      animatedMessageIds: Set<string>;
    }) => (
      <div className="relative">
        {/* Phone Frame */}
        <div className="w-36 h-64 bg-primary/20 rounded-[20px] p-1 shadow-lg">
          {/* Screen */}
          <div className="w-full h-full bg-primary/10 rounded-[16px] overflow-hidden flex flex-col">
            {/* Status Bar */}
            <div className="h-4 bg-primary/30 flex items-center justify-center">
              <div className="w-12 h-1 bg-primary/50 rounded-full"></div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {phoneMessages.map((msg) => {
                const shouldAnimate = !animatedMessageIds.has(msg.id);
                return (
                  <motion.div
                    key={msg.id}
                    initial={
                      shouldAnimate ? { opacity: 0, y: 10, scale: 0.8 } : false
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      msg.isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-[10px] leading-tight ${
                        msg.isUser
                          ? "bg-background/50 text-foreground rounded-br-sm"
                          : "bg-primary/80 text-background rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Indicator */}
              {phoneTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-primary/80 px-2 py-1 rounded-lg rounded-bl-sm">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Phone Label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="text-[10px] text-muted-foreground font-medium">
            Phone {phone}
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-4">
      {/* Two Phones */}
      <div className="flex justify-center items-start gap-3">
        {/* Phone 1 */}
        <MobilePhone
          phone={1}
          messages={phone1Messages}
          isTyping={isTyping.phone1}
          animatedMessageIds={animatedMessages}
        />

        {/* Sync Arrow */}
        <div className="flex flex-col items-center justify-center h-56">
          <motion.div className="text-primary rotate-90">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 0l4 4H9v4H7V4H4l4-4zM8 12l-4-4h3V4h2v4h3l-4 4z" />
            </svg>
          </motion.div>
          <div className="text-[12px] text-muted-foreground mt-1">Sync</div>
        </div>

        <MobilePhone
          phone={2}
          messages={phone2Messages}
          isTyping={isTyping.phone2}
          animatedMessageIds={animatedMessages}
        />
      </div>
    </div>
  );
};

// Animated Web & Reddit Search Demo
const SearchDemo = () => {
  const [searchType, setSearchType] = useState<"web" | "reddit">("web");
  const [isSearching, setIsSearching] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach((interval) => clearInterval(interval));
    intervalsRef.current = [];
  }, []);

  const addTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeoutsRef.current.push(timeout);
  }, []);

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    intervalsRef.current.push(interval);
  }, []);

  useEffect(() => {
    const mainInterval = setInterval(() => {
      setIsSearching(true);
      const searchTimeout = setTimeout(() => {
        setSearchType((prev) => (prev === "web" ? "reddit" : "web"));
        setIsSearching(false);
      }, 2000);
      addTimeout(searchTimeout);
    }, 4000);
    addInterval(mainInterval);

    return () => {
      clearAllTimeouts();
      clearAllIntervals();
    };
  }, [addTimeout, addInterval, clearAllTimeouts, clearAllIntervals]);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="bg-muted/30 rounded-lg p-2 ring ring-ring/20 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <motion.div
            key={searchType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground flex-1"
          >
            Searching {searchType === "web" ? "the web" : "Reddit"}...
          </motion.div>
          <motion.div
            animate={{ rotate: isSearching ? 360 : 0 }}
            transition={{ duration: 1, repeat: isSearching ? Infinity : 0 }}
          >
            <Globe className="h-4 w-4 text-primary" />
          </motion.div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {[1, 2].map((result) => (
          <motion.div
            key={`${searchType}-${result}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: result * 0.2 }}
            className="bg-muted/20 rounded p-2 ring ring-ring/20"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full bg-primary")} />
              <span className="text-xs font-medium">
                {searchType === "web" ? "Web" : "Reddit"} Result {result}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Real-time {searchType} search results
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main Bento Grid Component
export default function BentoGrid({ className }: BentoGridProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">
        {/* Multi AI Models */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl pt-6 relative overflow-hidden "
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 px-6">
              <div>
                <h3 className="font-bold group-hover:text-primary transition-colors">
                  Multi AI Models
                </h3>
                <p className="text-xs text-muted-foreground">
                  20+ advanced models
                </p>
              </div>
            </div>
            <div className="h-[225px] w-52 mx-auto ">
              <AIIconsDemo />
            </div>
          </div>
        </motion.div>

        {/* Our Features - Top Left (spans 2 columns on large screens) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 flex flex-col gap-7 justify-center items-center bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl p-6 relative overflow-hidden "
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

          <CapybaraIcon size="2xl" animated={true} showLoader={true} />
        </motion.div>

        {/* Image Generation */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl pt-6 px-6 relative overflow-hidden "
        >
          <div className="relative z-10">
            <div className="flex  items-center gap-2 mb-3">
              <div>
                <h3 className="font-bold group-hover:text-primary transition-colors">
                  Image Generation
                </h3>
                <p className="text-xs text-muted-foreground">
                  AI-powered visuals
                </p>
              </div>
            </div>
            <div className="h-[225px] overflow-hidden">
              <ImageGenDemo />
            </div>
          </div>
        </motion.div>

        {/* Voice Input */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br lg:col-span-2 from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl p-6 relative overflow-hidden group "
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div>
                <h3 className="font-bold group-hover:text-primary transition-colors">
                  Voice Input
                </h3>
                <p className="text-xs text-muted-foreground">
                  Speech recognition
                </p>
              </div>
            </div>
            <div className="h-[200px] flex items-center justify-center overflow-hidden">
              <VoiceInputDemo />
            </div>
          </div>
        </motion.div>

        {/* Real-time Sync Demo - spans 2 columns */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-1 lg:col-span-4 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl pt-6  relative overflow-hidden "
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 px-6">
              <div>
                <h3 className="font-bold group-hover:text-primary transition-colors">
                  Real-time Sync
                </h3>
                <p className="text-xs text-muted-foreground">
                  Cross-device synchronization
                </p>
              </div>
            </div>
            <div className="h-[222px] overflow-hidden">
              <RealTimeSyncDemo />
            </div>
          </div>
        </motion.div>

        {/* Web & Reddit Search - spans 2 columns */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-1 lg:col-span-3 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl p-6 relative overflow-hidden "
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div>
                <h3 className="font-bold group-hover:text-primary transition-colors">
                  Web & Reddit Search
                </h3>
                <p className="text-xs text-muted-foreground">
                  Real-time information retrieval
                </p>
              </div>
            </div>
            <div className="h-[200px] flex items-center justify-center overflow-hidden">
              <SearchDemo />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
