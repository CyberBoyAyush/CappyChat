import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Star,
  Zap,
  Shield,
  Search,
  Key,
  Settings,
  Users,
  Database,
  ImageIcon,
  Crop,
  Trash2,
  Loader2,
  Gauge,
  Crown,
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
  UserX
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { CHANGELOG, CURRENT_VERSION } from '../../lib/version';

// Icon mapping for dynamic rendering
const iconMap = {
  ImageIcon, Crop, Trash2, Loader2, Gauge, Crown, BookOpen, ChevronDown, List, Image,
  Info, Monitor, FolderOpen, Brain, TreePine, RefreshCw, LogOut, Loader, Upload, Cpu, UserX,
  Zap, Shield, Search, Key, Settings, Users, Database
};

// Color mapping for feature types
const colorMap = {
  purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
  blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  red: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
  orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
  green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
  gray: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
};

const textColorMap = {
  purple: 'text-purple-800 dark:text-purple-200',
  blue: 'text-blue-800 dark:text-blue-200',
  red: 'text-red-800 dark:text-red-200',
  orange: 'text-orange-800 dark:text-orange-200',
  yellow: 'text-yellow-800 dark:text-yellow-200',
  green: 'text-green-800 dark:text-green-200',
  gray: 'text-gray-800 dark:text-gray-200'
};

const descriptionColorMap = {
  purple: 'text-purple-700 dark:text-purple-300',
  blue: 'text-blue-700 dark:text-blue-300',
  red: 'text-red-700 dark:text-red-300',
  orange: 'text-orange-700 dark:text-orange-300',
  yellow: 'text-yellow-700 dark:text-yellow-300',
  green: 'text-green-700 dark:text-green-300',
  gray: 'text-gray-700 dark:text-gray-300'
};

export default function ChangelogPage() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Changelog</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Current Version: v{CURRENT_VERSION}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">AVChat Changelog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with the latest features, improvements, and fixes in AVChat.
            </p>
          </div>

          {/* Changelog Entries */}
          <div className="space-y-12">
            {CHANGELOG.map((entry, index) => {

              return (
                <div key={entry.version} className={`relative ${index > 0 ? 'border-l-2 border-muted pl-6' : ''}`}>
                  <div className="flex items-center gap-3 mb-6">
                    {entry.isLatest && (
                      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        <Star className="h-4 w-4" />
                        Latest
                      </div>
                    )}
                    <h2 className="text-2xl font-bold">Version {entry.version}</h2>
                    <span className="text-muted-foreground">{formatDate(entry.date)}</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {entry.features.map((feature, featureIndex) => {
                      const FeatureIcon = iconMap[feature.icon as keyof typeof iconMap] || Star;
                      const colorClasses = colorMap[feature.color as keyof typeof colorMap] || colorMap.gray;
                      const textColor = textColorMap[feature.color as keyof typeof textColorMap] || textColorMap.gray;
                      const descriptionColor = descriptionColorMap[feature.color as keyof typeof descriptionColorMap] || descriptionColorMap.gray;

                      return (
                        <div key={featureIndex} className={`flex items-start gap-3 p-4 rounded-lg border ${colorClasses}`}>
                          <FeatureIcon className="h-5 w-5 mt-0.5" />
                          <div>
                            <h3 className={`font-semibold ${textColor}`}>{feature.title}</h3>
                            <p className={`text-sm mt-1 ${descriptionColor}`}>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>


          {/* Footer */}
          <div className="text-center pt-8 border-t">
            <p className="text-muted-foreground">
              Have suggestions for new features? <Link to="/settings?section=contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
