import React from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../lib/theme';

const { height: SH } = Dimensions.get('window');

export function AppModal({ visible, onClose, title, subtitle, children, footer }) {
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[s.sheet, {
          backgroundColor: T.surface,
          borderColor: T.border,
          paddingBottom: bottomPad,
        }]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: T.borderStrong }]} />

          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: T.text }]}>{title}</Text>
              {subtitle ? <Text style={[s.subtitle, { color: T.textMuted }]}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, {
              backgroundColor: T.surfaceAlt,
              borderColor: T.border,
            }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={17} color={T.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={[s.divider, { backgroundColor: T.border }]} />

          {/* Body */}
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <>
              <View style={[s.divider, { backgroundColor: T.border }]} />
              <View style={s.footer}>{footer}</View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SH * 0.88,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 2,
  },
  divider: { height: 1 },
  body: { padding: 20, gap: 14 },
  footer: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
});
