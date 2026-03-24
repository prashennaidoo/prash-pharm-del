import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Sidebar } from '@/components/sidebar';

export default function TabLayout() {
  const activeTint = useThemeColor({}, 'tabIconSelected') as string;
  const inactiveTint = useThemeColor({}, 'tabIconDefault') as string;

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <Sidebar />}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: activeTint,
            tabBarInactiveTintColor: inactiveTint,
            tabBarStyle: { display: 'none' },
          }}
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assessment" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-delivery"
        options={{
          title: 'Add Delivery',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="add-delivery-medication"
        options={{
          title: 'Add Delivery Medication',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="add-delivery-summary"
        options={{
          title: 'Add Delivery Summary',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          href: null, // Hide from tab bar
        }}
      />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  content: {
    flex: 1,
    ...(Platform.OS === 'web' ? { marginLeft: 260, paddingLeft: 0 } : {}),
  },
});