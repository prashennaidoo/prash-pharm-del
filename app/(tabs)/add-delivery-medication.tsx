import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { DeliveryProgressTracker } from '@/components/delivery-progress-tracker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Create styles function that uses theme values
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 80, // Account for floating nav bar
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.componentGap,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.componentGap,
  },
  scheduleCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  scheduleCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  scheduleOptions: {
    gap: theme.spacing.sm,
  },
  scheduleOption: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
    backgroundColor: theme.colors.transparentCard,
  },
  scheduleOptionSelected: {
    borderColor: theme.colors.status.pickedUp,
    borderWidth: 2,
  },
  scheduleOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  scheduleOptionLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  scheduleOptionDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  coldChainCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  coldChainCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  coldChainOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  coldChainOption: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
    backgroundColor: theme.colors.transparentCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  coldChainOptionSelected: {
    borderColor: theme.colors.status.pickedUp,
    borderWidth: 2,
  },
  coldChainOptionLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  disclaimer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.status.info,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  disclaimerText: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.medium,
    color: theme.colors.status.infoText,
    flex: 1,
  },
  proceedButton: {
    backgroundColor: theme.colors.status.pickedUp,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  proceedButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
});

type MedicationSchedule = 'schedule-1-2' | 'schedule-3-5' | 'schedule-6' | 'unscheduled' | null;
type ColdChainRequired = boolean | null;

export default function AddDeliveryMedicationScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const params = useLocalSearchParams();
  const [selectedSchedule, setSelectedSchedule] = useState<MedicationSchedule>(null);
  const [coldChainRequired, setColdChainRequired] = useState<ColdChainRequired>(null);

  const scheduleOptions = [
    {
      id: 'unscheduled' as const,
      label: 'Unscheduled',
      description: 'No schedule classification',
    },
    {
      id: 'schedule-1-2' as const,
      label: 'Schedule 1-2',
      description: 'Over the counter',
    },
    {
      id: 'schedule-3-5' as const,
      label: 'Schedule 3-5',
      description: 'Prescription',
    },
    {
      id: 'schedule-6' as const,
      label: 'Schedule 6',
      description: 'Controlled substance',
    },
  ];

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Back Button */}
          <TransparentCard
            style={styles.backButton}
            interactive={true}
            onPress={() => router.push('/(tabs)/add-delivery')}
          >
            <MaterialIcons
              name="arrow-back"
              size={theme.iconSizes.header}
              color={theme.colors.text}
            />
          </TransparentCard>
        </View>

        {/* Title */}
        <Text style={[
          styles.title,
          { color: theme.colors.text }
        ]}>Add Medication</Text>

        {/* Schedule Selection Card */}
        <TransparentCard style={styles.scheduleCard}>
          <Text style={styles.scheduleCardTitle}>What schedule medication is being delivered?</Text>
          
          <View style={styles.scheduleOptions}>
            {scheduleOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.scheduleOption,
                  selectedSchedule === option.id && styles.scheduleOptionSelected,
                ]}
                onPress={() => setSelectedSchedule(option.id)}
              >
                <View style={styles.scheduleOptionHeader}>
                  <Text style={styles.scheduleOptionLabel}>{option.label}</Text>
                  {selectedSchedule === option.id && (
                    <MaterialIcons
                      name="check-circle"
                      size={theme.iconSizes.md}
                      color={theme.colors.status.pickedUp}
                    />
                  )}
                </View>
                <Text style={styles.scheduleOptionDescription}>{option.description}</Text>
              </Pressable>
            ))}
          </View>
        </TransparentCard>

        {/* Cold Chain Selection Card */}
        <TransparentCard style={styles.coldChainCard}>
          <Text style={styles.coldChainCardTitle}>Is a cold chain required?</Text>
          
          <View style={styles.coldChainOptions}>
            <Pressable
              style={[
                styles.coldChainOption,
                coldChainRequired === true && styles.coldChainOptionSelected,
              ]}
              onPress={() => setColdChainRequired(true)}
            >
              <Text style={styles.coldChainOptionLabel}>Yes</Text>
              {coldChainRequired === true && (
                <MaterialIcons
                  name="check-circle"
                  size={theme.iconSizes.md}
                  color={theme.colors.status.pickedUp}
                />
              )}
            </Pressable>
            
            <Pressable
              style={[
                styles.coldChainOption,
                coldChainRequired === false && styles.coldChainOptionSelected,
              ]}
              onPress={() => setColdChainRequired(false)}
            >
              <Text style={styles.coldChainOptionLabel}>No</Text>
              {coldChainRequired === false && (
                <MaterialIcons
                  name="check-circle"
                  size={theme.iconSizes.md}
                  color={theme.colors.status.pickedUp}
                />
              )}
            </Pressable>
          </View>

          {/* Disclaimer - shows when Yes is selected */}
          {coldChainRequired === true && (
            <View style={styles.disclaimer}>
              <MaterialIcons
                name="info"
                size={theme.iconSizes.md}
                color={theme.colors.status.infoText}
              />
              <Text style={styles.disclaimerText}>
                Temperature monitoring required (2-8 degrees celcius)
              </Text>
            </View>
          )}
        </TransparentCard>

        {/* Proceed to Summary Button */}
        {selectedSchedule !== null && coldChainRequired !== null && (
          <Pressable
            style={styles.proceedButton}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/add-delivery-summary',
                params: {
                  // Pass through delivery info from previous page
                  patientId: params.patientId as string || '',
                  customerName: params.customerName as string || '',
                  customerId: params.customerId as string || '',
                  customerPhone: params.customerPhone as string || '',
                  deliveryAddress: params.deliveryAddress as string || '',
                  deliveryDate: params.deliveryDate as string || '',
                  deliveryTime: params.deliveryTime as string || '',
                  deliveryDateTime: params.deliveryDateTime as string || '', // ISO timestamp for database
                  recipientName: params.recipientName as string || '',
                  // Add medication info
                  medicationSchedule: selectedSchedule,
                  coldChainRequired: coldChainRequired.toString(),
                },
              });
            }}
          >
            <Text style={styles.proceedButtonText}>
              Proceed to Summary
            </Text>
          </Pressable>
        )}

        {/* Progress Tracker */}
        <DeliveryProgressTracker currentStep={2} />
      </ScrollView>
    </BackgroundGradient>
  );
}

