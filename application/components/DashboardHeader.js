import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { AppModal } from '../components/ui/AppModal';
import { AppButton } from '../components/ui/AppButton';
import { User, Search, LogOut, AlertTriangle, Sun, Moon } from 'lucide-react-native';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const T = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigation = useNavigation();

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  return (
    <View style={[styles.headerOuter, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          {/* Brand */}
          <View style={styles.brandInfo}>
            <Text style={[styles.shopName, { color: T.text }]}>
              {(user?.shopName || 'Workshop').toUpperCase()}
            </Text>
          </View>

          {/* Right actions */}
          <View style={styles.rightActions}>

            {/* 🌙 / ☀ Dark mode toggle */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: T.surfaceAlt, borderWidth: 1, borderColor: T.border }]}
              onPress={T.toggleTheme}
              activeOpacity={0.7}
            >
              {T.isDark
                ? <Sun size={18} color="#F59E0B" strokeWidth={2} />
                : <Moon size={18} color={T.textMuted} strokeWidth={2} />
              }
            </TouchableOpacity>

            {/* Search */}
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: T.surfaceAlt, borderWidth: 1, borderColor: T.border }]}>
              <Search size={18} color={T.textMuted} />
            </TouchableOpacity>

            {/* Avatar + dropdown */}
            <View style={{ position: 'relative', zIndex: 9999 }}>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowDropdown(!showDropdown)}>
                <View style={[styles.avatar, { backgroundColor: T.primary }]}>
                  <Text style={styles.avatarText}>
                    {(user?.ownerName?.[0] || user?.shopName?.[0] || 'W').toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>

              {showDropdown && (
                <View style={[styles.dropdown, { backgroundColor: T.surface, borderColor: T.border }]}>
                  {/* Theme toggle in dropdown too */}
                  <TouchableOpacity
                    style={[styles.dropdownItem, { marginBottom: 10 }]}
                    onPress={() => { setShowDropdown(false); T.toggleTheme(); }}
                  >
                    {T.isDark
                      ? <Sun size={15} color="#F59E0B" />
                      : <Moon size={15} color={T.textMuted} />
                    }
                    <Text style={[styles.dropdownMutedText, { color: T.textMuted }]}>
                      {T.isDark ? 'LIGHT MODE' : 'DARK MODE'}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: T.border, marginBottom: 10 }} />

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowDropdown(false);
                      setShowLogoutModal(true);
                    }}
                  >
                    <LogOut size={15} color="#DC2626" />
                    <Text style={styles.dropdownText}>SIGN OUT</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <AppModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
      >
        <View style={styles.modalBody}>
          <View style={[styles.modalIconBox, { backgroundColor: T.dangerBg }]}>
            <AlertTriangle size={32} color="#DC2626" />
          </View>
          <Text style={[styles.modalText, { color: T.textMuted }]}>
            Are you sure you want to log out? You will need to sign in again to manage your workshop.
          </Text>

          <View style={styles.modalActions}>
            <AppButton
              title="Cancel"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setShowLogoutModal(false)}
            />
            <AppButton
              title="Log Out"
              variant="primary"
              style={{ flex: 1, backgroundColor: '#DC2626' }}
              onPress={handleLogout}
            />
          </View>
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: {
    zIndex: 9999,
    elevation: 4,
    borderBottomWidth: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONT,
    letterSpacing: 1.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginLeft: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONT,
  },
  dropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    minWidth: 170,
    borderWidth: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownMutedText: {
    fontWeight: '800',
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  dropdownText: {
    color: '#DC2626',
    fontWeight: '900',
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 1,
  },
  modalBody: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONT,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
