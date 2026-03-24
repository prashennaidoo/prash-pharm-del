import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { DeliveryStatus } from './index';

interface OrderHeaderProps {
  warehouse: string;
  status: DeliveryStatus;
}

const getStatusConfig = (status: DeliveryStatus, isDark: boolean) => {
  switch (status) {
    case 'pending':
      return {
        text: 'Pending',
        backgroundColor: '#f29e9d', // Pink/red from bar chart
        textColor: '#FFFFFF',
      };
    case 'picked_up':
      return {
        text: 'Picked Up',
        backgroundColor: '#d2c9fe', // Purple from bar chart
        textColor: '#FFFFFF',
      };
    case 'delivered':
      return {
        text: 'Delivered',
        backgroundColor: '#a1f4a8',
        textColor: '#065F46', // Dark green text for contrast on light green background
      };
  }
};

/**
 * Header component for order card displaying warehouse and status badge.
 */
export function OrderHeader({ warehouse, status }: OrderHeaderProps) {
  const isDark = false; // Light mode enforced
  const statusConfig = getStatusConfig(status, isDark);

  // Calculate dynamic font size and padding for status text based on screen width
  const screenWidth = Dimensions.get('window').width;
  // Estimate text width: "Picked Up" is longest at ~9 chars
  // Each char is roughly 6-7px at fontSize 10
  const maxTextLength = Math.max(...['Pending', 'Picked Up', 'Delivered'].map(s => s.length));
  const estimatedTextWidth = maxTextLength * 7; // chars * px per char at fontSize 10
  // Available width for status badge: screen width - card padding - warehouse text - gap
  // Conservative estimate: assume warehouse takes ~40% of width, card padding ~32px
  const cardPadding = 32; // 16px * 2
  const estimatedWarehouseWidth = (screenWidth - cardPadding) * 0.4;
  const availableWidthForBadge = (screenWidth - cardPadding) * 0.5; // Reserve 50% for badge
  const baseFontSize = 10;
  const minFontSize = screenWidth < 350 ? 8 : 9;
  const maxFontSize = 10;
  // Scale font size based on available width
  const scaleFactor = Math.min(1, availableWidthForBadge / estimatedTextWidth);
  const dynamicFontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * scaleFactor));
  // Reduce padding on smaller screens to give more room for text
  const badgePaddingHorizontal = screenWidth < 350 ? 6 : 8;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          { color: isDark ? Colors.dark.text : Colors.light.text }
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.75}
        ellipsizeMode="tail"
      >{warehouse}</Text>
      <View style={[
        styles.statusBadge, 
        { 
          backgroundColor: statusConfig.backgroundColor,
          paddingHorizontal: badgePaddingHorizontal
        }
      ]}>
        <Text 
          style={[
            styles.statusText, 
            { 
              color: '#000000',
              fontSize: dynamicFontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.65}
        >
          {statusConfig.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    minWidth: 0, // Allow flex shrinking
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 1, // Allow badge to shrink slightly if needed
    minWidth: 0, // Allow content-based sizing
    maxWidth: '50%', // Prevent badge from taking too much space
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    flex: 1, // Allow text to take available space
    flexShrink: 1, // Allow text to shrink if needed
    marginRight: Spacing.xs, // Add small gap between text and badge
    minWidth: 0, // Allow flex shrinking
  },
});

