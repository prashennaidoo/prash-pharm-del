import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { Sidebar } from '@/components/sidebar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from '@/lib/supabase';
import { getCurrentUserPharmacy } from '@/lib/auth';
import { useToast } from '@/components/toast';

// Create styles function that uses theme values
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  contentWrapper: {
    flex: 1,
    ...(Platform.OS === 'web' ? { marginLeft: 260 } : {}),
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingHorizontal: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.screenPadding,
    paddingTop: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.screenPadding + 20,
    paddingBottom: Platform.OS === 'web' ? theme.spacing.screenPadding : 80,
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
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  formCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
    backgroundColor: theme.colors.transparentCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
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
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Platform.OS === 'web' ? '#d2c9fe' : theme.colors.status.pickedUp,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.transparentCard,
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
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.transparentCard,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addressCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  removeAddressButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.transparentCard,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.transparentCard,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  addAddressButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  webAddPatientCard: {
    ...(Platform.OS === 'web' ? {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.componentGap,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    } : {}),
  },
});

interface Address {
  description: string;
  address: string;
}

export default function AddPatientScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phoneNumber: '',
  });
  const [addresses, setAddresses] = useState<Address[]>([
    { description: 'Home', address: '' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

      // Insert patient into database
      const { error } = await supabase
        .from('patient')
        .insert({
          name: formData.name.trim(),
          surname: formData.surname.trim() || null,
          phone_number: formData.phoneNumber.trim(),
          address: validAddresses,
          pharmacy_id: pharmacyId,
        });

      // If there's an error, show it
      if (error) {
        console.error('Error creating patient:', error);
        toast.error(error.message || 'Failed to create patient. Please try again.');
        return;
      }

      toast.success('Patient created successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <BackgroundGradient style={styles.container}>
      {Platform.OS === 'web' && <Sidebar />}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Web Add Patient Card - Wraps all content */}
        {Platform.OS === 'web' ? (
          <View style={styles.webAddPatientCard}>
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
            ]}>Add New Patient</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Create a new patient record for your pharmacy
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
              <View key={index} style={styles.addressCard}>
                <View style={styles.addressCardHeader}>
                  <Text style={styles.addressCardTitle}>Address {index + 1}</Text>
                  {addresses.length > 1 && (
                    <Pressable
                      style={styles.removeAddressButton}
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
                    </Pressable>
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
              </View>
            ))}

            <Pressable
              style={styles.addAddressButton}
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
            </Pressable>

            {errors.addresses && (
              <Text style={styles.errorText}>{errors.addresses}</Text>
            )}
          </View>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.button,
                styles.buttonSecondary,
                loading && styles.buttonDisabled
              ]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.buttonPrimary,
                loading && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {loading ? 'Creating...' : 'Create Patient'}
              </Text>
            </Pressable>
          </View>
        </TransparentCard>
          </View>
        ) : (
          <>
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
            ]}>Add New Patient</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Create a new patient record for your pharmacy
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
                  <View key={index} style={styles.addressCard}>
                    <View style={styles.addressCardHeader}>
                      <Text style={styles.addressCardTitle}>Address {index + 1}</Text>
                      {addresses.length > 1 && (
                        <Pressable
                          style={styles.removeAddressButton}
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
                        </Pressable>
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
                  </View>
                ))}

                <Pressable
                  style={styles.addAddressButton}
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
                </Pressable>

                {errors.addresses && (
                  <Text style={styles.errorText}>{errors.addresses}</Text>
                )}
              </View>

              {/* Button Row */}
              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.button,
                    styles.buttonSecondary,
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    styles.buttonPrimary,
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                    {loading ? 'Creating...' : 'Create Patient'}
                  </Text>
                </Pressable>
              </View>
            </TransparentCard>
          </>
        )}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}

