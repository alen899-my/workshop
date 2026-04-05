import { Platform } from 'react-native';
import Constants from 'expo-constants';

let BASE_URL;

if (Platform.OS === 'web') {
  // Prevents CORS/Private Network Blocking by Chrome if user views Expo via their local Network IP instead of localhost
  BASE_URL = `http://${window.location.hostname}:5000`;
} else {
  // Safely grab the EXACT dynamic IP address that Metro is currently serving from your computer
  const hostUri = Constants?.expoConfig?.hostUri;
  
  if (hostUri) {
    const ipAddress = hostUri.split(':')[0];
    BASE_URL = `http://${ipAddress}:5000`;
  } else {
    // Ultimate fallback for physical devices if Expo Canary hides the host config
    BASE_URL = 'http://10.248.106.145:5000';
  }
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `${BASE_URL}/api`;
