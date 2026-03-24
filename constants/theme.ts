/**
 * Centralized Theme Configuration
 * 
 * This file contains all design tokens for the application including:
 * - Colors (light/dark mode)
 * - Typography (sizes, weights, line heights)
 * - Spacing
 * - Border Radius
 * - Icon Sizes
 * - Status Colors
 * - Opacity Values
 * 
 * Usage: Import and use these values throughout the app for consistency.
 * Example: import { Colors, Typography, Spacing } from '@/constants/theme';
 */

import { Platform } from 'react-native';

// ============================================================================
// COLORS
// ============================================================================

export const Colors = {
  light: {
    // Text Colors
    text: '#040507',
    textSecondary: 'rgba(4, 5, 7, 0.6)',
    textTertiary: 'rgba(4, 5, 7, 0.4)',
    
    // Background Colors
    background: '#f2f4fa',
    cardBackground: '#F6F8FA',
    badgeBackground: '#F2F4F7',
    challengeCardBackground: '#D8EEF8',
    
    // Brand Colors
    primary: '#4a71c4',
    secondary: '#98b0e5',
    accent: '#5d87e0',
    tint: '#4a71c4',
    
    // UI Colors
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#4a71c4',
    
    // Transparent/Overlay Colors
    transparentCard: 'rgba(255, 255, 255, 0.25)',
    overlayBackground: 'rgba(255, 255, 255, 0.65)',
    
    // Status Colors (semantic)
    status: {
      success: '#a1f4a8',
      successText: '#065F46',
      warning: '#fbbf24',
      warningText: '#78350f',
      error: '#f29e9d',
      errorText: '#FFFFFF',
      info: '#d2c9fe',
      infoText: '#FFFFFF',
      pending: '#f29e9d',
      pendingText: '#FFFFFF',
      pickedUp: '#d2c9fe',
      pickedUpText: '#FFFFFF',
      delivered: '#a1f4a8',
      deliveredText: '#065F46',
    },
    
    // Gradient colors for background
    gradientColors: [
      'rgba(74, 113, 196, 0.12)', // Soft blue
      'rgba(152, 176, 229, 0.15)', // Light blue
      'rgba(93, 135, 224, 0.1)',   // Accent blue
      'rgba(242, 244, 250, 0.08)', // Light background
    ],
    overlayGradientColors: [
      'rgba(152, 176, 229, 0.1)',
      'rgba(74, 113, 196, 0.06)',
      'transparent',
    ],
  },
  dark: {
    // Text Colors
    text: '#f9f9fb',
    textSecondary: 'rgba(249, 249, 251, 0.6)',
    textTertiary: 'rgba(249, 249, 251, 0.4)',
    
    // Background Colors
    background: '#06080f',
    cardBackground: '#1F2A2E',
    badgeBackground: '#2A2D32',
    challengeCardBackground: '#1A3A4A',
    
    // Brand Colors
    primary: '#3b61b5',
    secondary: '#193266',
    accent: '#1f49a3',
    tint: '#3b61b5',
    
    // UI Colors
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#3b61b5',
    
    // Transparent/Overlay Colors
    transparentCard: 'rgba(255, 255, 255, 0.2)',
    overlayBackground: 'rgba(255, 255, 255, 0.1)',
    
    // Status Colors (semantic)
    status: {
      success: '#10b981',
      successText: '#FFFFFF',
      warning: '#f59e0b',
      warningText: '#FFFFFF',
      error: '#ef4444',
      errorText: '#FFFFFF',
      info: '#6366f1',
      infoText: '#FFFFFF',
      pending: '#f29e9d',
      pendingText: '#FFFFFF',
      pickedUp: '#d2c9fe',
      pickedUpText: '#FFFFFF',
      delivered: '#10b981',
      deliveredText: '#FFFFFF',
    },
    
    // Gradient colors for background
    gradientColors: [
      'rgba(59, 97, 181, 0.15)', // Soft blue
      'rgba(25, 50, 102, 0.1)',  // Deep blue
      'rgba(31, 73, 163, 0.12)',  // Accent blue
      'rgba(15, 20, 35, 0.05)',   // Very dark with transparency
    ],
    overlayGradientColors: [
      'rgba(59, 97, 181, 0.08)',
      'rgba(31, 73, 163, 0.05)',
      'transparent',
    ],
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

// Poppins font family - default font for the entire app
export const Fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
  thin: 'Poppins-Thin',
  extraLight: 'Poppins-ExtraLight',
  extraBold: 'Poppins-ExtraBold',
  black: 'Poppins-Black',
  default: 'Poppins-Regular',
};

// Typography scale - standardized font sizes, line heights, and weights
export const Typography = {
  // Display/Heading Styles
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: Fonts.bold,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: Fonts.bold,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.bold,
  },
  h3: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Fonts.semiBold,
  },
  h4: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Fonts.semiBold,
  },
  h5: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.semiBold,
  },
  h6: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.semiBold,
  },
  
  // Body Text Styles
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.regular,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  bodyXSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: Fonts.regular,
  },
  
  // Specialized Text Styles
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.medium,
  },
  caption: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: Fonts.regular,
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.semiBold,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  
  // Stat/Number Styles
  statLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.bold,
  },
  statMedium: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: Fonts.bold,
  },
  statSmall: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.semiBold,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  // Base spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  
  // Component-specific spacing
  componentGap: 24,      // Standard gap between major components
  sectionGap: 32,        // Gap between sections
  cardPadding: 20,       // Standard padding for cards
  screenPadding: 20,     // Standard padding for screen edges
  cardGap: 16,           // Gap between cards in a row
  itemGap: 8,            // Gap between items in a list
  buttonPadding: 12,     // Standard button padding
  inputPadding: 12,      // Standard input padding
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,           // Fully rounded (pill shape)
  
  // Component-specific
  card: 20,              // Standard card border radius
  button: 12,            // Standard button border radius
  badge: 12,             // Badge/chip border radius
  avatar: 14,            // Avatar border radius (small)
  avatarLarge: 28,       // Large avatar border radius
  input: 12,             // Input field border radius
};

// ============================================================================
// ICON SIZES
// ============================================================================

export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  
  // Component-specific
  button: 20,            // Standard button icon size
  tabBar: 24,            // Tab bar icon size
  header: 20,            // Header icon size
  card: 20,              // Card icon size
};

// ============================================================================
// OPACITY
// ============================================================================

export const Opacity = {
  disabled: 0.4,
  hover: 0.8,
  pressed: 0.6,
  overlay: 0.65,         // Used for overlay backgrounds
  subtle: 0.25,          // Used for subtle backgrounds
  transparent: 0,        // Fully transparent
  opaque: 1,             // Fully opaque
};

// ============================================================================
// SHADOWS / ELEVATION (Platform-specific)
// ============================================================================

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
