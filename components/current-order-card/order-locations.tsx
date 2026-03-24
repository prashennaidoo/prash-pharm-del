import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface OrderLocationsProps {
  origin: string;
  destination: string;
  avatarEmoji?: string;
}

/**
 * Locations component displaying origin and destination with avatar.
 */
export function OrderLocations({
  origin,
  destination,
  avatarEmoji
}: OrderLocationsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Calculate dynamic font size based on screen width
  const screenWidth = Dimensions.get('window').width;
  const cardPadding = 32; // 16px * 2
  const iconSize = 16;
  const iconGap = 6;
  const avatarWidth = avatarEmoji ? 24 + iconGap : 0;
  const availableWidthPerLocation = (screenWidth - cardPadding - iconSize * 2 - iconGap * 2 - avatarWidth) / 2;
  
  // Estimate max text length (use longer of origin/destination)
  const maxTextLength = Math.max(origin.length, destination.length);
  const baseFontSize = 11;
  const minFontSize = screenWidth < 350 ? 9 : 10;
  const maxFontSize = 11;
  
  // Estimate character width at base font size (roughly 6-7px per char)
  const estimatedTextWidth = maxTextLength * 6.5;
  const scaleFactor = Math.min(1, availableWidthPerLocation / estimatedTextWidth);
  const dynamicFontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * scaleFactor));

  return (
    <View style={styles.container}>
      {/* Left side: Avatar and origin */}
      <View style={styles.locationGroup}>
        {avatarEmoji ? (
          <View style={[
            styles.avatar,
            { backgroundColor: isDark ? Colors.dark.icon : Colors.light.icon }
          ]}>
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </View>
        ) : null}
        <MaterialIcons
          name="location-on"
          size={16}
          color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
        />
        <Text 
          style={[
            styles.locationText,
            { 
              color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
              fontSize: dynamicFontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
          ellipsizeMode="tail"
        >{origin}</Text>
      </View>

      {/* Right side: Destination */}
      <View style={styles.locationGroup}>
        <MaterialIcons 
          name="location-on" 
          size={16} 
          color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
        />
        <Text 
          style={[
            styles.locationText,
            { 
              color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
              fontSize: dynamicFontSize
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
          ellipsizeMode="tail"
        >{destination}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 0, // Allow flex shrinking
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1, // Allow groups to take equal space
    flexShrink: 1, // Allow shrinking if needed
    minWidth: 0, // Allow flex shrinking
    marginHorizontal: 4, // Small margin between groups
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Prevent avatar from shrinking
  },
  avatarEmoji: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    flexShrink: 1, // Allow text to shrink
    minWidth: 0, // Allow flex shrinking
  },
});

