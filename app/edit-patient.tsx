import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '@/lib/supabase';
import { getCurrentUserPharmacy } from '@/lib/auth';

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
    ...theme.typography.h3,
    marginBottom: theme.spacing.componentGap,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.componentGap,
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
  addressCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.colors.overlayBackground,
    marginBottom: theme.spacing.md,
    opacity: theme.opacity.overlay,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addressCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  removeAddressButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  addAddressButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
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

interface Address {
  description: string;
  address: string;
}

export default function EditPatientScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const params = useLocalSearchParams();
  const patientId = params.patientId as string;

  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phoneNumber: '',
  });
  const [addresses, setAddresses] = useState<Address[]>([
    { description: 'Home', address: '' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load patient data on mount
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        Alert.alert('Error', 'Patient ID is missing', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      try {
        setLoadingPatient(true);
        
        // Get pharmacy ID
        const { pharmacyId } = await getCurrentUserPharmacy();

        // Fetch patient data
        const { data: patientData, error: patientError } = await supabase
          .from('patient')
          .select('id, name, surname, phone_number, address')
          .eq('id', patientId)
          .eq('pharmacy_id', pharmacyId)
          .single();

        if (patientError) {
          console.error('Error fetching patient:', patientError);
          Alert.alert(
            'Error',
            'Failed to load patient data. Please try again.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }

        if (!patientData) {
          Alert.alert(
            'Error',
            'Patient not found',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }

        // Populate form with patient data
        setFormData({
          name: patientData.name || '',
          surname: patientData.surname || '',
          phoneNumber: patientData.phone_number || '',
        });

        // Populate addresses
        if (patientData.address && Array.isArray(patientData.address) && patientData.address.length > 0) {
          setAddresses(patientData.address.map((addr: any) => ({
            description: addr.description || '',
            address: addr.address || '',
          })));
        } else {
          setAddresses([{ description: 'Home', address: '' }]);
        }
      } catch (error: any) {
        console.error('Error loading patient data:', error);
        Alert.alert(
          'Error',
          error?.message || 'An unexpected error occurred while loading patient data.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } finally {
        setLoadingPatient(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Validate at least one address is provided
    const validAddresses = addresses.filter(addr => addr.address.trim());
    if (validAddresses.length === 0) {
      newErrors.addresses = 'At least one address is required';
    }

    // Validate each address has a description
    addresses.forEach((addr, index) => {
      if (addr.address.trim() && !addr.description.trim()) {
        newErrors[`address_${index}_description`] = 'Address description is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Get pharmacy ID for the current user
      const { pharmacyId } = await getCurrentUserPharmacy();

      // Prepare addresses array (filter out empty addresses)
      const validAddresses = addresses
        .filter(addr => addr.address.trim() && addr.description.trim())
        .map(addr => ({
          description: addr.description.trim(),
          address: addr.address.trim(),
        }));

      // Update patient in database
      const { data, error } = await supabase
        .from('patient')
        .update({
          name: formData.name.trim(),
          surname: formData.surname.trim() || null,
          phone_number: formData.phoneNumber.trim(),
          address: validAddresses,
        })
        .eq('id', patientId)
        .eq('pharmacy_id', pharmacyId)
        .select();

      if (error) {
        console.error('Error updating patient:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to update patient. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!data || data.length === 0) {
        Alert.alert(
          'Error',
          'Patient was updated but no data was returned. Please refresh the patients list.',
          [{ text: 'OK' }]
        );
        router.back();
        return;
      }

      // Success - show alert and navigate back
      Alert.alert(
        'Success',
        'Patient updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating patient:', error);
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingPatient) {
    return (
      <BackgroundGradient style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loadingContainer}>
            <MaterialIcons
              name="hourglass-empty"
              size={theme.iconSizes.xl}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.loadingText}>Loading patient data...</Text>
          </View>
        </ScrollView>
      </BackgroundGradient>
    );
  }

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
            onPress={handleCancel}
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
        ]}>Edit Patient</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Update patient information
        </Text>

        {/* Form Card */}
        <TransparentCard style={styles.formCard}>
          {/* Name Field */}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Name *</Text>
            <TextInput
              style={[
                styles.formInput,
                errors.name && styles.formInputError
              ]}
              placeholder="Enter patient name"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              autoCapitalize="words"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Surname Field */}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Surname</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter patient surname (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.surname}
              onChangeText={(text) => {
                setFormData({ ...formData, surname: text });
              }}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number Field */}
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Phone Number *</Text>
            <TextInput
              style={[
                styles.formInput,
                errors.phoneNumber && styles.formInputError
              ]}
              placeholder="Enter phone number"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.phoneNumber}
              onChangeText={(text) => {
                setFormData({ ...formData, phoneNumber: text });
                if (errors.phoneNumber) {
                  setErrors({ ...errors, phoneNumber: '' });
                }
              }}
              keyboardType="phone-pad"
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          {/* Addresses Section */}
          <View style={styles.formField}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <Text style={styles.formLabel}>Addresses *</Text>
              {addresses.length > 1 && (
                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                  {addresses.filter(a => a.address.trim()).length} address{addresses.filter(a => a.address.trim()).length !== 1 ? 'es' : ''}
                </Text>
              )}
            </View>

            {addresses.map((addr, index) => (
              <TransparentCard key={index} style={styles.addressCard}>
                <View style={styles.addressCardHeader}>
                  <Text style={styles.addressCardTitle}>Address {index + 1}</Text>
                  {addresses.length > 1 && (
                    <TransparentCard
                      style={[styles.removeAddressButton, { backgroundColor: theme.colors.overlayBackground }]}
                      interactive={true}
                      onPress={() => {
                        const newAddresses = addresses.filter((_, i) => i !== index);
                        setAddresses(newAddresses);
                        // Clear related errors
                        const newErrors = { ...errors };
                        delete newErrors[`address_${index}_description`];
                        setErrors(newErrors);
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        size={theme.iconSizes.md}
                        color={theme.colors.status.error}
                      />
                    </TransparentCard>
                  )}
                </View>

                <View style={{ marginBottom: theme.spacing.sm }}>
                  <Text style={[styles.formLabel, { marginBottom: theme.spacing.xs }]}>Description</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      errors[`address_${index}_description`] && styles.formInputError
                    ]}
                    placeholder="e.g., Home, Work, Office"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={addr.description}
                    onChangeText={(text) => {
                      const newAddresses = [...addresses];
                      newAddresses[index].description = text;
                      setAddresses(newAddresses);
                      if (errors[`address_${index}_description`]) {
                        const newErrors = { ...errors };
                        delete newErrors[`address_${index}_description`];
                        setErrors(newErrors);
                      }
                    }}
                  />
                  {errors[`address_${index}_description`] && (
                    <Text style={styles.errorText}>{errors[`address_${index}_description`]}</Text>
                  )}
                </View>

                <View>
                  <Text style={[styles.formLabel, { marginBottom: theme.spacing.xs }]}>Address</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      { minHeight: 80, textAlignVertical: 'top' },
                      errors.addresses && index === 0 && styles.formInputError
                    ]}
                    placeholder="Enter full address"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={addr.address}
                    onChangeText={(text) => {
                      const newAddresses = [...addresses];
                      newAddresses[index].address = text;
                      setAddresses(newAddresses);
                      if (errors.addresses) {
                        setErrors({ ...errors, addresses: '' });
                      }
                    }}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </TransparentCard>
            ))}

            <TransparentCard
              style={[styles.addAddressButton, { backgroundColor: theme.colors.overlayBackground, opacity: theme.opacity.overlay }]}
              interactive={true}
              onPress={() => {
                setAddresses([...addresses, { description: '', address: '' }]);
              }}
            >
              <MaterialIcons
                name="add"
                size={theme.iconSizes.md}
                color={theme.colors.text}
              />
              <Text style={styles.addAddressButtonText}>Add Another Address</Text>
            </TransparentCard>

            {errors.addresses && (
              <Text style={styles.errorText}>{errors.addresses}</Text>
            )}
          </View>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            <TransparentCard
              style={[
                styles.button,
                styles.buttonSecondary,
                loading && styles.buttonDisabled
              ]}
              interactive={!loading}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
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
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {loading ? 'Updating...' : 'Update Patient'}
              </Text>
            </TransparentCard>
          </View>
        </TransparentCard>
      </ScrollView>
    </BackgroundGradient>
  );
}

