import { supabase, getDriverSupabaseClient } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DRIVER_TOKEN_KEY = 'driver_token';
const DRIVER_PHARMACY_KEY = 'driver_pharmacy';

export type SignupInput = {
  email: string;
  password: string;
  pharmacyName: string;
  name: string;
  surname: string;
};

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function startPhoneSignIn(phone: string) {
  const normalized = phone.trim();
  const { data, error } = await supabase.auth.signInWithOtp({ phone: normalized });
  if (error) throw error;
  return data;
}

export async function verifyPhoneOtp(phone: string, code: string) {
  const normalized = phone.trim();
  const token = code.trim();
  const { data, error } = await supabase.auth.verifyOtp({ phone: normalized, token, type: 'sms' });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signUpAndBootstrap(input: SignupInput) {
  const { email, password, pharmacyName, name, surname } = input;

  // 1) Create auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) throw signUpError;

  const userId = signUpData.user?.id;
  if (!userId) throw new Error('Failed to create user.');

  // 2) Bootstrap domain data with RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('bootstrap_signup', {
    p_owner_user_id: userId,
    p_pharmacy_name: pharmacyName,
    p_pharmacist_name: name,
    p_pharmacist_surname: surname,
  });
  if (rpcError) throw rpcError;

  return { userId, bootstrap: rpcData };
}

export async function getCurrentUserPharmacy() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('No authenticated user');

  // First try to get pharmacy_id using the SECURITY DEFINER function
  // This function can access auth.users which the client cannot
  const { data: userPharmacyData, error: userPharmacyError } = await supabase
    .rpc('get_user_pharmacy', { user_id: user.id });

  let pharmacyId: number;
  let pharmacyName: string;

  // If user_pharmacy function returns data and no error, use it
  // This should work for both pharmacists and drivers
  if (userPharmacyData && userPharmacyData.length > 0 && !userPharmacyError && userPharmacyData[0].pharmacy_id) {
    // User is linked via user_pharmacy function
    pharmacyId = userPharmacyData[0].pharmacy_id;
    
    // Try to get pharmacy name if possible
    try {
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacy')
        .select('pharmacy_name')
        .eq('id', pharmacyId)
        .single();
      
      if (!pharmacyError && pharmacy) {
        pharmacyName = pharmacy.pharmacy_name;
      } else {
        pharmacyName = 'Pharmacy';
      }
    } catch {
      pharmacyName = 'Pharmacy';
    }
  } else {
    // Fallback: Get pharmacy_id from pharmacy table where owner_user_id matches (for pharmacy owners)
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacy')
      .select('id, pharmacy_name')
      .eq('owner_user_id', user.id)
      .single();

    if (pharmacyError) throw pharmacyError;
    if (!pharmacy) throw new Error('Pharmacy not found for user');

    pharmacyId = pharmacy.id;
    pharmacyName = pharmacy.pharmacy_name;
  }

  // Get pharmacist_id from pharmacists table
  const { data: pharmacist, error: pharmacistError } = await supabase
    .from('pharmacists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (pharmacistError) throw pharmacistError;
  if (!pharmacist) throw new Error('Pharmacist not found for user');

  return {
    pharmacyId,
    pharmacyName,
    pharmacistId: pharmacist.id,
  };
}

export async function getCurrentUserInfo() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('No authenticated user');

  // Get pharmacist info from pharmacists table
  const { data: pharmacist, error: pharmacistError } = await supabase
    .from('pharmacists')
    .select('name, surname')
    .eq('user_id', user.id)
    .single();

  if (pharmacistError) throw pharmacistError;
  
  const fullName = pharmacist 
    ? `${pharmacist.name || ''} ${pharmacist.surname || ''}`.trim() 
    : user.email?.split('@')[0] || 'User';

  return {
    name: fullName,
    email: user.email || '',
    initials: fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U',
  };
}

export async function isCurrentUserOwner(): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    // Get pharmacy info to check if user is the owner
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacy')
      .select('owner_user_id')
      .eq('owner_user_id', user.id)
      .single();

    // If we can find a pharmacy where this user is the owner, return true
    if (!pharmacyError && pharmacy) {
      return true;
    }

    // Also check via RPC function as fallback
    const { data: userPharmacyData, error: userPharmacyError } = await supabase
      .rpc('get_user_pharmacy', { user_id: user.id });

    if (!userPharmacyError && userPharmacyData && userPharmacyData.length > 0) {
      const pharmacyId = userPharmacyData[0].pharmacy_id;
      if (pharmacyId) {
        // Check if this user is the owner of the pharmacy
        const { data: pharmacyData } = await supabase
          .from('pharmacy')
          .select('owner_user_id')
          .eq('id', pharmacyId)
          .single();

        return pharmacyData?.owner_user_id === user.id;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking if user is owner:', error);
    return false;
  }
}

// Driver authentication functions
export async function signInDriver(pharmacyId: number, pin: string): Promise<{ token: string; pharmacy_id: number; pharmacy_name: string }> {
  // Use direct fetch to get better error messages
  const supabaseUrl = (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL as string) || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/driver-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ pharmacy_id: pharmacyId, pin }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If not JSON, use the text as-is (truncate if too long)
            errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }
      } catch (e) {
        console.error('Error reading error response:', e);
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
    }

    if (!responseData) {
      throw new Error('No data returned from driver login');
    }

    if (responseData.error) {
      throw new Error(responseData.error);
    }

    if (!responseData.token) {
      throw new Error('No token returned from driver login');
    }
    
    // Store token and pharmacy info
    await AsyncStorage.setItem(DRIVER_TOKEN_KEY, responseData.token);
    await AsyncStorage.setItem(DRIVER_PHARMACY_KEY, JSON.stringify({
      pharmacy_id: responseData.pharmacy_id,
      pharmacy_name: responseData.pharmacy_name,
    }));

    return responseData;
  } catch (err: any) {
    console.error('Driver login exception:', err);
    throw err;
  }
}

export async function getDriverToken(): Promise<string | null> {
  return await AsyncStorage.getItem(DRIVER_TOKEN_KEY);
}

export async function isDriverSession(): Promise<boolean> {
  const token = await getDriverToken();
  if (!token) return false;
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    if (Date.now() >= exp) {
      // Token expired, clear it
      await signOutDriver();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function signOutDriver() {
  await AsyncStorage.removeItem(DRIVER_TOKEN_KEY);
  await AsyncStorage.removeItem(DRIVER_PHARMACY_KEY);
}

export async function getDriverPharmacy(): Promise<{ pharmacyId: number; pharmacyName: string } | null> {
  const pharmacyData = await AsyncStorage.getItem(DRIVER_PHARMACY_KEY);
  if (!pharmacyData) return null;
  
  try {
    const parsed = JSON.parse(pharmacyData);
    return {
      pharmacyId: parsed.pharmacy_id,
      pharmacyName: parsed.pharmacy_name || 'Pharmacy',
    };
  } catch {
    return null;
  }
}

// Re-export getDriverSupabaseClient from supabase.ts
export { getDriverSupabaseClient };


