import WorkshopBackdrop from '@/components/WorkshopBackdrop';
/** Premium automotive design system — shared primitives wired to real data.
 *  Every component is controlled: no fake state, no demo content.
 */
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Shadows, Type, UI, type ThemeColors } from '@/constants/theme';
import { useTheme, getContrastColor } from '@/hooks/use-theme';

/* ── AppScreen ─────────────────────────────────────────────── */
export function AppScreen({
  children,
  contentStyle,
}: {
  children: React.ReactNode;
  contentStyle?: object;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.appScreen, { backgroundColor: theme.background }]}>
      <WorkshopBackdrop />
      <View style={[styles.appScreenInner, contentStyle]}>{children}</View>
    </View>
  );
}

/* ── DashboardHeader ───────────────────────────────────────── */
export function DashboardHeader({
  branch,
  greeting,
  date,
  pendingCount,
  avatarLabel,
  avatarUri,
  onBranchPress,
  onRepairsPress,
  onProfilePress,
}: {
  branch: string;
  greeting: string;
  date: string;
  pendingCount: number;
  avatarLabel: string;
  avatarUri?: string | null;
  onBranchPress?: () => void;
  onRepairsPress?: () => void;
  onProfilePress?: () => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeHeader(theme), [theme]);
  return (
    <View style={{ gap: 14 }}>
    <View style={s.wrap}>
      <View style={s.left}>
        <Pressable
          onPress={onBranchPress}
          style={({ pressed }) => [s.branch, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Workshop branch"
        >
          <Text style={s.branchText} numberOfLines={1}>
            {branch}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
        </Pressable>

      </View>
      <View style={s.right}>
        <Pressable
          onPress={onRepairsPress}
          style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="View repairs"
        >
          <Ionicons name="clipboard-outline" size={20} color={theme.text} />
          {pendingCount > 0 && (
            <View style={s.dot}>
              <Text style={s.dotText}>
                {pendingCount > 9 ? '9+' : String(pendingCount)}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={onProfilePress}
          style={({ pressed }) => [s.avatar, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatarImg} contentFit="cover" />
          ) : (
            <Text style={s.avatarText}>{avatarLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
      <View style={{ gap: 3 }}>
        <Text style={s.greeting} numberOfLines={1}>
          {greeting}
        </Text>
        <Text style={s.date}>{date}</Text>
      </View>
    </View>
  );
}

/* ── Metrics ───────────────────────────────────────────────── */
export interface Metric {
  key: string;
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  const theme = useTheme();
  const s = useMemo(() => makeMetrics(theme), [theme]);
  return (
    <View style={s.row}>
      {metrics.map((m, i) => (
        <View key={m.key} style={[s.item, i > 0 && s.divided]}>
          <View style={s.iconBox}>
            <Ionicons name={m.icon} size={17} color={theme.textSecondary} />
          </View>
          <Text style={s.value} numberOfLines={1} adjustsFontSizeToFit>
            {m.value}
          </Text>
          <Text style={s.label} numberOfLines={2}>
            {m.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── ProgressDistributionBar ───────────────────────────────── */
export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function ProgressDistributionBar({ segments }: { segments: Segment[] }) {
  const theme = useTheme();
  const s = useMemo(() => makeSegments(theme), [theme]);
  const total = segments.reduce((a, b) => a + b.value, 0);
  return (
    <View style={s.wrap}>
      <View style={s.track}>
        {segments.map((g) => {
          const pct = total > 0 ? (g.value / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <View key={g.key} style={[s.fill, { width: `${pct}%`, backgroundColor: g.color }]}><Text style={{ fontSize: 10, color: getContrastColor(g.color) }}>{pct >= 12 ? Math.round(pct) + '%' : ''}</Text></View>
          );
        })}
      </View>
      <View style={s.legend}>
        {segments.map((g) => {
          const pct = total > 0 ? Math.round((g.value / total) * 100) : 0;
          return (
            <View key={g.key} style={s.legendItem}>
              <View style={[s.swatch, { backgroundColor: g.color }]} />
              <Text style={s.legendLabel} numberOfLines={1}>
                {g.label} · {pct}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ── VehicleImage ──────────────────────────────────────────── */
export function VehicleImage({
  uri,
  aspect = UI.heroAspect,
  radius = UI.card.borderRadius,
  icon = 'car-outline',
  style,
}: {
  uri?: string | null;
  aspect?: number;
  radius?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: object;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        { aspectRatio: aspect, borderRadius: radius, overflow: 'hidden', backgroundColor: theme.backgroundElement },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <View style={[styles.fillCenter, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.fallbackIcon, { backgroundColor: theme.card }]}>
            <Ionicons name={icon} size={30} color={theme.textSecondary} />
          </View>
          <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>No photo</Text>
        </View>
      )}
    </View>
  );
}

/* ── WeeklyActivityCard ────────────────────────────────────── */
export function WeeklyActivityCard({
  total,
  days,
  highlightIndex,
  subtitle = 'Jobs completed',
}: {
  total: string;
  days: { label: string; value: number }[];
  highlightIndex: number;
  subtitle?: string;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeWeekly(theme), [theme]);
  const max = Math.max(1, ...days.map((d) => d.value));
  return (
    <View style={s.card}>
      <View style={s.head}>
        <View>
          <Text style={s.total}>{total}</Text>
          <Text style={s.sub}>{subtitle}</Text>
        </View>
        <View style={s.weekBadge}>
          <Text style={s.weekBadgeText}>7 days</Text>
        </View>
      </View>
      <View style={s.bars}>
        {days.map((d, i) => (
          <View key={`${d.label}-${i}`} style={s.col}>
            <View style={s.barTrack}>
              <View
                style={[
                  s.barFill,
                  {
                    height: `${(d.value / max) * 100}%`,
                    backgroundColor: i === highlightIndex ? theme.accent : theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={[s.day, i === highlightIndex && s.dayActive]}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── AttentionList (charcoal) ──────────────────────────────── */
export interface AttentionItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  count?: number;
}

export function AttentionList({
  items,
  onPress,
}: {
  items: AttentionItem[];
  onPress?: (key: string) => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeAttention(theme), [theme]);
  if (items.length === 0) {
    return (
      <View style={s.card}>
        <View style={s.emptyRow}>
          <Ionicons name="checkmark-circle-outline" size={22} color={theme.accent} />
          <Text style={s.emptyText}>Nothing needs attention</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={s.card}>
      {items.map((item, i) => (
        <Pressable
          key={item.key}
          onPress={() => onPress?.(item.key)}
          style={({ pressed }) => [s.row, i > 0 && s.divided, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <View style={s.iconBox}>
            <Ionicons name={item.icon} size={17} color={theme.accent} />
          </View>
          <View style={s.texts}>
            <Text style={s.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={s.sub} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          {typeof item.count === 'number' && (
            <View style={s.count}>
              <Text style={s.countText}>{item.count}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={theme.panelMuted} />
        </Pressable>
      ))}
    </View>
  );
}

/* ── ScheduleRow ───────────────────────────────────────────── */
export function ScheduleRow({
  time,
  imageUri,
  title,
  subtitle,
  last,
  onPress,
}: {
  time: string;
  imageUri?: string | null;
  title: string;
  subtitle: string;
  last?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeSchedule(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, !last && s.divided, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <Text style={s.time}>{time}</Text>
      <View style={s.thumb}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.thumbImg} contentFit="cover" />
        ) : (
          <Ionicons name="car-outline" size={18} color={theme.textSecondary} />
        )}
      </View>
      <View style={s.texts}>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

/* ── ServiceInfoCard ───────────────────────────────────────── */
export function ServiceInfoCard({
  icon,
  label,
  value,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  style?: object;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeServiceInfo(theme), [theme]);
  return (
    <View style={[s.card, style]}>
      <View style={s.iconBox}>
        <Ionicons name={icon} size={17} color={theme.textSecondary} />
      </View>
      <Text style={s.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={s.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* ── ServiceChecklist (charcoal, interactive) ───────────────── */
export interface ChecklistItem {
  id: string;
  title: string;
  detail?: string;
  checked: boolean;
  failed?: boolean;
  busy?: boolean;
}

export function ServiceChecklist({
  items,
  onToggle,
  onFail,
  onDetails,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onFail?: (id: string) => void;
  onDetails?: (id: string) => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeChecklist(theme), [theme]);
  const done = items.filter((i) => i.checked).length;
  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>Service checklist</Text>
        <View style={s.countPill}>
          <Text style={s.countText}>
            {done}/{items.length}
          </Text>
        </View>
      </View>
      {items.length === 0 && <Text style={s.empty}>No tasks recorded</Text>}
      {items.map((item, i) => (
        <View key={item.id} style={[s.row, i > 0 && s.divided]}>
          <View style={s.taskHeading}>
            <Text style={s.taskNumber}>{String(i + 1).padStart(2, '0')}</Text>
            <Pressable onPress={() => onDetails?.(item.id)} disabled={!onDetails}
              style={({ pressed }) => [s.taskContent, pressed && { opacity: 0.7 }]}>
              <Text style={s.itemTitle}>{item.title}</Text>
              {!!item.detail && <Text style={s.itemDetail}>{item.detail}</Text>}
            </Pressable>
            {onDetails && <Ionicons name="chevron-forward" size={18} color={theme.panelMuted} />}
          </View>
          <View style={s.actions}>
            <Pressable onPress={() => onToggle(item.id)} disabled={item.busy}
              style={({ pressed }) => [s.box, { borderColor: '#4ADE80' }, item.checked && s.boxChecked, (pressed || item.busy) && { opacity: 0.7 }]}
              accessibilityRole="checkbox" accessibilityState={{ checked: item.checked, disabled: item.busy }}
              accessibilityLabel={'Mark completed: ' + item.title}>
              <Ionicons name="checkmark" size={19} color={item.checked ? '#052E16' : '#4ADE80'} />
            </Pressable>
            {onFail && <Pressable onPress={() => onFail(item.id)} disabled={item.busy}
              style={({ pressed }) => [s.box, { borderColor: '#F87171', backgroundColor: item.failed ? '#F87171' : 'transparent' }, (pressed || item.busy) && { opacity: 0.7 }]}
              accessibilityRole="checkbox" accessibilityState={{ checked: !!item.failed, disabled: item.busy }}
              accessibilityLabel={'Mark not completed: ' + item.title}>
              <Ionicons name="close" size={19} color={item.failed ? '#450A0A' : '#F87171'} />
            </Pressable>}
            {item.busy && <ActivityIndicator size="small" color={theme.panelMuted} accessibilityLabel="Saving task status" />}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ── TechnicianCard ────────────────────────────────────────── */
export function TechnicianCard({
  name,
  role,
  phone,
  photoUri,
  onCall,
}: {
  name: string;
  role: string;
  phone?: string | null;
  photoUri?: string | null;
  onCall?: () => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeTech(theme), [theme]);
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={s.card}>
      <View style={s.avatar}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={s.avatarImg} contentFit="cover" />
        ) : (
          <Text style={s.initials}>{initials || '—'}</Text>
        )}
      </View>
      <View style={s.texts}>
        <Text style={s.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.role} numberOfLines={1}>
          {role}
        </Text>
      </View>
      {phone && onCall && (
        <Pressable
          onPress={onCall}
          style={({ pressed }) => [s.callBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name}`}
        >
          <Ionicons name="call" size={16} color={theme.accentForeground} />
        </Pressable>
      )}
    </View>
  );
}

/* ── PrimaryButton ─────────────────────────────────────────── */
export function PrimaryButton({
  title,
  onPress,
  icon = 'arrow-forward',
  variant = 'yellow',
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap | null;
  variant?: 'yellow' | 'dark' | 'outline';
  disabled?: boolean;
  style?: object;
}) {
  const theme = useTheme();
  const s = useMemo(() => makePrimary(theme), [theme]);
  const bg =
    variant === 'yellow'
      ? theme.accent
      : variant === 'dark'
        ? theme.dark
        : 'transparent';
  const fg =
    variant === 'yellow'
      ? theme.accentForeground
      : variant === 'dark'
        ? theme.panelText
        : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: variant === 'outline' ? theme.border : bg },
        pressed && s.pressed,
        disabled && { opacity: 0.5 },
        style,
      ]}
      accessibilityRole="button"
    >
      <Text style={[s.text, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
      {icon && <Ionicons name={icon} size={17} color={fg} />}
    </Pressable>
  );
}

/* ── SectionHeader ─────────────────────────────────────────── */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[styles.sectionAction, { color: theme.textSecondary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ── States ────────────────────────────────────────────────── */
export function LoadingState({ message }: { message?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ActivityIndicator size="small" color={theme.text} />
      {message && <Text style={[styles.stateText, { color: theme.textSecondary }]}>{message}</Text>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.stateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name="alert-circle-outline" size={22} color={theme.error} />
      <Text style={[styles.stateText, { color: theme.text }]}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[styles.retryText, { color: theme.text }]}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ── styles ────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  appScreen: { flex: 1 },
  appScreenInner: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center' },
  fillCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fallbackIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: Type.meta, fontWeight: '500' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: Type.sectionTitle, fontWeight: '600', letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontWeight: '600' },
  stateCard: {
    borderWidth: 1,
    borderRadius: UI.card.borderRadius,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  stateText: { fontSize: Type.body, fontWeight: '500', textAlign: 'center' },
  retryText: { fontSize: 13, fontWeight: '700' },
});

function cardBase(theme: ThemeColors) {
  return {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: UI.card.borderRadius,
    ...Shadows.card,
  };
}

function makeHeader(theme: ThemeColors) {
  return StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    left: { flex: 1, gap: 2 },
    branch: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.text, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '100%' },
    branchText: { fontSize: 19, fontWeight: '400', color: theme.text, flexShrink: 1 },
    greeting: { fontSize: Type.screenTitle, fontWeight: '400', color: theme.text, letterSpacing: -0.5 },
    date: { fontSize: 14, fontWeight: '400', color: theme.textSecondary },
    right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: {
      width: UI.iconBox,
      height: UI.iconBox,
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    dotText: { fontSize: 10, fontWeight: '700', color: theme.accentForeground },
    avatar: {
      width: UI.iconBox,
      height: UI.iconBox,
      borderRadius: 20,
      backgroundColor: theme.dark,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontSize: 14, fontWeight: '700', color: theme.panelText },
  });
}

function makeMetrics(theme: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      paddingVertical: 2,
    },
    item: { flex: 1, alignItems: 'flex-start', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
    divided: { borderLeftWidth: 1, borderLeftColor: theme.divider },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundElement,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    value: { fontSize: Type.metric, fontWeight: '300', color: theme.text, letterSpacing: -1 },
    label: { fontSize: Type.meta, fontWeight: '500', color: theme.textSecondary, lineHeight: 15 },
  });
}

function makeSegments(theme: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    track: { flexDirection: 'row', height: 26, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.backgroundElement },
    fill: { height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    swatch: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { fontSize: Type.meta, fontWeight: '500', color: theme.textSecondary },
  });
}

function makeWeekly(theme: ThemeColors) {
  return StyleSheet.create({
    card: { ...cardBase(theme), padding: 16, gap: 14, flex: 1 },
    head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    total: { fontSize: Type.metric, fontWeight: '300', color: theme.text, letterSpacing: -1 },
    sub: { fontSize: Type.meta, fontWeight: '500', color: theme.textSecondary },
    weekBadge: { backgroundColor: theme.backgroundElement, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    weekBadgeText: { fontSize: 11, fontWeight: '600', color: theme.textSecondary },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 96 },
    col: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
    barTrack: { flex: 1, width: '100%', maxWidth: 7, justifyContent: 'flex-end', alignItems: 'center' },
    barFill: { width: '100%', borderRadius: 6 },
    day: { fontSize: 10, fontWeight: '600', color: theme.textSecondary },
    dayActive: { color: theme.text },
  });
}

function makeAttention(theme: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: theme.dark, borderRadius: UI.card.borderRadius, borderWidth: 1, borderColor: theme.dark, paddingHorizontal: 6, paddingVertical: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 13 },
    divided: { borderTopWidth: 1, borderTopColor: theme.panelBorder },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.panelBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texts: { flex: 1, gap: 1 },
    title: { fontSize: Type.body, fontWeight: '600', color: theme.panelText },
    sub: { fontSize: Type.meta, fontWeight: '400', color: theme.panelMuted },
    count: { backgroundColor: theme.accent, borderRadius: 999, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
    countText: { fontSize: 12, fontWeight: '700', color: theme.accentForeground },
    emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
    emptyText: { fontSize: Type.body, fontWeight: '500', color: theme.panelMuted },
  });
}

function makeSchedule(theme: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 2 },
    divided: { borderBottomWidth: 1, borderBottomColor: theme.divider },
    time: { fontSize: 13, fontWeight: '600', color: theme.text, width: 56, fontVariant: ['tabular-nums'] },
    thumb: {
      width: UI.thumbSmall,
      height: UI.thumbSmall,
      borderRadius: 14,
      backgroundColor: theme.backgroundElement,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    thumbImg: { width: '100%', height: '100%' },
    texts: { flex: 1, gap: 1 },
    title: { fontSize: Type.cardTitle, fontWeight: '600', color: theme.text },
    sub: { fontSize: Type.meta, fontWeight: '400', color: theme.textSecondary },
  });
}

function makeServiceInfo(theme: ThemeColors) {
  return StyleSheet.create({
    card: { ...cardBase(theme), padding: 14, gap: 8, flex: 1 },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.backgroundElement,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 11, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
    value: { fontSize: Type.cardTitle, fontWeight: '600', color: theme.text },
  });
}

function makeChecklist(theme: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: theme.dark, borderRadius: UI.card.borderRadius, padding: 18, gap: 2 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    title: { fontSize: Type.sectionTitle, fontWeight: '600', color: theme.panelText },
    countPill: { backgroundColor: theme.panelBorder, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    countText: { fontSize: 12, fontWeight: '700', color: theme.panelText, fontVariant: ['tabular-nums'] },
    empty: { fontSize: Type.body, color: theme.panelMuted },
    row: { gap: 14, paddingVertical: 18 },
    taskHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    taskNumber: { fontSize: 12, lineHeight: 24, color: theme.panelMuted, minWidth: 22, fontVariant: ['tabular-nums'] },
    taskContent: { flex: 1, minWidth: 0 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingLeft: 32 },
    divided: { borderTopWidth: 1, borderTopColor: theme.panelBorder },
    box: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: theme.panelMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: { backgroundColor: '#4ADE80', borderColor: '#4ADE80' },
    itemTitle: { fontSize: 16, lineHeight: 25, fontWeight: '500', color: theme.panelText, flexShrink: 1 },
    itemDetail: { fontSize: 13, lineHeight: 21, color: theme.panelMuted, marginTop: 6 },
  });
}

function makeTech(theme: ThemeColors) {
  return StyleSheet.create({
    card: { ...cardBase(theme), flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.dark,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    initials: { fontSize: 16, fontWeight: '700', color: theme.panelText },
    texts: { flex: 1, gap: 1 },
    name: { fontSize: Type.cardTitle, fontWeight: '600', color: theme.text },
    role: { fontSize: Type.meta, fontWeight: '400', color: theme.textSecondary },
    callBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

function makePrimary(theme: ThemeColors) {
  void theme;
  return StyleSheet.create({
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 56,
      borderRadius: UI.buttonRadius,
      borderWidth: 1,
      paddingHorizontal: 20,
    },
    pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    text: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  });
}

export function useWideLayout(breakpoint = 560): boolean {
  const { width } = useWindowDimensions();
  return width >= breakpoint;
}
