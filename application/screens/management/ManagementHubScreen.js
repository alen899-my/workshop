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

export default function ManagementHubScreen({ navigation }) {
  const { can, isSuperAdmin } = useRBAC();
  const visible = MODULES.filter((m) => isSuperAdmin || can(m.perm));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerIconWrap}>
            <LayoutGrid size={16} color="#6B7280" strokeWidth={2} />
          </View>
          <Text style={s.eyebrow}>Admin Console</Text>
          <Text style={s.pageTitle}>Management</Text>
          <Text style={s.pageSub}>
            {visible.length} module{visible.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        {/* ── Cards ── */}
        <View style={s.cards}>
          {visible.map((mod, index) => {
            const Icon = mod.icon;
            const isFeatured = index === 0;

            if (isFeatured) {
              /* ── Large hero card ── */
              return (
                <TouchableOpacity
                  key={mod.key}
                  style={s.featuredCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(mod.key)}
                >
                  {/* Decorative background circle */}
                  <View style={[s.featuredOrb, { backgroundColor: mod.accent + '18' }]} />

                  <View style={s.featuredTop}>
                    <View style={[s.featuredIconWrap, { backgroundColor: mod.accentBg }]}>
                      <Icon size={26} color={mod.accent} strokeWidth={1.7} />
                    </View>
                    <View style={[s.featuredArrowWrap, { backgroundColor: mod.accent }]}>
                      <ArrowRight size={15} color="#fff" strokeWidth={2.5} />
                    </View>
                  </View>

                  <Text style={s.featuredTitle}>{mod.title}</Text>
                  <Text style={s.featuredSub}>{mod.sub}</Text>

                  <View style={[s.featuredFooter, { borderTopColor: mod.accent + '20' }]}>
                    <View style={[s.featuredDot, { backgroundColor: mod.accent }]} />
                    <Text style={[s.featuredFooterTxt, { color: mod.accent }]}>Tap to manage</Text>
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
                <View style={[s.rowIconWrap, { backgroundColor: mod.accentBg }]}>
                  <Icon size={20} color={mod.accent} strokeWidth={1.75} />
                </View>

                <View style={s.rowBody}>
                  <Text style={s.rowTitle}>{mod.title}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{mod.sub}</Text>
                </View>

                <View style={[s.rowChevron, { backgroundColor: mod.accentBg }]}>
                  <ArrowRight size={13} color={mod.accent} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#F3F4F6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  pageSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 5,
    fontWeight: '400',
  },

  /* ── Cards container ── */
  cards: {
    gap: 10,
  },

  /* ── Featured card ── */
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
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
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  featuredSub: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    color: '#111827',
    letterSpacing: -0.2,
  },
  rowSub: {
    fontSize: 12,
    color: '#9CA3AF',
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