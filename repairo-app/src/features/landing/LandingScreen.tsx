import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppButton from '@/components/AppButton';
import { UI, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LandingScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Ionicons name="build-outline" size={22} color={theme.text} />
          <Text style={[styles.wordmark, { color: theme.text }]}>Repairo</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>WORKSHOP MANAGEMENT</Text>
          <Text style={[styles.title, { color: theme.text }]}>A clear view of your workshop.</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>Manage repairs, vehicles, customers, and invoices in one place.</Text>
          <View style={[styles.features, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              ['build-outline', 'Keep every repair on track'],
              ['people-outline', 'Keep customer details organized'],
              ['receipt-outline', 'Create and manage invoices'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.feature}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={theme.textSecondary} />
                <Text style={[styles.featureText, { color: theme.text }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.actions}>
          <AppButton title="Log in" variant="green" fullWidth onPress={() => router.push('/auth/login' as any)} />
          <AppButton title="Create account" fullWidth onPress={() => router.push('/auth/signup' as any)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: 24, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  wordmark: { fontSize: 22, fontWeight: '600', letterSpacing: -0.5 },
  body: { flex: 1, justifyContent: 'center', gap: 16, paddingVertical: 24 },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 34, lineHeight: 41, fontWeight: '600', letterSpacing: -1 },
  description: { fontSize: 15, lineHeight: 24 },
  features: { ...UI.card, marginTop: 8, gap: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { flex: 1, fontSize: 14, lineHeight: 20 },
  actions: { gap: 12, paddingBottom: 12 },
});