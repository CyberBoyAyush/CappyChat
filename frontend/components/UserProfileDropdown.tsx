/**
 * User Profile Dropdown Component
 *
 * Displays user information and provides access to profile actions like logout.
 * Shows user avatar, name, email, and account management options.
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/frontend/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Button } from "@/frontend/components/ui/button";
import {
  User,
  Settings,
  LogOut,
  Shield,
  Database,
  ChevronDown,
  LogIn,
  UserPlus,
  Sparkles,
  Github,
  Info,
  Calendar,
  Activity,
  Crown,
  Coins,
} from "lucide-react";
import { getUserTierInfo, type TierType } from "@/lib/tierSystem";
import AuthDialog from "./auth/AuthDialog";
import { useAuthDialog } from "@/frontend/hooks/useAuthDialog";
import { cn } from "@/lib/utils";
import { FaMoneyBill1 } from "react-icons/fa6";

// Type for tier information
interface TierInfo {
  tier: TierType;
  freeCredits: number;
  premiumCredits: number;
  superPremiumCredits: number;
  lastResetDate?: string;
}

// Memoized tier badge component
const TierBadge = memo(
  ({ tier, className }: { tier: TierType; className?: string }) => {
    const badgeConfig = useMemo(() => {
      switch (tier) {
        case "premium":
          return {
            label: "PRO",
            icon: Crown,
            className:
              "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-purple-500/25",
          };
        case "admin":
          return {
            label: "ADMIN",
            icon: Shield,
            className:
              "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-zinc-500/25",
          };
        default:
          return null;
      }
    }, [tier]);

    if (!badgeConfig) return null;

    const IconComponent = badgeConfig.icon;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-200 hover:scale-105",
          badgeConfig.className,
          className
        )}
      >
        <IconComponent className="h-3 w-3" />
        {badgeConfig.label}
      </span>
    );
  }
);
TierBadge.displayName = "TierBadge";

const UserProfileDropdown: React.FC = () => {
  const { user, logout, isGuest, guestUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [isLoadingTier, setIsLoadingTier] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const authDialog = useAuthDialog();

  // Don't render on authentication pages
  const isAuthPage = location.pathname.startsWith("/auth/");

  // Load tier information immediately when user is available
  useEffect(() => {
    const loadTierInfo = async () => {
      if (!user || isLoadingTier || isAuthPage) return;

      setIsLoadingTier(true);
      try {
        const info = await getUserTierInfo();
        setTierInfo(info);
      } catch (error) {
        console.error("Error loading tier info:", error);
        // Set default tier info on error
        setTierInfo({
          tier: "free",
          freeCredits: 0,
          premiumCredits: 0,
          superPremiumCredits: 0,
        });
      } finally {
        setIsLoadingTier(false);
      }
    };

    // Load immediately when user changes
    if (user && !isAuthPage) {
      loadTierInfo();
    } else {
      setTierInfo(null);
    }
  }, [user, isAuthPage]);

  // Memoized logout handler
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

  // Memoized settings handler
  const handleSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  // Memoized user initials calculation - moved before conditional returns
  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  // Memoized avatar component - moved before conditional returns
  const UserAvatar = useMemo(
    () => (
      <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium shadow-md transition-transform hover:scale-105">
        {userInitials}
      </div>
    ),
    [userInitials]
  );

  if (isAuthPage) return null;

  // Show guest user interface if not authenticated
  if (!user && isGuest) {
    return (
      <>
        <div className="flex gap-2 p-2">
          <Button
            onClick={() => authDialog.navigateToLogin()}
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-sm"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign in
          </Button>
          <Button
            onClick={() => authDialog.navigateToSignup()}
            variant="default"
            size="sm"
            className="flex-1 h-9 text-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign up
          </Button>
        </div>

        {/* Guest status indicator */}
        <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
          {guestUser && (
            <span>
              {guestUser.messagesUsed}/{guestUser.maxMessages} free messages
              used
            </span>
          )}
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
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center justify-around gap-2 px-2 py-1.5 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 rounded-lg"
        >
          {/* User Info */}
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1.5">
              {/* User Avatar */}
              {UserAvatar}
              <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                {displayName}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 ">
            {/* Tier Badge */}
            {tierInfo && tierInfo.tier !== "free" && (
              <TierBadge tier={tierInfo.tier} />
            )}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform duration-300 ease-in-out",
                isDropdownOpen && "rotate-180"
              )}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-60 p-1.5 bg-card/95 backdrop-blur-xl border-border shadow-2xl"
        sideOffset={5}
      >
        {/* User Header with enhanced styling */}
        <DropdownMenuLabel className="px-3 py-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-md mb-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-semibold shadow-lg transition-transform hover:scale-105">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">
                  {displayName}
                </span>
                {tierInfo && tierInfo.tier !== "free" && (
                  <TierBadge tier={tierInfo.tier} />
                )}
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {displayEmail}
              </span>
              {/* Credits display for non-admin users */}
              {tierInfo && tierInfo.tier !== "admin" && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Credits:
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {tierInfo.freeCredits +
                      tierInfo.premiumCredits +
                      tierInfo.superPremiumCredits}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        {/* User Actions with grouped sections */}
        <div className="px-1 py-1">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Account
          </div>
          <DropdownMenuItem
            onClick={() => navigate("/settings#profile")}
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-foreground hover:bg-muted/50 transition-colors"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings#storage")}
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-foreground hover:bg-muted/50 transition-colors"
          >
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Storage</span>
          </DropdownMenuItem>
        </div>

        {/* Admin Panel - Only show for admin users */}
        {tierInfo?.tier === "admin" && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <div className="px-1 py-1">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Administration
              </div>
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 hover:from-zinc-200 hover:to-zinc-300 dark:hover:from-zinc-700 dark:hover:to-zinc-600 transition-all"
              >
                <Shield className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Admin Panel
                </span>
              </DropdownMenuItem>
            </div>
          </>
        )}

        <DropdownMenuSeparator className="my-1" />

        {/* Resources section */}
        <div className="px-1 py-1">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Resources
          </div>

          <DropdownMenuItem
            onClick={() => navigate("/about")}
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-foreground hover:bg-muted/50 transition-colors"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">About</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-foreground hover:bg-muted/50 transition-colors"
          >
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Pricing</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              window.open("https://status.cappychat.com", "_blank")
            }
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-foreground hover:bg-muted/50 transition-colors"
          >
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Status</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Settings and Logout */}
        <div className="px-1 py-1">
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
