import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { AppModal } from '../components/ui/AppModal';
import { AppButton } from '../components/ui/AppButton';
import { Colors } from '../constants/Colors';
import { User, Bell, Search, LogOut, AlertTriangle } from 'lucide-react-native';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigation = useNavigation();

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const roleLabels = {
    admin: "Super Admin",
    shop_owner: "Shop Owner",
    worker: "Technician",
    shop: "Shop Manager"
  };

  const displayRole = user?.role ? (roleLabels[user.role.toLowerCase()] || user.role) : "Owner";

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Top Identity Row */}
      <View style={[styles.topRow, { zIndex: 9999 }]}>
        <View style={styles.brandInfo}>
          <Text style={styles.shopName}>{(user?.shopName || "Workshop").toUpperCase()}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{displayRole.toUpperCase()}</Text>
          </View>
        </View>

        <View style={[styles.rightActions, { zIndex: 9999 }]}>
          <TouchableOpacity style={styles.iconBtn}>
            <Search size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={{ position: 'relative', zIndex: 9999, elevation: 20 }}>
             <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowDropdown(!showDropdown)}>
               <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(user?.ownerName?.[0] || user?.shopName?.[0] || 'W').toUpperCase()}</Text>
               </View>
             </TouchableOpacity>

             {/* Cross-platform Absolute Dropdown Menu */}
             {showDropdown && (
               <View style={styles.dropdown}>
                 <TouchableOpacity 
                   style={styles.dropdownItem} 
                   onPress={() => {
                     setShowDropdown(false);
                     setShowLogoutModal(true);
                   }}
                 >
                    <LogOut size={16} color="#DC2626" />
                    <Text style={styles.dropdownText}>SIGN OUT</Text>
                 </TouchableOpacity>
               </View>
             )}
          </View>
        </View>
      </View>

      {/* User greeting */}
      <View style={[styles.welcomeRow, { zIndex: 1 }]}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.ownerName || "Administrator"}</Text>
      </View>

      {/* Logout Confirmation Modal */}
      <AppModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
      >
        <View style={styles.modalBody}>
          <View style={styles.modalIconBox}>
             <AlertTriangle size={32} color="#DC2626" />
          </View>
          <Text style={styles.modalText}>
            Are you sure you want to log out of your account? You will need to sign in again to manage your workshop.
          </Text>
          
          <View style={styles.modalActions}>
            <AppButton 
              title="Cancel" 
              variant="outline" 
              style={{flex: 1}} 
              onPress={() => setShowLogoutModal(false)} 
            />
            <AppButton 
              title="Log Out" 
              variant="primary" 
              style={{flex: 1, backgroundColor: '#DC2626'}} 
              onPress={handleLogout} 
            />
          </View>
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 9999,
    elevation: 15,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONT,
    letterSpacing: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(99, 179, 237, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  roleText: {
    fontSize: 9,
    color: Colors.dark.primary,
    fontFamily: FONT,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginLeft: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONT,
  },
  welcomeRow: {
    marginTop: 5,
  },
  welcomeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: FONT,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONT,
    marginTop: 2,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownText: {
    color: '#DC2626',
    fontWeight: '900',
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  modalBody: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    fontFamily: FONT,
    lineHeight: 22,
    marginBottom: 30,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  }
});
