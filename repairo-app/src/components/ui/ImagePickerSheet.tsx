import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

export default function ImagePickerSheet({ visible, onClose, onCamera, onGallery }: ImagePickerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ThemedText style={styles.title}>Add Photo</ThemedText>

          <View style={styles.optionsRow}>
            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => { onCamera(); onClose(); }}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#3D7A78' }]}>
                <Ionicons name="camera" size={26} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.optionLabel}>Camera</ThemedText>
              <ThemedText style={styles.optionHint}>Capture a new photo</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => { onGallery(); onClose(); }}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="images" size={26} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.optionLabel}>Gallery</ThemedText>
              <ThemedText style={styles.optionHint}>Choose from library</ThemedText>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelPressed]}
            onPress={onClose}
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  option: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  optionPressed: {
    opacity: 0.75,
    backgroundColor: '#F0ECE3',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  optionHint: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A80',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    opacity: 0.75,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
