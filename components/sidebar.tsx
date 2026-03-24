import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform, Modal, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Spacing, BorderRadius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUserInfo, signOut } from '@/lib/auth';

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

export function Sidebar() {
  const router = useRouter();
  const segments = useSegments();
  const theme = useTheme();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<View>(null);
  const [profileLayout, setProfileLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await getCurrentUserInfo();
        setUserInfo(user);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const isActive = (route: string) => {
    const segs = segments as string[];
    const currentPath = '/' + segs.join('/');

    if (route === '/') {
      return currentPath === '/' || currentPath === '/(tabs)' || segs.length === 0 || (segs.length === 1 && segs[0] === 'index');
    }

    const routePath = route.replace(/^\//, '');
    return currentPath === route || currentPath.startsWith(route + '/') || segs[0] === routePath;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={[
        styles.sidebar, 
        { 
          backgroundColor: Platform.OS === 'web' 
            ? '#FAFAFA' // Slightly off-white for web
            : theme.colors.cardBackground 
        }
      ]}>
        {/* User Profile Section */}
        <View style={styles.userSection}>
          <Pressable
            ref={profileRef}
            onPress={() => {
              profileRef.current?.measureInWindow((x, y, width, height) => {
                setProfileLayout({ x, y, width, height });
                setShowProfileMenu(true);
              });
            }}
            style={styles.userProfile}
          >
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {userInfo?.initials || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text 
                style={[styles.userName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {userInfo?.name || 'Loading...'}
              </Text>
              <Text 
                style={[styles.userEmail, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {userInfo?.email || ''}
              </Text>
            </View>
            <MaterialIcons 
              name="more-vert" 
              size={20} 
              color={theme.colors.textSecondary} 
            />
          </Pressable>
        </View>

        {/* Navigation Items */}
        <View style={styles.navItems}>
          {navItems.map((item) => {
            const active = isActive(item.route);
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  active && { backgroundColor: theme.colors.primary + '15' }
                ]}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={item.icon} 
                  size={22} 
                  color={active ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text 
                  style={[
                    styles.navItemText,
                    { 
                      color: active ? theme.colors.primary : theme.colors.text,
                      fontFamily: active ? theme.fonts.semiBold : theme.fonts.regular
                    }
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Delivery Button */}
        <TouchableOpacity
          style={styles.addDeliveryButton}
          onPress={() => router.push('/add-delivery')}
          activeOpacity={0.8}
        >
          <MaterialIcons 
            name="add" 
            size={20} 
            color={theme.colors.text} 
          />
          <Text style={styles.addDeliveryButtonText}>
            Add Delivery
          </Text>
        </TouchableOpacity>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.bottomActionItem}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="settings" 
              size={20} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.bottomActionText, { color: theme.colors.textSecondary }]}>
              Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomActionItem}
            onPress={() => {
              // Add support action here
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="help-outline" 
              size={20} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.bottomActionText, { color: theme.colors.textSecondary }]}>
              Support
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
          {profileLayout && (
            <View 
              style={{
                position: 'absolute',
                top: profileLayout.y + profileLayout.height + 4,
                left: profileLayout.x,
                width: profileLayout.width,
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
                  onPress={handleLogout}
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
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    width: 260,
    ...(Platform.OS === 'web'
      ? {
          height: '100vh',
          position: 'fixed' as any,
          left: 0,
          top: 0,
          zIndex: 1000,
        } as any
      : { display: 'none' }),
  },
  sidebar: {
    width: '100%',
    ...(Platform.OS === 'web' ? { height: '100%' } as any : {}),
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.08)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '1px 0 4px rgba(0, 0, 0, 0.04)',
    } as any : {}),
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  userSection: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
  },
  navItems: {
    flex: 1,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  navItemText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  addDeliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#d2c9fe', // Same purple as bar chart
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  addDeliveryButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  bottomActions: {
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  bottomActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  bottomActionText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  profileMenu: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
  },
});

