import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { TransparentCard } from '@/components/transparent-card';
import { Spacing } from '@/constants/theme';
import { OrderHeader } from './order-header';
import { OrderProgressBar } from './order-progress-bar';
import { OrderLocations } from './order-locations';

export type DeliveryStatus = 'pending' | 'picked_up' | 'delivered';

export interface CurrentOrderCardProps {
  /** Warehouse name displayed on the left */
  warehouse?: string;
  /** Origin location */
  origin?: string;
  /** Destination location */
  destination?: string;
  /** Progress value between 0 and 1 */
  progress?: number;
  /** Custom style for the card container */
  style?: ViewStyle;
  /** Avatar emoji for the driver */
  avatarEmoji?: string;
  /** Number of progress dots to display */
  totalDots?: number;
  /** Delivery status: pending, picked_up, or delivered */
  status?: DeliveryStatus;
}

/**
 * Current order card component displaying order progress and location details.
 *
 * This is a modular component composed of:
 * - OrderHeader: Shows warehouse and status
 * - OrderProgressBar: Shows progress with dots, scooter icon, and path
 * - OrderLocations: Shows origin and destination with avatar
 *
 * @example
 * ```tsx
 * <CurrentOrderCard
 *   warehouse="Current Deliveries"
 *   origin="Surabaya, East Java"
 *   destination="Denpasar, Bali"
 *   status="picked_up"
 * />
 * ```
 */
export function CurrentOrderCard({
  warehouse = 'Current Deliveries',
  origin = 'Surabaya, East Java',
  destination = 'Denpasar, Bali',
  progress,
  avatarEmoji,
  totalDots = 10,
  status = 'pending',
  style
}: CurrentOrderCardProps) {
  // Calculate progress based on status if not provided
  const calculatedProgress = progress !== undefined 
    ? progress 
    : status === 'pending' 
      ? 0 
      : status === 'picked_up' 
        ? 0.5 
        : 1;

  return (
    <TransparentCard 
      style={[styles.card, style]}
      interactive={false}
    >
      <OrderHeader
        warehouse={warehouse}
        status={status}
      />
      
      <OrderProgressBar 
        progress={calculatedProgress}
        totalDots={totalDots}
        status={status}
      />
      
      <OrderLocations 
        origin={origin}
        destination={destination}
        avatarEmoji={avatarEmoji}
      />
    </TransparentCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
  },
});

// Export sub-components for advanced usage
export { OrderHeader } from './order-header';
export { OrderProgressBar } from './order-progress-bar';
export { OrderLocations } from './order-locations';

