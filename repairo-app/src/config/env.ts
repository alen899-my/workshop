export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const ENV = {
  API_URL,
  CF_R2_PUBLIC_URL: process.env.EXPO_PUBLIC_CF_R2_PUBLIC_URL || '',
  POSTHOG_TOKEN: process.env.EXPO_PUBLIC_POSTHOG_TOKEN || '',
};

export default ENV;
