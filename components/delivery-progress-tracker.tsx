import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface DeliveryProgressTrackerProps {
  currentStep: 1 | 2 | 3;
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.screenPadding,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.transparentCard,
    borderWidth: 2,
    borderColor: theme.colors.transparentCard,
  },
  stepDotActive: {
    backgroundColor: theme.colors.status.pickedUp,
    borderColor: theme.colors.status.pickedUp,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.status.pickedUp,
    borderColor: theme.colors.status.pickedUp,
  },
  stepLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  connectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.transparentCard,
    marginHorizontal: theme.spacing.xs,
    marginTop: 5, // Align with center of dots (6px from top for 12px dot)
  },
  connectorLineCompleted: {
    backgroundColor: theme.colors.status.pickedUp,
  },
});

export function DeliveryProgressTracker({ currentStep }: DeliveryProgressTrackerProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const steps = [
    { id: 1, label: 'Add Patient details' },
    { id: 2, label: 'Add medication' },
    { id: 3, label: 'Summary' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          // Connector line is completed if the next step is completed or active
          const isConnectorCompleted = index < steps.length - 1 && steps[index + 1].id <= currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.stepDot,
                    isActive && styles.stepDotActive,
                    isCompleted && styles.stepDotCompleted,
                  ]}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    isConnectorCompleted && styles.connectorLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

