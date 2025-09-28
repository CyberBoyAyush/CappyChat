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

| Prop         | Type                                                                                                | Default | Description                             |
| ------------ | --------------------------------------------------------------------------------------------------- | ------- | --------------------------------------- |
| `size`       | `"text-xs" \| "text-sm" \| "text-md" \| "text-lg" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | `"2xl"` | Controls the size of the icon           |
| `animated`   | `boolean`                                                                                           | `true`  | Whether to show walking animation       |
| `showLoader` | `boolean`                                                                                           | `false` | Whether to show the walking line loader |
| `className`  | `string`                                                                                            | `""`    | Additional CSS classes                  |

## Size Reference

The component automatically adjusts its height based on whether the loader is shown. Heights shown as `with loader / without loader`. **Note**: Heights have been optimized to eliminate excessive bottom spacing.

### Available Sizes

- **text-xs** (~15 × 14px): Fits inside `text-xs` copy for inline flair
- **text-sm** (~19 × 18px): Ideal for status pills or tiny loaders
- **text-md** (~24 × 22px): Pairs with body text (Tailwind `text-base`/`text-md`)
- **text-lg** (~30 × 28px): Works with `text-lg` headlines or chat typing rows
- **xs** (~42 × 39px): Micro badges or compact component headers
- **sm** (~67 × 62px): Navigation, avatar badges, or small cards
- **md** (~96 × 88px): Cards, tooltips, or empty states
- **lg** (~134 × 123px): Default size for most layouts
- **xl** (~163 × 149px): Prominent headings or spotlight sections
- **2xl** (192 × 176px): Base artwork used across the app; ideal for welcome screens

## Examples

### Inline Text Icon

```tsx
<span className="flex items-center gap-1">
  Welcome to <CapybaraIcon size="text-sm" animated={false} /> CappyChat!
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
<CapybaraIcon size="text-md" animated showLoader className="inline-flex" />
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
  <CapybaraIcon size="2xl" animated={true} showLoader={true} className="mb-6" />
  <h1>Welcome to CappyChat!</h1>
</div>
```

### Hero Section

```tsx
<section className="hero">
  <CapybaraIcon
    size="2xl"
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
    size="2xl"
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

- Sizes scale proportionally from the base 2xl illustration so spacing stays consistent
- `flex-shrink-0` ensures the icon maintains its footprint in flex layouts
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
