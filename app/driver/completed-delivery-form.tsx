import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Alert, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useToast } from '@/components/toast';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';
import { decode as base64ToArrayBuffer } from 'base64-arraybuffer';
import { getDriverSupabaseClient } from '@/lib/auth';

// Convert URI or data URI to uploadable format (Blob for web, ArrayBuffer for React Native)
async function prepareFileForUpload(fileUriOrBase64: string): Promise<Blob | ArrayBuffer> {
  // Web: Use Blob
  if (Platform.OS === 'web') {
    const response = await fetch(fileUriOrBase64);
    return await response.blob();
  }
  
  // React Native: Use ArrayBuffer (Supabase recommended approach)
  if (fileUriOrBase64.startsWith('data:')) {
    // Extract base64 from data URI
    const base64Data = fileUriOrBase64.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URI');
    }
    // Decode base64 to ArrayBuffer
    return base64ToArrayBuffer(base64Data);
  }
  
  // File URI - fetch and convert to ArrayBuffer
  const response = await fetch(fileUriOrBase64);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  return await response.arrayBuffer();
}

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
  formCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.md,
  },
  formField: {
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.overlayBackground,
  },
  formInputError: {
    borderColor: theme.colors.status.error,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
  },
  photoSection: {
    marginBottom: theme.spacing.md,
  },
  photoButton: {
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  signatureSection: {
    marginBottom: theme.spacing.md,
  },
  signatureContainer: {
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.md,
    height: 200,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  signatureActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  clearButton: {
    flex: 1,
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: theme.getStatusColor('delivered'),
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
  },
  loadingText: {
    ...theme.typography.body,
    textAlign: 'center',
    opacity: theme.opacity.overlay,
  },
});


interface DeliveryDetails {
  id: number;
  order_id: string;
  status: string;
  cold_chain: boolean;
}

export default function CompletedDeliveryFormScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [recipientIdNumber, setRecipientIdNumber] = useState('');
  const [scriptNumber, setScriptNumber] = useState('');
  const [temperature, setTemperature] = useState('');
  
  // Files
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signaturePreviewUri, setSignaturePreviewUri] = useState<string | null>(null);
  
  // Track drawing state to disable scrolling
  const [isDrawing, setIsDrawing] = useState(false);
  // Track whether signature has been confirmed (hides canvas, shows preview only)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState<{
    recipientName?: string;
    recipientIdNumber?: string;
    temperature?: string;
    photo?: string;
    signature?: string;
  }>({});
  
  const signatureRef = useRef<any>(null);
  const toast = useToast();

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
        .select('id, order_id, status, cold_chain')
        .eq('id', parseInt(id, 10))
        .single();

      if (error) {
        console.error('Error fetching delivery details:', error);
        toast.error('Failed to load delivery details');
        router.back();
      } else {
        setDelivery(data);
      }
    } catch (error: any) {
      console.error('Error fetching delivery details:', error);
      toast.error(error.message || 'Failed to load delivery details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Please grant photo library permissions to upload photos.');
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Please grant camera permissions to take photos.');
        return false;
      }
    }
    return true;
  };

  const handlePickPhoto = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setErrors(prev => ({ ...prev, photo: undefined }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.error('Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setErrors(prev => ({ ...prev, photo: undefined }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('Failed to take photo');
    }
  };

  const handleSignatureOK = (signature: string) => {
    console.log('=== Signature captured ===');
    console.log('Signature data length:', signature?.length || 0);
    console.log('Signature data preview:', signature?.substring(0, 100) || 'null/undefined');
    console.log('Is data URI:', signature?.startsWith('data:image'));
    
    if (signature && signature.trim() !== '') {
      setSignatureData(signature);
      // Set preview URI for display
      setSignaturePreviewUri(signature);
      setErrors(prev => ({ ...prev, signature: undefined }));
      console.log('✓ Signature data and preview set');
    } else {
      console.warn('⚠ Signature is empty or invalid');
    }
  };

  const handleSignatureBegin = () => {
    // Disable scrolling when drawing starts
    setIsDrawing(true);
  };

  const handleSignatureEnd = () => {
    // Re-enable scrolling when drawing ends
    // Use a small delay to ensure the touch event is fully processed
    setTimeout(() => {
      setIsDrawing(false);
    }, 100);
  };

  const handleConfirmSignature = () => {
    // Read the current signature - onOK will fire and set signatureData
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
    setSignatureConfirmed(true);
  };

  const handleSignatureClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    setSignatureData(null);
    setSignaturePreviewUri(null);
    setSignatureConfirmed(false);
    setErrors(prev => ({ ...prev, signature: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!recipientIdNumber.trim()) {
      newErrors.recipientIdNumber = 'Recipient ID number is required';
    }

    if (delivery?.cold_chain) {
      if (!temperature.trim()) {
        newErrors.temperature = 'Temperature is required for cold chain deliveries';
      } else {
        const tempValue = parseFloat(temperature);
        if (isNaN(tempValue)) {
          newErrors.temperature = 'Temperature must be a valid number';
        }
      }
    }

    // Photo is optional - no validation needed

    if (!signatureData) {
      newErrors.signature = 'Digital signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (fileUri: string, fileName: string, bucket: string): Promise<string | null> => {
    try {
      const driverSupabase = await getDriverSupabaseClient();
      const filePath = `deliveries/${delivery?.id}/${fileName}`;
      
      const fileData = await prepareFileForUpload(fileUri);
      
      const { data, error } = await driverSupabase.storage
        .from(bucket)
        .upload(filePath, fileData, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = driverSupabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const uploadSignature = async (signatureBase64: string): Promise<string | null> => {
    try {
      const driverSupabase = await getDriverSupabaseClient();
      const filePath = `deliveries/${delivery?.id}/signature.png`;
      
      const fileData = await prepareFileForUpload(signatureBase64);
      
      const { data, error } = await driverSupabase.storage
        .from('delivery-documents')
        .upload(filePath, fileData, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = driverSupabase.storage
        .from('delivery-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading signature:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    console.log('=== Starting delivery completion ===');
    console.log('Delivery:', delivery);
    console.log('Form state:', {
      recipientName: recipientName,
      recipientIdNumber: recipientIdNumber,
      temperature: temperature,
      hasPhoto: !!photoUri,
      hasSignature: !!signatureData,
    });
    
    const isValid = validateForm();
    console.log('Form validation result:', isValid);
    
    if (!isValid || !delivery) {
      console.log('✗ Form validation failed or delivery is null');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Creating driver Supabase client for database update...');
      const driverSupabase = await getDriverSupabaseClient();
      console.log('✓ Driver Supabase client created');

      // Upload photo
      let photoUrl: string | null = null;
      if (photoUri) {
        console.log('Photo URI exists, uploading photo...');
        try {
          photoUrl = await uploadFile(photoUri, `photo_${Date.now()}.jpg`, 'delivery-documents');
          console.log('✓ Photo uploaded successfully, URL:', photoUrl);
        } catch (photoError: any) {
          console.error('✗ Photo upload failed:', photoError);
          throw new Error(`Photo upload failed: ${photoError?.message || photoError}`);
        }
      } else {
        console.log('No photo to upload');
      }

      // Upload signature - use preview URI since that's what's displayed and verified
      let signatureUrl: string | null = null;
      if (signaturePreviewUri) {
        console.log('Signature preview URI exists, uploading signature from preview...');
        console.log('Preview URI length:', signaturePreviewUri?.length || 0);
        console.log('Preview URI preview:', signaturePreviewUri?.substring(0, 100) || 'null/undefined');
        try {
          signatureUrl = await uploadSignature(signaturePreviewUri);
          console.log('✓ Signature uploaded successfully, URL:', signatureUrl);
        } catch (signatureError: any) {
          console.error('✗ Signature upload failed:', signatureError);
          throw new Error(`Signature upload failed: ${signatureError?.message || signatureError}`);
        }
      } else if (signatureData) {
        // Fallback to signatureData if preview URI is not available
        console.log('Signature preview URI not available, using signature data...');
        try {
          signatureUrl = await uploadSignature(signatureData);
          console.log('✓ Signature uploaded successfully, URL:', signatureUrl);
        } catch (signatureError: any) {
          console.error('✗ Signature upload failed:', signatureError);
          throw new Error(`Signature upload failed: ${signatureError?.message || signatureError}`);
        }
      } else {
        console.log('No signature data to upload');
      }

      // Update delivery record
      console.log('Preparing delivery update data...');
      const updateData: any = {
        recipient_name: recipientName.trim(),
        recipient_id_number: recipientIdNumber.trim(),
        script_number: scriptNumber.trim() || null,
        status: 'delivered',
      };

      if (delivery.cold_chain && temperature.trim()) {
        updateData.temperature = parseFloat(temperature);
        console.log('Temperature added:', updateData.temperature);
      }

      if (photoUrl) {
        updateData.photo = photoUrl;
        console.log('Photo URL added to update data');
      }

      if (signatureUrl) {
        updateData.digital_signature = signatureUrl;
        console.log('Signature URL added to update data');
      }

      console.log('Update data:', updateData);
      console.log('Updating delivery record, ID:', delivery.id);

      const { data: updateResult, error } = await driverSupabase
        .from('delivery')
        .update(updateData)
        .eq('id', delivery.id)
        .select();

      if (error) {
        console.error('✗ Error updating delivery:', error);
        toast.error('Failed to complete delivery. Please try again.');
      } else {
        console.log('✓ Delivery updated successfully');
        toast.success('Delivery completed successfully!');
        router.back();
      }
    } catch (error: any) {
      console.error('✗ Error completing delivery:', error);
      toast.error(error.message || 'Failed to complete delivery. Please try again.');
    } finally {
      setSubmitting(false);
      console.log('=== Delivery completion process finished ===');
    }
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
              Completed Delivery Form
            </Text>
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading delivery details...
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
              Completed Delivery Form
            </Text>
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Delivery not found
          </Text>
        </ScrollView>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDrawing}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
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
            Completed Delivery Form
          </Text>
        </View>

        {/* Form Card */}
        <TransparentCard style={styles.formCard}>
          {/* Recipient Name */}
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Recipient Name *
            </Text>
            <TextInput
              style={[
                styles.formInput,
                { color: theme.colors.text },
                errors.recipientName && styles.formInputError,
              ]}
              value={recipientName}
              onChangeText={(text) => {
                setRecipientName(text);
                setErrors(prev => ({ ...prev, recipientName: undefined }));
              }}
              placeholder="Enter recipient name"
              placeholderTextColor={theme.colors.textSecondary}
            />
            {errors.recipientName && (
              <Text style={styles.errorText}>{errors.recipientName}</Text>
            )}
          </View>

          {/* Recipient ID Number */}
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Recipient ID Number *
            </Text>
            <TextInput
              style={[
                styles.formInput,
                { color: theme.colors.text },
                errors.recipientIdNumber && styles.formInputError,
              ]}
              value={recipientIdNumber}
              onChangeText={(text) => {
                setRecipientIdNumber(text);
                setErrors(prev => ({ ...prev, recipientIdNumber: undefined }));
              }}
              placeholder="Enter recipient ID number"
              placeholderTextColor={theme.colors.textSecondary}
            />
            {errors.recipientIdNumber && (
              <Text style={styles.errorText}>{errors.recipientIdNumber}</Text>
            )}
          </View>

          {/* Script Number */}
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Script Number (Optional)
            </Text>
            <TextInput
              style={[styles.formInput, { color: theme.colors.text }]}
              value={scriptNumber}
              onChangeText={setScriptNumber}
              placeholder="Enter script number"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>

          {/* Temperature (only if cold chain) */}
          {delivery.cold_chain && (
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>
                Temperature (°C) *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  { color: theme.colors.text },
                  errors.temperature && styles.formInputError,
                ]}
                value={temperature}
                onChangeText={(text) => {
                  setTemperature(text);
                  setErrors(prev => ({ ...prev, temperature: undefined }));
                }}
                placeholder="Enter temperature (e.g., 4.5)"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
              />
              {errors.temperature && (
                <Text style={styles.errorText}>{errors.temperature}</Text>
              )}
            </View>
          )}

          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Delivery Photo (Optional)
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Pressable
                style={[styles.photoButton, { flex: 1, backgroundColor: theme.colors.overlayBackground }]}
                onPress={handleTakePhoto}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={theme.iconSizes.md}
                  color={theme.colors.text}
                />
                <Text style={[styles.submitButtonText, { color: theme.colors.text }]}>
                  Take Photo
                </Text>
              </Pressable>
              <Pressable
                style={[styles.photoButton, { flex: 1, backgroundColor: theme.colors.overlayBackground }]}
                onPress={handlePickPhoto}
              >
                <MaterialIcons
                  name="photo-library"
                  size={theme.iconSizes.md}
                  color={theme.colors.text}
                />
                <Text style={[styles.submitButtonText, { color: theme.colors.text }]}>
                  Gallery
                </Text>
              </Pressable>
            </View>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            )}
            {errors.photo && (
              <Text style={styles.errorText}>{errors.photo}</Text>
            )}
          </View>

          {/* Digital Signature */}
          <View style={styles.signatureSection}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Digital Signature *
            </Text>

            {/* Canvas — hidden once confirmed to avoid duplicate display */}
            {!signatureConfirmed && (
              <>
                <View style={styles.signatureContainer}>
                  <SignatureCanvas
                    ref={signatureRef}
                    onOK={handleSignatureOK}
                    onBegin={handleSignatureBegin}
                    onEnd={handleSignatureEnd}
                    descriptionText="Sign here"
                    clearText=""
                    confirmText=""
                    webStyle={`
                      .m-signature-pad {
                        box-shadow: none;
                        border: none;
                      }
                      .m-signature-pad--body {
                        border: none;
                      }
                      .m-signature-pad--footer {
                        display: none;
                      }
                      .m-signature-pad--body canvas {
                        border-radius: ${theme.borderRadius.md}px;
                      }
                    `}
                    backgroundColor={theme.colors.overlayBackground}
                    penColor={theme.colors.text}
                    autoClear={false}
                  />
                </View>
                <View style={styles.signatureActions}>
                  <Pressable
                    style={[styles.clearButton, { backgroundColor: theme.colors.status.pickedUp }]}
                    onPress={handleConfirmSignature}
                  >
                    <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                      Confirm Signature
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.clearButton, { backgroundColor: theme.colors.overlayBackground }]}
                    onPress={handleSignatureClear}
                  >
                    <Text style={[styles.submitButtonText, { color: theme.colors.text }]}>
                      Clear
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Preview — shown after confirm */}
            {signatureConfirmed && signaturePreviewUri && (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={[styles.formLabel, { color: theme.colors.status.successText, marginBottom: theme.spacing.xs }]}>
                  ✓ Signature confirmed
                </Text>
                <View style={[styles.signatureContainer, { height: 150 }]}>
                  <Image
                    source={{ uri: signaturePreviewUri }}
                    style={{ width: '100%', height: '100%', borderRadius: theme.borderRadius.md }}
                    resizeMode="contain"
                  />
                </View>
                <Pressable
                  style={[styles.clearButton, { backgroundColor: theme.colors.overlayBackground, marginTop: theme.spacing.sm }]}
                  onPress={handleSignatureClear}
                >
                  <Text style={[styles.submitButtonText, { color: theme.colors.text }]}>
                    Redo Signature
                  </Text>
                </Pressable>
              </View>
            )}

            {errors.signature && (
              <Text style={styles.errorText}>{errors.signature}</Text>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Complete Delivery'}
            </Text>
          </Pressable>
        </TransparentCard>
      </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}
