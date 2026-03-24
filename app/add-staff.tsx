import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Text, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
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
    paddingTop: theme.spacing.screenPadding + 20, // Extra top padding
    paddingBottom: 80, // Account for floating nav bar
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
    gap: theme.spacing.md,
  },
  fieldGroup: {
    gap: theme.spacing.xs + 2,
  },
  doubleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
  },
  input: {
    height: 48,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
  },
  inputContainer: {
    opacity: theme.opacity.overlay,
    borderRadius: theme.borderRadius.card,
  },
  pickerContainer: {
    height: 48,
    borderRadius: theme.borderRadius.card,
    justifyContent: 'center',
    opacity: theme.opacity.overlay,
  },
  picker: {
    height: 48,
  },
  submitButton: {
    height: 50,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  submitButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
  },
  errorText: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});

export default function AddStaffScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState<'admin' | 'regular'>('regular');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const styles = createStyles(theme);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Generate a secure temporary password
  const generateTempPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!surname.trim()) {
      setError('Surname is required');
      return;
    }

    setSubmitting(true);

    try {
      // Get pharmacy ID for the current user
      const { pharmacyId } = await getCurrentUserPharmacy();

      // Generate a temporary password for the new staff member
      const tempPassword = generateTempPassword();

      // Step 1: Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: tempPassword,
        options: {
          emailRedirectTo: undefined, // They'll need to set password on first login
        },
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          setError('A user with this email already exists. Please use a different email.');
          return;
        }
        throw signUpError;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        throw new Error('Failed to create user account.');
      }

      // Step 2: Create pharmacist record
      const { error: pharmacistError } = await supabase
        .from('pharmacists')
        .insert({
          user_id: userId,
          pharmacy_id: pharmacyId,
          name: name.trim(),
          surname: surname.trim(),
          role: role === 'admin' ? 'admin' : 'regular',
        });

      if (pharmacistError) {
        console.error('Error creating pharmacist record:', pharmacistError);
        // Try to clean up the auth user if pharmacist creation fails
        // Note: We can't easily delete the auth user from client-side, but the error will be shown
        throw new Error(pharmacistError.message || 'Failed to create pharmacist record. The user account was created but may need manual cleanup.');
      }

      // Success - show alert with instructions
      Alert.alert(
        'Success',
        `Staff member added successfully!\n\nAn invitation email has been sent to ${email.trim()}. They will need to:\n1. Confirm their email address\n2. Use "Forgot Password" to set their password\n3. Log in with their email and new password`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (e: any) {
      console.error('Error adding staff member:', e);
      setError(e?.message ?? 'Failed to add staff member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = Boolean(email.trim() && validateEmail(email.trim()) && name.trim() && surname.trim());

  return (
    <BackgroundGradient style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
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
                Add Staff Member
              </Text>
              <View style={styles.placeholder} />
            </View>
            <Text style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary }
            ]}>
              Add a new staff member to your pharmacy
            </Text>
          </View>

          {/* Form Card */}
          <TransparentCard style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={[
                styles.label,
                { color: theme.colors.text }
              ]}>
                Email
              </Text>
              <View style={[
                styles.inputContainer,
                { backgroundColor: theme.colors.overlayBackground }
              ]}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="staff@example.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    { color: theme.colors.text }
                  ]}
                />
              </View>
            </View>

            <View style={styles.doubleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.label,
                  { color: theme.colors.text }
                ]}>
                  Name
                </Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme.colors.overlayBackground }
                ]}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="John"
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[
                      styles.input,
                      { color: theme.colors.text }
                    ]}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.label,
                  { color: theme.colors.text }
                ]}>
                  Surname
                </Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme.colors.overlayBackground }
                ]}>
                  <TextInput
                    value={surname}
                    onChangeText={setSurname}
                    placeholder="Doe"
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[
                      styles.input,
                      { color: theme.colors.text }
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[
                styles.label,
                { color: theme.colors.text }
              ]}>
                Role
              </Text>
              <View style={[
                styles.pickerContainer,
                {
                  backgroundColor: theme.colors.overlayBackground
                }
              ]}>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={[
                    styles.picker,
                    { color: theme.colors.text }
                  ]}
                >
                  <Picker.Item label="Regular" value="regular" />
                  <Picker.Item label="Admin" value="admin" />
                </Picker>
              </View>
            </View>

            <TransparentCard
              style={StyleSheet.flatten([
                styles.submitButton,
                {
                  backgroundColor: submitting || !isFormValid
                    ? theme.colors.overlayBackground
                    : theme.getStatusColor('picked_up'),
                  opacity: submitting || !isFormValid ? theme.opacity.disabled : 1
                }
              ])}
              interactive={!submitting && isFormValid}
              onPress={handleSubmit}
            >
              <Text style={[
                styles.submitButtonText,
                { color: submitting || !isFormValid ? theme.colors.textSecondary : '#000000' }
              ]}>
                {submitting ? 'Adding…' : 'Add Staff Member'}
              </Text>
            </TransparentCard>

            {!!error && (
              <Text style={[
                styles.errorText,
                { color: '#ff4444' }
              ]}>
                {error}
              </Text>
            )}
          </TransparentCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}