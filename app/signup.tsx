import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Image, Text } from 'react-native';
import { router } from 'expo-router';

import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { signUpAndBootstrap } from '@/lib/auth';

// Web-specific styles
const createWebStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
  },
  webCardWrapper: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { 
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' as any,
      '@media (max-width: 768px)': { 
        flexDirection: 'column',
        maxWidth: '100%'
      } as any 
    } : {}),
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  leftSection: {
    flex: 1,
    backgroundColor: '#8b5cf6', // Purple color for consistency with app theme
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    ...(Platform.OS === 'web' ? { 
      '@media (max-width: 768px)': { display: 'none' } as any 
    } : {}),
  },
  rightSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  brandSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 16,
  },
  signupForm: {
    width: '100%',
    ...(Platform.OS === 'web' ? { maxWidth: 400 } : {}),
  },
  signupTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'left',
  },
  fieldGroup: {
    marginBottom: 24,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#FFFFFF',
  },
  signupButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8b5cf6', // Purple for consistency with app theme
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

// Mobile styles (existing)
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
    paddingTop: theme.spacing.screenPadding + 40,
    paddingBottom: theme.spacing.screenPadding,
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerWrap: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.componentGap,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
  },
  subtitle: {
    ...theme.typography.body,
    opacity: theme.opacity.overlay,
    textAlign: 'center',
  },
  card: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  doubleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  label: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
  },
  primaryButton: {
    height: 50,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  primaryButtonText: {
    color: '#fff',
    ...theme.typography.body,
    fontFamily: theme.fonts.bold,
  },
  footerRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.status.error,
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default function SignupScreen() {
  const theme = useTheme();
  const [pharmacyName, setPharmacyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';
  const webStyles = createWebStyles(theme);
  const mobileStyles = createStyles(theme);
  const styles = isWeb ? webStyles : mobileStyles;

  const handleSignUp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signUpAndBootstrap({
        email: email.trim(),
        password,
        pharmacyName: pharmacyName.trim(),
        name: firstName.trim(),
        surname: surname.trim(),
      });
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Web layout
  if (isWeb) {
    return (
      <View style={webStyles.webContainer}>
        <TransparentCard style={webStyles.webCardWrapper}>
          <View style={webStyles.webContent}>
            {/* Left Section - Branding */}
            <View style={webStyles.leftSection}>
              <View style={webStyles.logoContainer}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={webStyles.logo}
                  resizeMode="contain"
                />
                <Text style={webStyles.brandText}>PharmaDelivery</Text>
                <Text style={webStyles.brandSubtext}>
                  Join PharmaDelivery platform,{'\n'}specialized in pharmaceutical delivery services.
                </Text>
              </View>
            </View>

            {/* Right Section - Signup Form */}
            <View style={webStyles.rightSection}>
              <View style={webStyles.signupForm}>
                <Text style={webStyles.signupTitle}>Create Account</Text>

                <View style={webStyles.fieldGroup}>
                  <Text style={webStyles.label}>Pharmacy Name</Text>
                  <TextInput
                    value={pharmacyName}
                    onChangeText={setPharmacyName}
                    placeholder="Acme Pharmacy"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={webStyles.input}
                  />
                </View>

                <View style={webStyles.doubleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={webStyles.label}>First Name</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="John"
                      placeholderTextColor={theme.colors.textTertiary}
                      style={webStyles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={webStyles.label}>Surname</Text>
                    <TextInput
                      value={surname}
                      onChangeText={setSurname}
                      placeholder="Doe"
                      placeholderTextColor={theme.colors.textTertiary}
                      style={webStyles.input}
                    />
                  </View>
                </View>

                <View style={webStyles.fieldGroup}>
                  <Text style={webStyles.label}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={webStyles.input}
                  />
                </View>

                <View style={webStyles.fieldGroup}>
                  <Text style={webStyles.label}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry
                    style={webStyles.input}
                  />
                </View>

                {!!error && (
                  <Text style={webStyles.errorText}>{error}</Text>
                )}

                <Pressable
                  style={[webStyles.signupButton, { opacity: submitting ? 0.7 : 1 }]}
                  onPress={handleSignUp}
                  disabled={submitting}
                >
                  <Text style={webStyles.signupButtonText}>
                    {submitting ? 'Creating…' : 'Create Account'}
                  </Text>
                </Pressable>

                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Already have an account? </Text>
                  <Pressable onPress={() => router.replace('/login')}>
                    <Text style={{ color: '#8b5cf6', fontSize: 14, fontWeight: '600' }}>
                      Sign in
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </TransparentCard>
      </View>
    );
  }

  // Mobile layout (existing)
  return (
    <BackgroundGradient style={mobileStyles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          style={mobileStyles.scrollView}
          contentContainerStyle={mobileStyles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={mobileStyles.headerWrap}>
            <View style={mobileStyles.logoCircle}>
              <Image source={require('@/assets/images/icon.png')} style={{ width: 44, height: 44 }} />
            </View>
            <Text style={[mobileStyles.title, { color: theme.colors.text }]}>Create account</Text>
            <Text style={[mobileStyles.subtitle, { color: theme.colors.textSecondary }]}>Join PharmaDelivery</Text>
          </View>

          <TransparentCard style={mobileStyles.card}>
            <View style={mobileStyles.fieldGroup}>
              <Text style={[mobileStyles.label, { color: theme.colors.text }]}>Pharmacy Name</Text>
              <TextInput
                value={pharmacyName}
                onChangeText={setPharmacyName}
                placeholder="Acme Pharmacy"
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                  mobileStyles.input, 
                  { 
                    color: theme.colors.text, 
                    borderColor: theme.colors.overlayBackground,
                    backgroundColor: theme.colors.overlayBackground,
                    opacity: theme.opacity.overlay,
                  }
                ]}
              />
            </View>

            <View style={mobileStyles.doubleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[mobileStyles.label, { color: theme.colors.text }]}>Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[
                    mobileStyles.input, 
                    { 
                      color: theme.colors.text, 
                      borderColor: theme.colors.overlayBackground,
                      backgroundColor: theme.colors.overlayBackground,
                      opacity: theme.opacity.overlay,
                    }
                  ]}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[mobileStyles.label, { color: theme.colors.text }]}>Surname</Text>
                <TextInput
                  value={surname}
                  onChangeText={setSurname}
                  placeholder="Doe"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[
                    mobileStyles.input, 
                    { 
                      color: theme.colors.text, 
                      borderColor: theme.colors.overlayBackground,
                      backgroundColor: theme.colors.overlayBackground,
                      opacity: theme.opacity.overlay,
                    }
                  ]}
                />
              </View>
            </View>

            <View style={mobileStyles.fieldGroup}>
              <Text style={[mobileStyles.label, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  mobileStyles.input, 
                  { 
                    color: theme.colors.text, 
                    borderColor: theme.colors.overlayBackground,
                    backgroundColor: theme.colors.overlayBackground,
                    opacity: theme.opacity.overlay,
                  }
                ]}
              />
            </View>

            <View style={mobileStyles.fieldGroup}>
              <Text style={[mobileStyles.label, { color: theme.colors.text }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                style={[
                  mobileStyles.input, 
                  { 
                    color: theme.colors.text, 
                    borderColor: theme.colors.overlayBackground,
                    backgroundColor: theme.colors.overlayBackground,
                    opacity: theme.opacity.overlay,
                  }
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              style={[
                mobileStyles.primaryButton, 
                { 
                  backgroundColor: '#8b5cf6', // Purple for consistency
                  opacity: submitting ? 0.7 : 1 
                }
              ]}
              disabled={submitting}
              onPress={handleSignUp}
            >
              <Text style={mobileStyles.primaryButtonText}>{submitting ? 'Creating…' : 'Create account'}</Text>
            </Pressable>
            {!!error && (
              <Text style={mobileStyles.errorText}>{error}</Text>
            )}
          </TransparentCard>

          <View style={mobileStyles.footerRow}>
            <Text style={{ color: theme.colors.textSecondary }}>Already have an account? </Text>
            <Pressable accessibilityRole="link" onPress={() => router.replace('/login')}>
              <Text style={{ color: '#8b5cf6', fontFamily: theme.fonts.semiBold }}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}
