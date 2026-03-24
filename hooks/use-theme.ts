/**
 * useTheme Hook
 * 
 * Provides easy access to theme values based on the current color scheme.
 * This hook automatically returns the correct theme values for light/dark mode.
 * 
 * Usage:
 * ```tsx
 * const theme = useTheme();
 * <Text style={{ color: theme.colors.text, fontSize: theme.typography.h3.fontSize }}>
 *   Hello World
 * </Text>
 * ```
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  IconSizes,
  Opacity,
  Shadows,
  Fonts,
} from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return {
    // Current color scheme
    colorScheme,
    isDark,
    isLight: !isDark,

    // Colors - automatically returns light or dark based on color scheme
    colors: Colors[colorScheme],

    // Typography - same for both themes
    typography: Typography,

    // Spacing - same for both themes
    spacing: Spacing,

    // Border Radius - same for both themes
    borderRadius: BorderRadius,

    // Icon Sizes - same for both themes
    iconSizes: IconSizes,

    // Opacity - same for both themes
    opacity: Opacity,

    // Shadows - same for both themes
    shadows: Shadows,

    // Fonts - same for both themes
    fonts: Fonts,

    // Helper function to get status colors
    getStatusColor: (status: 'pending' | 'picked_up' | 'delivered' | 'success' | 'warning' | 'error' | 'info') => {
      const statusMap: Record<string, keyof typeof Colors.light.status> = {
        pending: 'pending',
        picked_up: 'pickedUp',
        delivered: 'delivered',
        success: 'success',
        warning: 'warning',
        error: 'error',
        info: 'info',
      };
      return Colors[colorScheme].status[statusMap[status] || 'info'];
    },

    // Helper function to get status text color
    getStatusTextColor: (status: 'pending' | 'picked_up' | 'delivered' | 'success' | 'warning' | 'error' | 'info') => {
      const statusMap: Record<string, keyof typeof Colors.light.status> = {
        pending: 'pending',
        picked_up: 'pickedUp',
        delivered: 'delivered',
        success: 'success',
        warning: 'warning',
        error: 'error',
        info: 'info',
      };
      const statusKey = statusMap[status] || 'info';
      const textKey = `${statusKey}Text` as keyof typeof Colors.light.status;
      return Colors[colorScheme].status[textKey];
    },
  };
}

export type Theme = ReturnType<typeof useTheme>;








