import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getDriverSupabaseClient } from '@/lib/auth';

type DeliveryStatus = 'pending' | 'picked_up' | 'delivered';

interface DeliveryDetails {
  id: number;
  order_id: string;
  status: DeliveryStatus;
  address: string;
  delivery_date_time: string;
  created_at: string;
  medication_schedule: string;
  cold_chain: boolean;
  patient: {
    name: string;
    surname: string;
    phone_number: string;
    address: any;
  } | null;
}

// Helper function to get status config
const getStatusConfig = (status: DeliveryStatus, theme: ReturnType<typeof useTheme>) => {
  switch (status) {
    case 'pending':
      return {
        text: 'Pending',
        backgroundColor: theme.getStatusColor('pending'),
        textColor: theme.getStatusTextColor('pending'),
      };
    case 'picked_up':
      return {
        text: 'Picked Up',
        backgroundColor: theme.getStatusColor('picked_up'),
        textColor: theme.getStatusTextColor('picked_up'),
      };
    case 'delivered':
      return {
        text: 'Delivered',
        backgroundColor: theme.getStatusColor('delivered'),
        textColor: theme.getStatusTextColor('delivered'),
      };
  }
};

// Helper function to format date/time for display
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

// Helper function to format medication schedule
const getScheduleDisplay = (schedule: string): string => {
  switch (schedule) {
    case 'unscheduled':
      return 'Unscheduled';
    case 'schedule-1-2':
      return 'Schedule 1-2';
    case 'schedule-3-5':
      return 'Schedule 3-5';
    case 'schedule-6':
      return 'Schedule 6';
    default:
      return schedule || 'N/A';
  }
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.screenPadding + 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
  },
  headerTitle: {
    ...theme.typography.h3,
    flex: 1,
  },
  detailsCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
    flex: 1,
  },
  detailValue: {
    ...theme.typography.body,
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.badge,
    alignSelf: 'flex-end',
  },
  statusText: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
    color: '#000000',
  },
  sectionTitle: {
    ...theme.typography.h5,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  updateStatusCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  updateStatusTitle: {
    ...theme.typography.h5,
    marginBottom: theme.spacing.sm,
  },
  statusButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    ...theme.typography.body,
    textAlign: 'center',
    opacity: theme.opacity.overlay,
  },
});

export default function DriverOrderDetailsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeliveryDetails();
    }
  }, [id]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const driverSupabase = await getDriverSupabaseClient();

      const { data, error } = await driverSupabase
        .from('delivery')
        .select(`
          id,
          order_id,
          status,
          address,
          delivery_date_time,
          created_at,
          medication_schedule,
          cold_chain,
          patient:patient_id(
            name,
            surname,
            phone_number,
            address
          )
        `)
        .eq('id', parseInt(id, 10))
        .single();

      if (error) {
        console.error('Error fetching delivery details:', error);
        Alert.alert('Error', 'Failed to load delivery details');
        router.back();
      } else {
        setDelivery(data as unknown as DeliveryDetails);
      }
    } catch (error: any) {
      console.error('Error fetching delivery details:', error);
      Alert.alert('Error', error.message || 'Failed to load delivery details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: DeliveryStatus) => {
    if (!delivery) return;

    // Validate status transition
    const currentStatus = delivery.status;
    if (currentStatus === 'delivered') {
      Alert.alert('Error', 'Cannot update status of a delivered order');
      return;
    }
    if (currentStatus === 'picked_up' && newStatus === 'pending') {
      Alert.alert('Error', 'Cannot revert status from picked up to pending');
      return;
    }

    Alert.alert(
      'Update Status',
      `Are you sure you want to update the status to "${getStatusConfig(newStatus, theme).text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdating(true);
              const driverSupabase = await getDriverSupabaseClient();

              const { error } = await driverSupabase
                .from('delivery')
                .update({ status: newStatus })
                .eq('id', delivery.id);

              if (error) {
                console.error('Error updating status:', error);
                Alert.alert('Error', 'Failed to update status');
              } else {
                Alert.alert('Success', 'Status updated successfully', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              }
            } catch (error: any) {
              console.error('Error updating status:', error);
              Alert.alert('Error', error.message || 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <BackgroundGradient style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons
                name="arrow-back"
                size={theme.iconSizes.header}
                color={theme.colors.text}
              />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Order Details
            </Text>
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading order details...
          </Text>
        </ScrollView>
      </BackgroundGradient>
    );
  }

  if (!delivery) {
    return (
      <BackgroundGradient style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons
                name="arrow-back"
                size={theme.iconSizes.header}
                color={theme.colors.text}
              />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Order Details
            </Text>
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Order not found
          </Text>
        </ScrollView>
      </BackgroundGradient>
    );
  }

  const statusConfig = getStatusConfig(delivery.status, theme);
  const patientName = delivery.patient
    ? `${delivery.patient.name || ''} ${delivery.patient.surname || ''}`.trim() || 'Unknown'
    : 'Unknown';

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons
              name="arrow-back"
              size={theme.iconSizes.header}
              color={theme.colors.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Order Details
          </Text>
        </View>

        {/* Order Details */}
        <TransparentCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Order ID:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {delivery.order_id || `#${delivery.id}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Status:
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
              <Text style={styles.statusText}>{statusConfig.text}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Patient:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {patientName}
            </Text>
          </View>

          {delivery.patient?.phone_number && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Phone:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {delivery.patient.phone_number}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Delivery Address:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {delivery.address || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Delivery Date/Time:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {delivery.delivery_date_time
                ? formatDateTime(delivery.delivery_date_time)
                : formatDateTime(delivery.created_at)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Medication Schedule:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {getScheduleDisplay(delivery.medication_schedule)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Cold Chain Required:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {delivery.cold_chain ? 'Yes' : 'No'}
            </Text>
          </View>
        </TransparentCard>

        {/* Update Status Section */}
        {delivery.status !== 'delivered' && (
          <TransparentCard style={styles.updateStatusCard}>
            <Text style={[styles.updateStatusTitle, { color: theme.colors.text }]}>
              Update Status
            </Text>

            {delivery.status === 'pending' && (
              <Pressable
                style={[
                  styles.statusButton,
                  { backgroundColor: theme.getStatusColor('picked_up') },
                  updating && styles.statusButtonDisabled,
                ]}
                disabled={updating}
                onPress={() => updateStatus('picked_up')}
              >
                <Text style={styles.statusButtonText}>Picked Up</Text>
              </Pressable>
            )}

            {delivery.status === 'picked_up' && (
              <Pressable
                style={[
                  styles.statusButton,
                  { backgroundColor: theme.getStatusColor('delivered') },
                  updating && styles.statusButtonDisabled,
                ]}
                disabled={updating}
                onPress={() => router.push(`/driver/completed-delivery-form?id=${delivery.id}`)}
              >
                <Text style={styles.statusButtonText}>Mark as Delivered</Text>
              </Pressable>
            )}
          </TransparentCard>
        )}
      </ScrollView>
    </BackgroundGradient>
  );
}

