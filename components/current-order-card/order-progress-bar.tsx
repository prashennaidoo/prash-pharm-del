import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { DeliveryStatus } from './index';

interface OrderProgressBarProps {
  progress: number; // 0-1, where 0 is start and 1 is complete
  totalDots?: number;
  status: DeliveryStatus;
}

/**
 * Progress bar component showing order delivery progress with dots, status-specific icon, and path.
 */
export function OrderProgressBar({ progress, totalDots = 10, status }: OrderProgressBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get icon and color based on status
  // Always show bike icon regardless of status
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return {
          name: 'two-wheeler' as const,
          color: isDark ? '#F59E0B' : '#F59E0B',
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)',
        };
      case 'picked_up':
        return {
          name: 'two-wheeler' as const,
          color: isDark ? '#3B82F6' : '#3B82F6',
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        };
      case 'delivered':
        return {
          name: 'two-wheeler' as const,
          color: isDark ? '#10B981' : '#10B981',
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.2)',
        };
    }
  };

  const iconConfig = getStatusIcon();
  const showRemainingPath = status !== 'delivered';

  // Calculate dots to show based on status
  let dotsToShow = 0;
  if (status === 'picked_up') {
    dotsToShow = Math.floor(totalDots / 2); // Halfway for picked_up
  } else if (status === 'pending') {
    dotsToShow = 0; // No dots for pending
  } else {
    // For delivered, show all dots
    dotsToShow = totalDots;
  }

  return (
    <View style={styles.container}>
      {/* Progress dots - only show for picked_up and delivered */}
      {status !== 'pending' && Array.from({ length: dotsToShow }).map((_, index) => (
        <View 
          key={`dot-${index}`}
          style={[
            styles.progressDot,
            { backgroundColor: iconConfig.color }
          ]} 
        />
      ))}
      
      {/* Status-specific icon (current position) */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: iconConfig.backgroundColor }
      ]}>
        <MaterialIcons 
          name={iconConfig.name} 
          size={16} 
          color={iconConfig.color} 
        />
      </View>

      {/* Remaining path line and arrow (hidden when delivered) */}
      {showRemainingPath && (
        <View style={styles.remainingPath}>
          <View style={[
            styles.pathLine,
            { backgroundColor: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
          ]} />
          <MaterialIcons 
            name="arrow-forward" 
            size={16} 
            color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  remainingPath: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  pathLine: {
    flex: 1,
    height: 1,
  },
});

