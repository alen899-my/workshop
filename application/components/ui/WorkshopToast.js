import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity, Platform, SafeAreaView } from 'react-native';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const showToast = ({ type = 'info', title, description, duration = 3000 }) => {
    setToastConfig({ type, title, description });
    Animated.spring(slideAnim, {
      toValue: Platform.OS === 'ios' ? 60 : 40,
      velocity: 5,
      bounciness: 12,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    if (duration > 0) {
      setTimeout(() => hideToast(), duration);
    }
  };

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setToastConfig(null));
  };

  return (
    <ToastContext.Provider value={{ toast: showToast, hideToast }}>
      {children}
      {toastConfig && (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]} pointerEvents="box-none">
          <SafeAreaView pointerEvents="box-none">
            <ToastContent {...toastConfig} onDismiss={hideToast} />
          </SafeAreaView>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

function ToastContent({ type, title, description, onDismiss }) {
  let config = { bg: '#2400FF', icon: 'ℹ', titleColor: '#FFF', descColor: 'rgba(255,255,255,0.9)' };
  
  if (type === 'success') {
    config = { bg: '#10B981', icon: '✓', titleColor: '#FFF', descColor: 'rgba(255,255,255,0.9)' };
  } else if (type === 'error') {
    config = { bg: '#EF4444', icon: '!', titleColor: '#FFF', descColor: 'rgba(255,255,255,0.9)' };
  } else if (type === 'warning') {
    config = { bg: '#F59E0B', icon: '⚠', titleColor: '#1F2937', descColor: 'rgba(31,41,55,0.8)' };
  }

  return (
    <View style={[styles.toastBox, { backgroundColor: config.bg }]}>
      <View style={styles.iconBox}>
        <Text style={[styles.iconText, { color: config.titleColor }]}>{config.icon}</Text>
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.title, { color: config.titleColor }]} numberOfLines={1}>{title}</Text>
        {description ? <Text style={[styles.desc, { color: config.descColor }]} numberOfLines={2}>{description}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{top:15,bottom:15,left:15,right:15}}>
        <Text style={[styles.closeBtnText, { color: config.descColor }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 16, right: 16, zIndex: 9999 },
  toastBox: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    padding: 16, 
    borderRadius: 8, 
    elevation: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.25)' },
      default: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 10 
      }
    })
  },
  iconBox: { marginRight: 12, marginTop: 1 },
  iconText: { fontSize: 16, fontWeight: 'bold' },
  textBox: { flex: 1, marginRight: 8 },
  title: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  desc: { marginTop: 4, fontSize: 13, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  closeBtnText: { fontSize: 16, fontWeight: 'bold', marginTop: -2 }
});
