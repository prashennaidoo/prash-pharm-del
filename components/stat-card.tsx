import React from 'react';
import { StyleSheet, View, Text, ViewStyle, Dimensions, LayoutChangeEvent } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TransparentCard } from '@/components/transparent-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  style?: ViewStyle;
}

/**
 * Reusable stat card component for displaying key metrics.
 * Displays a label, value, and subtext in a transparent card.
 */
export function StatCard({ label, value, subtext, style }: StatCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [cardWidth, setCardWidth] = React.useState(0);

  const handleCardLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setCardWidth(width);
  };

  // Calculate dynamic font sizes based on screen width and card width
  const screenWidth = Dimensions.get('window').width;
  
  // For stat cards in a row, each card gets approximately half the screen width minus padding
  // Account for screen padding (32px) and gap between cards (typically 8-16px)
  const estimatedCardWidth = cardWidth > 0 
    ? cardWidth 
    : (screenWidth - 32 - 16) / 2; // Screen padding + gap between cards
  
  // Calculate dynamic font sizes
  // Value is the largest text (24px base), so scale it most aggressively
  const baseValueFontSize = 24;
  const minValueFontSize = screenWidth < 350 ? 18 : 20;
  const maxValueFontSize = 24;
  // Estimate value text width (e.g., "$24,580" is ~7 chars, each char ~14px at fontSize 24)
  const valueTextLength = String(value).length;
  const estimatedValueWidth = valueTextLength * 14; // chars * px per char at fontSize 24
  const availableWidthForValue = estimatedCardWidth - (Spacing.md * 2); // Card padding
  const valueScaleFactor = Math.min(1, availableWidthForValue / estimatedValueWidth);
  const dynamicValueFontSize = Math.max(
    minValueFontSize, 
    Math.min(maxValueFontSize, baseValueFontSize * valueScaleFactor)
  );
  
  // Label and subtext are smaller (10px base), scale them less aggressively
  const baseLabelFontSize = 10;
  const minLabelFontSize = screenWidth < 350 ? 8 : 9;
  const maxLabelFontSize = 10;
  const labelTextLength = label.length;
  const estimatedLabelWidth = labelTextLength * 7; // chars * px per char at fontSize 10
  const labelScaleFactor = Math.min(1, availableWidthForValue / estimatedLabelWidth);
  const dynamicLabelFontSize = Math.max(
    minLabelFontSize,
    Math.min(maxLabelFontSize, baseLabelFontSize * labelScaleFactor)
  );
  
  const subtextTextLength = subtext.length;
  const estimatedSubtextWidth = subtextTextLength * 7; // chars * px per char at fontSize 10
  const subtextScaleFactor = Math.min(1, availableWidthForValue / estimatedSubtextWidth);
  const dynamicSubtextFontSize = Math.max(
    minLabelFontSize,
    Math.min(maxLabelFontSize, baseLabelFontSize * subtextScaleFactor)
  );

  return (
    <TransparentCard 
      style={[styles.statCard, style]}
      interactive={false}
      onLayout={handleCardLayout}
    >
      <View style={styles.statCardContent}>
        <Text 
          style={[
            styles.statLabel,
            { 
              color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
              fontSize: dynamicLabelFontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >{label}</Text>
        <Text 
          style={[
            styles.statValue,
            { 
              color: isDark ? Colors.dark.text : Colors.light.text,
              fontSize: dynamicValueFontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >{value}</Text>
        <Text 
          style={[
            styles.statSubtext,
            { 
              color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
              fontSize: dynamicSubtextFontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >{subtext}</Text>
      </View>
    </TransparentCard>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    padding: Spacing.md,
  },
  statCardContent: {
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
    minWidth: 0, // Allow flex shrinking
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    width: '100%',
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginTop: 4,
    width: '100%',
  },
  statSubtext: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginTop: 2,
    width: '100%',
  },
});



