import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useTheme } from '@/hooks/use-theme';

interface LocationPickerProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  placeholder?: string;
  error?: string;
}

export default function LocationPicker({
  label,
  value,
  onChangeText,
  onCoordinatesChange,
  placeholder,
  error,
}: LocationPickerProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const addr = geocode[0];
        const parts = [addr.street, addr.district, addr.city, addr.region, addr.country].filter(Boolean) as string[];
        onChangeText(parts.join(', '));
      }

      onCoordinatesChange?.(latitude, longitude);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to get current location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={() => ref.current?.focus()}
        style={[
          styles.inputContainer,
          {
            borderColor: error ? theme.error : focused ? theme.text : theme.border,
            backgroundColor: theme.card,
          },
          focused && !error && styles.focusedShadow,
        ]}
      >
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={18}
          color={error ? theme.error : focused ? theme.text : theme.textSecondary}
          style={styles.icon}
        />
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.tabIconDefault}
          autoCapitalize="words"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Pressable
          style={[styles.gpsBtn, { backgroundColor: theme.primary }]}
          onPress={handleUseCurrentLocation}
          disabled={locating}
          hitSlop={6}
        >
          {locating ? (
            <ActivityIndicator size={14} color={theme.primaryForeground} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={theme.primaryForeground} />
          )}
        </Pressable>
      </Pressable>

      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={12} color={theme.error} />
          <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          gap: 6,
        },
        label: {
          fontSize: 12,
          fontWeight: '600',
          marginLeft: 2,
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderRadius: 14,
          paddingHorizontal: 14,
          height: 52,
        },
        focusedShadow: {
          shadowColor: theme.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
        icon: {
          marginRight: 10,
        },
        input: {
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          paddingVertical: 0,
        },
        gpsBtn: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        },
        errorRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginLeft: 2,
          marginTop: 2,
        },
        error: {
          fontSize: 12,
          fontWeight: '600',
        },
      }),
    [theme],
  );
};
