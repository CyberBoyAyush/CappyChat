/**
 * ModelBadge Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Displays Icons8-style badges for model features like "Premium", "Reasoning", etc.
 * Provides visual indicators for model capabilities and pricing.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ModelBadgeProps {
  type: 'premium' | 'reasoning';
  size?: number;
  className?: string;
}

// Icons8 Diamond Icon for Premium
const DiamondIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = ""
}) => (
  <img
    width={size}
    height={size}
    src="https://img.icons8.com/ios/50/diamond.png"
    alt="premium"
    className={className}
    style={{
      filter: 'brightness(0) saturate(100%) invert(47%) sepia(69%) saturate(959%) hue-rotate(334deg) brightness(103%) contrast(97%)'
    }} // Convert to orange #f76f52
  />
);

// Icons8 Brain Icon for Reasoning
const BrainIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = ""
}) => (
  <img
    width={size}
    height={size}
    src="https://img.icons8.com/ios/50/brain--v1.png"
    alt="reasoning"
    className={className}
    style={{
      filter: 'brightness(0) saturate(100%) invert(47%) sepia(69%) saturate(959%) hue-rotate(334deg) brightness(103%) contrast(97%)'
    }} // Convert to orange #f76f52
  />
);

export function ModelBadge({ type, size = 16, className }: ModelBadgeProps) {
  const badgeConfig = {
    premium: {
      icon: DiamondIcon,
      title: 'Premium Model',
    },
    reasoning: {
      icon: BrainIcon,
      title: 'Reasoning Capable',
    },
  };

  const config = badgeConfig[type];
  const IconComponent = config.icon;

  return (
    <span
      className={cn('inline-flex items-center', className)}
      title={config.title}
    >
      <IconComponent size={size} />
    </span>
  );
}
