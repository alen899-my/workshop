import { LinearGradient } from 'expo-linear-gradient';
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
          <LinearGradient colors={[theme.heroStart, theme.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={[styles.eyebrow, { color: theme.heroMuted }]}>WORKSHOP MANAGEMENT</Text>
            <Text style={[styles.title, { color: theme.heroText }]}>A clear view of your workshop.</Text>
            <Text style={[styles.description, { color: theme.heroMuted }]}>Manage repairs, vehicles, customers, and invoices in one place.</Text>
          </LinearGradient>
          <View style={[styles.features, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              ['build-outline', 'Repairs', 'Follow every job from check-in to handover.'],
              ['people-outline', 'Customers', 'Keep contacts and vehicle history together.'],
              ['receipt-outline', 'Invoices', 'Turn completed work into clear invoices.'],
            ].map(([icon, label, description], index) => (
              <View key={label} style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: [theme.warmTint, theme.coolTint, theme.successTint][index] }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={theme.primary} /></View>
                <View style={{ flex: 1, gap: 4 }}><Text style={[styles.featureText, { color: theme.text }]}>{label}</Text><Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>{description}</Text></View>
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
  hero: { padding: 24, borderRadius: 24, gap: 16 },
  featureIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '600', letterSpacing: -1 },
  description: { fontSize: 15, lineHeight: 24 },
  features: { ...UI.card, marginTop: 8, gap: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  actions: { gap: 12, paddingBottom: 12 },
});