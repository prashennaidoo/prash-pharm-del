import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/use-theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, toast.duration);

    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: {
      icon: 'check-circle' as const,
      bg: theme.colors.status.success,
      color: theme.colors.status.successText,
    },
    error: {
      icon: 'error' as const,
      bg: theme.colors.status.error,
      color: '#FFFFFF',
    },
    info: {
      icon: 'info' as const,
      bg: theme.colors.status.info,
      color: '#FFFFFF',
    },
  }[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: config.bg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
        },
      ]}
    >
      <MaterialIcons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color, fontFamily: 'Poppins-Medium' }]}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ctx: ToastContextType = {
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    info: (msg, dur) => show(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    alignItems: 'stretch',
    zIndex: 9999,
    ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
