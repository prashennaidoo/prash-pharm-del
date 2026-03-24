// Force light mode - always return 'light' regardless of system preference
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
