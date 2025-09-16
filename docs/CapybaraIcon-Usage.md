# CapybaraIcon Component Usage

The `CapybaraIcon` component is a reusable animated capybara icon that can be used anywhere in the application with customizable size and animation options.

## Import

```tsx
import CapybaraIcon from "@/frontend/components/ui/CapybaraIcon";
```

## Basic Usage

```tsx
// Simple capybara icon
<CapybaraIcon />

// Large animated capybara with loader
<CapybaraIcon
  size="xl"
  animated={true}
  showLoader={true}
/>

// Small static capybara icon
<CapybaraIcon
  size="sm"
  animated={false}
  showLoader={false}
/>
```

## Props

| Prop         | Type                                                                                | Default | Description                             |
| ------------ | ----------------------------------------------------------------------------------- | ------- | --------------------------------------- |
| `size`       | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl" \| "4xl" \| "5xl" \| "6xl"` | `"lg"`  | Controls the size of the icon           |
| `animated`   | `boolean`                                                                           | `true`  | Whether to show walking animation       |
| `showLoader` | `boolean`                                                                           | `false` | Whether to show the walking line loader |
| `className`  | `string`                                                                            | `""`    | Additional CSS classes                  |

## Size Reference

The component automatically adjusts its height based on whether the loader is shown. Heights shown as `with loader / without loader`. **Note**: Heights have been optimized to eliminate excessive bottom spacing.

### Tiny Sizes

- **xs**: 24px × (24px / 16px) - Ultra small for inline text, badges, or micro-interactions

### Small Sizes

- **sm**: 48px × (48px / 36px) - Perfect for buttons, navigation items, or small UI elements
- **md**: 80px × (80px / 60px) - Good for cards, tooltips, or medium components

### Standard Sizes

- **lg**: 112px × (112px / 84px) - Default size, ideal for most general uses
- **xl**: 144px × (144px / 108px) - Large size for prominent display areas

### Large Sizes

- **2xl**: 176px × (176px / 132px) - Perfect for welcome screens and feature highlights
- **3xl**: 240px × (240px / 180px) - Great for hero sections and main branding areas
- **4xl**: 320px × (320px / 240px) - Large hero sections and splash screens

### Giant Sizes

- **5xl**: 384px × (384px / 288px) - Full-screen displays and major focal points
- **6xl**: 448px × (448px / 336px) - Ultra-large displays, main landing pages

## Examples

### Inline Text Icon

```tsx
<span className="flex items-center gap-1">
  Welcome to <CapybaraIcon size="xs" animated={false} /> CapyChat!
</span>
```

### Navigation Badge

```tsx
<div className="flex items-center gap-2">
  <CapybaraIcon size="sm" animated={true} />
  <span>Live Chat</span>
</div>
```

### Loading State

```tsx
<CapybaraIcon size="md" animated={true} showLoader={true} className="mx-auto" />
```

### Button Icon

```tsx
<button className="flex items-center gap-2 px-4 py-2">
  <CapybaraIcon size="sm" animated={false} showLoader={false} />
  Start Chat
</button>
```

### Card Header

```tsx
<div className="card-header">
  <CapybaraIcon size="lg" animated={true} className="mb-2" />
  <h3>AI Assistant</h3>
</div>
```

### Welcome Screen

```tsx
<div className="text-center">
  <CapybaraIcon size="3xl" animated={true} showLoader={true} className="mb-6" />
  <h1>Welcome to CapyChat!</h1>
</div>
```

### Hero Section

```tsx
<section className="hero">
  <CapybaraIcon
    size="5xl"
    animated={true}
    showLoader={true}
    className="mx-auto mb-8"
  />
  <h1 className="text-6xl">Meet Your AI Companion</h1>
</section>
```

### Ultra Large Display

```tsx
<div className="landing-page-hero">
  <CapybaraIcon
    size="6xl"
    animated={true}
    showLoader={false}
    className="mx-auto opacity-90"
  />
  <div className="hero-content">
    <h1>The Future of AI Chat</h1>
  </div>
</div>
```

### Theme Adaptation

The component automatically adapts its colors to the current theme using CSS variables:

- `--color` (primary color)
- `--color2` (muted foreground color)

This means it will look perfect in all four themes:

- Light theme
- Dark theme
- Capybara Light theme
- Capybara Dark theme

## Responsive Design

The component includes responsive considerations:

- Very large sizes (`5xl`, `6xl`) automatically scale down on mobile devices
- `flex-shrink-0` class prevents unwanted shrinking in flex layouts
- All sizes maintain their aspect ratio across different screen sizes
- **Compact Mode**: When `showLoader={false}`, the component automatically becomes more compact (about 20% shorter)

## Performance Tips

- Use `animated={false}` for static displays to reduce CPU usage
- Smaller sizes (`xs`, `sm`) render faster than larger ones
- Use `showLoader={false}` to create more compact displays with better text spacing
- The component automatically optimizes its height based on whether the loader is needed

## Animations

The component includes several CSS animations:

- **movebody**: Subtle horizontal movement for body and head
- **moveleg**: Walking motion for main legs
- **moveleg2**: Alternating walking motion for smaller legs
- **moveline**: Moving dashed line for the loader

All animations can be disabled by setting `animated={false}`.
