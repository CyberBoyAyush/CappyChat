/**
 * Privacy & Security Page
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/privacy" route)
 * Purpose: Provides users with information about data privacy practices and security measures.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/frontend/components/ui/button";
import { ThemeToggleButton } from "@/frontend/components/ui/ThemeComponents";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Server,
  FileCheck,
  Users,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background w-full justify-center align-middle flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className=" w-full px-4 sm:px-6 lg:px-14 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={"/chat"}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Privacy & Security</h1>
            </div>
          </div>
          <ThemeToggleButton variant="inline" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="container max-w-4xl py-8 px-4 sm:px-6 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <div className="relative rounded-lg overflow-hidden bg-card p-6 sm:p-8 border border-border">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10 z-0"></div>
              <div className="relative z-10">
                <div className="p-2 w-fit rounded-full bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Privacy & Security at AtChat
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  We're committed to protecting your data with industry-leading
                  security measures and transparent privacy practices.
                </p>
              </div>
            </div>

            {/* Key Principles */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Our Privacy Principles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PrivacyCard
                  icon={<Lock />}
                  title="End-to-End Encryption"
                  description="Your conversations are encrypted in transit and at rest. We implement TLS 1.3 to protect data in transit."
                />
                <PrivacyCard
                  icon={<Eye />}
                  title="Data Transparency"
                  description="We clearly explain what data we collect, how we use it, and the control you have over your information."
                />
                <PrivacyCard
                  icon={<Database />}
                  title="Minimal Data Collection"
                  description="We only collect information necessary to provide and improve our services."
                />
                <PrivacyCard
                  icon={<Trash2 />}
                  title="Data Deletion Controls"
                  description="You can delete your conversation history and account data at any time."
                />
              </div>
            </section>

            {/* Data Practices */}
            <section className="space-y-6">
              <h3 className="text-xl font-semibold">How We Handle Your Data</h3>

              <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <h4 className="font-medium text-lg mb-4">
                  Information We Collect
                </h4>
                <ul className="space-y-2 text-sm sm:text-base">
                  <InfoListItem>
                    <span className="font-medium">Account information:</span>{" "}
                    Email address and authentication details for account
                    management
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Conversation history:</span>{" "}
                    The messages you exchange with our AI models
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Usage information:</span> How
                    you interact with our service to improve features
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Technical data:</span> Device
                    information and diagnostic data to ensure proper
                    functionality
                  </InfoListItem>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <h4 className="font-medium text-lg mb-4">
                  How We Use Your Information
                </h4>
                <ul className="space-y-2 text-sm sm:text-base">
                  <InfoListItem>
                    <span className="font-medium">Provide our services:</span>{" "}
                    Process your requests and deliver AI-powered responses
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Improve our models:</span>{" "}
                    Train and fine-tune AI models to improve response quality
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">
                      Enhance user experience:
                    </span>{" "}
                    Analyze usage patterns to improve features and interface
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Security:</span> Monitor and
                    prevent potential security threats or abuse
                  </InfoListItem>
                </ul>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                <h4 className="font-medium text-lg mb-4">Your Data Rights</h4>
                <ul className="space-y-2 text-sm sm:text-base">
                  <InfoListItem>
                    <span className="font-medium">Access:</span> Request a copy
                    of your personal data
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Correction:</span> Update or
                    correct your personal information
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Deletion:</span> Request
                    deletion of your data and conversation history
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Portability:</span> Export
                    your data in a machine-readable format
                  </InfoListItem>
                  <InfoListItem>
                    <span className="font-medium">Opt-out:</span> Control how
                    your data is used for improvement and training
                  </InfoListItem>
                </ul>
              </div>
            </section>

            {/* Security Measures */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Security Measures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PrivacyCard
                  icon={<Server />}
                  title="Secure Infrastructure"
                  description="Our systems run on industry-leading cloud providers with rigorous security controls and monitoring."
                />
                <PrivacyCard
                  icon={<FileCheck />}
                  title="Regular Audits"
                  description="We conduct regular security assessments and vulnerability testing to ensure system integrity."
                />
                <PrivacyCard
                  icon={<Users />}
                  title="Access Controls"
                  description="Strict internal access controls limit who can access user data, with comprehensive audit logging."
                />
                <PrivacyCard
                  icon={<Shield />}
                  title="Compliance"
                  description="Our practices comply with relevant regulations including GDPR, CCPA, and industry standards."
                />
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-card border border-border rounded-lg p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    Have questions about your data?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Our team is ready to assist with any privacy or security
                    concerns
                  </p>
                </div>
                <Button className="shrink-0">Contact Support</Button>
              </div>
            </section>

            {/* Last updated info */}
            <div className="text-sm text-muted-foreground border-t border-border pt-4 mt-8">
              <p>Privacy Policy Last Updated: June 13, 2025</p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full flex justify-center border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
        <div className="container max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AtChat Logo" className="h-5 w-5" />
            <span>© 2025 AtChat. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              to="/profile"
              className="hover:text-primary transition-colors"
            >
              Profile
            </Link>
            <Link to="/privacy" className="text-primary font-medium">
              Privacy
            </Link>
            <Link
              to="/settings"
              className="hover:text-primary transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components
const PrivacyCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/20 transition-colors">
      <div className="flex gap-3">
        <div className="text-primary shrink-0 mt-0.5">{icon}</div>
        <div>
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

const InfoListItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="flex gap-2 items-baseline">
      <div className="w-1 h-1 rounded-full bg-primary shrink-0 mt-2"></div>
      <span className="text-foreground">{children}</span>
    </li>
  );
};
