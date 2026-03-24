import React from 'react';
import { StyleSheet, ViewStyle, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface BackgroundGradientProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Reusable background gradient component that applies the app's theme gradient colors.
 * Automatically adapts to light/dark mode.
 * On web, uses a solid slightly less off-white color instead of gradient.
 */
export function BackgroundGradient({ children, style }: BackgroundGradientProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // For web, use a solid slightly less off-white color (darker than sidebar)
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webBackground, style]}>
        {children}
      </View>
    );
  }
  
  const gradientColors = isDark ? Colors.dark.gradientColors : Colors.light.gradientColors;
  const overlayGradientColors = isDark 
    ? Colors.dark.overlayGradientColors 
    : Colors.light.overlayGradientColors;

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Overlay gradient for depth */}
      <LinearGradient
        colors={overlayGradientColors as [string, string, ...string[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webBackground: {
    backgroundColor: '#F5F5F5', // Slightly less off-white (darker than sidebar) for web
  },
});








