import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Image, Text } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { useTheme } from '@/hooks/use-theme';
import { signInWithEmail, signInDriver } from '@/lib/auth';

type SignInMode = 'staff' | 'driver';

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
  loginForm: {
    width: '100%',
    ...(Platform.OS === 'web' ? { maxWidth: 400 } : {}),
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'left',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#8b5cf6', // Purple for consistency with app theme
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  fieldGroup: {
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
  passwordContainer: {
    position: 'relative',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  forgotPassword: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  registerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6', // Purple for consistency with app theme
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6', // Purple for consistency with app theme
  },
  loginButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8b5cf6', // Purple for consistency with app theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    paddingBottom: 100,
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
    textAlign: 'center',
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
  modeToggle: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.colors.overlayBackground,
    padding: 4,
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modeButtonText: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  fieldGroup: {
    gap: theme.spacing.sm,
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
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.status.error,
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default function LoginScreen() {
  const theme = useTheme();
  const [signInMode, setSignInMode] = useState<SignInMode>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isWeb = Platform.OS === 'web';
  const styles = (isWeb ? createWebStyles(theme) : createStyles(theme)) as ReturnType<typeof createStyles> & ReturnType<typeof createWebStyles>;

  const handleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (signInMode === 'staff') {
        await signInWithEmail(email.trim(), password);
        router.replace('/');
      } else {
        if (!pharmacyId.trim() || !pin.trim()) {
          setError('Please enter pharmacy ID and PIN');
          setSubmitting(false);
          return;
        }
        if (pin.length !== 4) {
          setError('PIN must be 4 digits');
          setSubmitting(false);
          return;
        }
        await signInDriver(parseInt(pharmacyId.trim(), 10), pin.trim());
        router.replace('/driver');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Web layout
  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <TransparentCard style={styles.webCardWrapper}>
          <View style={styles.webContent}>
            {/* Left Section - Branding */}
            <View style={styles.leftSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandText}>PharmaDelivery</Text>
                <Text style={styles.brandSubtext}>
                  Welcome to PharmaDelivery platform,{'\n'}specialized in pharmaceutical delivery services.
                </Text>
              </View>
            </View>

            {/* Right Section - Login Form */}
            <View style={styles.rightSection}>
              <View style={styles.loginForm}>
                <Text style={styles.loginTitle}>Sign In</Text>

                {/* Mode Toggle */}
                <View style={styles.modeToggle}>
                  <Pressable
                    style={[
                      styles.modeButton,
                      signInMode === 'staff' && styles.modeButtonActive
                    ]}
                    onPress={() => setSignInMode('staff')}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      signInMode === 'staff' && styles.modeButtonTextActive
                    ]}>
                      Pharmacist
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modeButton,
                      signInMode === 'driver' && styles.modeButtonActive
                    ]}
                    onPress={() => setSignInMode('driver')}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      signInMode === 'driver' && styles.modeButtonTextActive
                    ]}>
                      Driver
                    </Text>
                  </Pressable>
                </View>

                {signInMode === 'staff' ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Your Email"
                        placeholderTextColor={theme.colors.textTertiary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Password here"
                          placeholderTextColor={theme.colors.textTertiary}
                          secureTextEntry={!showPassword}
                          style={styles.input}
                        />
                        <Pressable 
                          style={styles.eyeIconContainer}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <MaterialIcons 
                            name={showPassword ? 'visibility' : 'visibility-off'} 
                            size={20} 
                            color={theme.colors.textSecondary} 
                          />
                        </Pressable>
                      </View>
                      <Pressable onPress={() => {}}>
                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Pharmacy ID</Text>
                      <TextInput
                        value={pharmacyId}
                        onChangeText={setPharmacyId}
                        placeholder="Enter pharmacy ID"
                        placeholderTextColor={theme.colors.textTertiary}
                        keyboardType="number-pad"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>PIN</Text>
                      <TextInput
                        value={pin}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                          setPin(numericText);
                        }}
                        placeholder="0000"
                        placeholderTextColor={theme.colors.textTertiary}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        style={styles.input}
                      />
                    </View>
                  </>
                )}

                {!!error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.registerButton}
                    onPress={() => router.push('/signup')}
                  >
                    <Text style={styles.registerButtonText}>Register</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.loginButton, { opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleSignIn}
                    disabled={submitting}
                  >
                    <Text style={styles.loginButtonText}>
                      {submitting ? 'Signing in…' : 'Sign In'}
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
    <BackgroundGradient style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.headerWrap}>
            <View style={styles.logoCircle}>
              <Image source={require('@/assets/images/icon.png')} style={{ width: 44, height: 44 }} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {signInMode === 'staff' ? 'Sign in to continue delivering' : 'Sign in with your pharmacy PIN'}
            </Text>
          </View>

          <TransparentCard style={styles.card}>
            <View style={styles.modeToggle}>
              <Pressable
                style={[
                  styles.modeButton, 
                  signInMode === 'staff' && { backgroundColor: theme.getStatusColor('picked_up') }
                ]}
                onPress={() => setSignInMode('staff')}
              >
                <Text 
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                  style={[
                    styles.modeButtonText, 
                    { color: signInMode === 'staff' ? '#FFFFFF' : theme.colors.textSecondary },
                    signInMode === 'staff' && styles.modeButtonTextActive
                  ]}
                >
                  Pharmacist
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modeButton, 
                  signInMode === 'driver' && { backgroundColor: theme.getStatusColor('picked_up') }
                ]}
                onPress={() => setSignInMode('driver')}
              >
                <Text 
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                  style={[
                    styles.modeButtonText, 
                    { color: signInMode === 'driver' ? '#FFFFFF' : theme.colors.textSecondary },
                    signInMode === 'driver' && styles.modeButtonTextActive
                  ]}
                >
                  Driver
                </Text>
              </Pressable>
            </View>

            {signInMode === 'staff' ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={[
                      styles.input, 
                      { 
                        color: theme.colors.text, 
                        borderColor: theme.colors.overlayBackground,
                        backgroundColor: theme.colors.overlayBackground,
                        opacity: theme.opacity.overlay,
                      }
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    style={[
                      styles.input, 
                      { 
                        color: theme.colors.text, 
                        borderColor: theme.colors.overlayBackground,
                        backgroundColor: theme.colors.overlayBackground,
                        opacity: theme.opacity.overlay,
                      }
                    ]}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Pharmacy ID</Text>
                  <TextInput
                    value={pharmacyId}
                    onChangeText={setPharmacyId}
                    placeholder="Enter pharmacy ID"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="number-pad"
                    style={[
                      styles.input, 
                      { 
                        color: theme.colors.text, 
                        borderColor: theme.colors.overlayBackground,
                        backgroundColor: theme.colors.overlayBackground,
                        opacity: theme.opacity.overlay,
                      }
                    ]}
                  />
                </View>
                  <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>PIN</Text>
                    <TextInput
                    value={pin}
                    onChangeText={(text) => {
                      // Only allow 4 digits
                      const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                      setPin(numericText);
                    }}
                    placeholder="0000"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                      style={[
                        styles.input, 
                        { 
                          color: theme.colors.text, 
                          borderColor: theme.colors.overlayBackground,
                          backgroundColor: theme.colors.overlayBackground,
                          opacity: theme.opacity.overlay,
                        }
                      ]}
                    />
                  </View>
              </>
            )}

            <Pressable
              accessibilityRole="button"
              style={[
                styles.primaryButton, 
                { 
                  backgroundColor: theme.getStatusColor('picked_up'), 
                  opacity: submitting ? 0.7 : 1 
                }
              ]}
              disabled={submitting}
              onPress={handleSignIn}
            >
              <Text style={styles.primaryButtonText}>
                {submitting
                  ? (signInMode === 'staff' ? 'Signing in…' : 'Signing in…')
                  : (signInMode === 'staff'
                      ? 'Sign in as Pharmacist'
                      : 'Sign in as Driver')}
              </Text>
            </Pressable>
            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </TransparentCard>

          <View style={styles.footerRow}>
            <Text style={{ color: theme.colors.textSecondary, flexShrink: 0 }}>New to PharmaDelivery? </Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/signup')}>
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.semiBold, flexShrink: 0 }}>
                Create an account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}
