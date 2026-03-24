import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface TransparentCardProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * If true, renders as a TouchableOpacity (interactive).
   * If false, renders as a View (non-interactive).
   */
  interactive?: boolean;
}

/**
 * Reusable transparent card component with theme-aware styling.
 * Automatically adapts transparency and colors based on light/dark mode.
 */
export function TransparentCard({ 
  children, 
  style, 
  interactive = false,
  ...touchableProps 
}: TransparentCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const backgroundColor = isDark 
    ? Colors.dark.transparentCard 
    : Colors.light.transparentCard;

  const cardStyle = [
    styles.card,
    { backgroundColor },
    style,
  ];

  if (interactive) {
    return (
      <TouchableOpacity
        style={cardStyle}
        activeOpacity={0.7}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Extract View-specific props for non-interactive mode
  const { onLayout, ...viewProps } = touchableProps as ViewProps;

  return (
    <View style={cardStyle} onLayout={onLayout} {...viewProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
  },
});

