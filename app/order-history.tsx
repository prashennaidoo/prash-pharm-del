import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { Sidebar } from '@/components/sidebar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getCurrentUserPharmacy } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type DeliveryStatus = 'pending' | 'picked_up' | 'delivered';
type MedicationSchedule = 'schedule-1-2' | 'schedule-3-5' | 'schedule-6';

interface Order {
  id: string;
  orderNumber: string;
  patient: string;
  status: DeliveryStatus;
  medicationSchedule: MedicationSchedule;
  date: string; // ISO date string (YYYY-MM-DD)
  phone?: string;
  address?: string;
}

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Generate sample orders with dates (going back from today)
const generateSampleOrders = (): Order[] => {
  const today = new Date();
  const orders: Order[] = [];
  
  const orderData = [
    { orderNumber: 'ORD-1234', patient: 'John Smith', status: 'delivered' as DeliveryStatus, medicationSchedule: 'schedule-1-2' as MedicationSchedule, phone: '+1-555-0101', address: '123 Main St, Springfield, IL 62701' },
    { orderNumber: 'ORD-1233', patient: 'Sarah Johnson', status: 'picked_up' as DeliveryStatus, medicationSchedule: 'schedule-3-5' as MedicationSchedule, phone: '+1-555-0102', address: '456 Oak Ave, Springfield, IL 62702' },
    { orderNumber: 'ORD-1232', patient: 'Michael Brown', status: 'pending' as DeliveryStatus, medicationSchedule: 'schedule-6' as MedicationSchedule, phone: '+1-555-0103', address: '789 Pine Rd, Springfield, IL 62703' },
    { orderNumber: 'ORD-1231', patient: 'Emily Davis', status: 'delivered' as DeliveryStatus, medicationSchedule: 'schedule-1-2' as MedicationSchedule, phone: '+1-555-0104', address: '321 Elm St, Springfield, IL 62704' },
    { orderNumber: 'ORD-1230', patient: 'David Wilson', status: 'delivered' as DeliveryStatus, medicationSchedule: 'schedule-3-5' as MedicationSchedule, phone: '+1-555-0105', address: '654 Maple Dr, Springfield, IL 62705' },
    { orderNumber: 'ORD-1229', patient: 'Lisa Garcia', status: 'picked_up' as DeliveryStatus, medicationSchedule: 'schedule-1-2' as MedicationSchedule, phone: '+1-555-0106', address: '987 Cedar Ln, Springfield, IL 62706' },
    { orderNumber: 'ORD-1228', patient: 'Robert Martinez', status: 'pending' as DeliveryStatus, medicationSchedule: 'schedule-3-5' as MedicationSchedule, phone: '+1-555-0107', address: '147 Birch St, Springfield, IL 62707' },
    { orderNumber: 'ORD-1227', patient: 'Jennifer Anderson', status: 'delivered' as DeliveryStatus, medicationSchedule: 'schedule-6' as MedicationSchedule, phone: '+1-555-0108', address: '258 Willow Ave, Springfield, IL 62708' },
    { orderNumber: 'ORD-1226', patient: 'William Taylor', status: 'delivered' as DeliveryStatus, medicationSchedule: 'schedule-1-2' as MedicationSchedule, phone: '+1-555-0109', address: '369 Spruce Rd, Springfield, IL 62709' },
    { orderNumber: 'ORD-1225', patient: 'Mary Thomas', status: 'picked_up' as DeliveryStatus, medicationSchedule: 'schedule-3-5' as MedicationSchedule, phone: '+1-555-0110', address: '741 Ash Dr, Springfield, IL 62710' },
  ];
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    orders.push({
      id: (i + 1).toString(),
      ...orderData[i],
      date: dateString,
    });
  }
  
  return orders;
};

// Helper function to get status config
const getStatusConfig = (status: DeliveryStatus, theme: ReturnType<typeof useTheme>) => {
  switch (status) {
    case 'pending':
      return {
        text: 'Pending',
        backgroundColor: theme.getStatusColor('pending'),
        textColor: theme.getStatusTextColor('pending'),
      };
    case 'picked_up':
      return {
        text: 'Picked Up',
        backgroundColor: theme.getStatusColor('picked_up'),
        textColor: theme.getStatusTextColor('picked_up'),
      };
    case 'delivered':
      return {
        text: 'Delivered',
        backgroundColor: theme.getStatusColor('delivered'),
        textColor: theme.getStatusTextColor('delivered'),
      };
  }
};

// Helper function to format medication schedule
const getScheduleDisplay = (schedule: MedicationSchedule): string => {
  switch (schedule) {
    case 'schedule-1-2':
      return 'Schedule 1-2';
    case 'schedule-3-5':
      return 'Schedule 3-5';
    case 'schedule-6':
      return 'Schedule 6';
    default:
      return 'N/A';
  }
};

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
    paddingBottom: Platform.OS === 'web' ? theme.spacing.screenPadding : 40,
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
  },
  headerTitle: {
    ...theme.typography.h3,
    flex: 1,
  },
  searchContainer: {
    marginBottom: theme.spacing.componentGap,
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayBackground,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.overlayBackground,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    ...theme.typography.body,
    flex: 1,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
  },
  tableContainer: {
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
  },
  tableScrollView: {
    maxHeight: Dimensions.get('window').height * 0.6,
    flexGrow: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.overlayBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.overlayBackground,
  },
  headerCell: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.overlayBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
  },
  tableRowSelected: {
    backgroundColor: theme.colors.primary,
    opacity: 0.2,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  tableCell: {
    ...theme.typography.bodySmall,
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.badge,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
    textAlign: 'center',
  },
  emptyState: {
    padding: theme.spacing.componentGap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  detailsCard: {
    marginTop: theme.spacing.componentGap,
    padding: theme.spacing.md,
  },
  detailsCardTitle: {
    ...theme.typography.h5,
    marginBottom: theme.spacing.md,
  },
  detailsSection: {
    marginBottom: theme.spacing.md,
  },
  detailsSectionTitle: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.xs,
  },
  detailsSectionValue: {
    ...theme.typography.body,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: theme.colors.overlayBackground,
    marginVertical: theme.spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  detailsRowItem: {
    flex: 1,
  },
  webOrdersCard: {
    ...(Platform.OS === 'web' ? {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.componentGap,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    } : {}),
  },
});

export default function OrderHistoryScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Get pharmacy ID
        const { pharmacyId } = await getCurrentUserPharmacy();

        // Fetch all orders for the pharmacy with patient information
        const { data: ordersData, error: ordersError } = await supabase
          .from('delivery')
          .select(`
            id,
            order_id,
            status,
            created_at,
            medication_schedule,
            address,
            patient:patient_id(
              name,
              surname,
              phone_number,
              address
            )
          `)
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          setOrders([]);
        } else if (ordersData) {
          // Format orders for display
          const formattedOrders: Order[] = ordersData.map(order => {
            // Get patient name from patient relationship
            let patientName = 'Customer';
            let phone: string | undefined;
            let address: string | undefined = order.address;

            if (order.patient) {
              const patient = order.patient as { name?: string; surname?: string; phone_number?: string; address?: any };
              if (patient.name) {
                patientName = patient.surname 
                  ? `${patient.name} ${patient.surname}`.trim()
                  : patient.name;
              }
              phone = patient.phone_number || undefined;
              // Use patient address if delivery address is not available
              // Handle JSONB address format: array of {description, address} objects
              if (!address && patient.address) {
                if (Array.isArray(patient.address) && patient.address.length > 0) {
                  // Get the first address from the array
                  const firstAddress = patient.address[0];
                  address = typeof firstAddress === 'object' && firstAddress.address 
                    ? firstAddress.address 
                    : String(patient.address);
                } else if (typeof patient.address === 'string') {
                  // Fallback for old text format (shouldn't happen after migration)
                  address = patient.address;
                }
              }
            }

            return {
              id: order.id.toString(),
              orderNumber: order.order_id || `Order #${order.id}`,
              patient: patientName,
              status: order.status as DeliveryStatus,
              medicationSchedule: (order.medication_schedule || 'schedule-6') as MedicationSchedule,
              date: new Date(order.created_at).toISOString().split('T')[0], // YYYY-MM-DD format
              phone,
              address,
            };
          });

          setOrders(formattedOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) {
      return orders;
    }

    const query = searchQuery.toLowerCase().trim();
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(query) ||
      order.patient.toLowerCase().includes(query) ||
      getStatusConfig(order.status, theme).text.toLowerCase().includes(query) ||
      getScheduleDisplay(order.medicationSchedule).toLowerCase().includes(query) ||
      formatDate(order.date).toLowerCase().includes(query) ||
      order.date.toLowerCase().includes(query) ||
      (order.phone && order.phone.toLowerCase().includes(query)) ||
      (order.address && order.address.toLowerCase().includes(query))
    );
  }, [searchQuery, orders, theme]);

  return (
    <BackgroundGradient style={styles.container}>
      {Platform.OS === 'web' && <Sidebar />}
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Web Orders Card - Wraps content from header to end of order details */}
        {Platform.OS === 'web' ? (
          <View style={styles.webOrdersCard}>
            {/* Header */}
            <View style={styles.header}>
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
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Order History
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={[
                styles.searchInputContainer,
                { 
                  backgroundColor: theme.colors.overlayBackground,
                  borderColor: theme.colors.overlayBackground,
                }
              ]}>
                <MaterialIcons
                  name="search"
                  size={theme.iconSizes.md}
                  color={theme.colors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.colors.text }
                  ]}
                  placeholder="Search orders..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Orders Table */}
            {loading ? (
          <TransparentCard style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Loading orders...
            </Text>
          </TransparentCard>
        ) : filteredOrders.length > 0 ? (
          <TransparentCard style={styles.tableContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={styles.tableScrollView}
            >
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 2 }]}>
                  Patient
                </Text>
                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>
                  Date
                </Text>
                <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>
                  Status
                </Text>
              </View>

              {/* Table Rows */}
              {filteredOrders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status, theme);
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <Pressable
                    key={order.id}
                    onPress={() => setSelectedOrder(order)}
                  >
                    <View 
                      style={[
                        styles.tableRow,
                        isSelected && styles.tableRowSelected,
                        index === filteredOrders.length - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <Text style={[styles.tableCell, { color: theme.colors.text, flex: 2 }]}>
                        {order.patient}
                      </Text>
                      <Text style={[styles.tableCell, { color: theme.colors.text, flex: 1 }]}>
                        {formatDate(order.date)}
                      </Text>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: statusConfig.backgroundColor }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: statusConfig.textColor }
                          ]}>
                            {statusConfig.text}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </TransparentCard>
        ) : (
          <TransparentCard style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() 
                ? `No orders found matching "${searchQuery}"`
                : 'No orders found'}
            </Text>
          </TransparentCard>
        )}

        {/* Order Details Card */}
        {selectedOrder && (
          <TransparentCard style={styles.detailsCard}>
            <Text style={[styles.detailsCardTitle, { color: theme.colors.text }]}>
              Order Details
            </Text>

            {/* Order Number and Status */}
            <View style={styles.detailsRow}>
              <View style={[styles.detailsSection, styles.detailsRowItem]}>
                <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                  Order Number
                </Text>
                <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                  {selectedOrder.orderNumber}
                </Text>
              </View>
              <View style={[styles.detailsSection, styles.detailsRowItem]}>
                <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                  Status
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusConfig(selectedOrder.status, theme).backgroundColor, alignSelf: 'flex-start' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusConfig(selectedOrder.status, theme).textColor }
                  ]}>
                    {getStatusConfig(selectedOrder.status, theme).text}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.detailsDivider, { backgroundColor: theme.colors.overlayBackground }]} />

            {/* Patient Information */}
            <View style={styles.detailsSection}>
              <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                Patient Name
              </Text>
              <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                {selectedOrder.patient}
              </Text>
            </View>

            {selectedOrder.phone && (
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                  Phone Number
                </Text>
                <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                  {selectedOrder.phone}
                </Text>
              </View>
            )}

            {selectedOrder.address && (
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                  Delivery Address
                </Text>
                <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                  {selectedOrder.address}
                </Text>
              </View>
            )}

            <View style={[styles.detailsDivider, { backgroundColor: theme.colors.overlayBackground }]} />

            {/* Order Date */}
            <View style={styles.detailsSection}>
              <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                Order Date
              </Text>
              <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                {formatDate(selectedOrder.date)}
              </Text>
            </View>

            {/* Medication Schedule */}
            <View style={styles.detailsSection}>
              <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                Medication Schedule
              </Text>
              <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                {getScheduleDisplay(selectedOrder.medicationSchedule)}
              </Text>
            </View>
          </TransparentCard>
        )}
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
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
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Order History
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={[
                styles.searchInputContainer,
                { 
                  backgroundColor: theme.colors.overlayBackground,
                  borderColor: theme.colors.overlayBackground,
                }
              ]}>
                <MaterialIcons
                  name="search"
                  size={theme.iconSizes.md}
                  color={theme.colors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.colors.text }
                  ]}
                  placeholder="Search orders..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Orders Table */}
            {loading ? (
              <TransparentCard style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Loading orders...
                </Text>
              </TransparentCard>
            ) : filteredOrders.length > 0 ? (
              <TransparentCard style={styles.tableContainer}>
                <ScrollView 
                  showsVerticalScrollIndicator={true}
                  style={styles.tableScrollView}
                >
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { color: theme.colors.text, flex: 2 }]}>
                      Patient
                    </Text>
                    <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>
                      Date
                    </Text>
                    <Text style={[styles.headerCell, { color: theme.colors.text, flex: 1 }]}>
                      Status
                    </Text>
                  </View>

                  {/* Table Rows */}
                  {filteredOrders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status, theme);
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <Pressable
                        key={order.id}
                        onPress={() => setSelectedOrder(order)}
                      >
                        <View 
                          style={[
                            styles.tableRow,
                            isSelected && styles.tableRowSelected,
                            index === filteredOrders.length - 1 && { borderBottomWidth: 0 }
                          ]}
                        >
                          <Text style={[styles.tableCell, { color: theme.colors.text, flex: 2 }]}>
                            {order.patient}
                          </Text>
                          <Text style={[styles.tableCell, { color: theme.colors.text, flex: 1 }]}>
                            {formatDate(order.date)}
                          </Text>
                          <View style={[styles.tableCell, { flex: 1 }]}>
                            <View style={[
                              styles.statusBadge,
                              { backgroundColor: statusConfig.backgroundColor }
                            ]}>
                              <Text style={[
                                styles.statusText,
                                { color: statusConfig.textColor }
                              ]}>
                                {statusConfig.text}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </TransparentCard>
            ) : (
              <TransparentCard style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery.trim() 
                    ? `No orders found matching "${searchQuery}"`
                    : 'No orders found'}
                </Text>
              </TransparentCard>
            )}

            {/* Order Details Card */}
            {selectedOrder && (
              <TransparentCard style={styles.detailsCard}>
                <Text style={[styles.detailsCardTitle, { color: theme.colors.text }]}>
                  Order Details
                </Text>

                {/* Order Number and Status */}
                <View style={styles.detailsRow}>
                  <View style={[styles.detailsSection, styles.detailsRowItem]}>
                    <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                      Order Number
                    </Text>
                    <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                      {selectedOrder.orderNumber}
                    </Text>
                  </View>
                  <View style={[styles.detailsSection, styles.detailsRowItem]}>
                    <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                      Status
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusConfig(selectedOrder.status, theme).backgroundColor, alignSelf: 'flex-start' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusConfig(selectedOrder.status, theme).textColor }
                      ]}>
                        {getStatusConfig(selectedOrder.status, theme).text}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.detailsDivider, { backgroundColor: theme.colors.overlayBackground }]} />

                {/* Patient Information */}
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                    Patient Name
                  </Text>
                  <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                    {selectedOrder.patient}
                  </Text>
                </View>

                {selectedOrder.phone && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                      Phone Number
                    </Text>
                    <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                      {selectedOrder.phone}
                    </Text>
                  </View>
                )}

                {selectedOrder.address && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                      Delivery Address
                    </Text>
                    <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                      {selectedOrder.address}
                    </Text>
                  </View>
                )}

                <View style={[styles.detailsDivider, { backgroundColor: theme.colors.overlayBackground }]} />

                {/* Order Date */}
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                    Order Date
                  </Text>
                  <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                    {formatDate(selectedOrder.date)}
                  </Text>
                </View>

                {/* Medication Schedule */}
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: theme.colors.textSecondary }]}>
                    Medication Schedule
                  </Text>
                  <Text style={[styles.detailsSectionValue, { color: theme.colors.text }]}>
                    {getScheduleDisplay(selectedOrder.medicationSchedule)}
                  </Text>
                </View>
              </TransparentCard>
            )}
          </>
        )}
        </ScrollView>
      </View>
    </BackgroundGradient>
  );
}

