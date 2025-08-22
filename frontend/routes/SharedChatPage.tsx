/**
 * SharedChatPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx
 * Purpose: Route component for displaying shared chat conversations.
 * Handles the /share/:shareId route and renders the SharedChatView component.
 */

import { useParams } from "react-router";
import SharedChatView from "../components/SharedChatView";

export default function SharedChatPage() {
  const { shareId } = useParams<{ shareId: string }>();

  if (!shareId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Share Link</h2>
          <p className="text-muted-foreground">The share link is malformed or missing.</p>
        </div>
      </div>
    );
  }

  return <SharedChatView shareId={shareId} />;
}
