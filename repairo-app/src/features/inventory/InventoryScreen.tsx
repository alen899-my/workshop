import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import { inventoryService, type Product, type InventoryShop } from './inventory.service';
import ProductDetail from './ProductDetail';

interface Props { onClose?: () => void; shopId?: number; onSelect?: (product: Product) => void }
const blank = { name: '', sku: '', category: '', unit: 'piece', location: '', cost_price: '0', selling_price: '0', reorder_level: '0', opening_stock: '0' };

export default function InventoryScreen({ onClose, shopId: fixedShop, onSelect }: Props) {
  const theme = useTheme(), insets = useSafeAreaInsets();
  const { can, user } = useRBAC();
  const [shopId, setShopId] = useState(fixedShop || user?.shopId);
  const [shops, setShops] = useState<InventoryShop[]>([]);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('active');
  const [products, setProducts] = useState<Product[]>([]), [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [form, setForm] = useState(blank), [saving, setSaving] = useState(false);
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false), [pickerOpen, setPickerOpen] = useState(false);
  const request = useRef(0), savingRef = useRef(false);
  const currentShop = shops.find(s => s.id === shopId);
  const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currentShop?.currency || 'INR' }).format(Number(value));

  useEffect(() => {
    let alive = true;
    inventoryService.shops().then(res => {
      if (!alive) return;
      if (res.success && res.data) {
        setShops(res.data);
        setShopId(current => current || res.data?.[0]?.id);
      } else setError(res.error || 'Could not load workshops');
    });
    return () => { alive = false; };
  }, []);

  const load = useCallback(async (offset = 0) => {
    if (!shopId) return;
    const seq = ++request.current;
    setLoading(true); setError('');
    const res = await inventoryService.list(shopId, search, filter, offset);
    if (seq !== request.current) return;
    if (res.success && res.data) {
      setProducts(previous => offset ? [...previous, ...res.data!] : res.data!); setMore(!!res.has_more);
    } else setError(res.error || 'Could not load products');
    setLoading(false);
  }, [shopId, search, filter]);
  useEffect(() => {
    request.current++;
    const timeout = setTimeout(() => {
      setProducts([]); setMore(false);
      void load();
    }, 250);
    return () => { clearTimeout(timeout); request.current++; };
  }, [load]);

  const edit = (product: Product | 'new') => {
    setError(''); setEditing(product); setImageAsset(null); setPhotoRemoved(false); setPickerOpen(false);
    setForm(product === 'new' ? blank : {
      name: product.name, sku: product.sku, category: product.category, unit: product.unit, location: product.location,
      cost_price: String(product.cost_price), selling_price: String(product.selling_price), reorder_level: String(product.reorder_level), opening_stock: '0',
    });
  };
  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError('Photo library permission is needed to add a product photo.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) { setImageAsset(result.assets[0]); setPhotoRemoved(false); }
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Camera permission is needed to take a product photo.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) { setImageAsset(result.assets[0]); setPhotoRemoved(false); }
  };
  const existingPhoto = editing && editing !== 'new' && !photoRemoved ? editing.image_url || null : null;
  const previewUri = imageAsset?.uri || existingPhoto;
  const save = async () => {
    if (!shopId || !editing || savingRef.current) return;
    if (!form.name.trim() || !form.sku.trim() || !form.unit.trim()) { setError('Name, SKU and unit are required.'); return; }
    for (const field of ['cost_price', 'selling_price', 'reorder_level', 'opening_stock'] as const) {
      if (!form[field].trim() || !Number.isFinite(Number(form[field])) || Number(form[field]) < 0) { setError('Enter valid non-negative prices and quantities.'); return; }
    }
    savingRef.current = true; setSaving(true); setError('');
    const res = await inventoryService.save({ ...form, shop_id: shopId,
      ...(editing !== 'new' ? { version: editing.version, is_active: editing.is_active } : {}),
    }, editing === 'new' ? undefined : editing.id);
    savingRef.current = false; setSaving(false);
    if (res.success && res.data) {
      let saved = res.data;
      if (imageAsset) {
        const up = await inventoryService.image(saved.id, shopId, imageAsset);
        if (up.success && up.data) saved = up.data;
        else setError(up.error || 'Product saved, but the photo could not be uploaded. Open the product to retry.');
      } else if (photoRemoved && editing !== 'new' && editing?.image_url) {
        const up = await inventoryService.removeImage(saved.id, shopId);
        if (up.success && up.data) saved = up.data;
        else setError(up.error || 'Product saved, but the photo could not be removed.');
      }
      setImageAsset(null); setPhotoRemoved(false);
      setEditing(null);
      // Created mid-billing with stock on hand: drop it straight onto the bill.
      if (onSelect && Number(saved.stock) > 0) onSelect(saved);
      else setSelected(saved);
      void load();
    }
    else setError(res.error || 'Could not save product');
  };

  if (selected && !editing) return <ProductDetail product={selected} currency={currentShop?.currency || 'INR'} onClose={() => { setSelected(null); void load(); }} onEdit={() => edit(selected)} onUpdate={setSelected} />;

  return <AppScreen>
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      {onClose ? (
        <Pressable accessibilityLabel="Back" disabled={saving} onPress={() => editing ? setEditing(null) : onClose()}><Ionicons name="arrow-back" size={24} color={theme.text} /></Pressable>
      ) : editing ? (
        <Pressable accessibilityLabel="Cancel editing" disabled={saving} onPress={() => setEditing(null)}><Ionicons name="arrow-back" size={24} color={theme.text} /></Pressable>
      ) : null}
      <Text style={styles.title}>{editing ? editing === 'new' ? 'New product' : 'Edit product' : onSelect ? 'Add from inventory' : 'Inventory'}</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
      {!!error && <View style={[styles.card, { backgroundColor: theme.card }]}><Text style={{ color: theme.destructive }}>{error}</Text>{!editing && <PrimaryButton title="Retry" variant="outline" onPress={() => { void load(); }} />}</View>}
      {editing ? <>
        <Text themeColor="textSecondary">{currentShop?.name} · Prices in {currentShop?.currency || 'INR'}</Text>
        {(Object.keys(blank) as (keyof typeof blank)[]).filter(key => editing === 'new' || key !== 'opening_stock').map(key => <InputField key={key}
          label={({ name: 'Product name', sku: 'SKU / part number', category: 'Category', unit: 'Unit (piece, litre, set)', location: 'Bin / shelf location', cost_price: 'Purchase cost', selling_price: 'Selling price', reorder_level: 'Low-stock threshold', opening_stock: 'Opening stock' })[key]}
          value={form[key]} onChangeText={value => setForm(previous => ({ ...previous, [key]: value }))}
          editable={!saving && !(key === 'unit' && editing !== 'new')} />)}
        <Text themeColor="textSecondary">Photo (optional)</Text>
        {previewUri ? <>
          <Image source={{ uri: previewUri }} style={styles.photo} contentFit="cover" />
          <View style={styles.row}>
            <PrimaryButton title="Change" variant="outline" onPress={() => setPickerOpen(true)} disabled={saving} />
            <PrimaryButton title="Remove" variant="outline" onPress={() => { setImageAsset(null); setPhotoRemoved(true); }} disabled={saving} />
          </View>
        </> : <PrimaryButton title="Add photo" icon="camera-outline" variant="outline" onPress={() => setPickerOpen(true)} disabled={saving} />}
        <PrimaryButton title={saving ? 'Saving…' : 'Save product'} disabled={saving} onPress={save} />
        <ImagePickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onCamera={() => { void takePhoto(); }} onGallery={() => { void pickFromGallery(); }} />
      </> : <>
        {!fixedShop && shops.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {shops.map(shop => <Pressable key={shop.id} onPress={() => setShopId(shop.id)} style={[styles.chip, { backgroundColor: shop.id === shopId ? theme.accent : theme.card }]}><Text>{shop.name}</Text></Pressable>)}
        </ScrollView>}
        <Text themeColor="textSecondary">{currentShop?.name || 'Select a workshop'} · Parts, fluids and accessories</Text>
        <TextInput accessibilityLabel="Search inventory" placeholder="Search name, SKU or category" placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} style={[styles.search, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} />
        <View style={styles.row}>{(onSelect ? ['active', 'low'] : ['active', 'low', 'archived']).map(value => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.chip, { backgroundColor: filter === value ? theme.accent : theme.card }]}><Text>{value === 'active' ? 'All products' : value === 'low' ? 'Low stock' : 'Archived'}</Text></Pressable>)}</View>
        {!onSelect && can('manage:inventory') && <PrimaryButton title="New product" icon="add" onPress={() => edit('new')} disabled={!shopId} />}
        {onSelect && <Text themeColor="textSecondary">Items are added to the bill. Stock is deducted when you save billing details.</Text>}
        {products.map(product => {
          const outOfStock = Number(product.stock) <= 0;
          const unpickable = !!onSelect && outOfStock;
          return <Pressable key={product.id} disabled={unpickable} onPress={() => onSelect ? onSelect(product) : setSelected(product)} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, opacity: unpickable ? 0.55 : 1 }]}>
          <View style={styles.between}>
            {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.thumb} contentFit="cover" /> : null}
            <Text style={styles.product}>{product.name}</Text>
            {onSelect
              ? <Pressable accessibilityLabel={'Add ' + product.name + ' to bill'} disabled={unpickable} onPress={() => onSelect(product)} style={[styles.addBtn, { backgroundColor: unpickable ? theme.backgroundElement : theme.accent }]}>
                  <Text style={[styles.addBtnText, { color: unpickable ? theme.textSecondary : theme.accentForeground }]}>{outOfStock ? 'No stock' : 'Add'}</Text>
                </Pressable>
              : <Ionicons name="chevron-forward" size={22} color={theme.primary} />}
          </View>
          <Text themeColor="textSecondary">{product.sku}{product.category ? ' · ' + product.category : ''}</Text>
          <View style={styles.between}><Text>{Number(product.stock)} {product.unit} available</Text><Text>{money(product.selling_price)}</Text></View>
          {Number(product.stock) <= Number(product.reorder_level) && <Text style={{ color: theme.destructive }}>{Number(product.stock) === 0 ? 'Out of stock' : 'Low stock'}</Text>}
        </Pressable>;})}
        {loading ? <LoadingState message="Loading inventory…" /> : !error && !products.length ? <>
          <Text themeColor="textSecondary">No products found. {onSelect ? 'Create the part below to add it straight to this bill.' : 'Add your first product or change the filters.'}</Text>
          {onSelect && can('manage:inventory') && <PrimaryButton title="New product" icon="add" onPress={() => edit('new')} disabled={!shopId} />}
        </> : null}
        {more && <PrimaryButton title="Load more" variant="outline" disabled={loading} onPress={() => { void load(products.length); }} />}
      </>}
    </ScrollView>
  </AppScreen>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 }, title: { fontSize: 24, fontWeight: '600', flex: 1 },
  content: { padding: 20, gap: 14, width: '100%', maxWidth: 840, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 }, search: { padding: 16, borderWidth: 1, borderRadius: 16, fontSize: 15 },
  card: { padding: 18, borderRadius: 24, borderWidth: 1, gap: 10 }, product: { fontSize: 18, fontWeight: '600', flex: 1 },
  thumb: { width: 46, height: 46, borderRadius: 12 }, photo: { width: '100%', height: 200, borderRadius: 16 },
  addBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 16 },
  addBtnText: { fontSize: 14, fontWeight: '700' },
});
