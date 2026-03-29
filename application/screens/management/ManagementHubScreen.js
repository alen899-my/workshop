import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UsersRound,
  Building2,
  ShieldHalf,
  ShieldCheck,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react-native';
import { useRBAC } from '../../lib/rbac';
import { useTheme } from '../../lib/theme';

const MODULES = [
  {
    key: 'Users',
    icon: UsersRound,
    title: 'Users',
    sub: 'Team members & access rights',
    accent: '#2563EB',
    accentBg: '#DBEAFE',
    perm: 'view:users',
  },
  {
    key: 'Shops',
    icon: Building2,
    title: 'Shops',
    sub: 'Workshop locations',
    accent: '#059669',
    accentBg: '#D1FAE5',
    perm: 'view:shops',
  },
  {
    key: 'Roles',
    icon: ShieldHalf,
    title: 'Roles',
    sub: 'Permission levels & groups',
    accent: '#7C3AED',
    accentBg: '#EDE9FE',
    perm: 'view:role',
  },
  {
    key: 'Permissions',
    icon: ShieldCheck,
    title: 'Permissions',
    sub: 'Granular access control',
    accent: '#D97706',
    accentBg: '#FEF3C7',
    perm: 'view:permission',
  },
];

const getModColor = (base, isDark) => {
  if (!isDark) return base;
  if (base === '#2563EB') return '#60a5fa'; // blue
  if (base === '#059669') return '#34d399'; // green
  if (base === '#7C3AED') return '#a78bfa'; // purple
  if (base === '#D97706') return '#fcd34d'; // amber
  return base;
};

export default function ManagementHubScreen({ navigation }) {
  const T = useTheme();
  const s = getStyles(T);
  const { can, isSuperAdmin } = useRBAC();
  const visible = MODULES.filter((m) => isSuperAdmin || can(m.perm));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
       
          <Text style={s.eyebrow}>Admin </Text>
          <Text style={s.pageTitle}>Management</Text>
          
        </View>

        {/* ── Cards ── */}
        <View style={s.cards}>
          {visible.map((mod, index) => {
            const Icon = mod.icon;
            const isFeatured = index === 0;
            const accentText = getModColor(mod.accent, T.isDark);
            const accentBgComp = T.isDark ? accentText + '18' : mod.accentBg;

            if (isFeatured) {
              /* ── Large hero card ── */
              return (
                <TouchableOpacity
                  key={mod.key}
                  style={s.featuredCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(mod.key)}
                >
                  <View style={[s.featuredOrb, { backgroundColor: accentText + '10' }]} />

                  <View style={s.featuredTop}>
                    <View style={[s.featuredIconWrap, { backgroundColor: accentBgComp }]}>
                      <Icon size={26} color={accentText} strokeWidth={1.7} />
                    </View>
                    <View style={[s.featuredArrowWrap, { backgroundColor: accentText }]}>
                      <ArrowRight size={15} color="#fff" strokeWidth={2.5} />
                    </View>
                  </View>

                  <Text style={s.featuredTitle}>{mod.title}</Text>
                  <Text style={s.featuredSub}>{mod.sub}</Text>

                  <View style={[s.featuredFooter, { borderTopColor: accentText + '20' }]}>
                    <View style={[s.featuredDot, { backgroundColor: accentText }]} />
                    <Text style={[s.featuredFooterTxt, { color: accentText }]}>Tap to manage</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            /* ── Regular row card ── */
            return (
              <TouchableOpacity
                key={mod.key}
                style={s.rowCard}
                activeOpacity={0.78}
                onPress={() => navigation.navigate(mod.key)}
              >
                <View style={[s.rowIconWrap, { backgroundColor: accentBgComp }]}>
                  <Icon size={20} color={accentText} strokeWidth={1.75} />
                </View>

                <View style={s.rowBody}>
                  <Text style={s.rowTitle}>{mod.title}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{mod.sub}</Text>
                </View>

                <View style={[s.rowChevron, { backgroundColor: accentBgComp }]}>
                  <ArrowRight size={13} color={accentText} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (T) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg, // migrated from #FAFAFA
  },

  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 48,
  },

  /* ── Header ── */
  header: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: T.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: T.text,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  pageSub: {
    fontSize: 13,
    color: T.textMuted,
    marginTop: 5,
    fontWeight: '400',
  },

  /* ── Cards container ── */
  cards: {
    gap: 10,
  },

  /* ── Featured card ── */
  featuredCard: {
    backgroundColor: T.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: T.isDark ? 0 : 4 },
    shadowOpacity: T.isDark ? 0 : 0.07,
    shadowRadius: T.isDark ? 0 : 12,
    elevation: T.isDark ? 0 : 3,
    marginBottom: 2,
  },
  featuredOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -50,
    right: -40,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featuredIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredArrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: T.text,
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  featuredSub: {
    fontSize: 13,
    color: T.textMuted,
    lineHeight: 19,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  featuredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featuredFooterTxt: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* ── Row card ── */
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 14,
    gap: 13,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: T.isDark ? 0 : 1 },
    shadowOpacity: T.isDark ? 0 : 0.04,
    shadowRadius: T.isDark ? 0 : 4,
    elevation: T.isDark ? 0 : 1,
  },
  rowIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -0.2,
  },
  rowSub: {
    fontSize: 12,
    color: T.textMuted,
    lineHeight: 16,
  },
  rowChevron: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});