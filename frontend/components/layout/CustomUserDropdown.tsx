/**
 * Custom User Dropdown Component for Navigation
 *
 * A simplified user dropdown containing only Settings, Admin (if admin), and Sign out.
 * Designed specifically for the navigation layout.
 */

"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { Button } from "@/frontend/components/ui/button";
import {
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  LogIn,
  UserPlus,
} from "lucide-react";
import { getUserTierInfo, type TierType } from "@/lib/tierSystem";
import AuthDialog from "../auth/AuthDialog";
import { useAuthDialog } from "@/frontend/hooks/useAuthDialog";
import { cn } from "@/lib/utils";

// Type for tier information
interface TierInfo {
  tier: TierType;
  freeCredits: number;
  premiumCredits: number;
  superPremiumCredits: number;
  lastResetDate?: string;
}

const CustomUserDropdown: React.FC = () => {
  const { user, logout, isGuest, guestUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null);
  const authDialog = useAuthDialog();

  // Don't render on authentication pages
  const isAuthPage = location.pathname.startsWith("/auth/");

  // Detect hover-capable devices
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(hover: hover)");
    setSupportsHover(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setSupportsHover(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Load tier information
  useEffect(() => {
    const loadTierInfo = async () => {
      if (!user || isAuthPage) return;

      try {
        const info = await getUserTierInfo();
        setTierInfo(info);
      } catch (error) {
        console.error("Error loading tier info:", error);
        setTierInfo({
          tier: "free",
          freeCredits: 0,
          premiumCredits: 0,
          superPremiumCredits: 0,
        });
      }
    };

    if (user && !isAuthPage) {
      loadTierInfo();
    } else {
      setTierInfo(null);
    }
  }, [user, isAuthPage]);

  // Close dropdown on outside interaction
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isDropdownOpen]);

  // Close dropdown when route changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (supportsHover) {
      setIsDropdownOpen(true);
    }
  }, [supportsHover]);

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (supportsHover) {
        setTimeout(() => {
          const relatedTarget = event.relatedTarget as Element;
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(relatedTarget) &&
            dropdownTriggerRef.current &&
            !dropdownTriggerRef.current.contains(relatedTarget)
          ) {
            setIsDropdownOpen(false);
          }
        }, 100);
      }
    },
    [supportsHover]
  );

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  if (isAuthPage) return null;

  // Show guest user interface if not authenticated
  if (!user && isGuest) {
    return (
      <>
        <div className="flex gap-2">
          <Button
            onClick={() => authDialog.navigateToLogin()}
            variant="outline"
            size="sm"
            className="h-9 text-sm border-border/60 hover:border-border hover:bg-muted/60 transition-all duration-200"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign in
          </Button>
          <Button
            onClick={() => authDialog.navigateToSignup()}
            variant="default"
            size="sm"
            className="h-9 text-sm shadow-sm hover:shadow-md transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign up
          </Button>
        </div>

        <AuthDialog
          isOpen={authDialog.isOpen}
          onClose={authDialog.closeDialog}
          initialMode={authDialog.mode}
          title={authDialog.title}
          description={authDialog.description}
        />
      </>
    );
  }

  // Don't render if no user and not guest
  if (!user) return null;

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        ref={dropdownTriggerRef}
        variant="ghost"
        onClick={handleDropdownToggle}
        className="flex items-center gap-2 px-3 py-2 h-10 hover:bg-muted/60 hover:shadow-sm transition-all duration-200 rounded-lg"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium shadow-sm">
          {userInitials}
        </div>
        <ChevronDown
          className={cn(
            "h-4 hidden md:block w-4 text-muted-foreground transition-transform duration-200",
            isDropdownOpen && "rotate-180"
          )}
        />
      </Button>

      {isDropdownOpen && (
        <>
          {/* Invisible bridge to prevent dropdown from closing */}
          <div className="absolute right-0 top-full z-40 h-3 w-52" />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border/40 bg-popover/98 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="px-3 py-2 border-b border-border/40 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-medium shadow-sm">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-foreground truncate text-sm">
                    {user.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  navigate("/settings");
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/60 rounded-lg transition-colors duration-200"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </button>

              {tierInfo?.tier === "admin" && (
                <button
                  onClick={() => {
                    navigate("/admin");
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/60 rounded-lg transition-colors duration-200"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Admin
                </button>
              )}

              <div className="border-t border-border/40 my-1" />

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomUserDropdown;
