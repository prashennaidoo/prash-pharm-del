# Theme System Guide

This guide explains how to use the centralized theme system in the PharmaDelivery app. The theme system provides a consistent way to manage colors, typography, spacing, and other design tokens throughout the application.

## Overview

The theme system is centralized in `constants/theme.ts` and accessed via the `useTheme()` hook. This ensures consistency across the entire application and makes it easy to update the design system from a single location.

## Quick Start

### 1. Import the `useTheme` hook

```tsx
import { useTheme } from '@/hooks/use-theme';
```

### 2. Use the theme in your component

```tsx
export default function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ 
        color: theme.colors.text,
        fontSize: theme.typography.h3.fontSize,
        fontFamily: theme.typography.h3.fontFamily
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

## Theme Structure

The theme object provides access to:

- **`colors`** - Color palette (automatically switches between light/dark mode)
- **`typography`** - Font sizes, line heights, and font families
- **`spacing`** - Consistent spacing values
- **`borderRadius`** - Border radius values
- **`iconSizes`** - Standard icon sizes
- **`opacity`** - Opacity values for overlays and effects
- **`shadows`** - Platform-specific shadow styles
- **`fonts`** - Font family names

## Colors

Colors automatically adapt to light/dark mode based on the user's system preference.

### Basic Colors

```tsx
theme.colors.text              // Primary text color
theme.colors.textSecondary     // Secondary text color
theme.colors.textTertiary       // Tertiary text color
theme.colors.background         // Background color
theme.colors.cardBackground     // Card background
theme.colors.primary            // Primary brand color
theme.colors.secondary          // Secondary brand color
theme.colors.accent             // Accent color
```

### Status Colors

Status colors are available for delivery statuses and semantic states:

```tsx
// Get status colors
theme.getStatusColor('pending')      // Returns pending background color
theme.getStatusColor('picked_up')    // Returns picked up background color
theme.getStatusColor('delivered')    // Returns delivered background color
theme.getStatusColor('success')      // Returns success color
theme.getStatusColor('warning')      // Returns warning color
theme.getStatusColor('error')        // Returns error color
theme.getStatusColor('info')         // Returns info color

// Get status text colors (for contrast)
theme.getStatusTextColor('pending')   // Returns appropriate text color
theme.getStatusTextColor('delivered')  // Returns appropriate text color
```

### Example: Using Status Colors

```tsx
const statusColor = theme.getStatusColor('delivered');
const statusTextColor = theme.getStatusTextColor('delivered');

<View style={{ backgroundColor: statusColor }}>
  <Text style={{ color: statusTextColor }}>Delivered</Text>
</View>
```

## Typography

The typography system provides pre-configured text styles with consistent font sizes, line heights, and font families.

### Typography Scale

```tsx
// Headings
theme.typography.display    // fontSize: 32, lineHeight: 40, bold
theme.typography.h1         // fontSize: 28, lineHeight: 36, bold
theme.typography.h2          // fontSize: 24, lineHeight: 32, bold
theme.typography.h3          // fontSize: 22, lineHeight: 28, semiBold
theme.typography.h4          // fontSize: 20, lineHeight: 26, semiBold
theme.typography.h5          // fontSize: 18, lineHeight: 24, semiBold
theme.typography.h6          // fontSize: 16, lineHeight: 22, semiBold

// Body Text
theme.typography.bodyLarge   // fontSize: 16, lineHeight: 24, regular
theme.typography.body        // fontSize: 14, lineHeight: 20, regular
theme.typography.bodySmall   // fontSize: 12, lineHeight: 18, regular
theme.typography.bodyXSmall  // fontSize: 10, lineHeight: 14, regular

// Specialized
theme.typography.label       // fontSize: 12, lineHeight: 16, medium
theme.typography.caption     // fontSize: 10, lineHeight: 14, regular
theme.typography.button      // fontSize: 14, lineHeight: 20, semiBold
theme.typography.link        // fontSize: 14, lineHeight: 20, regular

// Stats/Numbers
theme.typography.statLarge   // fontSize: 24, lineHeight: 32, bold
theme.typography.statMedium  // fontSize: 20, lineHeight: 28, bold
theme.typography.statSmall   // fontSize: 16, lineHeight: 24, semiBold
```

### Example: Using Typography

```tsx
// Method 1: Spread the typography object
<Text style={[
  theme.typography.h3,
  { color: theme.colors.text }
]}>
  Heading
</Text>

// Method 2: Use individual properties
<Text style={{
  fontSize: theme.typography.body.fontSize,
  lineHeight: theme.typography.body.lineHeight,
  fontFamily: theme.typography.body.fontFamily,
  color: theme.colors.text
}}>
  Body text
</Text>
```

## Spacing

Use consistent spacing values throughout the app:

```tsx
theme.spacing.xs              // 4
theme.spacing.sm              // 8
theme.spacing.md              // 16
theme.spacing.lg              // 24
theme.spacing.xl              // 32
theme.spacing.xxl              // 40
theme.spacing.xxxl             // 48

// Component-specific spacing
theme.spacing.componentGap    // 24 - Gap between major components
theme.spacing.sectionGap      // 32 - Gap between sections
theme.spacing.cardPadding     // 20 - Standard card padding
theme.spacing.screenPadding   // 20 - Screen edge padding
theme.spacing.cardGap         // 16 - Gap between cards
theme.spacing.itemGap         // 8 - Gap between list items
theme.spacing.buttonPadding   // 12 - Button padding
theme.spacing.inputPadding    // 12 - Input padding
```

### Example: Using Spacing

```tsx
<View style={{
  padding: theme.spacing.md,
  marginBottom: theme.spacing.componentGap,
  gap: theme.spacing.sm
}}>
  {/* Content */}
</View>
```

## Border Radius

Consistent border radius values:

```tsx
theme.borderRadius.none       // 0
theme.borderRadius.xs         // 4
theme.borderRadius.sm         // 8
theme.borderRadius.md         // 12
theme.borderRadius.lg         // 16
theme.borderRadius.xl         // 20
theme.borderRadius.xxl        // 24
theme.borderRadius.round      // 9999 (fully rounded)

// Component-specific
theme.borderRadius.card       // 20 - Standard card radius
theme.borderRadius.button     // 12 - Button radius
theme.borderRadius.badge      // 12 - Badge/chip radius
theme.borderRadius.avatar     // 14 - Small avatar radius
theme.borderRadius.avatarLarge // 28 - Large avatar radius
theme.borderRadius.input      // 12 - Input field radius
```

## Icon Sizes

Standard icon sizes:

```tsx
theme.iconSizes.xs            // 12
theme.iconSizes.sm            // 16
theme.iconSizes.md            // 20
theme.iconSizes.lg            // 24
theme.iconSizes.xl            // 32
theme.iconSizes.xxl           // 40

// Component-specific
theme.iconSizes.button        // 20 - Button icon size
theme.iconSizes.tabBar        // 24 - Tab bar icon size
theme.iconSizes.header        // 20 - Header icon size
theme.iconSizes.card          // 20 - Card icon size
```

### Example: Using Icon Sizes

```tsx
<MaterialIcons
  name="home"
  size={theme.iconSizes.header}
  color={theme.colors.text}
/>
```

## Opacity

Predefined opacity values:

```tsx
theme.opacity.disabled        // 0.4
theme.opacity.hover           // 0.8
theme.opacity.pressed         // 0.6
theme.opacity.overlay         // 0.65 - For overlay backgrounds
theme.opacity.subtle          // 0.25 - For subtle backgrounds
theme.opacity.transparent     // 0
theme.opacity.opaque          // 1
```

## Shadows

Platform-specific shadow styles:

```tsx
theme.shadows.sm              // Small shadow
theme.shadows.md              // Medium shadow
theme.shadows.lg              // Large shadow
```

### Example: Using Shadows

```tsx
<View style={[
  { backgroundColor: theme.colors.cardBackground },
  theme.shadows.md
]}>
  {/* Content */}
</View>
```

## Creating Styles with Theme

### Pattern 1: Inline Styles

```tsx
export default function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{
      padding: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.card
    }}>
      <Text style={{
        ...theme.typography.h4,
        color: theme.colors.text
      }}>
        Title
      </Text>
    </View>
  );
}
```

### Pattern 2: StyleSheet with Theme Function (Recommended)

This pattern is used in the home page and provides better performance:

```tsx
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.componentGap,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.cardPadding,
  },
});

export default function MyComponent() {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
      <View style={styles.card}>
        {/* Content */}
      </View>
    </View>
  );
}
```

## Best Practices

1. **Always use the theme** - Never hardcode colors, font sizes, or spacing values
2. **Use semantic color names** - Use `theme.colors.text` instead of `'#040507'`
3. **Use typography scale** - Use `theme.typography.h3` instead of custom font sizes
4. **Use spacing scale** - Use `theme.spacing.md` instead of `16`
5. **Use status colors** - Use `theme.getStatusColor()` for status indicators
6. **Create styles functions** - Use the `createStyles` pattern for better performance

## Updating the Theme

To update the theme, edit `constants/theme.ts`. Changes will automatically apply throughout the app since all components use the centralized theme.

### Adding New Colors

```tsx
// In constants/theme.ts
export const Colors = {
  light: {
    // ... existing colors
    newColor: '#FF5733',
  },
  dark: {
    // ... existing colors
    newColor: '#FF8C69',
  },
};
```

### Adding New Typography Styles

```tsx
// In constants/theme.ts
export const Typography = {
  // ... existing styles
  customStyle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },
};
```

## Migration Guide

To migrate existing components to use the theme:

1. Replace `useColorScheme()` with `useTheme()`
2. Replace hardcoded colors with `theme.colors.*`
3. Replace hardcoded font sizes with `theme.typography.*`
4. Replace hardcoded spacing with `theme.spacing.*`
5. Replace hardcoded border radius with `theme.borderRadius.*`
6. Replace hardcoded icon sizes with `theme.iconSizes.*`

### Before

```tsx
const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';

<Text style={{
  color: isDark ? '#f9f9fb' : '#040507',
  fontSize: 18,
  fontFamily: 'Poppins-SemiBold'
}}>
  Title
</Text>
```

### After

```tsx
const theme = useTheme();

<Text style={[
  theme.typography.h5,
  { color: theme.colors.text }
]}>
  Title
</Text>
```

## Examples

See `app/(tabs)/index.tsx` (the home page) for a complete example of using the theme system.

## Support

For questions or issues with the theme system, refer to this guide or check the theme configuration in `constants/theme.ts`.








