import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Star,
  Sparkles,
  Globe,
  CreditCard,
  UserCheck,
  MessageSquare,
  Search,
  Palette,
  Mic,
  Key,
  GitBranch,
  Link as LinkIcon,
  Unlock,
  ImageIcon,
  Crop,
  Trash2,
  Loader2,
  Zap,
  Gauge,
  Crown,
  Users,
  Settings,
  Shield,
  BookOpen,
  ChevronDown,
  List,
  Image,
  Info,
  Monitor,
  FolderOpen,
  Brain,
  TreePine,
  RefreshCw,
  LogOut,
  Loader,
  Upload,
  Cpu,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import ThemeToggleButton from "../components/ui/ThemeComponents";
import { CHANGELOG, CURRENT_VERSION } from "../../lib/version";

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Globe,
  CreditCard,
  UserCheck,
  MessageSquare,
  Search,
  Palette,
  Mic,
  Key,
  GitBranch,
  Link: LinkIcon,
  Unlock,
  ImageIcon,
  Crop,
  Trash2,
  Loader2,
  Zap,
  Gauge,
  Crown,
  Users,
  Settings,
  Shield,
  BookOpen,
  ChevronDown,
  List,
  Image,
  Info,
  Monitor,
  FolderOpen,
  Brain,
  TreePine,
  RefreshCw,
  LogOut,
  Loader,
  Upload,
  Cpu,
  UserX,
};

const typeLabels = {
  new: "New",
  improvement: "Improvement",
  fix: "Fix",
  security: "Security",
} as const;

const typeBadgeVariant = {
  new: "default",
  improvement: "secondary",
  fix: "destructive",
  security: "outline",
} as const;

type Feature = (typeof CHANGELOG)[number]["features"][number];

const getFeatureIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] ?? Star;
};

export default function ChangelogPage() {
  const navigate = useNavigate();
  const latestEntry = CHANGELOG.find((entry) => entry.isLatest) ?? CHANGELOG[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <main className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <header
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 px-6 py-10 shadow-sm sm:px-10"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="relative space-y-5">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              Release Notes
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              CappyChat Changelog
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Discover what&apos;s new, improved, and fixed across every release
              of CappyChat. Our changelog keeps you aligned with the latest
              updates and enhancements.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/60 px-3 py-1">
                <Star className="h-3.5 w-3.5" />
                Current version {CURRENT_VERSION}
              </div>
              {latestEntry && (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/60 px-3 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Updated {formatDate(latestEntry.date)}
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="mt-12 space-y-10">
          {CHANGELOG.map((entry) => {
            const formattedDate = formatDate(entry.date);

            return (
              <article
                key={entry.version}
                className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/90 px-6 py-8 shadow-sm transition-all duration-200 hover:border-border hover:shadow-lg sm:px-10"
              >
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {entry.isLatest && (
                      <Badge className="gap-1 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        Latest release
                      </Badge>
                    )}
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      Version {entry.version}
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </div>
                </div>

                <div className="relative mt-6 grid gap-4 md:grid-cols-2">
                  {entry.features.map((feature, featureIndex) => {
                    const FeatureIcon = getFeatureIcon(feature.icon);
                    const featureType = feature.type as Feature["type"];
                    const badgeVariant =
                      typeBadgeVariant[featureType] ?? "secondary";

                    return (
                      <div
                        key={`${entry.version}-${featureIndex}`}
                        className="group flex h-full items-start gap-4 rounded-xl border border-border/50 bg-secondary/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-secondary/60 hover:shadow-md"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground transition-colors duration-200 group-hover:border-border group-hover:text-primary">
                          <FeatureIcon className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={badgeVariant}
                              className="px-2.5 py-0.5 text-[11px] uppercase tracking-wide"
                            >
                              {typeLabels[featureType] ?? feature.type}
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold text-foreground">
                            {feature.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        <footer className="mt-16 border-t border-border/60 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Have suggestions for new features?{" "}
            <Link
              to="mailto:hi@aysh.me"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Email us
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
