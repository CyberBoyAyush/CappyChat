/**
 * AboutPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/about" route)
 * Purpose: Displays information about AVChat, the team, tech stack, and contribution options.
 * Shows team member profiles, social links, and technology stack used in the project.
 */

import React from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/BasicComponents";
import { GitHubIcon, XIcon } from "@/frontend/components/ui/icons";

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
  icon: React.ReactNode;
  technologies: Array<{
    name: string;
    description: string;
    version?: string;
  }>;
  color: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Ayush Sharma",
    role: "Co-Founder & Full Stack Developer",
    description:
      "Full-stack developer passionate about AI and creating seamless user experiences. Loves building fast, scalable applications.",
    photo:
      "https://media.licdn.com/dms/image/v2/D4D03AQHrimd9wDhXTQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1700307125570?e=1756339200&v=beta&t=kEc5XgGLCVSG09u7s8FyeCstvmaMqhXSnKu4RQJQS0I",
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
    twitter: "vranda_garg_",
  },
];

const techStack: TechStackItem[] = [
  {
    category: "Frontend Framework",
    description: "Modern React-based frontend with cutting-edge features",
    icon: <Monitor className="h-5 w-5" />,
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
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    category: "Backend & Database",
    description: "Scalable backend with real-time capabilities",
    icon: <Database className="h-5 w-5" />,
    technologies: [
      { name: "Appwrite", description: "Open-source backend-as-a-service" },
      { name: "IndexedDB", description: "Client-side database via Dexie.js" },
      { name: "Node.js", description: "JavaScript runtime environment" },
      { name: "Real-time Sync", description: "Live data synchronization" },
    ],
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    category: "AI & Machine Learning",
    description: "Multiple AI providers for diverse capabilities",
    icon: <Brain className="h-5 w-5" />,
    technologies: [
      { name: "OpenRouter", description: "Multi-model AI API gateway" },
      { name: "OpenAI", description: "GPT models and Whisper STT" },
      { name: "Runware", description: "High-performance image generation" },
      { name: "Cloudinary", description: "Media management and optimization" },
    ],
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    category: "Performance & DevOps",
    description: "Optimized for speed and developer experience",
    icon: <Zap className="h-5 w-5" />,
    technologies: [
      { name: "Zustand", description: "Lightweight state management" },
      { name: "SWR", description: "Data fetching with caching" },
      { name: "Turbopack", description: "Fast Rust-based bundler" },
      { name: "Vercel", description: "Edge deployment platform" },
    ],
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    category: "UI & Design System",
    description: "Beautiful, accessible, and responsive design",
    icon: <Palette className="h-5 w-5" />,
    technologies: [
      { name: "Shadcn/ui", description: "Modern component library" },
      { name: "Radix UI", description: "Accessible primitive components" },
      { name: "Lucide React", description: "Beautiful icon library" },
      { name: "Next Themes", description: "Dark/light mode support" },
    ],
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    category: "Development Tools",
    description: "Modern toolchain for efficient development",
    icon: <Code className="h-5 w-5" />,
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
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
];

export default function AboutPage() {
  const handleContribute = () => {
    window.open("https://github.com/cyberboyayush/AVChat", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 " />
                <span className="hidden md:block">Back to AVChat</span>
              </Button>
            </Link>
            <Button
              onClick={handleContribute}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80"
            >
              <Heart className="h-4 w-4" />
              Contribute to AVChat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              About AVChat
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The fastest AI chat application built with cutting-edge technology
              and a passion for exceptional user experiences.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Lightning Fast
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Brain className="h-3 w-3 mr-1" />
              Multiple AI Models
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Code className="h-3 w-3 mr-1" />
              Open Source
            </Badge>
          </div>
        </div>

        {/* Team Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground">
              The passionate individuals behind AVChat
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/40 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {member.name}
                      </h3>
                      <p className="text-primary font-medium">{member.role}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {member.description}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://github.com/${member.github}`,
                            "_blank"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <GitHubIcon className="h-4 w-4" />
                        GitHub
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://twitter.com/${member.twitter}`,
                            "_blank"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <XIcon className="h-4 w-4" />
                        Twitter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Tech Stack</h2>
            <p className="text-muted-foreground">
              The powerful technologies that make AVChat possible
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((stack, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className={`p-2 rounded-lg ${stack.color}`}>
                      {stack.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{stack.category}</div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    {stack.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {stack.technologies.map((tech, techIndex) => (
                      <div key={techIndex} className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {tech.name}
                          </span>
                          {tech.version && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              v{tech.version}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tech.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contribution Section */}
        <section className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Join Our Mission
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AVChat is open source and we welcome contributions from developers
              around the world. Help us make AI chat faster, better, and more
              accessible for everyone.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleContribute}
              size="lg"
              className="flex items-center gap-2 bg-primary hover:bg-primary/80"
            >
              <GitHubIcon className="h-5 w-5" />
              Contribute on GitHub
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                window.open(
                  "https://github.com/cyberboyayush/AVChat/issues",
                  "_blank"
                )
              }
              className="flex items-center gap-2"
            >
              <Code className="h-5 w-5" />
              Report Issues
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
