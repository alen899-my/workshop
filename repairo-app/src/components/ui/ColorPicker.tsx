import { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, TextInput, Pressable, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function hexToHsv(hex: string) {
  let h = 0, s = 0, v = 0;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    v = max;
    s = max === 0 ? 0 : d / max;
    if (d !== 0) {
      switch (max) {
        case r: h = 60 * (((g - b) / d) % 6); break;
        case g: h = 60 * ((b - r) / d + 2); break;
        case b: h = 60 * ((r - g) / d + 4); break;
      }
      if (h < 0) h += 360;
    }
  }
  return { h, s, v };
}

function isValidHex(color: string) {
  return /^#([0-9a-fA-F]{6})$/.test(color);
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const theme = useTheme();
  const { h, s, v } = hexToHsv(value);
  const [hue, setHue] = useState(h);
  const [sat, setSat] = useState(s);
  const [val, setVal] = useState(v);
  const [hexInput, setHexInput] = useState(value);
  const svLayoutRef = useRef({ width: 0, height: 0 });

  const updateFromHsv = useCallback((nh: number, ns: number, nv: number) => {
    setHue(nh);
    setSat(ns);
    setVal(nv);
    const hex = hsvToHex(nh, ns, nv);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  useEffect(() => {
    const { h: nh, s: ns, v: nv } = hexToHsv(value);
    setHue(nh);
    setSat(ns);
    setVal(nv);
    setHexInput(value);
  }, [value]);

  const onHexSubmit = useCallback(() => {
    let hex = hexInput.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (isValidHex(hex)) {
      const { h: nh, s: ns, v: nv } = hexToHsv(hex);
      setHue(nh);
      setSat(ns);
      setVal(nv);
      onChange(hex);
      setHexInput(hex);
    } else {
      setHexInput(value);
    }
  }, [hexInput, onChange, value]);

  const svPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const { width, height } = svLayoutRef.current;
        if (width > 0 && height > 0) {
          updateFromHsv(hue, Math.max(0, Math.min(1, locationX / width)), Math.max(0, Math.min(1, 1 - locationY / height)));
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const { width, height } = svLayoutRef.current;
        if (width > 0 && height > 0) {
          updateFromHsv(hue, Math.max(0, Math.min(1, locationX / width)), Math.max(0, Math.min(1, 1 - locationY / height)));
        }
      },
    })
  ).current;

  const huePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX } = evt.nativeEvent;
        const { width } = svLayoutRef.current;
        if (width > 0) {
          updateFromHsv(Math.max(0, Math.min(360, (locationX / width) * 360)), sat, val);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const { width } = svLayoutRef.current;
        if (width > 0) {
          updateFromHsv(Math.max(0, Math.min(360, (locationX / width) * 360)), sat, val);
        }
      },
    })
  ).current;

  const onSvLayout = useCallback((e: LayoutChangeEvent) => {
    svLayoutRef.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
  }, []);

  return (
    <View style={styles.container}>
      {/* Saturation / Value area */}
      <View
        style={[styles.svArea, { backgroundColor: `hsl(${hue}, 100%, 50%)` }]}
        onLayout={onSvLayout}
        {...svPanResponder.panHandlers}
      >
        <LinearGradient colors={['#fff', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(0,0,0,0)', '#000']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.svThumb, { left: `${sat * 100}%`, top: `${(1 - val) * 100}%` }]}>
          <View style={styles.svThumbInner} />
        </View>
      </View>

      {/* Hue slider */}
      <View style={styles.hueTrack} {...huePanResponder.panHandlers}>
        <LinearGradient
          colors={['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.hueGradient, StyleSheet.absoluteFill]}
        />
        <View style={[styles.hueThumb, { left: `${(hue / 360) * 100}%` }]}>
          <View style={styles.hueThumbInner} />
        </View>
      </View>

      {/* Preview + hex input */}
      <View style={styles.bottomRow}>
        <View style={[styles.preview, { backgroundColor: value }]} />
        <View style={styles.hexRow}>
          <ThemedText style={styles.hashtag}>#</ThemedText>
          <TextInput
            style={[styles.hexInput, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            value={hexInput.replace('#', '')}
            onChangeText={(t) => setHexInput('#' + t)}
            onSubmitEditing={onHexSubmit}
            onBlur={onHexSubmit}
            maxLength={7}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={[styles.applyBtn, { backgroundColor: theme.primary }]} onPress={onHexSubmit}>
            <ThemedText style={styles.applyText}>Apply</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;
const SV_HEIGHT = 200;

const styles = StyleSheet.create({
  container: { gap: Spacing.three, paddingHorizontal: Spacing.one },
  svArea: {
    height: SV_HEIGHT,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  svGradientWhite: {},
  svGradientBlack: {},
  svThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    marginLeft: -12,
    marginTop: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svThumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  hueTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  hueGradient: { borderRadius: TRACK_HEIGHT / 2 },
  hueThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    marginLeft: -(THUMB_SIZE / 2),
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    backgroundColor: '#fff',
  },
  hueThumbInner: { width: '100%', height: '100%', borderRadius: THUMB_SIZE / 2 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  preview: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  hexRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  hashtag: { fontSize: 16, fontWeight: '600' },
  hexInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  applyBtn: {
    paddingHorizontal: Spacing.three,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
