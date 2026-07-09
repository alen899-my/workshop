import { Appearance } from 'react-native';

export function useColorScheme() {
  return Appearance.getColorScheme() ?? 'light';
}
