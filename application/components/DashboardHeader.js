import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { AppModal } from '../components/ui/AppModal';
import { AppButton } from '../components/ui/AppButton';
import { User, Search, LogOut, AlertTriangle, Sun, Moon } from 'lucide-react-native';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const { width: SW } = Dimensions.get('window');

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const T = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // We measure the avatar button to position the dropdown precisely
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef(null);
  const navigation = useNavigation();

  const handleAvatarPress = () => {
    if (avatarRef.current) {
      avatarRef.current.measureInWindow((x, y, width, height) => {
        setDropdownPos({
          top: y + height + 8,          // 8px below the avatar
          right: SW - x - width,        // align right edge with avatar
        });
        setShowDropdown(true);
      });
    }
  };

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

            {/* Avatar — tap opens the Modal dropdown */}
            <TouchableOpacity
              ref={avatarRef}
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: T.primary }]}>
                <Text style={styles.avatarText}>
                  {(user?.ownerName?.[0] || user?.shopName?.[0] || 'W').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Avatar Dropdown — rendered in a transparent Modal so it escapes the header's clip bounds ── */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
        statusBarTranslucent
      >
        {/* Full-screen tap-outside-to-dismiss layer */}
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalBackdrop}>
            {/* Stop inner presses from closing the modal */}
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: T.surface,
                    borderColor: T.border,
                    top: dropdownPos.top,
                    right: dropdownPos.right,
                    shadowColor: T.isDark ? '#000' : T.primary,
                  },
                ]}
              >
                {/* User info row */}
                <View style={[styles.userInfoRow, { borderBottomColor: T.border }]}>
                  <View style={[styles.avatarSmall, { backgroundColor: T.primary }]}>
                    <Text style={styles.avatarText}>
                      {(user?.ownerName?.[0] || user?.shopName?.[0] || 'W').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userNameText, { color: T.text }]} numberOfLines={1}>
                      {user?.ownerName || user?.shopName || 'Workshop'}
                    </Text>
                    <Text style={[styles.userRoleText, { color: T.textMuted }]}>
                      {(user?.role || 'owner').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Dark / Light mode toggle */}
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: T.border }]}
                  onPress={() => {
                    setShowDropdown(false);
                    T.toggleTheme();
                  }}
                  activeOpacity={0.7}
                >
                  {T.isDark
                    ? <Sun size={16} color="#F59E0B" strokeWidth={2} />
                    : <Moon size={16} color={T.textMuted} strokeWidth={2} />
                  }
                  <Text style={[styles.dropdownMutedText, { color: T.textMuted }]}>
                    {T.isDark ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                </TouchableOpacity>

                {/* Sign Out */}
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    setTimeout(() => setShowLogoutModal(true), 200);
                  }}
                  activeOpacity={0.7}
                >
                  <LogOut size={16} color={T.destructive || '#C0272D'} strokeWidth={2} />
                  <Text style={[styles.dropdownSignOut, { color: T.destructive || '#C0272D' }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Logout Confirmation Modal ── */}
      <AppModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
      >
        <View style={styles.modalBody}>
          <View style={[styles.modalIconBox, { backgroundColor: T.dangerBg }]}>
            <AlertTriangle size={32} color={T.destructive || '#C0272D'} />
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
              style={{ flex: 1, backgroundColor: T.destructive || '#C0272D' }}
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
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONT,
  },

  // ── Modal Dropdown ───────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    // transparent — touch outside closes
  },
  dropdown: {
    position: 'absolute',
    minWidth: 200,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 24,    // Android shadow
    overflow: 'hidden',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT,
    letterSpacing: -0.2,
  },
  userRoleText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONT,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownMutedText: {
    fontWeight: '700',
    fontFamily: FONT,
    fontSize: 13,
  },
  dropdownSignOut: {
    fontWeight: '800',
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  // ── Logout Modal ─────────────────────────────────────────────────────
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
