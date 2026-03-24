import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { TransparentCard } from '@/components/transparent-card';
import { FloatingNavBar } from '@/components/floating-nav-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getCurrentUserPharmacy } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'picked_up' | 'delivered';
  deliveryDate: string; // YYYY-MM-DD format
  address?: string;
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
    padding: theme.spacing.screenPadding,
    paddingBottom: 80, // Account for floating nav bar
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.componentGap,
  },
  headerTitle: {
    ...theme.typography.h3,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  monthNavigationButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    ...theme.typography.h5,
    flex: 1,
    textAlign: 'center',
  },
  calendarCard: {
    padding: theme.spacing.md,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDay: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.medium,
    textAlign: 'center',
  },
  calendarGrid: {
    width: '100%',
  },
  calendarRow: {
    flexDirection: 'row',
    width: '100%',
  },
  calendarDay: {
    flex: 1,
    padding: 4,
    aspectRatio: 1,
  },
  dayContent: {
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
  },
  dayContentToday: {
    backgroundColor: theme.colors.primary,
    opacity: theme.opacity.hover,
  },
  dayContentOtherMonth: {
    opacity: theme.opacity.disabled,
  },
  dayNumber: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.medium,
  },
  dayNumberToday: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
  },
  dayContentSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  orderIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  ordersCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.componentGap,
  },
  ordersTitle: {
    ...theme.typography.h5,
    marginBottom: theme.spacing.sm,
  },
  orderItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.colors.overlayBackground,
    opacity: theme.opacity.overlay,
    marginBottom: theme.spacing.xs,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    ...theme.typography.bodySmall,
    fontFamily: theme.fonts.semiBold,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.badge,
  },
  statusText: {
    ...theme.typography.bodyXSmall,
    fontFamily: theme.fonts.semiBold,
  },
  orderDetails: {
    ...theme.typography.bodyXSmall,
    marginTop: 2,
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    ...theme.typography.body,
    textAlign: 'center',
    opacity: theme.opacity.disabled,
  },
});

export default function CalendarScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
            address,
            patient:patient_id(
              name,
              surname,
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
            // Get customer name from patient relationship
            let customerName = 'Customer';
            let address: string | undefined = order.address;

            if (order.patient) {
              const patient = order.patient as { name?: string; surname?: string; address?: any };
              if (patient.name) {
                customerName = patient.surname 
                  ? `${patient.name} ${patient.surname}`.trim()
                  : patient.name;
              }
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

            // Format created_at date to YYYY-MM-DD
            const deliveryDate = new Date(order.created_at).toISOString().split('T')[0];

            return {
              id: order.id.toString(),
              orderNumber: order.order_id || `Order #${order.id}`,
              customerName,
              status: order.status as Order['status'],
              deliveryDate,
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

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get month name
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  // Format date to YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get orders for a specific date
  const getOrdersForDate = (date: Date): Order[] => {
    const dateStr = formatDateLocal(date);
    return orders.filter(order => order.deliveryDate === dateStr);
  };

  // Get orders for selected date
  const selectedDateOrders = selectedDate ? getOrdersForDate(selectedDate) : [];

  // Get status color using theme (matches home page)
  const getStatusColor = (status: Order['status']): string => {
    return theme.getStatusColor(status);
  };

  // Get status text color using theme (matches home page)
  const getStatusTextColor = (status: Order['status']): string => {
    return theme.getStatusTextColor(status);
  };

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month to fill the first week
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    // Add previous month days
    for (let i = 0; i < firstDayOfWeek; i++) {
      const dayNumber = daysInPrevMonth - firstDayOfWeek + i + 1;
      days.push({
        date: new Date(prevYear, prevMonth, dayNumber),
        isCurrentMonth: false,
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(currentYear, currentMonth, day),
        isCurrentMonth: true,
      });
    }
    
    // Add days from next month to fill complete weeks
    const totalDaysSoFar = days.length;
    const daysNeededForCompleteWeeks = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let day = 1; day <= daysNeededForCompleteWeeks; day++) {
      days.push({
        date: new Date(nextYear, nextMonth, day),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentYear, currentMonth]);

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons
              name="arrow-back"
              size={theme.iconSizes.header}
              color={theme.colors.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Calendar
          </Text>
          <View style={{ width: theme.iconSizes.header }} />
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <Pressable
            style={styles.monthNavigationButton}
            onPress={goToPreviousMonth}
          >
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
          <Text style={[styles.monthYearText, { color: theme.colors.text }]}>
            {monthName}
          </Text>
          <Pressable
            style={styles.monthNavigationButton}
            onPress={goToNextMonth}
          >
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
        </View>

        {/* Calendar */}
        <TransparentCard style={styles.calendarCard}>
          {/* Week day headers */}
          <View style={styles.weekDaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} style={styles.weekDayContainer}>
                <Text
                  style={[
                    styles.weekDay,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, rowIndex) => {
              const weekDays = calendarDays.slice(rowIndex * 7, (rowIndex + 1) * 7);
              return (
                <View key={rowIndex} style={styles.calendarRow}>
                  {weekDays.map((dayInfo, dayIndex) => {
                    const isTodayDate = isToday(dayInfo.date);
                    const isSelected = selectedDate && 
                      dayInfo.date.toDateString() === selectedDate.toDateString();
                    const dayOrders = getOrdersForDate(dayInfo.date);
                    const hasOrders = dayOrders.length > 0;

                    return (
                      <Pressable
                        key={`${dayInfo.date.getTime()}-${rowIndex}-${dayIndex}`}
                        style={styles.calendarDay}
                        onPress={() => {
                          if (dayInfo.isCurrentMonth) {
                            setSelectedDate(dayInfo.date);
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.dayContent,
                            isTodayDate && styles.dayContentToday,
                            !dayInfo.isCurrentMonth && styles.dayContentOtherMonth,
                            isSelected && styles.dayContentSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayNumber,
                              isTodayDate && styles.dayNumberToday,
                              { color: isTodayDate ? '#FFFFFF' : theme.colors.text },
                              !dayInfo.isCurrentMonth && {
                                color: theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {dayInfo.date.getDate()}
                          </Text>
                          {hasOrders && (
                            <View style={[styles.orderIndicator, { backgroundColor: theme.colors.primary }]} />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </TransparentCard>

        {/* Selected Date Orders */}
        {selectedDate && (
          <TransparentCard style={styles.ordersCard}>
            <Text style={[styles.ordersTitle, { color: theme.colors.text }]}>
              Orders for {selectedDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {selectedDateOrders.length > 0 ? (
              selectedDateOrders.map((order) => (
                <View key={order.id} style={styles.orderItem}>
                  <View style={styles.orderItemHeader}>
                    <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                      {order.orderNumber}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: '#000000' },
                        ]}
                      >
                        {order.status === 'picked_up' ? 'Picked Up' : 
                         order.status === 'delivered' ? 'Delivered' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.orderDetails,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {order.customerName}
                  </Text>
                  {order.address && (
                    <Text
                      style={[
                        styles.orderDetails,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {order.address}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  No orders scheduled for this date
                </Text>
              </View>
            )}
          </TransparentCard>
        )}
      </ScrollView>

      {/* Floating Navigation Bar */}
      <FloatingNavBar />
    </BackgroundGradient>
  );
}
