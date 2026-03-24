import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface NavItem {
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
}

const navItems: NavItem[] = [
  { name: 'Home', icon: 'home', route: '/' },
  { name: 'Patients', icon: 'people', route: '/patients' },
  { name: 'Orders', icon: 'receipt', route: '/order-history' },
  { name: 'Reports', icon: 'assessment', route: '/reports' },
];

export function FloatingNavBar() {
  const router = useRouter();

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const backgroundColor = '#E5E5E5';

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { backgroundColor }]}>
        <View style={styles.navItems}>
          {navItems.map((item) => {
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={item.icon} 
                  size={24} 
                  color="#000000" 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 30,
    minWidth: 200,
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
    gap: Spacing.sm,
  },
  navItem: {
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
});

