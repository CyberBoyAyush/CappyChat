/**
 * Version Configuration and Changelog Data
 *
 * Centralized version management and changelog information for CappyChat.
 * This file contains the current version and detailed changelog entries.
 */

export const CURRENT_VERSION = "3.3.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  isLatest?: boolean;
  features: {
    type: "new" | "improvement" | "fix" | "security";
    title: string;
    description: string;
    icon: string;
    color: string;
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.3.0",
    date: "2025-08-31",
    isLatest: true,
    features: [
      {
        type: "new",
        title: "Gemini 2.5 Flash Lite Default Model",
        description:
          "Updated default model from OpenAI 5 Mini to Gemini 2.5 Flash Lite across the entire application for improved performance and cost efficiency.",
        icon: "Sparkles",
        color: "blue",
      },
      {
        type: "improvement",
        title: "Domain Migration to cappychat.com",
        description:
          "Migrated all URLs and references from cappychat.ayush-sharma.in to the new cappychat.com domain for better branding and accessibility.",
        icon: "Globe",
        color: "green",
      },
      {
        type: "improvement",
        title: "Subscription Management Enhancement",
        description:
          "Refactored subscription handling with next_billing_date consistency and improved cancellation status display.",
        icon: "CreditCard",
        color: "purple",
      },
      {
        type: "fix",
        title: "Guest User Model Restrictions",
        description:
          "Updated guest user restrictions to use Gemini 2.5 Flash Lite as the default model with proper validation and error messaging.",
        icon: "UserCheck",
        color: "orange",
      },
    ],
  },
  {
    version: "3.2.0",
    date: "2025-08-13",
    features: [
      {
        type: "new",
        title: "Reddit Search Integration",
        description:
          "Added comprehensive Reddit search functionality with dedicated UI components, citations, and search type selection between Web, Reddit, and Chat modes.",
        icon: "MessageSquare",
        color: "orange",
      },
      {
        type: "new",
        title: "Enhanced Search Type Selector",
        description:
          "Implemented SearchTypeSelector with Reddit icon support and improved UI for switching between different search modes.",
        icon: "Search",
        color: "blue",
      },
      {
        type: "improvement",
        title: "UI Component Enhancements",
        description:
          "Enhanced ModelSelector, ConversationStyleSelector, and other UI components with ghost buttons and improved dropdown styling.",
        icon: "Palette",
        color: "purple",
      },
      {
        type: "improvement",
        title: "Voice Input Button Updates",
        description:
          "Updated VoiceInputButton icons for better clarity, replacing MicOff with Ban and Mic with AudioLines for improved user experience.",
        icon: "Mic",
        color: "green",
      },
    ],
  },
  {
    version: "3.1.0",
    date: "2025-07-04",
    features: [
      {
        type: "new",
        title: "Tavily API Integration",
        description:
          "Integrated Tavily API for enhanced web search capabilities, allowing any selected model to perform comprehensive web searches with improved accuracy.",
        icon: "Search",
        color: "blue",
      },
      {
        type: "new",
        title: "BYOK Tavily Support",
        description:
          "Added Bring Your Own Key (BYOK) support for Tavily API keys with validation, persistence, and user-friendly management interface.",
        icon: "Key",
        color: "yellow",
      },
      {
        type: "new",
        title: "Automated Version Management",
        description:
          "Implemented automated version management system with changelog generation scripts and semantic versioning support.",
        icon: "GitBranch",
        color: "green",
      },
      {
        type: "improvement",
        title: "Web Search Citations",
        description:
          "Enhanced web search citations with improved UI components, better loading states, and comprehensive source attribution.",
        icon: "Link",
        color: "purple",
      },
      {
        type: "improvement",
        title: "Model Availability Enhancement",
        description:
          "Removed model restrictions for web search, allowing users to perform searches with any available AI model for better flexibility.",
        icon: "Unlock",
        color: "orange",
      },
    ],
  },
  {
    version: "3.0.0",
    date: "2025-07-01",
    isLatest: false,
    features: [
      {
        type: "new",
        title: "Image-to-Image Generation",
        description:
          "Revolutionary image-to-image generation functionality with advanced editing and enhancement capabilities. Transform existing images with AI-powered modifications.",
        icon: "ImageIcon",
        color: "purple",
      },
      {
        type: "new",
        title: "Aspect Ratio Selection",
        description:
          "Comprehensive aspect ratio selection system for image generation with support for multiple formats including 1:1, 16:9, 21:9, and 4:3.",
        icon: "Crop",
        color: "blue",
      },
      {
        type: "new",
        title: "Bulk Image Management",
        description:
          "Advanced bulk image deletion functionality with enhanced retry logic for improved image generation workflow management.",
        icon: "Trash2",
        color: "red",
      },
      {
        type: "improvement",
        title: "Enhanced Loading Experience",
        description:
          "Improved loading states and animations for image generation with refresh page instructions for better user guidance.",
        icon: "Loader2",
        color: "orange",
      },
    ],
  },
  {
    version: "2.2.0",
    date: "2025-06-30",
    features: [
      {
        type: "new",
        title: "Gemini 2.0 Flash Model",
        description:
          "Added Google's latest Gemini 2.0 Flash model with optimized configurations for faster response times and improved accuracy.",
        icon: "Zap",
        color: "yellow",
      },
      {
        type: "new",
        title: "Fast Model Indicators",
        description:
          "Visual indicators for fast models to help users identify and select high-performance AI models for quicker responses.",
        icon: "Gauge",
        color: "green",
      },
      {
        type: "new",
        title: "Juggernaut Pro Model",
        description:
          "Added Juggernaut Pro model to image generation API with enhanced configurations for professional-grade image creation.",
        icon: "Crown",
        color: "purple",
      },
      {
        type: "new",
        title: "Bulk User Operations",
        description:
          "Administrative functionality for bulk user operations and data deletion with enhanced management capabilities.",
        icon: "Users",
        color: "blue",
      },
      {
        type: "improvement",
        title: "Model Name Updates",
        description:
          "Updated model names including DeepSeek R1 Fast and optimized model configurations for better performance.",
        icon: "Settings",
        color: "gray",
      },
      {
        type: "fix",
        title: "Premium Tier Limits",
        description:
          "Updated TIER_LIMITS for premium and admin user tiers to provide better resource allocation.",
        icon: "Shield",
        color: "green",
      },
    ],
  },
  {
    version: "2.1.0",
    date: "2025-06-29",
    features: [
      {
        type: "new",
        title: "Comprehensive Documentation",
        description:
          "Added detailed project documentation including features, tech stack, and getting started guide for developers and users.",
        icon: "BookOpen",
        color: "blue",
      },
      {
        type: "new",
        title: "Collapsible Web Sources",
        description:
          "Implemented collapsible sections for web sources in citations component for better organization and readability.",
        icon: "ChevronDown",
        color: "purple",
      },
      {
        type: "new",
        title: "Thread Pagination",
        description:
          "Advanced pagination system for thread management with enhanced loading experience and better performance.",
        icon: "List",
        color: "green",
      },
      {
        type: "improvement",
        title: "Enhanced Image Generation",
        description:
          "Improved image generation handling with better loading states, animations, and user feedback mechanisms.",
        icon: "Image",
        color: "orange",
      },
      {
        type: "fix",
        title: "Team Information Updates",
        description:
          "Updated team member roles and descriptions in About page for accurate representation.",
        icon: "Users",
        color: "gray",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2025-06-28",
    features: [
      {
        type: "new",
        title: "About Page",
        description:
          "Comprehensive About page with team information, project details, and enhanced navigation throughout the application.",
        icon: "Info",
        color: "blue",
      },
      {
        type: "new",
        title: "Session Management System",
        description:
          "Advanced session management with detailed controls, limits, and comprehensive session monitoring capabilities.",
        icon: "Monitor",
        color: "green",
      },
      {
        type: "new",
        title: "File Management",
        description:
          "Enhanced file management system with improved UI, new icons, and better layout organization.",
        icon: "FolderOpen",
        color: "orange",
      },
      {
        type: "improvement",
        title: "Settings Page Enhancement",
        description:
          "Redesigned settings interface with About Us section navigation and improved user experience.",
        icon: "Settings",
        color: "purple",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2025-06-26",
    features: [
      {
        type: "new",
        title: "Global Memory System",
        description:
          "Revolutionary global memory support for enhanced memory management, better performance, and improved AI context retention.",
        icon: "Brain",
        color: "purple",
      },
      {
        type: "improvement",
        title: "LLM Result Display",
        description:
          "Improved structure for tree-like outputs in LLM results with better formatting and readability.",
        icon: "TreePine",
        color: "green",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-06-18",
    features: [
      {
        type: "new",
        title: "Real-time Sync Capabilities",
        description:
          "Enhanced real-time synchronization across the application for instant updates and seamless collaboration.",
        icon: "RefreshCw",
        color: "blue",
      },
      {
        type: "new",
        title: "Bulk User Logout",
        description:
          "Administrative functionality for bulk user logout with chunked processing and fallback methods.",
        icon: "LogOut",
        color: "red",
      },
      {
        type: "improvement",
        title: "Enhanced Loading Skeletons",
        description:
          "Improved loading skeleton styles for better UI experience during data loading states.",
        icon: "Loader",
        color: "gray",
      },
      {
        type: "improvement",
        title: "File Upload Enhancement",
        description:
          "Refactored file upload component with enhanced error handling and improved loading states.",
        icon: "Upload",
        color: "orange",
      },
      {
        type: "improvement",
        title: "Model Selection UI",
        description:
          "Enhanced BYOK indicator styling and improved model selection user interface.",
        icon: "Cpu",
        color: "purple",
      },
      {
        type: "fix",
        title: "Guest User Restrictions",
        description:
          "Updated guest user model restrictions to Gemini 2.5 Flash Lite for better resource management.",
        icon: "UserX",
        color: "yellow",
      },
    ],
  },
];

/**
 * Get changelog entry by version
 */
export function getChangelogEntry(version: string): ChangelogEntry | undefined {
  return CHANGELOG.find((entry) => entry.version === version);
}

/**
 * Get the latest changelog entry
 */
export function getLatestChangelog(): ChangelogEntry | undefined {
  return CHANGELOG.find((entry) => entry.isLatest) || CHANGELOG[0];
}

/**
 * Get all versions in descending order
 */
export function getAllVersions(): string[] {
  return CHANGELOG.map((entry) => entry.version);
}
