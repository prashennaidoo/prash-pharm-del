import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="order-details" options={{ headerShown: false }} />
      <Stack.Screen name="completed-delivery-form" options={{ headerShown: false }} />
    </Stack>
  );
}

