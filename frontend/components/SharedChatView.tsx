/**
 * SharedChatView Component
 *
 * Used in: frontend/routes/SharedChatPage.tsx
 * Purpose: Displays shared chat conversations in view-only mode with branch functionality for logged-in users.
 * Provides public access to shared conversations and allows authenticated users to branch and continue.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { GitBranch, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/frontend/contexts/AuthContext";
import Message from "./Message";
import { UIMessage } from "ai";

interface SharedThread {
  id: string;
  title: string;
  createdAt: string;
  sharedAt: string;
  isShared: boolean;
}

interface SharedChatViewProps {
  shareId: string;
}

export default function SharedChatView({ shareId }: SharedChatViewProps) {
  const [thread, setThread] = useState<SharedThread | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branching, setBranching] = useState(false);
  const { user, isGuest, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/share/${shareId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError(
              "This shared conversation could not be found or is no longer available."
            );
          } else {
            setError("Failed to load shared conversation.");
          }
          return;
        }

        const data = await response.json();
        setThread(data.thread);
        setMessages(data.messages);
      } catch (err) {
        console.error("Error fetching shared chat:", err);
        setError("Failed to load shared conversation.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedChat();
  }, [shareId]);

  const handleBranch = async () => {
    console.log("🔄 Starting branch process...", {
      user: !!user,
      isGuest,
      userId: user?.$id,
      emailVerified: user?.emailVerification,
      userStatus: user?.status,
    });

    // Check if user is properly authenticated
    if (!user || isGuest || !user.$id || !user.emailVerification) {
      console.log(
        "❌ User not properly authenticated, trying to refresh user data..."
      );

      // Try to refresh user data first
      try {
        await refreshUser();
        // Check again after refresh
        if (!user || isGuest || !user.$id || !user.emailVerification) {
          console.log(
            "❌ Still not authenticated after refresh, redirecting to login"
          );
          navigate("/login");
          return;
        }
      } catch (error) {
        console.log("❌ Failed to refresh user, redirecting to login");
        navigate("/login");
        return;
      }
    }

    setBranching(true);
    try {
      const response = await fetch("/api/share/branch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareId,
          title: `${thread?.title} (Branched)`,
          userId: user.$id, // Pass user ID from frontend
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // Response might not be JSON
          errorData = { error: "Network error" };
        }

        console.error(
          "Branch API error:",
          errorData,
          "Status:",
          response.status
        );

        // Handle authentication errors (401 status or AUTH_REQUIRED code)
        if (response.status === 401 || errorData.code === "AUTH_REQUIRED") {
          console.log("Authentication required, redirecting to login");
          navigate("/login");
          return;
        }

        throw new Error(
          errorData.error ||
            `Failed to branch conversation (${response.status})`
        );
      }

      const data = await response.json();
      console.log("✅ Branch successful:", data);

      // Navigate to the new branched thread
      console.log("🔄 Navigating to new thread:", data.threadId);
      navigate(`/chat/${data.threadId}`);
    } catch (err) {
      console.error("Error branching conversation:", err);
      // You could add a toast notification here
    } finally {
      setBranching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">
            Loading shared conversation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Conversation Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/chat")} variant="outline">
            Start New Conversation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="w-full px-5 fixed top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold">{thread?.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Shared{" "}
                    {new Date(thread?.sharedAt || "").toLocaleDateString()}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    View Only
                  </span>
                </div>
              </div>
            </div>

            {user && !isGuest && user.$id && user.emailVerification && (
              <Button
                onClick={handleBranch}
                disabled={branching}
                className="flex items-center gap-2"
              >
                {branching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GitBranch className="h-4 w-4" />
                )}
                {branching ? "Branching..." : "Branch & Continue"}
              </Button>
            )}

            {(!user || isGuest || !user.$id || !user.emailVerification) && (
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Login to Branch
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-5xl mx-auto px-4 pt-48 pb-16 md:py-28 ">
        <div className="space-y-6 no-scrollbar">
          {messages.map((message) => (
            <Message
              key={message.id}
              threadId={thread?.id || ""}
              message={message}
              setMessages={() => {}} // Read-only, no message updates
              reload={async () => Promise.resolve(null)} // Read-only, no reload
              isStreaming={false}
              registerRef={() => {}} // No navigation needed
              stop={() => {}} // No stopping needed
            />
          ))}

          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                This conversation is empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
