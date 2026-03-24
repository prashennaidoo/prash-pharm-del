import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { supabase } from '@/lib/supabase';
import { getCurrentUserPharmacy } from '@/lib/auth';

type Pharmacist = {
  id: string;
  name: string;
  surname: string;
  role: 'Owner' | 'Regular';
};

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
  staffListCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.componentGap,
  },
  staffListHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerText: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
  },
  staffRowsContainer: {
    gap: theme.spacing.sm,
  },
  staffRow: {
    opacity: theme.opacity.overlay,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  staffRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffInfo: {
    flex: 1,
    gap: 2,
  },
  staffName: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
  },
  staffSurname: {
    ...theme.typography.bodySmall,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.badge,
  },
  roleText: {
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
    textAlign: 'center',
  },
  addButtonCard: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  addButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
  },
});

export default function ManageStaffScreen() {
  const theme = useTheme();
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pharmacists from database
  useEffect(() => {
    const fetchPharmacists = async () => {
      try {
        setLoading(true);
        
        // Get pharmacy ID for the logged-in user
        const { pharmacyId } = await getCurrentUserPharmacy();

        // Fetch pharmacy info to get owner_user_id
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacy')
          .select('owner_user_id')
          .eq('id', pharmacyId)
          .single();

        if (pharmacyError) {
          console.error('Error fetching pharmacy:', pharmacyError);
          setPharmacists([]);
          return;
        }

        const ownerUserId = pharmacyData?.owner_user_id;

        // Fetch all pharmacists for this pharmacy
        const { data: pharmacistsData, error: pharmacistsError } = await supabase
          .from('pharmacists')
          .select('id, name, surname, user_id, role')
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false });

        if (pharmacistsError) {
          console.error('Error fetching pharmacists:', pharmacistsError);
          setPharmacists([]);
          return;
        }

        if (!pharmacistsData || pharmacistsData.length === 0) {
          setPharmacists([]);
          setLoading(false);
          return;
        }

        // Map pharmacists and determine role
        const mappedPharmacists: Pharmacist[] = pharmacistsData.map((pharmacist) => {
          // Determine role: if user_id matches owner_user_id, they're Owner
          // Otherwise check the role field, or default to Regular
          let role: 'Owner' | 'Regular' = 'Regular';
          
          if (pharmacist.user_id === ownerUserId) {
            role = 'Owner';
          } else if (pharmacist.role) {
            // Check if role field indicates owner (case-insensitive)
            const roleLower = pharmacist.role.toLowerCase();
            if (roleLower === 'owner' || roleLower === 'admin') {
              role = 'Owner';
            }
          }

          return {
            id: pharmacist.id.toString(),
            name: pharmacist.name || '',
            surname: pharmacist.surname || '',
            role,
          };
        });

        setPharmacists(mappedPharmacists);
      } catch (error) {
        console.error('Error fetching pharmacists:', error);
        setPharmacists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacists();
  }, []);

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
              Pharmacy Staff
            </Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={[
            styles.headerSubtitle,
            { color: theme.colors.textSecondary }
          ]}>
            Manage your pharmacy staff members
          </Text>
        </View>

        {/* Staff List Card */}
        <TransparentCard style={styles.staffListCard}>
          {/* Table Header */}
          <View style={styles.staffListHeader}>
            <View style={{ flex: 2, minWidth: 80 }}>
              <Text style={[
                styles.headerText,
                { color: theme.colors.textSecondary }
              ]}>
                Name
              </Text>
            </View>
            <View style={{ flex: 2, minWidth: 80 }}>
              <Text style={[
                styles.headerText,
                { color: theme.colors.textSecondary }
              ]}>
                Surname
              </Text>
            </View>
            <View style={{ flex: 1.5, minWidth: 70 }}>
              <Text style={[
                styles.headerText,
                { color: theme.colors.textSecondary }
              ]}>
                Role
              </Text>
            </View>
          </View>

          {/* Staff Rows */}
          {loading ? (
            <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.colors.text} />
            </View>
          ) : pharmacists.length === 0 ? (
            <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
              <Text style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary }
              ]}>
                No staff members found
              </Text>
            </View>
          ) : (
            <View style={styles.staffRowsContainer}>
              {pharmacists.map((pharmacist) => (
                <View
                  key={pharmacist.id}
                  style={[
                    styles.staffRow,
                    { backgroundColor: theme.colors.overlayBackground }
                  ]}
                >
                  <View style={styles.staffRowContent}>
                    <View style={{ flex: 2, minWidth: 80 }}>
                      <Text style={[
                        styles.staffName,
                        { color: theme.colors.text }
                      ]}>
                        {pharmacist.name}
                      </Text>
                    </View>
                    <View style={{ flex: 2, minWidth: 80 }}>
                      <Text style={[
                        styles.staffSurname,
                        { color: theme.colors.textSecondary }
                      ]}>
                        {pharmacist.surname}
                      </Text>
                    </View>
                    <View style={{ flex: 1.5, minWidth: 70, alignItems: 'flex-start' }}>
                      <View style={[
                        styles.roleBadge,
                        {
                          backgroundColor: pharmacist.role === 'Owner'
                            ? theme.getStatusColor('picked_up')
                            : theme.getStatusColor('pending')
                        }
                      ]}>
                        <Text style={[
                          styles.roleText,
                          { color: '#000000' }
                        ]}>
                          {pharmacist.role}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </TransparentCard>

        {/* Add Staff Button */}
        <TransparentCard
          style={styles.addButtonCard}
          interactive={true}
          onPress={() => router.push('/add-staff')}
        >
          <MaterialIcons
            name="add"
            size={theme.iconSizes.header}
            color={theme.colors.text}
          />
          <Text style={[
            styles.addButtonText,
            { color: theme.colors.text }
          ]}>
            Add Staff Member
          </Text>
        </TransparentCard>
      </ScrollView>
    </BackgroundGradient>
  );
}
