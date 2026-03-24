import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { FloatingNavBar } from '@/components/floating-nav-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getCurrentUserPharmacy } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Patient {
  id: string;
  name: string;
  surname: string;
  deliveryCount: number;
  lastDeliveryDate?: string;
}

interface PatientDetails {
  id: string;
  name: string;
  surname: string;
  phone_number: string;
  address: Array<{ description: string; address: string }> | null;
  deliveryCount: number;
  lastDeliveryDate?: string;
}

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
    paddingHorizontal: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.screenPadding,
    paddingTop: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.screenPadding + 20, // Extra top padding
    paddingBottom: Platform.OS === 'web' ? theme.spacing.screenPadding : 80, // Account for floating nav bar on mobile
  },
  header: {
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
  },
  headerSubtitle: {
    ...theme.typography.bodySmall,
  },
  patientsList: {
    gap: theme.spacing.md,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary,
    opacity: theme.opacity.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    color: '#fff',
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
  },
  patientContent: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
  },
  patientInfo: {
    ...theme.typography.bodySmall,
  },
  patientStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deliveryCount: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
  },
  lastDelivery: {
    ...theme.typography.bodyXSmall,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
    gap: theme.spacing.md,
  },
  emptyStateIcon: {
    opacity: theme.opacity.overlay,
  },
  emptyStateText: {
    ...theme.typography.body,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  patientCardSelected: {
    borderWidth: 2,
    borderColor: theme.getStatusColor('picked_up'),
  },
  detailsCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.componentGap,
    gap: theme.spacing.md,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailsTitle: {
    ...theme.typography.h5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm - 1,
    opacity: theme.opacity.overlay,
  },
  editButtonText: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  detailsSection: {
    gap: theme.spacing.xs,
  },
  detailsLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  detailsValue: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  addressItem: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.card,
    marginTop: theme.spacing.xs,
    opacity: theme.opacity.overlay,
  },
  addressDescription: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    padding: 0,
  },
  webPatientsCard: {
    ...(Platform.OS === 'web' ? {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.componentGap,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    } : {}),
  },
});

export default function PatientsScreen() {
  const theme = useTheme();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch patients from database
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get pharmacy ID for the logged-in user
      const { pharmacyId } = await getCurrentUserPharmacy();

      // Fetch patients for this pharmacy
      const { data: patientsData, error: patientsError } = await supabase
        .from('patient')
        .select('id, name, surname, phone_number, address')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        setPatients([]);
        return;
      }

      if (!patientsData || patientsData.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      // Fetch delivery statistics for each patient
      const patientsWithStats = await Promise.all(
        patientsData.map(async (patient) => {
          // Get delivery count and last delivery date
          const { data: deliveriesData } = await supabase
            .from('delivery')
            .select('created_at')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false });

          const deliveryCount = deliveriesData?.length || 0;
          const lastDeliveryDate = deliveriesData && deliveriesData.length > 0
            ? deliveriesData[0].created_at
            : undefined;

          return {
            id: patient.id.toString(),
            name: patient.name || '',
            surname: patient.surname || '',
            deliveryCount,
            lastDeliveryDate,
          };
        })
      );

      setPatients(patientsWithStats);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh patients when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  // Fetch patient details when selected
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!selectedPatientId) {
        setSelectedPatientDetails(null);
        return;
      }

      try {
        setLoadingDetails(true);
        
        // Get pharmacy ID
        const { pharmacyId } = await getCurrentUserPharmacy();

        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from('patient')
          .select('id, name, surname, phone_number, address')
          .eq('id', parseInt(selectedPatientId, 10))
          .eq('pharmacy_id', pharmacyId)
          .single();

        if (patientError) {
          console.error('Error fetching patient details:', patientError);
          setSelectedPatientDetails(null);
          return;
        }

        if (!patientData) {
          setSelectedPatientDetails(null);
          return;
        }

        // Get delivery statistics
        const { data: deliveriesData } = await supabase
          .from('delivery')
          .select('created_at')
          .eq('patient_id', patientData.id)
          .order('created_at', { ascending: false });

        const deliveryCount = deliveriesData?.length || 0;
        const lastDeliveryDate = deliveriesData && deliveriesData.length > 0
          ? deliveriesData[0].created_at
          : undefined;

        setSelectedPatientDetails({
          id: patientData.id.toString(),
          name: patientData.name || '',
          surname: patientData.surname || '',
          phone_number: patientData.phone_number || '',
          address: patientData.address as Array<{ description: string; address: string }> | null,
          deliveryCount,
          lastDeliveryDate,
        });
      } catch (error) {
        console.error('Error fetching patient details:', error);
        setSelectedPatientDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchPatientDetails();
  }, [selectedPatientId]);

  const handlePatientSelect = (patientId: string) => {
    if (selectedPatientId === patientId) {
      // Deselect if clicking the same patient
      setSelectedPatientId(null);
    } else {
      setSelectedPatientId(patientId);
    }
  };

  const handleEditPatient = () => {
    if (selectedPatientId) {
      router.push({
        pathname: '/edit-patient',
        params: { patientId: selectedPatientId }
      } as any);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deliveries';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string, surname: string) => {
    const firstInitial = name?.[0]?.toUpperCase() || '';
    const lastInitial = surname?.[0]?.toUpperCase() || '';
    return (firstInitial + lastInitial) || 'P';
  };

  const styles = createStyles(theme);

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const fullName = `${patient.name} ${patient.surname}`.toLowerCase();
    return fullName.includes(query) || patient.name.toLowerCase().includes(query) || patient.surname.toLowerCase().includes(query);
  });

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Web Patients Card - Wraps content from header to end of patient details */}
        {Platform.OS === 'web' ? (
          <View style={styles.webPatientsCard}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[
                styles.headerTitle,
                { color: theme.colors.text }
              ]}>Patients</Text>
              <Text style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary }
              ]}>View all patients associated with your pharmacy</Text>
            </View>

            {/* Add Patient Button */}
            <TransparentCard
              style={{ ...styles.addButton, backgroundColor: '#d2c9fe' }}
              interactive={true}
              onPress={() => router.push('/add-patient' as any)}
            >
              <MaterialIcons
                name="add"
                size={theme.iconSizes.md}
                color={theme.colors.text}
              />
              <Text style={styles.addButtonText}>Add New Patient</Text>
            </TransparentCard>

            {/* Search Bar */}
            <TransparentCard style={{ ...styles.searchBar, backgroundColor: theme.colors.overlayBackground, opacity: theme.opacity.overlay }}>
              <MaterialIcons
                name="search"
                size={theme.iconSizes.md}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons
                    name="close"
                    size={theme.iconSizes.sm}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              )}
            </TransparentCard>

            {/* Patients List */}
            {loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="hourglass-empty"
              size={theme.iconSizes.xl}
              color={theme.colors.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary }
            ]}>Loading patients...</Text>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="people-outline"
              size={theme.iconSizes.xl}
              color={theme.colors.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={[
              styles.emptyStateText,
              { color: theme.colors.text }
            ]}>
              {searchQuery.trim() ? 'No patients found' : 'No patients found'}
            </Text>
            <Text style={[
              styles.emptyStateSubtext,
              { color: theme.colors.textSecondary }
            ]}>
              {searchQuery.trim() ? 'Try a different search term' : 'Add a new patient to get started'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.patientsList}>
              {filteredPatients.map((patient) => {
                const cardStyle = selectedPatientId === patient.id
                  ? { ...styles.patientCard, ...styles.patientCardSelected }
                  : styles.patientCard;
                
                return (
                  <TransparentCard
                    key={patient.id}
                    style={cardStyle}
                    interactive={true}
                    onPress={() => handlePatientSelect(patient.id)}
                  >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {getInitials(patient.name, patient.surname)}
                    </Text>
                  </View>
                  <View style={styles.patientContent}>
                    <Text style={[
                      styles.patientName,
                      { color: theme.colors.text }
                    ]}>
                      {patient.surname 
                        ? `${patient.name} ${patient.surname}`.trim()
                        : patient.name}
                    </Text>
                    <Text style={[
                      styles.patientInfo,
                      { color: theme.colors.textSecondary }
                    ]}>
                      Last delivery: {formatDate(patient.lastDeliveryDate)}
                    </Text>
                  </View>
                  <View style={styles.patientStats}>
                    <Text style={[
                      styles.deliveryCount,
                      { color: theme.colors.text }
                    ]}>
                      {patient.deliveryCount}
                    </Text>
                    <Text style={[
                      styles.lastDelivery,
                      { color: theme.colors.textSecondary }
                    ]}>
                      {patient.deliveryCount === 1 ? 'delivery' : 'deliveries'}
                    </Text>
                  </View>
                </TransparentCard>
                );
              })}
            </View>

            {/* Patient Details Card */}
            {selectedPatientDetails && (
              <TransparentCard style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <Text style={[
                    styles.detailsTitle,
                    { color: theme.colors.text }
                  ]}>
                    Patient Details
                  </Text>
                  <TransparentCard
                    style={{ ...styles.editButton, backgroundColor: theme.colors.overlayBackground }}
                    interactive={true}
                    onPress={handleEditPatient}
                  >
                    <MaterialIcons
                      name="edit"
                      size={theme.iconSizes.sm}
                      color={theme.colors.text}
                    />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TransparentCard>
                </View>

                {loadingDetails ? (
                  <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
                    <MaterialIcons
                      name="hourglass-empty"
                      size={theme.iconSizes.md}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.detailsValue,
                      { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }
                    ]}>
                      Loading details...
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Name */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Name</Text>
                      <Text style={styles.detailsValue}>
                        {selectedPatientDetails?.surname 
                          ? `${selectedPatientDetails.name} ${selectedPatientDetails.surname}`.trim()
                          : selectedPatientDetails?.name || 'N/A'}
                      </Text>
                    </View>

                    {/* Phone Number */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Phone Number</Text>
                      <Text style={styles.detailsValue}>
                        {selectedPatientDetails?.phone_number || 'Not provided'}
                      </Text>
                    </View>

                    {/* Addresses */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Addresses</Text>
                      {selectedPatientDetails?.address && selectedPatientDetails.address.length > 0 ? (
                        selectedPatientDetails.address.map((addr, index) => (
                          <View key={index} style={styles.addressItem}>
                            <Text style={styles.addressDescription}>
                              {addr.description || `Address ${index + 1}`}
                            </Text>
                            <Text style={styles.addressText}>
                              {addr.address}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.detailsValue, { color: theme.colors.textSecondary }]}>
                          No addresses on file
                        </Text>
                      )}
                    </View>

                    {/* Delivery Stats */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Delivery Statistics</Text>
                      <Text style={styles.detailsValue}>
                        {selectedPatientDetails?.deliveryCount || 0} {(selectedPatientDetails?.deliveryCount || 0) === 1 ? 'delivery' : 'deliveries'}
                      </Text>
                      <Text style={[styles.detailsValue, { color: theme.colors.textSecondary, fontSize: 12 }]}>
                        Last delivery: {formatDate(selectedPatientDetails?.lastDeliveryDate)}
                      </Text>
                    </View>
                  </>
                )}
              </TransparentCard>
            )}
          </>
        )}
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[
                styles.headerTitle,
                { color: theme.colors.text }
              ]}>Patients</Text>
              <Text style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary }
              ]}>View all patients associated with your pharmacy</Text>
            </View>

            {/* Add Patient Button */}
            <TransparentCard
              style={{ ...styles.addButton, backgroundColor: theme.getStatusColor('picked_up') }}
              interactive={true}
              onPress={() => router.push('/add-patient' as any)}
            >
              <MaterialIcons
                name="add"
                size={theme.iconSizes.md}
                color={theme.colors.text}
              />
              <Text style={styles.addButtonText}>Add New Patient</Text>
            </TransparentCard>

            {/* Search Bar */}
            <TransparentCard style={{ ...styles.searchBar, backgroundColor: theme.colors.overlayBackground, opacity: theme.opacity.overlay }}>
              <MaterialIcons
                name="search"
                size={theme.iconSizes.md}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons
                    name="close"
                    size={theme.iconSizes.sm}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              )}
            </TransparentCard>

            {/* Patients List */}
            {loading ? (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="hourglass-empty"
                  size={theme.iconSizes.xl}
                  color={theme.colors.textSecondary}
                  style={styles.emptyStateIcon}
                />
                <Text style={[
                  styles.emptyStateText,
                  { color: theme.colors.textSecondary }
                ]}>Loading patients...</Text>
              </View>
            ) : filteredPatients.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="people-outline"
                  size={theme.iconSizes.xl}
                  color={theme.colors.textSecondary}
                  style={styles.emptyStateIcon}
                />
                <Text style={[
                  styles.emptyStateText,
                  { color: theme.colors.text }
                ]}>
                  {searchQuery.trim() ? 'No patients found' : 'No patients found'}
                </Text>
                <Text style={[
                  styles.emptyStateSubtext,
                  { color: theme.colors.textSecondary }
                ]}>
                  {searchQuery.trim() ? 'Try a different search term' : 'Add a new patient to get started'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.patientsList}>
                  {filteredPatients.map((patient) => {
                    const cardStyle = selectedPatientId === patient.id
                      ? { ...styles.patientCard, ...styles.patientCardSelected }
                      : styles.patientCard;
                    
                    return (
                      <TransparentCard
                        key={patient.id}
                        style={cardStyle}
                        interactive={true}
                        onPress={() => handlePatientSelect(patient.id)}
                      >
                      <View style={styles.patientAvatar}>
                        <Text style={styles.patientAvatarText}>
                          {getInitials(patient.name, patient.surname)}
                        </Text>
                      </View>
                      <View style={styles.patientContent}>
                        <Text style={[
                          styles.patientName,
                          { color: theme.colors.text }
                        ]}>
                          {patient.surname 
                            ? `${patient.name} ${patient.surname}`.trim()
                            : patient.name}
                        </Text>
                        <Text style={[
                          styles.patientInfo,
                          { color: theme.colors.textSecondary }
                        ]}>
                          Last delivery: {formatDate(patient.lastDeliveryDate)}
                        </Text>
                      </View>
                      <View style={styles.patientStats}>
                        <Text style={[
                          styles.deliveryCount,
                          { color: theme.colors.text }
                        ]}>
                          {patient.deliveryCount}
                        </Text>
                        <Text style={[
                          styles.lastDelivery,
                          { color: theme.colors.textSecondary }
                        ]}>
                          {patient.deliveryCount === 1 ? 'delivery' : 'deliveries'}
                        </Text>
                      </View>
                    </TransparentCard>
                    );
                  })}
                </View>

                {/* Patient Details Card */}
                {selectedPatientDetails && (
                  <TransparentCard style={styles.detailsCard}>
                    <View style={styles.detailsHeader}>
                      <Text style={[
                        styles.detailsTitle,
                        { color: theme.colors.text }
                      ]}>
                        Patient Details
                      </Text>
                      <TransparentCard
                        style={{ ...styles.editButton, backgroundColor: theme.colors.overlayBackground }}
                        interactive={true}
                        onPress={handleEditPatient}
                      >
                        <MaterialIcons
                          name="edit"
                          size={theme.iconSizes.sm}
                          color={theme.colors.text}
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TransparentCard>
                    </View>

                    {loadingDetails ? (
                      <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
                        <MaterialIcons
                          name="hourglass-empty"
                          size={theme.iconSizes.md}
                          color={theme.colors.textSecondary}
                        />
                        <Text style={[
                          styles.detailsValue,
                          { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }
                        ]}>
                          Loading details...
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* Name */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsLabel}>Name</Text>
                          <Text style={styles.detailsValue}>
                            {selectedPatientDetails?.surname 
                              ? `${selectedPatientDetails.name} ${selectedPatientDetails.surname}`.trim()
                              : selectedPatientDetails?.name || 'N/A'}
                          </Text>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsLabel}>Phone Number</Text>
                          <Text style={styles.detailsValue}>
                            {selectedPatientDetails?.phone_number || 'Not provided'}
                          </Text>
                        </View>

                        {/* Addresses */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsLabel}>Addresses</Text>
                          {selectedPatientDetails?.address && selectedPatientDetails.address.length > 0 ? (
                            selectedPatientDetails.address.map((addr, index) => (
                              <View key={index} style={styles.addressItem}>
                                <Text style={styles.addressDescription}>
                                  {addr.description || `Address ${index + 1}`}
                                </Text>
                                <Text style={styles.addressText}>
                                  {addr.address}
                                </Text>
                              </View>
                            ))
                          ) : (
                            <Text style={[styles.detailsValue, { color: theme.colors.textSecondary }]}>
                              No addresses on file
                            </Text>
                          )}
                        </View>

                        {/* Delivery Stats */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsLabel}>Delivery Statistics</Text>
                          <Text style={styles.detailsValue}>
                            {selectedPatientDetails?.deliveryCount || 0} {(selectedPatientDetails?.deliveryCount || 0) === 1 ? 'delivery' : 'deliveries'}
                          </Text>
                          <Text style={[styles.detailsValue, { color: theme.colors.textSecondary, fontSize: 12 }]}>
                            Last delivery: {formatDate(selectedPatientDetails?.lastDeliveryDate)}
                          </Text>
                        </View>
                      </>
                    )}
                  </TransparentCard>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Navigation Bar - Only on mobile */}
      {Platform.OS !== 'web' && <FloatingNavBar />}
    </BackgroundGradient>
  );
}

