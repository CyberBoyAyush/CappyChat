/**
 * AboutPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx ("/about" route)
 * Purpose: Showcases product vision, team, technology stack, and contribution paths.
 * Styling conforms to theme tokens defined in app/globals.css so every theme looks cohesive.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Code,
  Zap,
  Database,
  Palette,
  Brain,
  Monitor,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/BasicComponents";
import ThemeToggleButton from "@/frontend/components/ui/ThemeComponents";
import { FaGithub, FaTwitter, FaXTwitter } from "react-icons/fa6";

interface TeamMember {
  name: string;
  role: string;
  description: string;
  photo: string;
  github: string;
  twitter: string;
}

interface TechStackItem {
  category: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  technologies: Array<{
    name: string;
    description: string;
    version?: string;
  }>;
}

const highlights: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Lightning Fast", icon: Zap },
  { label: "Multiple AI Models", icon: Brain },
  { label: "Open Source", icon: Code },
];

const teamMembers: TeamMember[] = [
  {
    name: "Ayush Sharma",
    role: "Co-Founder & Full Stack Developer",
    description:
      "Full-stack developer passionate about AI and creating seamless user experiences. Loves building fast, scalable applications.",
    photo: "https://avatars.githubusercontent.com/u/69210117?v=4",
    github: "cyberboyayush",
    twitter: "cyberboyayush",
  },
  {
    name: "Vranda Garg",
    role: "Co-Founder & Frontend Developer",
    description:
      "Frontend developer with a focus on creating beautiful and intuitive interfaces. Loves making complex things simple.",
    photo: "https://avatars.githubusercontent.com/u/166229165?v=4",
    github: "vrandaagarg",
    twitter: "vrandaagarg",
  },
];

const techStack: TechStackItem[] = [
  {
    category: "Frontend Framework",
    description: "Modern React-based frontend with cutting-edge features",
    icon: Monitor,
    accent: "--chart-1",
    technologies: [
      {
        name: "Next.js",
        description: "Full-stack React framework",
        version: "15.3",
      },
      {
        name: "React",
        description: "UI library with concurrent features",
        version: "19",
      },
      { name: "TypeScript", description: "Type-safe JavaScript development" },
      { name: "TailwindCSS", description: "Utility-first CSS framework" },
      { name: "Framer Motion", description: "Production-ready motion library" },
    ],
  },
  {
    category: "Backend & Database",
    description: "Scalable backend with real-time capabilities",
    icon: Database,
    accent: "--chart-2",
    technologies: [
      { name: "Appwrite", description: "Open-source backend-as-a-service" },
      { name: "IndexedDB", description: "Client-side database via Dexie.js" },
      { name: "Node.js", description: "JavaScript runtime environment" },
      { name: "Real-time Sync", description: "Live data synchronization" },
    ],
  },
  {
    category: "AI & Machine Learning",
    description: "Multiple AI providers for diverse capabilities",
    icon: Brain,
    accent: "--chart-3",
    technologies: [
      { name: "OpenRouter", description: "Multi-model AI API gateway & image generation" },
      { name: "OpenAI", description: "GPT models and Whisper STT" },
      { name: "Cloudinary", description: "Media management and optimization" },
    ],
  },
  {
    category: "Performance & DevOps",
    description: "Optimized for speed and developer experience",
    icon: Zap,
    accent: "--chart-4",
    technologies: [
      { name: "Zustand", description: "Lightweight state management" },
      { name: "SWR", description: "Data fetching with caching" },
      { name: "Turbopack", description: "Fast Rust-based bundler" },
      { name: "Vercel", description: "Edge deployment platform" },
    ],
  },
  {
    category: "UI & Design System",
    description: "Beautiful, accessible, and responsive design",
    icon: Palette,
    accent: "--chart-5",
    technologies: [
      { name: "Shadcn/ui", description: "Modern component library" },
      { name: "Radix UI", description: "Accessible primitive components" },
      { name: "Lucide React", description: "Beautiful icon library" },
      { name: "Next Themes", description: "Dark/light mode support" },
    ],
  },
  {
    category: "Development Tools",
    description: "Modern toolchain for efficient development",
    icon: Code,
    accent: "--primary",
    technologies: [
      {
        name: "pnpm",
        description: "Fast, disk space efficient package manager",
      },
      { name: "ESLint", description: "Code linting and quality assurance" },
      {
        name: "React Hook Form",
        description: "Performant forms with validation",
      },
      { name: "Zod", description: "TypeScript-first schema validation" },
    ],
  },
];

const openLink = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen pt-12 bg-background text-foreground">
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-20   sm:px-6 lg:px-8">
        <header
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 px-6 py-12 shadow-sm sm:px-12"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="relative  space-y-6 text-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              Built with passion
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              About CappyChat
            </h1>
            <p className="mx-auto max-w-3xl text-sm text-muted-foreground sm:text-base">
              CappyChat is the fastest AI chat experience we know how to
              build—crafted with a deep respect for design, speed, and the
              developer community powering it.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <Badge
                    key={item.label}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    <Icon className="mr-1 h-3.5 w-3.5" />
                    {item.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </header>

        <section className="relative mt-14 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Meet the team
            </h2>
            <p className="text-muted-foreground">
              The people shaping AVChat every single day
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {teamMembers.map((member) => {
              const teamAccent = {
                "--team-border":
                  "color-mix(in srgb, var(--primary) 22%, transparent)",
                "--team-border-hover":
                  "color-mix(in srgb, var(--primary) 32%, transparent)",
              } as React.CSSProperties;

              return (
                <Card
                  key={member.github}
                  className="group relative overflow-hidden border border-border/60 bg-card/85 shadow-sm transition-all duration-200 hover:border-border hover:shadow-lg"
                  style={teamAccent}
                >
                  <CardContent className="relative space-y-4 p-6 text-center">
                    <div className="mx-auto size-24 overflow-hidden rounded-full border-4 border-[var(--team-border)] transition-colors duration-300 group-hover:border-[var(--team-border-hover)]">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {member.name}
                      </h3>
                      <p className="text-sm font-medium text-primary">
                        {member.role}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {member.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openLink(`https://github.com/${member.github}`)
                        }
                        className="gap-2"
                      >
                        GitHub
                        <FaGithub className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openLink(`https://twitter.com/${member.twitter}`)
                        }
                        className="gap-2"
                      >
                        Twitter
                        <FaXTwitter className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="relative mt-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Tech stack
            </h2>
            <p className="text-muted-foreground">
              The tools and services that power our experience
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((stack) => {
              const Icon = stack.icon;
              const accentColor = `var(${stack.accent})`;
              const accentBackground = `color-mix(in srgb, ${accentColor} 16%, transparent)`;
              const accentBorder = `color-mix(in srgb, ${accentColor} 32%, transparent)`;

              return (
                <Card
                  key={stack.category}
                  className="relative overflow-hidden border border-border/60 bg-card/85 shadow-sm transition-all duration-200 hover:border-border hover:shadow-lg"
                >
                  <CardHeader className="relative pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-lg border p-2"
                        style={{
                          background: accentBackground,
                          borderColor: accentBorder,
                          color: accentColor,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {stack.category}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-3 text-sm text-muted-foreground">
                      {stack.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {stack.technologies.map((tech) => (
                      <div
                        key={tech.name}
                        className="rounded-lg border border-border/40 bg-secondary/50 p-3"
                      >
                        <div className="flex items-center justify-between text-sm font-medium text-foreground">
                          <span>{tech.name}</span>
                          {tech.version && (
                            <Badge
                              variant="secondary"
                              className="px-2 py-0.5 text-[11px]"
                            >
                              v{tech.version}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {tech.description}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="relative mt-16 rounded-3xl border border-border/60 bg-card/85 px-6 py-12 text-center shadow-sm sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at top, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 60%)",
            }}
          />
          <div className="relative space-y-5">
            <h2 className="text-3xl font-semibold tracking-tight">
              Join our mission
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              AVChat is open source and community-driven. Contribute code, file
              issues, or share feedback to make the experience even better for
              everyone.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() =>
                  openLink("https://github.com/cyberboyayush/CappyChat")
                }
              >
                Contribute on GitHub
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() =>
                  openLink("https://github.com/cyberboyayush/CappyChat/issues")
                }
              >
                Report an issue
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Prefer chatting?{" "}
              <Link
                to="/settings?section=contact"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Reach out to us directly.
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
