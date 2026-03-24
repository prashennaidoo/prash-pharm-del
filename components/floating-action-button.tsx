import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface FloatingActionButtonProps {
  onPress?: () => void;
  route?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  backgroundColor?: string;
}

export function FloatingActionButton({ 
  onPress, 
  route = '/add-delivery',
  icon = 'add',
  backgroundColor 
}: FloatingActionButtonProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(route as any);
    }
  };

  const buttonColor = backgroundColor || theme.getStatusColor('picked_up');

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: buttonColor }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={icon}
        size={28}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100, // Position above the floating nav bar (which is at bottom: 20)
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
});


