import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AppScreen, PrimaryButton, LoadingState } from '@/components/design-system';
import { ThemedText as Text } from '@/components/themed-text';
import InputField from '@/components/ui/InputField';
import ImagePickerSheet from '@/components/ui/ImagePickerSheet';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import { inventoryService, type Product, type Movement } from './inventory.service';

interface Props { product: Product; currency: string; onClose: () => void; onEdit: () => void; onUpdate: (product: Product) => void }
export default function ProductDetail({ product, currency, onClose, onEdit, onUpdate }: Props) {
  const theme = useTheme(), insets = useSafeAreaInsets(), { can } = useRBAC();
  const [movements, setMovements] = useState<Movement[]>([]), [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [kind, setKind] = useState<'receipt' | 'adjustment'>('receipt');
  const [quantity, setQuantity] = useState(''), [reason, setReason] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const attempt = useRef({ payload: '', id: '' }), busyRef = useRef(false);
  const history = useCallback(async (before?: string) => {
    setLoading(true);
    const res = await inventoryService.history(product.id, product.shop_id, before);
    if (res.success && res.data) { setMovements(old => before ? [...old, ...res.data!] : res.data!); setMore(!!res.has_more); }
    else setError(res.error || 'Could not load stock history');
    setLoading(false);
  }, [product.id, product.shop_id]);
  useEffect(() => {
    const timeout = setTimeout(() => { void history(); }, 0);
    return () => clearTimeout(timeout);
  }, [history]);
  const saveStock = async () => {
    if (busyRef.current) return;
    if (!quantity.trim() || !Number.isFinite(Number(quantity)) || Number(quantity) === 0 || (kind === 'receipt' && Number(quantity) < 0) || !reason.trim()) {
      setError('Enter a valid quantity and a reason. Receipts must be positive.'); return;
    }
    const payload = JSON.stringify({ shop_id: product.shop_id, quantity, kind, reason });
    // Keep the same request ID after a connection failure, so retry cannot receive stock twice.
    if (attempt.current.payload !== payload) attempt.current = { payload, id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) };
    busyRef.current = true; setBusy(true); setError('');
    const res = await inventoryService.stock(product.id, { shop_id: product.shop_id, quantity, kind, reason, request_id: attempt.current.id });
    busyRef.current = false; setBusy(false);
    if (res.success && res.data) { onUpdate(res.data); setQuantity(''); setReason(''); attempt.current = { payload: '', id: '' }; void history(); }
    else setError(res.error || 'Could not update stock');
  };
  const archive = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    const res = await inventoryService.save({ ...product, is_active: !product.is_active }, product.id);
    busyRef.current = false; setBusy(false);
    if (res.success && res.data) onUpdate(res.data); else setError(res.error || 'Could not update product');
  };
  const changePhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    const res = await inventoryService.image(product.id, product.shop_id, asset);
    busyRef.current = false; setBusy(false);
    if (res.success && res.data) onUpdate(res.data); else setError(res.error || 'Photo upload failed');
  };
  const removePhoto = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    const res = await inventoryService.removeImage(product.id, product.shop_id);
    busyRef.current = false; setBusy(false);
    if (res.success && res.data) onUpdate(res.data); else setError(res.error || 'Photo could not be removed');
  };
  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError('Photo library permission is needed to add a product photo.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) void changePhoto(result.assets[0]);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Camera permission is needed to take a product photo.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) void changePhoto(result.assets[0]);
  };
  const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
  return <AppScreen>
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}><Pressable onPress={onClose} disabled={busy} accessibilityLabel="Back to inventory"><Ionicons name="arrow-back" size={24} color={theme.text} /></Pressable><Text style={styles.title}>Product details</Text></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.photo} contentFit="cover" /> : null}
        <Text style={styles.title}>{product.name}</Text><Text themeColor="textSecondary">{product.sku} · {product.is_active ? 'Active' : 'Archived'}</Text>
        <Text style={styles.stock}>{Number(product.stock)} <Text>{product.unit} in stock</Text></Text>
        <Text>Reorder at {Number(product.reorder_level)} {product.unit}</Text>
        <Text>Selling price: {money(product.selling_price)}</Text>
        {can('manage:inventory') && <Text>Purchase cost: {money(product.cost_price)}</Text>}
        {!!product.category && <Text>Category: {product.category}</Text>}
        {!!product.location && <Text>Location: {product.location}</Text>}
        {can('manage:inventory') && <PrimaryButton title="Edit product" variant="outline" onPress={onEdit} disabled={busy} />}
        {can('manage:inventory') && (product.image_url
          ? <View style={styles.row}>
              <PrimaryButton title="Change photo" variant="outline" onPress={() => setPickerOpen(true)} disabled={busy} />
              <PrimaryButton title="Remove photo" variant="outline" onPress={() => { void removePhoto(); }} disabled={busy} />
            </View>
          : <PrimaryButton title="Add photo" icon="camera-outline" variant="outline" onPress={() => setPickerOpen(true)} disabled={busy} />)}
      </View>
      <ImagePickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onCamera={() => { void takePhoto(); }} onGallery={() => { void pickFromGallery(); }} />
      {!!error && <Text style={{ color: theme.destructive }}>{error}</Text>}
      {can('manage:inventory') && product.is_active && <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={styles.heading}>Update stock</Text>
        <View style={styles.row}>{(['receipt', 'adjustment'] as const).map(value => <Pressable key={value} disabled={busy} onPress={() => setKind(value)} style={[styles.chip, { backgroundColor: kind === value ? theme.accent : theme.backgroundElement }]}><Text>{value === 'receipt' ? 'Receive stock' : 'Adjustment'}</Text></Pressable>)}</View>
        <InputField label={kind === 'receipt' ? 'Quantity received' : 'Quantity change (+ / −)'} value={quantity} onChangeText={setQuantity} editable={!busy} />
        <InputField label="Reason / supplier reference" value={reason} onChangeText={setReason} editable={!busy} />
        <Text themeColor="textSecondary">{kind === 'receipt' ? 'Record deliveries received into this workshop.' : 'Use a negative quantity for damage or shortages. Every change is recorded.'}</Text>
        <PrimaryButton title={busy ? 'Saving…' : 'Save stock movement'} disabled={busy} onPress={saveStock} />
      </View>}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={styles.heading}>Stock history</Text>
        <PrimaryButton title="Refresh history" variant="outline" onPress={() => { setError(''); void history(); }} disabled={loading} />
        {movements.map(movement => <View key={movement.id} style={[styles.movement, { borderColor: theme.border }]}>
          <View style={styles.between}><Text>{movement.kind.replace(/_/g, ' ')}</Text><Text style={{ fontWeight: '600' }}>{Number(movement.quantity) > 0 ? '+' : ''}{Number(movement.quantity)} {product.unit}</Text></View>
          <Text>{movement.reason}{movement.repair_id ? ' · Repair #' + movement.repair_id : ''}</Text>
          <Text themeColor="textSecondary">{new Date(movement.created_at).toLocaleString()}{movement.actor_name ? ' · ' + movement.actor_name : ''}</Text>
          <Text themeColor="textSecondary">Balance: {Number(movement.balance_after)} {product.unit}</Text>
        </View>)}
        {loading ? <LoadingState message="Loading history…" /> : !movements.length && !error ? <Text themeColor="textSecondary">No stock movements yet.</Text> : null}
        {more && <PrimaryButton title="Earlier movements" variant="outline" disabled={loading} onPress={() => { void history(movements[movements.length - 1]?.id); }} />}
      </View>
      {can('manage:inventory') && <><Text themeColor="textSecondary">Archiving hides this product from new bills. Existing bills and stock history are kept.</Text><PrimaryButton title={product.is_active ? 'Archive product' : 'Restore product'} variant="outline" disabled={busy} onPress={archive} /></>}
    </ScrollView>
  </AppScreen>;
}
const styles = StyleSheet.create({
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }, title: { fontSize: 24, fontWeight: '600', flexShrink: 1 },
  content: { padding: 20, gap: 16, width: '100%', maxWidth: 840, alignSelf: 'center' }, card: { borderRadius: 24, padding: 20, gap: 14 },
  photo: { width: '100%', height: 220, borderRadius: 16 },
  stock: { fontSize: 38, fontWeight: '500' }, heading: { fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { borderRadius: 20, padding: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, movement: { paddingVertical: 12, borderBottomWidth: 1, gap: 6 },
});
