import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Dimensions, Modal, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from '@/components/themed-view';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { BarChart, BarChartData } from '@/components/bar-chart';
import { StatCard } from '@/components/stat-card';
import { CurrentOrderCard, DeliveryStatus } from '@/components/current-order-card';
import { FloatingNavBar } from '@/components/floating-nav-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getCurrentUserInfo, getCurrentUserPharmacy, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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
  dashboardTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.componentGap,
  },
  chartCard: {
    marginBottom: theme.spacing.componentGap,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.componentGap,
  },
  currentOrderCard: {
    marginBottom: theme.spacing.componentGap,
  },
  orderHistoryCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.componentGap,
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
    minWidth: 0, // Allow flex shrinking
  },
  orderRowLeft: {
    flex: 1,
    gap: 2,
    flexShrink: 1, // Allow text to shrink if needed
    minWidth: 0, // Allow flex shrinking
    marginRight: theme.spacing.xs, // Add small gap between text and badge
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
    flexShrink: 1, // Allow badge to shrink slightly if needed
    minWidth: 0, // Allow content-based sizing
    maxWidth: '45%', // Prevent badge from taking too much space
  },
  statusText: {
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
    textAlign: 'center',
  },
  notificationButtonCard: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
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
  menuDivider: {
    height: 1,
    marginVertical: theme.spacing.xs,
  },
  webDashboardCard: {
    ...(Platform.OS === 'web' ? {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.card,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.componentGap,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    } : {}),
  },
});

export default function HomeScreen() {
  const theme = useTheme();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [weeklyDeliveryData, setWeeklyDeliveryData] = useState<BarChartData[]>([]);
  const [totalDeliveries, setTotalDeliveries] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<{
    status: DeliveryStatus;
    origin: string;
    destination: string;
    warehouse: string;
  } | null>(null);
  const [todaysDeliveries, setTodaysDeliveries] = useState<Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: DeliveryStatus;
  }>>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profilePillLayout, setProfilePillLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const profilePillRef = useRef<View>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotationAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Fetch user info and orders
  const fetchData = async () => {
      try {
        
        // Get user info
        const user = await getCurrentUserInfo();
        setUserInfo(user);

        // Get pharmacy ID and name
        const { pharmacyId, pharmacyName } = await getCurrentUserPharmacy();

        // Generate dates for the last 7 days (using UTC to avoid timezone issues)
        const dates: string[] = [];
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(todayUTC);
          date.setUTCDate(date.getUTCDate() - i);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          dates.push(dateStr);
        }

        // Query orders for the last 7 days
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        // Use a wider range to ensure we capture all orders (start of first day to end of last day in UTC)
        const startDateTime = `${startDate}T00:00:00.000Z`;
        const endDateTime = `${endDate}T23:59:59.999Z`;
        
        const { data: orders, error } = await supabase
          .from('delivery')
          .select('created_at')
          .eq('pharmacy_id', pharmacyId)
          .gte('created_at', startDateTime)
          .lte('created_at', endDateTime);

        if (error) {
          console.error('Error fetching orders for graph:', error);
          // Fallback to empty data
          setWeeklyDeliveryData(generateEmptyWeeklyData(dates));
        } else {
          // Group orders by date (using UTC to match the date range)
          const ordersByDate = new Map<string, number>();
          dates.forEach(date => ordersByDate.set(date, 0));
          
          if (orders && orders.length > 0) {
            orders.forEach(order => {
              // Parse the timestamp and convert to UTC date string
              const orderDateUTC = new Date(order.created_at);
              const orderDateStr = orderDateUTC.toISOString().split('T')[0];
              
              // Only count if the date is within our date range
              if (ordersByDate.has(orderDateStr)) {
                const count = ordersByDate.get(orderDateStr) || 0;
                ordersByDate.set(orderDateStr, count + 1);
              }
            });
          }

          // Convert to chart data format
          const values = Array.from(ordersByDate.values());
          
          const chartData: BarChartData[] = dates.map((date, idx) => ({
            day: date,
            value: ordersByDate.get(date) || 0,
            maxValue: 1, // This will be overridden by dynamic calculation in BarChart
            id: `chart-${date}-${idx}` // Add unique identifier
          }));

          setWeeklyDeliveryData(chartData);
        }

        // Fetch total deliveries count (all time)
        const { count: totalCount, error: totalError } = await supabase
          .from('delivery')
          .select('*', { count: 'exact', head: true })
          .eq('pharmacy_id', pharmacyId);

        if (totalError) {
          console.error('Error fetching total deliveries:', totalError);
        } else {
          setTotalDeliveries(totalCount || 0);
        }

        // Fetch pending orders count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('delivery')
          .select('*', { count: 'exact', head: true })
          .eq('pharmacy_id', pharmacyId)
          .eq('status', 'pending');

        if (pendingError) {
          console.error('Error fetching pending orders:', pendingError);
        } else {
          setPendingOrders(pendingCount || 0);
        }

        // Fetch pharmacy address for origin
        const { data: pharmacy, error: pharmacyError } = await supabase
          .from('pharmacy')
          .select('pharmacy_address')
          .eq('id', pharmacyId)
          .single();

        const pharmacyAddress = pharmacy?.pharmacy_address || pharmacyName || 'Pharmacy';

        // Fetch the most recent order with status 'pending' or 'picked_up'
        const { data: recentOrder, error: recentOrderError } = await supabase
          .from('delivery')
          .select('id, status, address, order_id, created_at')
          .eq('pharmacy_id', pharmacyId)
          .in('status', ['pending', 'picked_up'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentOrderError && recentOrderError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching current order:', recentOrderError);
        } else if (recentOrder) {
          setCurrentOrder({
            status: recentOrder.status as DeliveryStatus,
            origin: pharmacyAddress,
            destination: recentOrder.address || 'Address not available',
            warehouse: pharmacyName || 'Current Deliveries',
          });
        } else {
          // No current order found
          setCurrentOrder(null);
        }

        // Fetch today's deliveries (pending, picked_up, and delivered) with patient information
        // Reuse todayUTC from above
        const todayStart = todayUTC.toISOString().split('T')[0] + 'T00:00:00.000Z';
        const todayEnd = todayUTC.toISOString().split('T')[0] + 'T23:59:59.999Z';
        
        const { data: todaysDeliveriesData, error: todaysDeliveriesError } = await supabase
          .from('delivery')
          .select(`
            id,
            order_id,
            status,
            created_at,
            patient:patient_id(name, surname)
          `)
          .eq('pharmacy_id', pharmacyId)
          .in('status', ['pending', 'picked_up', 'delivered'])
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .order('created_at', { ascending: false });

        if (todaysDeliveriesError) {
          console.error('Error fetching today\'s deliveries:', todaysDeliveriesError);
          setTodaysDeliveries([]);
        } else if (todaysDeliveriesData && todaysDeliveriesData.length > 0) {
          // Format orders for display
          const formattedOrders = todaysDeliveriesData.map(order => {
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

          setTodaysDeliveries(formattedOrders);
        } else {
          setTodaysDeliveries([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to empty data
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        setWeeklyDeliveryData(generateEmptyWeeklyData(dates));
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Stop any existing animation
    if (rotationAnimationRef.current) {
      rotationAnimationRef.current.stop();
    }
    
    // Start rotation animation
    rotateAnim.setValue(0);
    rotationAnimationRef.current = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    rotationAnimationRef.current.start();
    
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
      if (rotationAnimationRef.current) {
        rotationAnimationRef.current.stop();
        rotationAnimationRef.current = null;
      }
      rotateAnim.setValue(0);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper function to generate empty weekly data
  const generateEmptyWeeklyData = (dates: string[]): BarChartData[] => {
    return dates.map((date, idx) => ({
      day: date,
      value: 0,
      maxValue: 1, // This will be overridden by dynamic calculation in BarChart
      id: `chart-${date}-${idx}` // Add unique identifier
    }));
  };

  // Format dates for display (MM/DD format)
  const formattedWeeklyData: BarChartData[] = weeklyDeliveryData.map(item => {
    const date = new Date(item.day);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return {
      ...item,
      day: `${month}/${day}`, // Display as MM/DD
      id: item.id // Preserve the unique ID
    };
  });

  const styles = createStyles(theme);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Calculate dynamic font size and padding for status badges based on screen width
  const screenWidth = Dimensions.get('window').width;
  // Estimate text width: "Picked Up" is longest at ~9 chars
  // Each char is roughly 6-7px at fontSize 10
  const maxTextLength = Math.max(...['Pending', 'Picked Up', 'Delivered'].map(s => s.length));
  const estimatedTextWidth = maxTextLength * 7; // chars * px per char at fontSize 10
  // Available width for status badge: screen width - card padding - order row padding - order info - gap
  // Conservative estimate: assume order info takes ~60% of width, card padding ~32px, row padding ~32px
  const cardPadding = 32; // 16px * 2
  const rowPadding = 32; // 16px * 2
  const availableWidthForBadge = (screenWidth - cardPadding - rowPadding) * 0.35; // Reserve 35% for badge
  const baseFontSize = 10;
  const minFontSize = screenWidth < 350 ? 8 : 9;
  const maxFontSize = 10;
  // Scale font size based on available width
  const scaleFactor = Math.min(1, availableWidthForBadge / estimatedTextWidth);
  const dynamicFontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * scaleFactor));
  // Reduce padding on smaller screens to give more room for text
  const badgePaddingHorizontal = screenWidth < 350 ? 6 : theme.spacing.sm;

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section - Only show on mobile */}
        {Platform.OS !== 'web' && (
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
                    {userInfo?.initials || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[
                    styles.profileName,
                    { color: theme.colors.text }
                  ]}>
                    {userInfo?.name || 'Loading...'}
                  </Text>
                  <Text style={[
                    styles.profileEmail,
                    { color: theme.colors.textSecondary }
                  ]}>
                    {userInfo?.email || ''}
                  </Text>
                </View>
              </TransparentCard>
            </View>

            {/* Header Buttons */}
            <View style={styles.headerButtons}>
              {/* Refresh Button */}
              <TransparentCard
                style={styles.notificationButtonCard}
                interactive={true}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                  <MaterialIcons
                    name="refresh"
                    size={theme.iconSizes.header}
                    color={theme.colors.text}
                  />
                </Animated.View>
              </TransparentCard>

              {/* Add Delivery Button */}
              <TransparentCard
                style={[styles.notificationButtonCard, { backgroundColor: '#d2c9fe' }]}
                interactive={true}
                onPress={() => router.push('/(tabs)/add-delivery')}
              >
                <MaterialIcons
                  name="add"
                  size={theme.iconSizes.header}
                  color={theme.colors.text}
                />
              </TransparentCard>

              {/* Settings Button Card */}
              <TransparentCard
                style={styles.notificationButtonCard}
                interactive={true}
                onPress={() => router.push('/settings')}
              >
                <MaterialIcons
                  name="settings"
                  size={theme.iconSizes.header}
                  color={theme.colors.text}
                />
              </TransparentCard>
            </View>
          </View>
        )}

        {/* Web Dashboard Card - Wraps content from refresh button to today's deliveries */}
        {Platform.OS === 'web' ? (
          <View style={styles.webDashboardCard}>
            {/* Web Header - Refresh and Add Delivery buttons */}
            <View style={styles.headerSection}>
              <View style={styles.headerButtons}>
                {/* Refresh Button */}
                <TransparentCard
                  style={styles.notificationButtonCard}
                  interactive={true}
                  onPress={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <MaterialIcons
                      name="refresh"
                      size={theme.iconSizes.header}
                      color={theme.colors.text}
                    />
                  </Animated.View>
                </TransparentCard>

                {/* Add Delivery Button */}
                <TransparentCard
                  style={[styles.notificationButtonCard, { backgroundColor: '#d2c9fe' }]}
                  interactive={true}
                  onPress={() => router.push('/(tabs)/add-delivery')}
                >
                  <MaterialIcons
                    name="add"
                    size={theme.iconSizes.header}
                    color={theme.colors.text}
                  />
                </TransparentCard>
              </View>
            </View>

            {/* Dashboard Title */}
            <Text style={[
              styles.dashboardTitle,
              { color: theme.colors.text }
            ]}>Pharmacy Delivery Dashboard</Text>

            {/* Delivery Chart */}
            <BarChart
              title="Weekly Deliveries"
              data={formattedWeeklyData}
              style={styles.chartCard}
              xAxisLabel="Date"
              yAxisLabel="Deliveries"
            />

            {/* Stats Cards Row */}
            <View style={styles.statsRow}>
              <StatCard
                label="Total Deliveries"
                value={totalDeliveries.toString()}
                subtext="All time"
              />
              <StatCard
                label="Pending Orders"
                value={pendingOrders}
                subtext="Current"
              />
            </View>

            {/* Current Order Card */}
            {currentOrder && (
              <CurrentOrderCard
                style={styles.currentOrderCard}
                status={currentOrder.status}
                warehouse={currentOrder.warehouse}
                origin={currentOrder.origin}
                destination={currentOrder.destination}
              />
            )}

            {/* Today's Deliveries Card */}
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
            >Today's Deliveries</Text>
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
            {todaysDeliveries.length > 0 ? (
              todaysDeliveries.map((order) => {
                const statusConfig = getStatusConfig(order.status, theme);
                return (
                  <View 
                    key={order.id}
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
                    >No deliveries today</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </TransparentCard>
          </View>
        ) : (
          <>
            {/* Dashboard Title */}
            <Text style={[
              styles.dashboardTitle,
              { color: theme.colors.text }
            ]}>Pharmacy Delivery Dashboard</Text>

            {/* Delivery Chart */}
            <BarChart
              title="Weekly Deliveries"
              data={formattedWeeklyData}
              style={styles.chartCard}
              xAxisLabel="Date"
              yAxisLabel="Deliveries"
            />

            {/* Stats Cards Row */}
            <View style={styles.statsRow}>
              <StatCard
                label="Total Deliveries"
                value={totalDeliveries.toString()}
                subtext="All time"
              />
              <StatCard
                label="Pending Orders"
                value={pendingOrders}
                subtext="Current"
              />
            </View>

            {/* Current Order Card */}
            {currentOrder && (
              <CurrentOrderCard
                style={styles.currentOrderCard}
                status={currentOrder.status}
                warehouse={currentOrder.warehouse}
                origin={currentOrder.origin}
                destination={currentOrder.destination}
              />
            )}

            {/* Today's Deliveries Card */}
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
                >Today's Deliveries</Text>
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
                {todaysDeliveries.length > 0 ? (
                  todaysDeliveries.map((order) => {
                    const statusConfig = getStatusConfig(order.status, theme);
                    return (
                      <View 
                        key={order.id}
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
                        >No deliveries today</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </TransparentCard>
          </>
        )}
      </ScrollView>

      {/* Floating Navigation Bar - Only on mobile */}
      {Platform.OS !== 'web' && <FloatingNavBar />}

      {/* Profile Menu Modal - Only on mobile */}
      {Platform.OS !== 'web' && (
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
      )}
    </BackgroundGradient>
  );
}
