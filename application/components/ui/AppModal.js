import React from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { T } from '../../constants/Theme';

const { height: SH } = Dimensions.get('window');

export function AppModal({ visible, onClose, title, subtitle, children, footer }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{title}</Text>
              {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={17} color={T.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={s.divider} />

          {/* Body */}
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <>
              <View style={s.divider} />
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
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SH * 0.88,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomWidth: 0,
    ...T.shadowMd,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
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
    color: T.text,
    fontFamily: T.font,
  },
  subtitle: {
    fontSize: 12,
    color: T.textMuted,
    fontFamily: T.font,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: T.border },
  body: { padding: 20, gap: 14 },
  footer: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
});
