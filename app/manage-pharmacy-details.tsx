import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '@/lib/supabase';
import { getCurrentUserPharmacy, isCurrentUserOwner } from '@/lib/auth';

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
    paddingTop: theme.spacing.screenPadding + 20,
    paddingBottom: 80,
  },
  header: {
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    textAlign: 'center',
    flex: 1,
  },
  headerSubtitle: {
    ...theme.typography.body,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  formCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.componentGap,
  },
  formField: {
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
  },
  formInputError: {
    borderColor: theme.colors.status.error,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.componentGap,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.getStatusColor('picked_up'),
  },
  buttonSecondary: {
    backgroundColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
  },
  buttonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
  },
  buttonTextPrimary: {
    color: theme.colors.text,
  },
  buttonTextSecondary: {
    color: theme.colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});

export default function ManagePharmacyDetailsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingPharmacy, setLoadingPharmacy] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [formData, setFormData] = useState({
    pharmacyName: '',
    pharmacyAddress: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = createStyles(theme);

  // Load pharmacy data on mount
  useEffect(() => {
    const loadPharmacyData = async () => {
      try {
        setLoadingPharmacy(true);
        
        // Check if user is owner
        const ownerStatus = await isCurrentUserOwner();
        setIsOwner(ownerStatus);

        if (!ownerStatus) {
          Alert.alert('Access Denied', 'Only pharmacy owners can manage pharmacy details', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }

        // Get pharmacy ID
        const { pharmacyId } = await getCurrentUserPharmacy();

        // Fetch pharmacy data
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacy')
          .select('pharmacy_name, pharmacy_address')
          .eq('id', pharmacyId)
          .single();

        if (pharmacyError) {
          console.error('Error fetching pharmacy:', pharmacyError);
          Alert.alert('Error', 'Failed to load pharmacy details', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }

        if (pharmacyData) {
          setFormData({
            pharmacyName: pharmacyData.pharmacy_name || '',
            pharmacyAddress: pharmacyData.pharmacy_address || '',
          });
        }
      } catch (error) {
        console.error('Error loading pharmacy data:', error);
        Alert.alert('Error', 'Failed to load pharmacy details', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } finally {
        setLoadingPharmacy(false);
      }
    };

    loadPharmacyData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pharmacyName.trim()) {
      newErrors.pharmacyName = 'Pharmacy name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Get pharmacy ID
      const { pharmacyId } = await getCurrentUserPharmacy();

      // Update pharmacy data
      const { error: updateError } = await supabase
        .from('pharmacy')
        .update({
          pharmacy_name: formData.pharmacyName.trim(),
          pharmacy_address: formData.pharmacyAddress.trim() || null,
        })
        .eq('id', pharmacyId);

      if (updateError) {
        console.error('Error updating pharmacy:', updateError);
        Alert.alert('Error', 'Failed to update pharmacy details. Please try again.');
        return;
      }

      Alert.alert('Success', 'Pharmacy details updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving pharmacy details:', error);
      Alert.alert('Error', 'Failed to save pharmacy details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPharmacy) {
    return (
      <BackgroundGradient style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.text} />
          <Text style={styles.loadingText}>Loading pharmacy details...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  if (!isOwner) {
    return null; // Will redirect via useEffect
  }

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TransparentCard
              style={styles.backButton}
              interactive={true}
              onPress={() => router.back()}
            >
              <MaterialIcons
                name="arrow-back"
                size={theme.iconSizes.header}
                color={theme.colors.text}
              />
            </TransparentCard>
            <Text style={[
              styles.headerTitle,
              { color: theme.colors.text }
            ]}>
              Pharmacy Details
            </Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={[
            styles.headerSubtitle,
            { color: theme.colors.textSecondary }
          ]}>
            Edit your pharmacy information
          </Text>
        </View>

        {/* Form Card */}
        <TransparentCard style={styles.formCard}>
          {/* Pharmacy Name Field */}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Pharmacy Name *</Text>
            <TextInput
              style={[
                styles.formInput,
                errors.pharmacyName && styles.formInputError
              ]}
              placeholder="Enter pharmacy name"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.pharmacyName}
              onChangeText={(text) => {
                setFormData({ ...formData, pharmacyName: text });
                if (errors.pharmacyName) {
                  setErrors({ ...errors, pharmacyName: '' });
                }
              }}
              autoCapitalize="words"
            />
            {errors.pharmacyName && (
              <Text style={styles.errorText}>{errors.pharmacyName}</Text>
            )}
          </View>

          {/* Pharmacy Address Field */}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Pharmacy Address</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter pharmacy address (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.pharmacyAddress}
              onChangeText={(text) => {
                setFormData({ ...formData, pharmacyAddress: text });
              }}
              autoCapitalize="words"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TransparentCard
              style={[
                styles.button,
                styles.buttonSecondary,
                loading && styles.buttonDisabled
              ]}
              interactive={!loading}
              onPress={() => router.back()}
            >
              <Text style={[
                styles.buttonText,
                styles.buttonTextSecondary
              ]}>
                Cancel
              </Text>
            </TransparentCard>
            <TransparentCard
              style={[
                styles.button,
                styles.buttonPrimary,
                loading && styles.buttonDisabled
              ]}
              interactive={!loading}
              onPress={handleSave}
            >
              <Text style={[
                styles.buttonText,
                styles.buttonTextPrimary
              ]}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TransparentCard>
          </View>
        </TransparentCard>
      </ScrollView>
    </BackgroundGradient>
  );
}


