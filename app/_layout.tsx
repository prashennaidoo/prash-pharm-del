import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/components/toast';

// Removed useColorScheme import - enforcing light mode only
import { supabase } from '@/lib/supabase';
import { isDriverSession } from '@/lib/auth';
import {
  Poppins_100Thin,
  Poppins_100Thin_Italic,
  Poppins_200ExtraLight,
  Poppins_200ExtraLight_Italic,
  Poppins_300Light,
  Poppins_300Light_Italic,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black,
  Poppins_900Black_Italic,
} from '@expo-google-fonts/poppins';

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Thin': Poppins_100Thin,
    'Poppins-ThinItalic': Poppins_100Thin_Italic,
    'Poppins-ExtraLight': Poppins_200ExtraLight,
    'Poppins-ExtraLightItalic': Poppins_200ExtraLight_Italic,
    'Poppins-Light': Poppins_300Light,
    'Poppins-LightItalic': Poppins_300Light_Italic,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-RegularItalic': Poppins_400Regular_Italic,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-MediumItalic': Poppins_500Medium_Italic,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-SemiBoldItalic': Poppins_600SemiBold_Italic,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-BoldItalic': Poppins_700Bold_Italic,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
    'Poppins-ExtraBoldItalic': Poppins_800ExtraBold_Italic,
    'Poppins-Black': Poppins_900Black,
    'Poppins-BlackItalic': Poppins_900Black_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Check for driver session first
        const isDriver = await isDriverSession();
        if (isDriver) {
          if (!isMounted) return;
          router.replace('/driver' as any);
          setChecking(false);
          return;
        }

        // Check for pharmacist session
        // Wrap in try-catch to handle missing/invalid sessions gracefully
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        // If there's an error or no session, redirect to login
        if (error || !data.session) {
          router.replace('/login' as any);
        }
        setChecking(false);
      } catch (error) {
        // Handle any unexpected errors by redirecting to login
        console.error('Error checking auth session:', error);
        if (!isMounted) return;
        router.replace('/login' as any);
        setChecking(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Check for driver session first
      const isDriver = await isDriverSession();
      if (isDriver) {
        router.replace('/driver' as any);
        return;
      }

      // Handle pharmacist session
      if (!session) {
        router.replace('/login' as any);
      } else {
        router.replace('/' as any);
      }
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <ToastProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="driver" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="manage-staff" options={{ headerShown: false }} />
        <Stack.Screen name="manage-pharmacy-details" options={{ headerShown: false }} />
        <Stack.Screen name="add-staff" options={{ headerShown: false }} />
        <Stack.Screen name="order-history" options={{ headerShown: false }} />
        <Stack.Screen name="add-patient" options={{ headerShown: false }} />
        <Stack.Screen name="edit-patient" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
      </ToastProvider>
    </ThemeProvider>
  );
}
