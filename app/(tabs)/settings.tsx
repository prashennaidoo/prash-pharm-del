import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { FloatingNavBar } from '@/components/floating-nav-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { isCurrentUserOwner } from '@/lib/auth';

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
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.screenPadding + 20, // Extra top padding
    paddingBottom: 80, // Account for floating nav bar
  },
  header: {
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
  },
  headerSubtitle: {
    ...theme.typography.body,
  },
  settingsList: {
    gap: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.overlayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: theme.opacity.overlay,
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
  },
  settingSubtitle: {
    ...theme.typography.bodySmall,
  },
  chevronIcon: {
    opacity: theme.opacity.overlay,
  },
  disabledItem: {
    opacity: theme.opacity.disabled,
  },
  disabledText: {
    opacity: theme.opacity.disabled,
  },
});

export default function SettingsScreen() {
  const theme = useTheme();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Check if current user is an owner
  useEffect(() => {
    const checkOwnerStatus = async () => {
      try {
        const ownerStatus = await isCurrentUserOwner();
        setIsOwner(ownerStatus);
      } catch (error) {
        console.error('Error checking owner status:', error);
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnerStatus();
  }, []);

  const settingsItems = [
    {
      icon: 'people' as const,
      title: 'Manage Pharmacy Staff',
      subtitle: isOwner ? 'Add, edit, and remove staff members' : 'Only pharmacy owners can manage staff',
      onPress: isOwner ? () => router.push('/manage-staff') : undefined,
      disabled: !isOwner,
    },
    {
      icon: 'store' as const,
      title: 'Manage Pharmacy Details',
      subtitle: isOwner ? 'Edit pharmacy name and address' : 'Only pharmacy owners can manage pharmacy details',
      onPress: isOwner ? () => router.push('/manage-pharmacy-details') : undefined,
      disabled: !isOwner,
    },
    {
      icon: 'info' as const,
      title: 'About',
      subtitle: 'App version and information',
      onPress: undefined,
      disabled: false,
    },
  ];

  const styles = createStyles(theme);

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: theme.colors.text }
          ]}>Settings</Text>
          <Text style={[
            styles.headerSubtitle,
            { color: theme.colors.textSecondary }
          ]}>Manage your app preferences and account</Text>
        </View>

        {/* Settings Items */}
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => {
            const cardStyle: ViewStyle = item.disabled 
              ? StyleSheet.flatten([styles.settingItem, styles.disabledItem])
              : styles.settingItem;
            
            return (
            <TransparentCard
              key={index}
              style={cardStyle}
              interactive={!!item.onPress && !item.disabled}
              onPress={item.onPress}
            >
              <View style={styles.settingIconContainer}>
                <MaterialIcons
                  name={item.icon}
                  size={theme.iconSizes.md}
                  color={item.disabled ? theme.colors.textSecondary : theme.colors.text}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[
                  styles.settingTitle,
                  { color: item.disabled ? theme.colors.textSecondary : theme.colors.text }
                ]}>{item.title}</Text>
                <Text style={[
                  styles.settingSubtitle,
                  { color: theme.colors.textSecondary }
                ]}>{item.subtitle}</Text>
              </View>
              {item.onPress && !item.disabled && (
                <MaterialIcons
                  name="chevron-right"
                  size={theme.iconSizes.md}
                  color={theme.colors.text}
                  style={styles.chevronIcon}
                />
              )}
            </TransparentCard>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Navigation Bar */}
      <FloatingNavBar />
    </BackgroundGradient>
  );
}
