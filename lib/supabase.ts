import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const supabaseUrl = (extra.EXPO_PUBLIC_SUPABASE_URL as string) || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = (extra.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast during development if env is missing
  throw new Error('Missing Supabase configuration. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    storageKey: 'sb-pharma-auth',
  },
  global: {
    headers: {
      'x-application-name': 'pharmadelivery',
    },
  },
});

// Create a Supabase client for drivers that uses custom JWT token
export async function getDriverSupabaseClient() {
  console.log('=== Creating Driver Supabase Client ===');
  const { getDriverToken } = await import('./auth');
  const token = await getDriverToken();
  
  console.log('Driver token exists:', !!token);
  if (token) {
    // Decode JWT to see payload (for debugging)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT Payload:', JSON.stringify(payload, null, 2));
        console.log('JWT role:', payload.role);
        console.log('JWT pharmacy_id:', payload.pharmacy_id);
        console.log('JWT sub:', payload.sub);
      }
    } catch (e) {
      console.log('Could not decode JWT:', e);
    }
    console.log('Token preview:', token.substring(0, 50) + '...');
  }
  
  if (!token) {
    console.error('❌ No driver token found');
    throw new Error('No driver token found');
  }

  console.log('Creating Supabase client with token...');
  // Create a client with custom JWT token
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'pharmadelivery',
        'Authorization': `Bearer ${token}`,
      },
    },
  });
  
  // Set the session with the JWT token so Storage operations work correctly
  // Supabase Storage requires the token to be set via setSession, not just headers
  try {
    const { data: { session }, error: sessionError } = await client.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for custom JWT tokens
    });
    
    if (sessionError) {
      console.warn('Warning: Could not set session:', sessionError);
      // Continue anyway - the token in headers might be sufficient
    } else {
      console.log('✓ Session set successfully');
    }
  } catch (sessionErr) {
    console.warn('Warning: Error setting session:', sessionErr);
    // Continue anyway - the token in headers might be sufficient
  }
  
  console.log('✓ Driver Supabase client created');
  return client;
}


