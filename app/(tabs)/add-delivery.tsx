import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { Sidebar } from '@/components/sidebar';
import { DeliveryProgressTracker } from '@/components/delivery-progress-tracker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { getCurrentUserPharmacy } from '@/lib/auth';
import { useToast } from '@/components/toast';

// Patient interface matching database structure
interface Patient {
  id: number;
  name: string;
  surname: string | null;
  phone_number: string;
  address: Array<{ description: string; address: string }> | null;
}

// Address interface for display
interface DisplayAddress {
  index: number;
  description: string;
  address: string;
  isDefault?: boolean;
}

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
    paddingTop: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.screenPadding + 20, // Extra top padding
    paddingBottom: Platform.OS === 'web' ? theme.spacing.screenPadding : 80, // Account for floating nav bar on mobile
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.componentGap,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
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
  searchContainer: {
    marginBottom: theme.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.transparentCard,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },
  searchIcon: {
    color: theme.colors.textSecondary,
  },
  suggestionsContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    maxHeight: 200,
  },
  suggestionItem: {
    backgroundColor: theme.colors.transparentCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  suggestionName: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  suggestionId: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  suggestionPhone: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  suggestionAddress: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  addressCard: {
    padding: theme.spacing.md,
    marginTop: 0,
    marginBottom: theme.spacing.lg,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addressCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  addAddressButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.transparentCard,
  },
  addressList: {
    gap: theme.spacing.sm,
  },
  addressItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
    backgroundColor: theme.colors.transparentCard,
  },
  addressItemSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  addressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  addressItemLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  addressItemDefault: {
    backgroundColor: theme.colors.status.pickedUp,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.round,
  },
  addressItemDefaultText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  addressItemText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addAddressForm: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.transparentCard,
  },
  addAddressFormTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  formButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  formButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  formButtonSecondary: {
    backgroundColor: theme.colors.transparentCard,
  },
  formButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
  },
  formButtonTextPrimary: {
    color: theme.colors.background,
  },
  formButtonTextSecondary: {
    color: theme.colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  addPatientForm: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.transparentCard,
  },
  addPatientFormTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  formInputError: {
    borderColor: theme.colors.status.error,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
  },
  recipientCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  recipientCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.transparentCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  recipientInput: {
    backgroundColor: theme.colors.transparentCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
    marginTop: theme.spacing.sm,
  },
  continueButton: {
    backgroundColor: Platform.OS === 'web' ? '#d2c9fe' : theme.colors.status.pickedUp,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  continueButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  webAddDeliveryCard: {
    ...(Platform.OS === 'web' ? {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.componentGap,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    } : {}),
  },
  dateTimeCard: {
    padding: theme.spacing.md,
    marginTop: 0,
    marginBottom: theme.spacing.lg,
  },
  dateTimeCardTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.transparentCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.transparentCard,
  },
  dateTimeButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  dateTimeButtonPlaceholder: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },
});

export default function AddDeliveryScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchText, setSearchText] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    description: '',
    address: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    surname: '',
    phoneNumber: '',
    addressDescription: 'Home',
    address: '',
  });
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientFormErrors, setPatientFormErrors] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  // Memoize today so minimumDate never changes between renders (avoids picker reset)
  const today = useMemo(() => new Date(), []);
  const toast = useToast();
  const [isRecipientDifferent, setIsRecipientDifferent] = useState(false);
  const [recipientName, setRecipientName] = useState('');

  // Fetch patients from database
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { pharmacyId } = await getCurrentUserPharmacy();
        
        const { data: patientsData, error } = await supabase
          .from('patient')
          .select('id, name, surname, phone_number, address')
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching patients:', error);
          return;
        }

        setPatients(patientsData || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search text
  const filteredPatients = React.useMemo(() => {
    if (!searchText.trim()) return [];

    const query = searchText.toLowerCase();
    return patients.filter(patient => {
      const fullName = `${patient.name} ${patient.surname || ''}`.toLowerCase().trim();
      const patientId = patient.id.toString();
      return (
        fullName.includes(query) ||
        patient.name.toLowerCase().includes(query) ||
        (patient.surname && patient.surname.toLowerCase().includes(query)) ||
        patientId.includes(query) ||
        patient.phone_number.includes(query)
      );
    }).slice(0, 5); // Limit to 5 suggestions
  }, [searchText, patients]);

  // Get addresses for selected patient
  const patientAddresses: DisplayAddress[] = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.address) return [];
    
    return selectedPatient.address.map((addr, index) => ({
      index,
      description: addr.description || `Address ${index + 1}`,
      address: addr.address,
      isDefault: index === 0, // First address is default
    }));
  }, [selectedPatient]);

  // Handle search text change
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowSuggestions(text.length > 0);
    // Clear selected patient if search text changes significantly
    if (selectedPatient) {
      const fullName = `${selectedPatient.name} ${selectedPatient.surname || ''}`.toLowerCase().trim();
      if (!fullName.includes(text.toLowerCase()) && !selectedPatient.id.toString().includes(text)) {
        setSelectedPatient(null);
        setSelectedAddressIndex(null);
        setIsRecipientDifferent(false);
        setRecipientName('');
      }
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    const displayName = patient.surname ? `${patient.name} ${patient.surname}` : patient.name;
    setSearchText(displayName);
    setShowSuggestions(false);
    setSelectedAddressIndex(null);
    setShowAddAddressForm(false);
    // Reset recipient fields when patient changes
    setIsRecipientDifferent(false);
    setRecipientName('');
  };

  // Handle address selection
  const handleAddressSelect = (addressIndex: number) => {
    setSelectedAddressIndex(addressIndex);
    setShowAddAddressForm(false);
  };

  // Handle add address button press
  const handleAddAddressPress = () => {
    setShowAddAddressForm(true);
    setSelectedAddressIndex(null);
  };

  // Handle cancel add address
  const handleCancelAddAddress = () => {
    setShowAddAddressForm(false);
    setNewAddress({ description: '', address: '' });
  };

  // Handle add patient form toggle
  const handleToggleAddPatientForm = () => {
    setShowAddPatientForm(!showAddPatientForm);
    if (showAddPatientForm) {
      // Reset form when closing
      setNewPatientData({
        name: '',
        surname: '',
        phoneNumber: '',
        addressDescription: 'Home',
        address: '',
      });
      setPatientFormErrors({});
    }
    // Clear search when opening form
    if (!showAddPatientForm) {
      setSearchText('');
      setShowSuggestions(false);
    }
  };

  // Validate new patient form
  const validateNewPatientForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newPatientData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!newPatientData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(newPatientData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!newPatientData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!newPatientData.addressDescription.trim()) {
      newErrors.addressDescription = 'Address description is required';
    }

    setPatientFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save new patient
  const handleSaveNewPatient = async () => {
    if (!validateNewPatientForm()) {
      return;
    }

    try {
      setSavingPatient(true);

      // Get pharmacy ID
      const { pharmacyId } = await getCurrentUserPharmacy();

      // Prepare address array
      const patientAddresses = [{
        description: newPatientData.addressDescription.trim(),
        address: newPatientData.address.trim(),
      }];

      // Insert patient into database
      const { data: newPatient, error } = await supabase
        .from('patient')
        .insert({
          name: newPatientData.name.trim(),
          surname: newPatientData.surname.trim() || null,
          phone_number: newPatientData.phoneNumber.trim(),
          address: patientAddresses,
          pharmacy_id: pharmacyId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        toast.error(error.message || 'Failed to create patient. Please try again.');
        return;
      }

      // Add new patient to local state
      const createdPatient: Patient = {
        id: newPatient.id,
        name: newPatient.name || '',
        surname: newPatient.surname,
        phone_number: newPatient.phone_number || '',
        address: newPatient.address as Array<{ description: string; address: string }> | null,
      };

      setPatients([createdPatient, ...patients]);

      // Auto-select the newly created patient
      setSelectedPatient(createdPatient);
      setSelectedAddressIndex(0); // Select first address
      setSearchText(createdPatient.surname 
        ? `${createdPatient.name} ${createdPatient.surname}` 
        : createdPatient.name);
      
      // Reset recipient fields when selecting new patient
      setIsRecipientDifferent(false);
      setRecipientName('');
      
      // Close the form
      setShowAddPatientForm(false);
      setNewPatientData({
        name: '',
        surname: '',
        phoneNumber: '',
        addressDescription: 'Home',
        address: '',
      });
      setPatientFormErrors({});

      toast.success('Patient created and selected!');
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSavingPatient(false);
    }
  };

  // Handle save address
  const handleSaveAddress = async () => {
    if (!selectedPatient) return;

    // Validate form
    if (!newAddress.description.trim()) {
      toast.error('Please enter an address description (e.g., Home, Work)');
      return;
    }

    if (!newAddress.address.trim()) {
      toast.error('Please enter the address');
      return;
    }

    try {
      setSavingAddress(true);

      // Get current addresses or initialize empty array
      const currentAddresses = selectedPatient.address || [];
      
      // Add new address
      const updatedAddresses = [
        ...currentAddresses,
        {
          description: newAddress.description.trim(),
          address: newAddress.address.trim(),
        },
      ];

      // Update patient record in database
      const { error } = await supabase
        .from('patient')
        .update({ address: updatedAddresses })
        .eq('id', selectedPatient.id);

      if (error) {
        console.error('Error saving address:', error);
        toast.error('Failed to save address. Please try again.');
        return;
      }

      // Update local state
      setSelectedPatient({
        ...selectedPatient,
        address: updatedAddresses,
      });

      // Select the newly added address
      setSelectedAddressIndex(updatedAddresses.length - 1);
      setShowAddAddressForm(false);
      setNewAddress({ description: '', address: '' });
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format time for display
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  // Handle date change
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && date) {
        setSelectedDate(date);
      }
    } else {
      // iOS - picker stays open, update date as user scrolls
      if (date) {
        setSelectedDate(date);
      }
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    }
  };

  // Handle time change
  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && time) {
        setSelectedTime(time);
      }
    } else {
      // iOS - picker stays open, update time as user scrolls
      if (time) {
        setSelectedTime(time);
      }
      if (event.type === 'dismissed') {
        setShowTimePicker(false);
      }
    }
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Web Add Delivery Card - Wraps all content */}
          {Platform.OS === 'web' ? (
            <View style={styles.webAddDeliveryCard}>
              {/* Header Section */}
              <View style={styles.headerSection}>
          {/* Back Button */}
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
        </View>

        {/* Title */}
        <Text style={[
          styles.title,
          { color: theme.colors.text }
        ]}>Add New Pharmacy Delivery</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Create a new delivery order for the pharmacy
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TransparentCard style={styles.searchBar}>
            <MaterialIcons
              name="search"
              size={theme.iconSizes.md}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer name, id number, customer number"
              placeholderTextColor={theme.colors.textTertiary}
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!showAddPatientForm}
            />
            {searchText.length > 0 && !showAddPatientForm && (
              <Pressable onPress={() => {
                setSearchText('');
                setSelectedPatient(null);
                setSelectedAddressIndex(null);
                setShowSuggestions(false);
                setIsRecipientDifferent(false);
                setRecipientName('');
              }}>
                <MaterialIcons
                  name="clear"
                  size={theme.iconSizes.md}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            )}
            <Pressable 
              onPress={handleToggleAddPatientForm}
              style={{ marginLeft: theme.spacing.xs }}
            >
              <MaterialIcons
                name={showAddPatientForm ? "close" : "add"}
                size={theme.iconSizes.md}
                color={showAddPatientForm ? theme.colors.status.error : theme.colors.primary}
              />
            </Pressable>
          </TransparentCard>

          {/* Add Patient Form */}
          {showAddPatientForm && (
            <TransparentCard style={styles.addPatientForm}>
              <Text style={styles.addPatientFormTitle}>Add New Patient</Text>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    patientFormErrors.name && styles.formInputError
                  ]}
                  placeholder="Enter patient name"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newPatientData.name}
                  onChangeText={(text) => {
                    setNewPatientData({ ...newPatientData, name: text });
                    if (patientFormErrors.name) {
                      setPatientFormErrors({ ...patientFormErrors, name: '' });
                    }
                  }}
                  autoCapitalize="words"
                />
                {patientFormErrors.name && (
                  <Text style={styles.errorText}>{patientFormErrors.name}</Text>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Surname</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter patient surname (optional)"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newPatientData.surname}
                  onChangeText={(text) => {
                    setNewPatientData({ ...newPatientData, surname: text });
                  }}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    patientFormErrors.phoneNumber && styles.formInputError
                  ]}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newPatientData.phoneNumber}
                  onChangeText={(text) => {
                    setNewPatientData({ ...newPatientData, phoneNumber: text });
                    if (patientFormErrors.phoneNumber) {
                      setPatientFormErrors({ ...patientFormErrors, phoneNumber: '' });
                    }
                  }}
                  keyboardType="phone-pad"
                />
                {patientFormErrors.phoneNumber && (
                  <Text style={styles.errorText}>{patientFormErrors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Address Description *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    patientFormErrors.addressDescription && styles.formInputError
                  ]}
                  placeholder="e.g., Home, Work, Office"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newPatientData.addressDescription}
                  onChangeText={(text) => {
                    setNewPatientData({ ...newPatientData, addressDescription: text });
                    if (patientFormErrors.addressDescription) {
                      setPatientFormErrors({ ...patientFormErrors, addressDescription: '' });
                    }
                  }}
                />
                {patientFormErrors.addressDescription && (
                  <Text style={styles.errorText}>{patientFormErrors.addressDescription}</Text>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Address *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { minHeight: 80, textAlignVertical: 'top' },
                    patientFormErrors.address && styles.formInputError
                  ]}
                  placeholder="Enter full address"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newPatientData.address}
                  onChangeText={(text) => {
                    setNewPatientData({ ...newPatientData, address: text });
                    if (patientFormErrors.address) {
                      setPatientFormErrors({ ...patientFormErrors, address: '' });
                    }
                  }}
                  multiline
                  numberOfLines={3}
                />
                {patientFormErrors.address && (
                  <Text style={styles.errorText}>{patientFormErrors.address}</Text>
                )}
              </View>

              <View style={styles.formButtonRow}>
                <Pressable
                  style={[styles.formButton, styles.formButtonSecondary, savingPatient && styles.buttonDisabled]}
                  onPress={handleToggleAddPatientForm}
                  disabled={savingPatient}
                >
                  <Text style={[styles.formButtonText, styles.formButtonTextSecondary]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.formButton, styles.formButtonPrimary, savingPatient && styles.buttonDisabled]}
                  onPress={handleSaveNewPatient}
                  disabled={savingPatient}
                >
                  <Text style={[styles.formButtonText, styles.formButtonTextPrimary]}>
                    {savingPatient ? 'Saving...' : 'Save Patient'}
                  </Text>
                </Pressable>
              </View>
            </TransparentCard>
          )}

          {/* Search Suggestions */}
          {showSuggestions && filteredPatients.length > 0 && !showAddPatientForm && (
            <View style={styles.suggestionsContainer}>
              {filteredPatients.map((patient) => {
                const displayName = patient.surname 
                  ? `${patient.name} ${patient.surname}` 
                  : patient.name;
                return (
                  <Pressable
                    key={patient.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionSelect(patient)}
                  >
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionName}>{displayName}</Text>
                      <Text style={styles.suggestionId}>ID: {patient.id}</Text>
                    </View>
                    <Text style={styles.suggestionPhone}>{patient.phone_number}</Text>
                    {patient.address && patient.address.length > 0 && (
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {patient.address[0].address}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Selected Patient Info */}
          {selectedPatient && !showAddPatientForm && (
            <>
              <TransparentCard style={{ padding: theme.spacing.md, marginTop: theme.spacing.sm, marginBottom: 0 }}>
                <Text style={[theme.typography.body, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
                  Selected Patient:
                </Text>
                <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: theme.spacing.xs }]}>
                  {selectedPatient.surname 
                    ? `${selectedPatient.name} ${selectedPatient.surname}` 
                    : selectedPatient.name} (ID: {selectedPatient.id})
                </Text>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
                  {selectedPatient.phone_number}
                </Text>
                {selectedPatient.address && selectedPatient.address.length > 0 && (
                  <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                    {selectedPatient.address[0].address}
                  </Text>
                )}
              </TransparentCard>

              {/* Recipient Information */}
              <TransparentCard style={styles.recipientCard}>
                <Text style={styles.recipientCardTitle}>Recipient Information</Text>
                
                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() => {
                    setIsRecipientDifferent(!isRecipientDifferent);
                    if (isRecipientDifferent) {
                      setRecipientName('');
                    }
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    isRecipientDifferent && styles.checkboxChecked
                  ]}>
                    {isRecipientDifferent && (
                      <MaterialIcons
                        name="check"
                        size={theme.iconSizes.sm}
                        color={theme.colors.background}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Is the person receiving the delivery not the patient?
                  </Text>
                </Pressable>

                {isRecipientDifferent && (
                  <TextInput
                    style={styles.recipientInput}
                    placeholder="Enter recipient name"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={recipientName}
                    onChangeText={setRecipientName}
                    autoCapitalize="words"
                  />
                )}
              </TransparentCard>
            </>
          )}
        </View>

        {/* Address Selection Card */}
        {selectedPatient && (
          <TransparentCard style={styles.addressCard}>
            <View style={styles.addressCardHeader}>
              <Text style={styles.addressCardTitle}>Select Delivery Address</Text>
              <Pressable
                style={styles.addAddressButton}
                onPress={handleAddAddressPress}
              >
                <MaterialIcons
                  name="add"
                  size={theme.iconSizes.md}
                  color={theme.colors.text}
                />
              </Pressable>
            </View>

            {/* Address List */}
            {!showAddAddressForm && patientAddresses.length > 0 && (
              <View style={styles.addressList}>
                {patientAddresses.map((address) => (
                  <Pressable
                    key={address.index}
                    style={[
                      styles.addressItem,
                      selectedAddressIndex === address.index && styles.addressItemSelected,
                    ]}
                    onPress={() => handleAddressSelect(address.index)}
                  >
                    <View style={styles.addressItemHeader}>
                      <Text style={styles.addressItemLabel}>{address.description}</Text>
                      {address.isDefault && (
                        <View style={styles.addressItemDefault}>
                          <Text style={styles.addressItemDefaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressItemText}>
                      {address.address}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Add Address Form */}
            {showAddAddressForm && (
              <View style={styles.addAddressForm}>
                <Text style={styles.addAddressFormTitle}>Add New Address</Text>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Description *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Home, Work, Office"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={newAddress.description}
                    onChangeText={(text) => setNewAddress({ ...newAddress, description: text })}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Full Address *</Text>
                  <TextInput
                    style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Enter full address"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={newAddress.address}
                    onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formButtonRow}>
                  <Pressable
                    style={[styles.formButton, styles.formButtonSecondary, savingAddress && styles.buttonDisabled]}
                    onPress={handleCancelAddAddress}
                    disabled={savingAddress}
                  >
                    <Text style={[styles.formButtonText, styles.formButtonTextSecondary]}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.formButton, styles.formButtonPrimary, savingAddress && styles.buttonDisabled]}
                    onPress={handleSaveAddress}
                    disabled={savingAddress}
                  >
                    <Text style={[styles.formButtonText, styles.formButtonTextPrimary]}>
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Empty state when no addresses */}
            {!showAddAddressForm && patientAddresses.length === 0 && (
              <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>
                  No addresses found
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                  Tap the + button to add an address
                </Text>
              </View>
            )}
          </TransparentCard>
        )}

        {/* Date and Time Picker */}
        {selectedPatient && (
          <TransparentCard style={styles.dateTimeCard}>
            <Text style={styles.dateTimeCardTitle}>Select Delivery Date & Time</Text>
            
            <View style={styles.dateTimeRow}>
              {/* Date Picker Button */}
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={selectedDate ? styles.dateTimeButtonText : styles.dateTimeButtonPlaceholder}>
                  {selectedDate ? formatDate(selectedDate) : 'Select Date'}
                </Text>
                <MaterialIcons
                  name="calendar-today"
                  size={theme.iconSizes.md}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

              {/* Time Picker Button */}
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={selectedTime ? styles.dateTimeButtonText : styles.dateTimeButtonPlaceholder}>
                  {selectedTime ? formatTime(selectedTime) : 'Select Time'}
                </Text>
                <MaterialIcons
                  name="access-time"
                  size={theme.iconSizes.md}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={today}
              />
            )}

            {/* Time Picker */}
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </TransparentCard>
        )}

        {/* Continue Button - appears when address is selected */}
        {selectedAddressIndex !== null && selectedPatient && (
          <Pressable
            style={[
              styles.continueButton,
              (isRecipientDifferent && !recipientName.trim()) && styles.buttonDisabled
            ]}
            onPress={() => {
              // Validate recipient name if checkbox is checked
              if (isRecipientDifferent && !recipientName.trim()) {
                toast.error('Please enter the recipient name');
                return;
              }

              const selectedAddressData = patientAddresses[selectedAddressIndex];
              const addressString = selectedAddressData?.address || 'N/A';
              const displayName = selectedPatient.surname 
                ? `${selectedPatient.name} ${selectedPatient.surname}` 
                : selectedPatient.name;
              
              // Combine date and time into a single ISO timestamp
              const combinedDateTime = new Date(selectedDate);
              combinedDateTime.setHours(selectedTime.getHours());
              combinedDateTime.setMinutes(selectedTime.getMinutes());
              combinedDateTime.setSeconds(0);
              combinedDateTime.setMilliseconds(0);
              
              router.push({
                pathname: '/(tabs)/add-delivery-medication',
                params: {
                  patientId: selectedPatient.id.toString(),
                  customerName: displayName,
                  customerId: selectedPatient.id.toString(),
                  customerPhone: selectedPatient.phone_number || '',
                  deliveryAddress: addressString,
                  deliveryDate: formatDate(selectedDate), // For display purposes
                  deliveryTime: formatTime(selectedTime), // For display purposes
                  deliveryDateTime: combinedDateTime.toISOString(), // ISO timestamp for database
                  recipientName: isRecipientDifferent ? recipientName.trim() : '',
                },
              });
            }}
            disabled={isRecipientDifferent && !recipientName.trim()}
          >
            <Text style={styles.continueButtonText}>
              Continue to Medication Input
            </Text>
          </Pressable>
        )}

              {/* Progress Tracker */}
              <DeliveryProgressTracker currentStep={1} />
            </View>
          ) : (
            <>
              {/* Header Section */}
              <View style={styles.headerSection}>
                {/* Back Button */}
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
              </View>

              {/* Title */}
              <Text style={[
                styles.title,
                { color: theme.colors.text }
              ]}>Add New Pharmacy Delivery</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Create a new delivery order for the pharmacy
              </Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <TransparentCard style={styles.searchBar}>
                  <MaterialIcons
                    name="search"
                    size={theme.iconSizes.md}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search customer name, id number, customer number"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={searchText}
                    onChangeText={handleSearchChange}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!showAddPatientForm}
                  />
                  {searchText.length > 0 && !showAddPatientForm && (
                    <Pressable onPress={() => {
                      setSearchText('');
                      setSelectedPatient(null);
                      setSelectedAddressIndex(null);
                      setShowSuggestions(false);
                      setIsRecipientDifferent(false);
                      setRecipientName('');
                    }}>
                      <MaterialIcons
                        name="clear"
                        size={theme.iconSizes.md}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  )}
                  <Pressable 
                    onPress={handleToggleAddPatientForm}
                    style={{ marginLeft: theme.spacing.xs }}
                  >
                    <MaterialIcons
                      name={showAddPatientForm ? "close" : "add"}
                      size={theme.iconSizes.md}
                      color={showAddPatientForm ? theme.colors.status.error : theme.colors.primary}
                    />
                  </Pressable>
                </TransparentCard>

                {/* Add Patient Form */}
                {showAddPatientForm && (
                  <TransparentCard style={styles.addPatientForm}>
                    <Text style={styles.addPatientFormTitle}>Add New Patient</Text>
                    
                    <View style={styles.formField}>
                      <Text style={styles.formLabel}>Name *</Text>
                      <TextInput
                        style={[
                          styles.formInput,
                          patientFormErrors.name && styles.formInputError
                        ]}
                        placeholder="Enter patient name"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={newPatientData.name}
                        onChangeText={(text) => {
                          setNewPatientData({ ...newPatientData, name: text });
                          if (patientFormErrors.name) {
                            setPatientFormErrors({ ...patientFormErrors, name: '' });
                          }
                        }}
                        autoCapitalize="words"
                      />
                      {patientFormErrors.name && (
                        <Text style={styles.errorText}>{patientFormErrors.name}</Text>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.formLabel}>Surname</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Enter patient surname (optional)"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={newPatientData.surname}
                        onChangeText={(text) => {
                          setNewPatientData({ ...newPatientData, surname: text });
                        }}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.formLabel}>Phone Number *</Text>
                      <TextInput
                        style={[
                          styles.formInput,
                          patientFormErrors.phoneNumber && styles.formInputError
                        ]}
                        placeholder="Enter phone number"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={newPatientData.phoneNumber}
                        onChangeText={(text) => {
                          setNewPatientData({ ...newPatientData, phoneNumber: text });
                          if (patientFormErrors.phoneNumber) {
                            setPatientFormErrors({ ...patientFormErrors, phoneNumber: '' });
                          }
                        }}
                        keyboardType="phone-pad"
                      />
                      {patientFormErrors.phoneNumber && (
                        <Text style={styles.errorText}>{patientFormErrors.phoneNumber}</Text>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.formLabel}>Address Description *</Text>
                      <TextInput
                        style={[
                          styles.formInput,
                          patientFormErrors.addressDescription && styles.formInputError
                        ]}
                        placeholder="e.g., Home, Work, Office"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={newPatientData.addressDescription}
                        onChangeText={(text) => {
                          setNewPatientData({ ...newPatientData, addressDescription: text });
                          if (patientFormErrors.addressDescription) {
                            setPatientFormErrors({ ...patientFormErrors, addressDescription: '' });
                          }
                        }}
                      />
                      {patientFormErrors.addressDescription && (
                        <Text style={styles.errorText}>{patientFormErrors.addressDescription}</Text>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.formLabel}>Address *</Text>
                      <TextInput
                        style={[
                          styles.formInput,
                          { minHeight: 80, textAlignVertical: 'top' },
                          patientFormErrors.address && styles.formInputError
                        ]}
                        placeholder="Enter full address"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={newPatientData.address}
                        onChangeText={(text) => {
                          setNewPatientData({ ...newPatientData, address: text });
                          if (patientFormErrors.address) {
                            setPatientFormErrors({ ...patientFormErrors, address: '' });
                          }
                        }}
                        multiline
                        numberOfLines={3}
                      />
                      {patientFormErrors.address && (
                        <Text style={styles.errorText}>{patientFormErrors.address}</Text>
                      )}
                    </View>

                    <View style={styles.formButtonRow}>
                      <Pressable
                        style={[styles.formButton, styles.formButtonSecondary, savingPatient && styles.buttonDisabled]}
                        onPress={handleToggleAddPatientForm}
                        disabled={savingPatient}
                      >
                        <Text style={[styles.formButtonText, styles.formButtonTextSecondary]}>
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.formButton, styles.formButtonPrimary, savingPatient && styles.buttonDisabled]}
                        onPress={handleSaveNewPatient}
                        disabled={savingPatient}
                      >
                        <Text style={[styles.formButtonText, styles.formButtonTextPrimary]}>
                          {savingPatient ? 'Saving...' : 'Save Patient'}
                        </Text>
                      </Pressable>
                    </View>
                  </TransparentCard>
                )}
              </View>

              {/* Search Suggestions */}
              {showSuggestions && filteredPatients.length > 0 && !showAddPatientForm && (
                <View style={styles.suggestionsContainer}>
                  {filteredPatients.map((patient) => {
                    const displayName = patient.surname 
                      ? `${patient.name} ${patient.surname}` 
                      : patient.name;
                    return (
                      <Pressable
                        key={patient.id}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(patient)}
                      >
                        <View style={styles.suggestionHeader}>
                          <Text style={styles.suggestionName}>{displayName}</Text>
                          <Text style={styles.suggestionId}>ID: {patient.id}</Text>
                        </View>
                        <Text style={styles.suggestionPhone}>{patient.phone_number}</Text>
                        {patient.address && patient.address.length > 0 && (
                          <Text style={styles.suggestionAddress} numberOfLines={1}>
                            {patient.address[0].address}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Selected Patient Info */}
              {selectedPatient && !showAddPatientForm && (
                <>
                  <TransparentCard style={{ padding: theme.spacing.md, marginTop: theme.spacing.sm, marginBottom: 0 }}>
                    <Text style={[theme.typography.body, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
                      Selected Patient:
                    </Text>
                    <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: theme.spacing.xs }]}>
                      {selectedPatient.surname 
                        ? `${selectedPatient.name} ${selectedPatient.surname}` 
                        : selectedPatient.name} (ID: {selectedPatient.id})
                    </Text>
                    <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
                      {selectedPatient.phone_number}
                    </Text>
                    {selectedPatient.address && selectedPatient.address.length > 0 && (
                      <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                        {selectedPatient.address[0].address}
                      </Text>
                    )}
                  </TransparentCard>

                  {/* Recipient Information */}
                  <TransparentCard style={styles.recipientCard}>
                    <Text style={styles.recipientCardTitle}>Recipient Information</Text>
                    
                    <Pressable
                      style={styles.checkboxContainer}
                      onPress={() => {
                        setIsRecipientDifferent(!isRecipientDifferent);
                        if (isRecipientDifferent) {
                          setRecipientName('');
                        }
                      }}
                    >
                      <View style={[
                        styles.checkbox,
                        isRecipientDifferent && styles.checkboxChecked
                      ]}>
                        {isRecipientDifferent && (
                          <MaterialIcons
                            name="check"
                            size={theme.iconSizes.sm}
                            color={theme.colors.background}
                          />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        Is the person receiving the delivery not the patient?
                      </Text>
                    </Pressable>

                    {isRecipientDifferent && (
                      <TextInput
                        style={styles.recipientInput}
                        placeholder="Enter recipient name"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={recipientName}
                        onChangeText={setRecipientName}
                        autoCapitalize="words"
                      />
                    )}
                  </TransparentCard>
                </>
              )}

              {/* Address Selection Card */}
              {selectedPatient && (
                <TransparentCard style={styles.addressCard}>
                  <View style={styles.addressCardHeader}>
                    <Text style={styles.addressCardTitle}>Select Delivery Address</Text>
                    <Pressable
                      style={styles.addAddressButton}
                      onPress={handleAddAddressPress}
                    >
                      <MaterialIcons
                        name="add"
                        size={theme.iconSizes.md}
                        color={theme.colors.text}
                      />
                    </Pressable>
                  </View>

                  {/* Address List */}
                  {!showAddAddressForm && patientAddresses.length > 0 && (
                    <View style={styles.addressList}>
                      {patientAddresses.map((address) => (
                        <Pressable
                          key={address.index}
                          style={[
                            styles.addressItem,
                            selectedAddressIndex === address.index && styles.addressItemSelected,
                          ]}
                          onPress={() => handleAddressSelect(address.index)}
                        >
                          <View style={styles.addressItemHeader}>
                            <Text style={styles.addressItemLabel}>{address.description}</Text>
                            {address.isDefault && (
                              <View style={styles.addressItemDefault}>
                                <Text style={styles.addressItemDefaultText}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressItemText}>
                            {address.address}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Add Address Form */}
                  {showAddAddressForm && (
                    <View style={styles.addAddressForm}>
                      <Text style={styles.addAddressFormTitle}>Add New Address</Text>
                      
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Description *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="e.g., Home, Work, Office"
                          placeholderTextColor={theme.colors.textTertiary}
                          value={newAddress.description}
                          onChangeText={(text) => setNewAddress({ ...newAddress, description: text })}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Full Address *</Text>
                        <TextInput
                          style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                          placeholder="Enter full address"
                          placeholderTextColor={theme.colors.textTertiary}
                          value={newAddress.address}
                          onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
                          multiline
                          numberOfLines={3}
                        />
                      </View>

                      <View style={styles.formButtonRow}>
                        <Pressable
                          style={[styles.formButton, styles.formButtonSecondary, savingAddress && styles.buttonDisabled]}
                          onPress={handleCancelAddAddress}
                          disabled={savingAddress}
                        >
                          <Text style={[styles.formButtonText, styles.formButtonTextSecondary]}>
                            Cancel
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.formButton, styles.formButtonPrimary, savingAddress && styles.buttonDisabled]}
                          onPress={handleSaveAddress}
                          disabled={savingAddress}
                        >
                          <Text style={[styles.formButtonText, styles.formButtonTextPrimary]}>
                            {savingAddress ? 'Saving...' : 'Save Address'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Empty state when no addresses */}
                  {!showAddAddressForm && patientAddresses.length === 0 && (
                    <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
                      <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>
                        No addresses found
                      </Text>
                      <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                        Tap the + button to add an address
                      </Text>
                    </View>
                  )}
                </TransparentCard>
              )}

              {/* Date and Time Picker */}
              {selectedPatient && (
                <TransparentCard style={styles.dateTimeCard}>
                  <Text style={styles.dateTimeCardTitle}>Select Delivery Date & Time</Text>
                  
                  <View style={styles.dateTimeRow}>
                    {/* Date Picker Button */}
                    <Pressable
                      style={styles.dateTimeButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={selectedDate ? styles.dateTimeButtonText : styles.dateTimeButtonPlaceholder}>
                        {selectedDate ? formatDate(selectedDate) : 'Select Date'}
                      </Text>
                      <MaterialIcons
                        name="calendar-today"
                        size={theme.iconSizes.md}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>

                    {/* Time Picker Button */}
                    <Pressable
                      style={styles.dateTimeButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={selectedTime ? styles.dateTimeButtonText : styles.dateTimeButtonPlaceholder}>
                        {selectedTime ? formatTime(selectedTime) : 'Select Time'}
                      </Text>
                      <MaterialIcons
                        name="access-time"
                        size={theme.iconSizes.md}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  {/* Date Picker */}
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      minimumDate={today}
                    />
                  )}

                  {/* Time Picker */}
                  {showTimePicker && (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleTimeChange}
                    />
                  )}
                </TransparentCard>
              )}

              {/* Continue Button - appears when address is selected */}
              {selectedAddressIndex !== null && selectedPatient && (
                <Pressable
                  style={[
                    styles.continueButton,
                    (isRecipientDifferent && !recipientName.trim()) && styles.buttonDisabled
                  ]}
                  onPress={() => {
                    // Validate recipient name if checkbox is checked
                    if (isRecipientDifferent && !recipientName.trim()) {
                      toast.error('Please enter the recipient name');
                      return;
                    }

                    const selectedAddressData = patientAddresses[selectedAddressIndex];
                    const addressString = selectedAddressData?.address || 'N/A';
                    const displayName = selectedPatient.surname 
                      ? `${selectedPatient.name} ${selectedPatient.surname}` 
                      : selectedPatient.name;
                    
                    // Combine date and time into a single ISO timestamp
                    const combinedDateTime = new Date(selectedDate);
                    combinedDateTime.setHours(selectedTime.getHours());
                    combinedDateTime.setMinutes(selectedTime.getMinutes());
                    combinedDateTime.setSeconds(0);
                    combinedDateTime.setMilliseconds(0);
                    
                    router.push({
                      pathname: '/(tabs)/add-delivery-medication',
                      params: {
                        patientId: selectedPatient.id.toString(),
                        customerName: displayName,
                        customerId: selectedPatient.id.toString(),
                        customerPhone: selectedPatient.phone_number || '',
                        deliveryAddress: addressString,
                        deliveryDate: formatDate(selectedDate), // For display purposes
                        deliveryTime: formatTime(selectedTime), // For display purposes
                        deliveryDateTime: combinedDateTime.toISOString(), // ISO timestamp for database
                        recipientName: isRecipientDifferent ? recipientName.trim() : '',
                      },
                    });
                  }}
                  disabled={isRecipientDifferent && !recipientName.trim()}
                >
                  <Text style={styles.continueButtonText}>
                    Continue to Medication Input
                  </Text>
                </Pressable>
              )}

              {/* Progress Tracker */}
              <DeliveryProgressTracker currentStep={1} />
            </>
          )}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}