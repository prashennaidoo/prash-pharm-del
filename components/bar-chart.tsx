import React, { useState } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent, ViewStyle, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TransparentCard } from '@/components/transparent-card';
import { Colors, Fonts } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface BarChartData {
  day: string;
  value: number;
  maxValue: number;
  id?: string; // Optional unique identifier for React keys
}

interface BarChartProps {
  title: string;
  data: BarChartData[];
  style?: ViewStyle;
  yAxisMax?: number;
  yAxisSteps?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function BarChart({ 
  title, 
  data, 
  style,
  yAxisMax,
  yAxisSteps = 6,
  xAxisLabel,
  yAxisLabel
}: BarChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [cardWidth, setCardWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [barPositions, setBarPositions] = useState<{ x: number; y: number; width: number }[]>([]);

  const handleBarPress = (index: number) => {
    setSelectedIndex(prevIndex => prevIndex === index ? null : index);
  };
  
  const handleCardLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setCardWidth(width);
  };

  const handleBarLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, y, width } = event.nativeEvent.layout;
    const newPositions = [...barPositions];
    newPositions[index] = { x, y, width };
    setBarPositions(newPositions);
  };

  // Calculate min and max values from actual data
  const dataValues = data.map(item => item.value);
  const minValue = dataValues.length > 0 ? Math.min(...dataValues) : 0;
  const rawMaxValue = dataValues.length > 0 ? Math.max(...dataValues) : 0;
  
  // Helper function to calculate nice intervals (integer-only)
  const calculateNiceScale = (min: number, max: number): { min: number; max: number; step: number } => {
    // If no data (all zeros), return 0-3 range with integer step
    if (max === 0 && min === 0) {
      return { min: 0, max: 3, step: 1 };
    }
    
    // Ensure min and max are integers
    const intMin = Math.floor(min);
    const intMax = Math.ceil(max);
    
    // Calculate range
    const range = intMax - intMin;
    
    // If range is 0 (all values are the same), add some padding
    if (range === 0) {
      const paddedMax = intMax === 0 ? 1 : intMax + 1;
      // Calculate integer step that divides nicely
      const rawStep = paddedMax / yAxisSteps;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalizedStep = rawStep / magnitude;
      
      let niceStep;
      if (normalizedStep <= 1) {
        niceStep = 1;
      } else if (normalizedStep <= 2) {
        niceStep = 2;
      } else if (normalizedStep <= 5) {
        niceStep = 5;
      } else {
        niceStep = 10;
      }
      
      niceStep = Math.max(1, Math.round(niceStep * magnitude)); // Ensure integer and at least 1
      return { min: 0, max: paddedMax, step: niceStep };
    }
    
    // Calculate a nice integer step size
    const rawStep = range / yAxisSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalizedStep = rawStep / magnitude;
    
    // Round to nice numbers (1, 2, 5, 10, etc.)
    let niceStep;
    if (normalizedStep <= 1) {
      niceStep = 1;
    } else if (normalizedStep <= 2) {
      niceStep = 2;
    } else if (normalizedStep <= 5) {
      niceStep = 5;
    } else {
      niceStep = 10;
    }
    
    niceStep = Math.max(1, Math.round(niceStep * magnitude)); // Ensure integer and at least 1
    
    // Calculate nice min and max (always integers)
    const niceMin = Math.floor(intMin / niceStep) * niceStep;
    const niceMax = Math.ceil(intMax / niceStep) * niceStep;
    
    return { min: niceMin, max: niceMax, step: niceStep };
  };
  
  // Use provided yAxisMax if available, otherwise calculate dynamically
  let maxValue: number;
  let minAxisValue: number;
  let step: number;
  
  if (yAxisMax !== undefined) {
    // If yAxisMax is provided, use it but still calculate nice intervals
    const scale = calculateNiceScale(0, yAxisMax);
    maxValue = scale.max;
    minAxisValue = scale.min;
    step = scale.step;
  } else {
    // Calculate dynamically from data
    const scale = calculateNiceScale(minValue, rawMaxValue);
    maxValue = scale.max;
    minAxisValue = scale.min;
    step = scale.step;
  }
  
  // Check if a date string matches today's date
  const isToday = (dateString: string): boolean => {
    try {
      // Try parsing as ISO date (YYYY-MM-DD)
      if (dateString.includes('-')) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
      }
      
      // Try parsing as MM/DD format
      if (dateString.includes('/')) {
        const [month, day] = dateString.split('/').map(Number);
        const today = new Date();
        return month === today.getMonth() + 1 && day === today.getDate();
      }
      
      // Fall back to checking if it matches today's day abbreviation
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      return dateString === days[today];
    } catch {
      return false;
    }
  };
  
  // Generate Y-axis labels dynamically (integer-only)
  const yAxisLabels: number[] = [];
  const numSteps = Math.round((maxValue - minAxisValue) / step);
  for (let i = numSteps; i >= 0; i--) {
    const value = minAxisValue + (i * step);
    // Ensure integer value
    const intValue = Math.round(value);
    yAxisLabels.push(intValue);
  }

  // Calculate bar width dynamically
  // Card padding: 16 * 2 = 32
  // Y-axis width: dynamic based on max value
  // Gap between bars: responsive to screen size
  // Bar wrapper paddingHorizontal: 2 * 2 * data.length (2px padding on each side of each bar)
  const screenWidth = Dimensions.get('window').width;
  const CARD_PADDING = 32;
  
  // Calculate dynamic Y-axis width based on longest label
  // Find the longest y-axis label string (by character count)
  const maxYAxisLabelLength = yAxisLabels.length > 0 
    ? Math.max(...yAxisLabels.map(label => String(label).length))
    : String(maxValue).length;
  // Estimate width needed: each digit is ~6-7px at fontSize 10, plus padding
  const baseYAxisFontSize = 10;
  const estimatedYAxisLabelWidth = maxYAxisLabelLength * 7; // chars * px per char
  const Y_AXIS_PADDING = 8; // Right padding for spacing
  const MIN_Y_AXIS_WIDTH = screenWidth < 350 ? 25 : 28;
  const Y_AXIS_WIDTH = Math.max(MIN_Y_AXIS_WIDTH, estimatedYAxisLabelWidth + Y_AXIS_PADDING);
  
  // Calculate fixed font size for y-axis labels (same for all labels)
  const yAxisBaseFontSize = 10;
  const yAxisMinFontSize = screenWidth < 350 ? 8 : 9;
  const yAxisMaxFontSize = 10;
  // Scale font size based on available width, but use fixed size for all labels
  const yAxisAvailableWidth = Y_AXIS_WIDTH - Y_AXIS_PADDING;
  const yAxisScaleFactor = Math.min(1, yAxisAvailableWidth / estimatedYAxisLabelWidth);
  const dynamicYAxisFontSize = Math.max(
    yAxisMinFontSize,
    Math.min(yAxisMaxFontSize, yAxisBaseFontSize * yAxisScaleFactor)
  );
  // Reduce gap on smaller screens to give more room for labels
  const GAP_SIZE = screenWidth < 350 ? 1 : 2;
  const TOTAL_GAPS = GAP_SIZE * (data.length - 1);
  const TOTAL_BAR_PADDING = 4 * data.length;
  const NUM_BARS = data.length;
  const availableWidth = cardWidth - CARD_PADDING - Y_AXIS_WIDTH - TOTAL_GAPS - TOTAL_BAR_PADDING;
  const barWidth = cardWidth > 0 ? Math.max(availableWidth / NUM_BARS, 6) : 0;
  
  // Calculate dynamic font size for labels based on available width per bar
  // Chart area width: cardWidth - CARD_PADDING - Y_AXIS_WIDTH
  // Each bar wrapper gets: (chartAreaWidth - TOTAL_GAPS) / NUM_BARS
  const chartAreaWidth = cardWidth - CARD_PADDING - Y_AXIS_WIDTH;
  const availableWidthPerBar = cardWidth > 0 ? (chartAreaWidth - TOTAL_GAPS) / NUM_BARS : 0;
  // Estimate max text width needed
  // Dates are typically 5 chars (MM/DD format like "12/25"), but could be longer
  const maxLabelLength = Math.max(...data.map(item => item.day.length), 5);
  // Use a scaling factor: smaller screens get smaller fonts
  const baseFontSize = 10;
  // Scale font size based on available width per bar, but ensure minimum readability
  // For very small screens (< 350px), use smaller base size
  const minFontSize = screenWidth < 350 ? 8 : 9;
  const maxFontSize = 10;
  // Calculate font size: ensure labels fit within available width
  // Assume each character is roughly 6-7px wide at fontSize 10
  const estimatedTextWidth = maxLabelLength * 7; // chars * 7px per char at fontSize 10
  const scaleFactor = Math.min(1, availableWidthPerBar / estimatedTextWidth);
  const dynamicLabelFontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * scaleFactor));
  
  // Calculate dynamic font size for bar values (numbers below bars)
  const baseValueFontSize = 11;
  const minValueFontSize = screenWidth < 350 ? 8 : 9;
  const maxValueFontSize = 11;
  // Estimate value text width (e.g., "60" is 2 chars, each char ~7px at fontSize 11)
  const maxValueLength = Math.max(...data.map(item => String(item.value).length));
  const estimatedValueTextWidth = maxValueLength * 7; // chars * px per char
  const valueScaleFactor = Math.min(1, availableWidthPerBar / estimatedValueTextWidth);
  const dynamicValueFontSize = Math.max(minValueFontSize, Math.min(maxValueFontSize, baseValueFontSize * valueScaleFactor));

  // Calculate percentage change from previous day
  const getPercentageChange = (index: number): number | null => {
    if (index === 0) return null; // No previous day for first day
    const currentValue = data[index].value;
    const previousValue = data[index - 1].value;
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Combine chart card style with custom style
  const cardStyle: ViewStyle = style 
    ? { ...styles.chartCard, ...style }
    : styles.chartCard;

  return (
    <TransparentCard 
      style={cardStyle}
      interactive={false}
      onLayout={handleCardLayout}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.chartSubheading,
            { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
          ]}>Deliveries</Text>
          <Text style={[
            styles.chartTitle,
            { color: isDark ? Colors.dark.text : Colors.light.text }
          ]}>{title}</Text>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/calendar' as any)}
          >
            <MaterialIcons
              name="calendar-today"
              size={16}
              color={isDark ? Colors.dark.text : Colors.light.text}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.chartContainer}>
        {/* Y-Axis */}
        <View style={[styles.yAxis, { width: Y_AXIS_WIDTH }]}>
          {yAxisLabels.map((value, idx) => (
            <Text 
              key={`y-axis-${idx}-${value}`}
              style={[
                styles.yAxisLabel,
                { 
                  color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
                  fontSize: dynamicYAxisFontSize
                }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={false}
            >
              {value}
            </Text>
          ))}
        </View>
        
        {/* Chart Bars Container */}
        <View style={styles.chartBarsContainer}>
          {/* Chart Bars */}
          <View style={[styles.chartBars, { gap: GAP_SIZE }]}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * 150;
            const isCurrentDay = isToday(item.day);
            const barColor = isCurrentDay ? '#f29e9d' : '#d2c9fe';
            
            // Ensure unique key: always include index to guarantee uniqueness
            const uniqueKey = item.id ? `${item.id}-${index}` : `bar-${index}-${item.day}-${item.value}`;
            
            return (
              <Pressable
                key={uniqueKey}
                style={[styles.barWrapper, { width: availableWidthPerBar || 'auto' }]}
                onLayout={(event) => handleBarLayout(index, event)}
                onPress={() => handleBarPress(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[styles.barContainer, { width: barWidth }]}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: barHeight,
                        backgroundColor: barColor
                      }
                    ]}
                  />
                </View>
                <Text 
                  style={[
                    styles.barLabel,
                    { 
                      color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
                      fontSize: dynamicLabelFontSize,
                      maxWidth: availableWidthPerBar || '100%'
                    }
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.6}
                  ellipsizeMode="tail"
                >{item.day}</Text>
                <Text 
                  style={[
                    styles.barValue,
                    { 
                      color: isDark ? Colors.dark.text : Colors.light.text,
                      fontSize: dynamicValueFontSize,
                      maxWidth: availableWidthPerBar || '100%'
                    }
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.6}
                  ellipsizeMode="tail"
                >{item.value}</Text>
              </Pressable>
            );
          })}
          </View>
          {/* X-Axis Label */}
          {xAxisLabel && (
            <Text 
              style={[
                styles.axisLabel,
                styles.xAxisHeading,
                { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
              ]}
            >
              {xAxisLabel}
            </Text>
          )}
        </View>
      </View>

      {/* Popup for selected bar */}
      {selectedIndex !== null && (() => {
        const popupPercentageChange = getPercentageChange(selectedIndex);
        const barHeight = (data[selectedIndex].value / maxValue) * 150;
        const position = barPositions[selectedIndex];
        const screenWidth = Dimensions.get('window').width;
        const POPUP_MAX_WIDTH = screenWidth - 32; // Screen width minus margins
        const POPUP_MIN_WIDTH = 140;
        
        // Calculate bar center position
        let barCenterX = 0;
        if (position) {
          barCenterX = 16 + 30 + position.x + position.width / 2; // Card padding + Y-axis + bar position
        } else if (cardWidth > 0) {
          const barSpacing = availableWidth / NUM_BARS;
          barCenterX = 16 + 30 + (selectedIndex * barSpacing) + (barSpacing / 2);
        }
        
        // Calculate popup width (dynamic based on content, but constrained)
        const estimatedPopupWidth = Math.max(POPUP_MIN_WIDTH, Math.min(POPUP_MAX_WIDTH, 180));
        
        // Center popup above the bar, but ensure it stays on screen
        const popupLeft = Math.max(
          16, // Minimum left margin
          Math.min(
            barCenterX - estimatedPopupWidth / 2, // Center above bar
            cardWidth - estimatedPopupWidth - 16 // Don't go off right edge
          )
        );
        
        const popupBottom = 200 - barHeight + 60;
        
        return (
          <View 
            style={[
              styles.popup,
              {
                left: popupLeft,
                bottom: popupBottom,
                maxWidth: POPUP_MAX_WIDTH,
                minWidth: POPUP_MIN_WIDTH,
              }
            ]}
            pointerEvents="box-none"
          >
            <Text style={styles.popupLabel}>Total orders</Text>
            <Text style={styles.popupValue}>{data[selectedIndex].value}</Text>
            {popupPercentageChange !== null && (
              <View style={styles.popupChangeRow}>
                <View style={[
                  styles.popupChangePill,
                  { backgroundColor: popupPercentageChange >= 0 ? '#D1FAE5' : '#FEE2E2' }
                ]}>
                  <Text style={[
                    styles.popupChangeText,
                    { color: popupPercentageChange >= 0 ? '#065F46' : '#991B1B' }
                  ]}>
                    {popupPercentageChange >= 0 ? '+' : ''}{popupPercentageChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.popupChangeLabel}>vs previous day</Text>
              </View>
            )}
          </View>
        );
      })()}
    </TransparentCard>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  titleContainer: {
    flex: 1,
  },
  chartSubheading: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginBottom: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    opacity: 0.65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0, // Allow flex shrinking
    overflow: 'visible', // Allow labels to be visible
  },
  yAxis: {
    height: 200,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 50, // Align with bar container bottom (200 - 150 = 50)
    minWidth: 0, // Allow flex shrinking
  },
  chartBarsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textAlign: 'right',
    width: '100%',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 200,
    gap: 2,
    overflow: 'visible',
    minWidth: 0, // Allow flex shrinking
    width: '100%',
  },
  axisLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
  },
  xAxisHeading: {
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
    minWidth: 0, // Allow flex shrinking
    flexShrink: 1, // Allow shrinking if needed
    overflow: 'visible', // Allow labels to be visible
  },
  barContainer: {
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 15,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    flexShrink: 1, // Allow text to shrink
    minWidth: 0, // Allow flex shrinking
  },
  barValue: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    flexShrink: 1, // Allow text to shrink
    minWidth: 0, // Allow flex shrinking
  },
  popup: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    alignSelf: 'flex-start',
  },
  popupLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    marginBottom: 6,
    marginHorizontal: 0,
  },
  popupValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#111827',
    marginBottom: 10,
    marginHorizontal: 0,
  },
  popupChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 0,
  },
  popupChangePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popupChangeText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  popupChangeLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
});

