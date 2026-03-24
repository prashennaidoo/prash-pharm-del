import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { CurrentOrderCard, DeliveryStatus } from '@/components/current-order-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getDriverPharmacy, signOutDriver, getDriverSupabaseClient } from '@/lib/auth';

// Helper function to get status config using centralized theme
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

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.screenPadding + 20,
    paddingBottom: theme.spacing.screenPadding + 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.componentGap,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs + 2,
    gap: theme.spacing.xs + 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.avatar,
    backgroundColor: theme.colors.primary,
    opacity: theme.opacity.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
  },
  profileInfo: {
    flexDirection: 'column',
    gap: 1,
  },
  profileName: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.medium,
  },
  profileEmail: {
    ...theme.typography.bodyXSmall,
  },
  profileMenu: {
    borderRadius: theme.borderRadius.card,
    paddingVertical: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  menuItemText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
  },
  ordersCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.componentGap,
  },
  ordersTitle: {
    ...theme.typography.h5,
    marginBottom: theme.spacing.md,
  },
  ordersList: {
    gap: theme.spacing.md,
  },
  orderListItem: {
    marginBottom: theme.spacing.sm,
  },
  emptyOrdersText: {
    ...theme.typography.body,
    textAlign: 'center',
    opacity: theme.opacity.overlay,
    paddingVertical: theme.spacing.lg,
  },
  orderHistoryCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.componentGap,
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderHistoryTitle: {
    ...theme.typography.h5,
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.sm - 1,
    opacity: theme.opacity.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderRowsContainer: {
    gap: theme.spacing.sm,
  },
  orderRow: {
    opacity: theme.opacity.overlay,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  orderRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 0,
  },
  orderRowLeft: {
    flex: 1,
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
    marginRight: theme.spacing.xs,
  },
  orderNumber: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    flexShrink: 1,
    minWidth: 0,
  },
  customerName: {
    ...theme.typography.bodySmall,
    flexShrink: 1,
    minWidth: 0,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.badge,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '45%',
  },
  statusText: {
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
    textAlign: 'center',
  },
});

interface PendingOrder {
  id: number;
  order_id: string;
  status: DeliveryStatus;
  address: string;
  created_at: string;
  pharmacy_address?: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: DeliveryStatus;
}

export default function DriverDashboardScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [pharmacyName, setPharmacyName] = useState<string>('');
  const [pharmacyAddress, setPharmacyAddress] = useState<string>('');
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profilePillLayout, setProfilePillLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const profilePillRef = useRef<View>(null);

  useEffect(() => {
    loadPharmacyInfo();
  }, []);

  const loadPharmacyInfo = async () => {
    try {
      const pharmacy = await getDriverPharmacy();
      if (pharmacy) {
        setPharmacyName(pharmacy.pharmacyName);
      }
    } catch (error) {
      console.error('Error loading pharmacy info:', error);
    }
  };

  const fetchPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      const driverSupabase = await getDriverSupabaseClient();
      const pharmacy = await getDriverPharmacy();

      if (!pharmacy) {
        console.error('Pharmacy information not found');
        setPendingOrders([]);
        return;
      }

      // Fetch pharmacy address
      const { data: pharmacyData, error: pharmacyError } = await driverSupabase
        .from('pharmacy')
        .select('pharmacy_address')
        .eq('id', pharmacy.pharmacyId)
        .single();

      if (!pharmacyError && pharmacyData) {
        setPharmacyAddress(pharmacyData.pharmacy_address || pharmacy.pharmacyName || 'Pharmacy');
      } else {
        setPharmacyAddress(pharmacy.pharmacyName || 'Pharmacy');
      }

      // Fetch pending and picked_up orders
      const { data: orders, error } = await driverSupabase
        .from('delivery')
        .select('id, order_id, status, address, created_at')
        .eq('pharmacy_id', pharmacy.pharmacyId)
        .in('status', ['pending', 'picked_up'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        setPendingOrders([]);
      } else {
        setPendingOrders(orders || []);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const driverSupabase = await getDriverSupabaseClient();
      const pharmacy = await getDriverPharmacy();

      if (!pharmacy) {
        console.error('Pharmacy information not found');
        setRecentOrders([]);
        return;
      }

      // Fetch recent orders for order history (last 3 orders) with patient information
      const { data: recentOrdersData, error: recentOrdersError } = await driverSupabase
        .from('delivery')
        .select(`
          id,
          order_id,
          status,
          created_at,
          patient:patient_id(name, surname)
        `)
        .eq('pharmacy_id', pharmacy.pharmacyId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentOrdersError) {
        console.error('Error fetching recent orders:', recentOrdersError);
        setRecentOrders([]);
      } else if (recentOrdersData && recentOrdersData.length > 0) {
        // Format orders for display
        const formattedOrders = recentOrdersData.map(order => {
          // Get customer name from patient relationship
          let customerName = 'Customer';
          if (order.patient) {
            const patient = order.patient as { name?: string; surname?: string };
            if (patient.name) {
              customerName = patient.surname 
                ? `${patient.name} ${patient.surname}`.trim()
                : patient.name;
            }
          }
          
          return {
            id: order.id.toString(),
            orderNumber: order.order_id || `Order #${order.id}`,
            customerName,
            status: order.status as DeliveryStatus,
          };
        });

        setRecentOrders(formattedOrders);
      } else {
        setRecentOrders([]);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setRecentOrders([]);
    }
  }, []);

  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPendingOrders();
      fetchRecentOrders();
    }, [fetchPendingOrders, fetchRecentOrders])
  );

  const handleLogout = async () => {
    try {
      await signOutDriver();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get initials from pharmacy name
  const getInitials = (name: string): string => {
    if (!name) return 'D';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/driver/order-details?id=${orderId}`);
  };

  // Calculate dynamic font size and padding for status badges based on screen width
  const screenWidth = Dimensions.get('window').width;
  const maxTextLength = Math.max(...['Pending', 'Picked Up', 'Delivered'].map(s => s.length));
  const estimatedTextWidth = maxTextLength * 7;
  const cardPadding = 32;
  const rowPadding = 32;
  const availableWidthForBadge = (screenWidth - cardPadding - rowPadding) * 0.35;
  const baseFontSize = 10;
  const minFontSize = screenWidth < 350 ? 8 : 9;
  const maxFontSize = 10;
  const scaleFactor = Math.min(1, availableWidthForBadge / estimatedTextWidth);
  const dynamicFontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * scaleFactor));
  const badgePaddingHorizontal = screenWidth < 350 ? 6 : theme.spacing.sm;

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* User Profile Pill */}
          <View ref={profilePillRef}>
            <TransparentCard
              style={styles.profilePill}
              interactive={true}
              onPress={() => {
                profilePillRef.current?.measureInWindow((x, y, width, height) => {
                  setProfilePillLayout({ x, y, width, height });
                  setShowProfileMenu(true);
                });
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(pharmacyName)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[
                  styles.profileName,
                  { color: theme.colors.text }
                ]}>
                  {pharmacyName || 'Loading...'}
                </Text>
                <Text style={[
                  styles.profileEmail,
                  { color: theme.colors.textSecondary }
                ]}>
                  driver
                </Text>
              </View>
            </TransparentCard>
          </View>
        </View>

        {/* Orders Card */}
        <TransparentCard style={styles.ordersCard}>
          <Text style={[
            styles.ordersTitle,
            { color: theme.colors.text }
          ]}>
            Current Orders
          </Text>

          {loading ? (
            <Text style={[
              styles.emptyOrdersText,
              { color: theme.colors.textSecondary }
            ]}>
              Loading orders...
            </Text>
          ) : pendingOrders.length === 0 ? (
            <Text style={[
              styles.emptyOrdersText,
              { color: theme.colors.textSecondary }
            ]}>
              No pending orders
            </Text>
          ) : pendingOrders.length === 1 ? (
            <Pressable onPress={() => handleOrderPress(pendingOrders[0].id)}>
              <CurrentOrderCard
                warehouse={pharmacyName || 'Current Deliveries'}
                origin={pharmacyAddress}
                destination={pendingOrders[0].address || 'Address not available'}
                status={pendingOrders[0].status}
              />
            </Pressable>
          ) : (
            <View style={styles.ordersList}>
              {pendingOrders.map((order) => (
                <Pressable
                  key={order.id}
                  style={styles.orderListItem}
                  onPress={() => handleOrderPress(order.id)}
                >
                  <CurrentOrderCard
                    warehouse={pharmacyName || 'Current Deliveries'}
                    origin={pharmacyAddress}
                    destination={order.address || 'Address not available'}
                    status={order.status}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </TransparentCard>

        {/* Order History Card */}
        <TransparentCard style={styles.orderHistoryCard}>
          <View style={styles.orderHistoryHeader}>
            <Text style={[
              styles.orderHistoryTitle,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
            >Order History</Text>
            <Pressable 
              style={[styles.expandButton, { backgroundColor: theme.colors.overlayBackground }]}
              onPress={() => router.push('/order-history')}
            >
              <MaterialIcons 
                name="call-made" 
                size={theme.iconSizes.sm} 
                color={theme.colors.text} 
              />
            </Pressable>
          </View>
          
          <View style={styles.orderRowsContainer}>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status, theme);
                return (
                  <Pressable
                    key={order.id}
                    onPress={() => handleOrderPress(parseInt(order.id))}
                  >
                    <View 
                      style={[styles.orderRow, { backgroundColor: theme.colors.overlayBackground }]}
                    >
                      <View style={styles.orderRowContent}>
                        <View style={styles.orderRowLeft}>
                          <Text 
                            style={[
                              styles.orderNumber,
                              { color: theme.colors.text }
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.75}
                            ellipsizeMode="tail"
                          >{order.orderNumber}</Text>
                          <Text 
                            style={[
                              styles.customerName,
                              { color: theme.colors.textSecondary }
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.75}
                            ellipsizeMode="tail"
                          >{order.customerName}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge, 
                          { 
                            backgroundColor: statusConfig.backgroundColor,
                            paddingHorizontal: badgePaddingHorizontal
                          }
                        ]}>
                          <Text 
                            style={[
                              styles.statusText, 
                              { 
                                color: '#000000',
                                fontSize: dynamicFontSize
                              }
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.65}
                          >
                            {statusConfig.text}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={[styles.orderRow, { backgroundColor: theme.colors.overlayBackground }]}>
                <View style={styles.orderRowContent}>
                  <View style={styles.orderRowLeft}>
                    <Text 
                      style={[
                        styles.customerName,
                        { color: theme.colors.textSecondary }
                      ]}
                    >No recent orders</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </TransparentCard>
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }} 
          onPress={() => setShowProfileMenu(false)}
        >
          {profilePillLayout && (
            <View 
              style={{
                position: 'absolute',
                top: profilePillLayout.y + profilePillLayout.height + 4,
                left: profilePillLayout.x,
                width: profilePillLayout.width,
              }}
            >
              <Pressable 
                style={[
                  styles.profileMenu,
                  { backgroundColor: theme.colors.cardBackground }
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                >
                  <MaterialIcons
                    name="logout"
                    size={theme.iconSizes.md}
                    color={theme.colors.text}
                  />
                  <Text style={[
                    styles.menuItemText,
                    { color: theme.colors.text }
                  ]}>
                    Logout
                  </Text>
                </Pressable>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>
    </BackgroundGradient>
  );
}

