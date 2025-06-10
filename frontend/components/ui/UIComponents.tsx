/**
 * UI Components
 *
 * Used in: Various components throughout the application
 * Purpose: Consolidated small UI components including icons, loading animations, and error displays.
 * Contains custom SVG icons, loading states, and error components not available in external libraries.
 */

import { CircleAlert } from 'lucide-react';

// ===============================================
// Custom Icons
// ===============================================

export const StopIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      viewBox="0 0 16 16"
      width={size}
      style={{ color: 'currentcolor' }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 3H13V13H3V3Z"
        fill="currentColor"
      />
    </svg>
  );
};

// ===============================================
// Error Components
// ===============================================

/**
 * Error Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Displays error messages in a styled container with an alert icon.
 * Used to show API errors, network errors, or other chat-related error messages.
 */
export function Error({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600 flex items-center gap-4">
      <CircleAlert size={24} aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ===============================================
// Loading Components
// ===============================================

/**
 * MessageLoading Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Displays a loading animation while AI is generating a response.
 * Shows animated dots to indicate message processing state.
 */
export function MessageLoading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_qFRN"
          begin="0;spinner_OcgL.end+0.25s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate
          begin="spinner_qFRN.begin+0.1s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_OcgL"
          begin="spinner_qFRN.begin+0.2s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}

// Default export for backward compatibility
export default MessageLoading;
