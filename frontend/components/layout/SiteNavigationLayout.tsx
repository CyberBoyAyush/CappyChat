/**
 * SiteNavigationLayout
 *
 * Provides a shared marketing/settings layout with a responsive top navigation bar.
 * Includes back navigation, brand, primary links, resources dropdown, theme toggle, and user menu.
 */

"use client";

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Menu,
} from "lucide-react";
import { CapybaraIcon } from "@/frontend/components/ui/CapybaraIcon";
import { Button } from "@/frontend/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import CustomUserDropdown from "@/frontend/components/layout/CustomUserDropdown";
import { cn } from "@/lib/utils";

interface ResourceLink {
  label: string;
  href: string;
  external?: boolean;
}

const resourceLinks: ResourceLink[] = [
  { label: "Changelog", href: "/changelog" },
  {
    label: "GitHub",
    href: "https://github.com/CyberBoyAyush/CappyChat",
    external: true,
  },
  { label: "Status", href: "https://status.cappychat.com", external: true },
];

const contributeHref = "https://github.com/CyberBoyAyush/CappyChat";

const SiteNavigationLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileResourcesExpanded, setMobileResourcesExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [supportsHover, setSupportsHover] = useState(false);
  const isShareView = location.pathname.startsWith("/share");

  // Determine if the current route should highlight the Resources tab
  const isResourcesActive = useMemo(() => {
    return resourceLinks.some(
      (link) => !link.external && location.pathname.startsWith(link.href)
    );
  }, [location.pathname]);

  const handleBackHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Detect hover-capable devices for dual interaction behaviour
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

  // Close dropdown on outside interaction
  useEffect(() => {
    if (!resourcesOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setResourcesOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [resourcesOpen]);

  // Close dropdown and mobile menu whenever the route changes
  useEffect(() => {
    setResourcesOpen(false);
    setMobileMenuOpen(false);
    setMobileResourcesExpanded(false);
  }, [location.pathname]);

  const handleResourcesToggle = useCallback(() => {
    setResourcesOpen((prev) => !prev);
  }, []);

  const handleMobileResourcesToggle = useCallback(() => {
    setMobileResourcesExpanded((prev) => !prev);
  }, []);

  const handleResourcesMouseEnter = useCallback(() => {
    if (supportsHover) {
      setResourcesOpen(true);
    }
  }, [supportsHover]);

  const handleResourcesMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (supportsHover) {
        // Add a longer delay to allow smooth transition to dropdown content
        setTimeout(() => {
          const relatedTarget = event.relatedTarget as Element;
          if (
            dropdownRef.current &&
            !dropdownRef.current.contains(relatedTarget) &&
            dropdownTriggerRef.current &&
            !dropdownTriggerRef.current.contains(relatedTarget)
          ) {
            setResourcesOpen(false);
          }
        }, 100);
      }
    },
    [supportsHover]
  );

  const handleResourcesBlur = useCallback(() => {
    // Delay to allow focus to move inside the dropdown
    window.setTimeout(() => {
      if (!dropdownRef.current) return;
      const activeElement = document.activeElement;
      if (activeElement && dropdownRef.current.contains(activeElement)) return;
      setResourcesOpen(false);
    }, 0);
  }, []);

  const handleResourcesKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setResourcesOpen(false);
      dropdownTriggerRef.current?.focus();
    }
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative",
      isActive
        ? "bg-primary/10 text-primary shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:shadow-sm"
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isShareView && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
          <div className="mx-auto flex px-2.5 w-full max-w-7xl items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Button
                aria-label="Go to home"
                variant="ghost"
                size="icon"
                onClick={handleBackHome}
                className="h-10 w-10 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/50 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link
                to="/"
                className="text-xl font-bold tracking-tight md:text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
              >
                CappyChat
              </Link>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleResourcesMouseEnter}
                onMouseLeave={handleResourcesMouseLeave}
                onKeyDown={handleResourcesKeyDown}
              >
                <button
                  ref={dropdownTriggerRef}
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative",
                    resourcesOpen || isResourcesActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:shadow-sm"
                  )}
                  aria-haspopup="menu"
                  aria-expanded={resourcesOpen}
                  onClick={handleResourcesToggle}
                  onFocus={handleResourcesMouseEnter}
                  onBlur={handleResourcesBlur}
                >
                  Resources
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      resourcesOpen && "rotate-180"
                    )}
                  />
                </button>

                {resourcesOpen && (
                  <>
                    {/* Invisible bridge to prevent dropdown from closing */}
                    <div className="absolute left-1/2 top-full z-40 h-3 w-96 -translate-x-1/2" />
                    <div
                      role="menu"
                      aria-label="Resources"
                      className="absolute  left-1/2 top-full z-50 mt-3 w-96 -translate-x-1/2 rounded-xl border border-border/40 bg-popover/98 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden"
                    >
                      <div className="flex">
                        {/* Left side with CapybaraIcon */}
                        <div className="flex-shrink-0 w-36 bg-primary/10  p-1 flex flex-col items-center justify-center">
                          <div className="bg-background/70 flex-shrink-0 w-34 h-full flex justify-center items-center flex-col p-4 rounded-xl">
                            <CapybaraIcon
                              size="md"
                              animated={true}
                              showLoader={true}
                              className="mb-2"
                            />
                            <div className="text-left">
                              <h3 className="text-sm font-semibold text-foreground mb-1">
                                Resources
                              </h3>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Helpful links and documentation for CappyChat
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right side with links */}
                        <div className="flex-1 p-2 bg-primary/10">
                          <div className="space-y-1">
                            {resourceLinks.map((link) => {
                              const itemStyles =
                                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-background/50 group";

                              if (link.external) {
                                return (
                                  <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    role="menuitem"
                                    className={itemStyles}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-foreground">
                                        {link.label}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {link.label === "GitHub" &&
                                          "View source code and contribute"}
                                        {link.label === "Status" &&
                                          "Check system status and uptime"}
                                      </span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-80 transition-opacity" />
                                  </a>
                                );
                              }

                              const isActive = location.pathname.startsWith(
                                link.href
                              );
                              return (
                                <Link
                                  key={link.label}
                                  to={link.href}
                                  role="menuitem"
                                  className={cn(
                                    itemStyles,
                                    isActive && "bg-primary/10 text-primary"
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {link.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {link.label === "Changelog" &&
                                        "Latest updates and features"}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <NavLink to="/pricing" className={navLinkClass}>
                Pricing
              </NavLink>
              <a
                href={contributeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:shadow-sm rounded-lg transition-all duration-200 flex items-center gap-1.5"
              >
                Contribute
              </a>
            </div>

            <div className="flex items-center md:gap-2">
              <ThemeToggleButton
                variant="inline"
                className="h-10 w-10 rounded-lg border border-border/60 bg-background hover:bg-muted/60 hover:shadow-sm transition-all duration-200"
              />

              <div className="">
                <CustomUserDropdown />
              </div>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-10 w-10 rounded-full border border-transparent hover:border-border/60 hover:bg-muted/60 hover:shadow-sm transition-all duration-200"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <SheetHeader className="text-left border-b border-ring/10">
                    <SheetTitle className="text-lg font-semibold">
                      Menu
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/about"
                        className={cn(
                          " px-3 py-2 text-base font-medium transition-colors",
                          location.pathname === "/about"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        About
                      </Link>
                      <div>
                        <button
                          onClick={handleMobileResourcesToggle}
                          className="w-full flex items-center justify-between px-3 py-2 text-base font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                          Resources
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              mobileResourcesExpanded && "rotate-90"
                            )}
                          />
                        </button>
                        {mobileResourcesExpanded && (
                          <div className="flex ml-4 flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
                            {resourceLinks.map((link) => {
                              const baseClasses =
                                "flex items-center justify-between  px-3 py-2 text-sm transition-colors";
                              if (link.external) {
                                return (
                                  <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${baseClasses} text-muted-foreground hover:text-foreground hover:bg-muted/50`}
                                  >
                                    {link.label}
                                    <ExternalLink className="h-4 w-4 opacity-70" />
                                  </a>
                                );
                              }

                              const active = location.pathname.startsWith(
                                link.href
                              );
                              return (
                                <Link
                                  key={link.label}
                                  to={link.href}
                                  className={cn(
                                    baseClasses,
                                    active
                                      ? "bg-muted text-foreground"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  )}
                                >
                                  {link.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <Link
                        to="/pricing"
                        className={cn(
                          " px-3 py-2 text-base font-medium transition-colors",
                          location.pathname === "/pricing"
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        Pricing
                      </Link>
                      <a
                        href={contributeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2  px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        Contribute
                        <ExternalLink className="h-4 w-4 opacity-70" />
                      </a>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1", !isShareView && "pt-20")}>
        <Outlet />
      </main>
    </div>
  );
};

export default SiteNavigationLayout;
