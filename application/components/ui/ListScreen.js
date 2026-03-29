import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, StyleSheet,
  Alert, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Search, SlidersHorizontal, Eye, Pencil, Trash2, ChevronRight, X } from 'lucide-react-native';
import { T } from '../../constants/Theme';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * ListScreen — Light-themed, table-style list screen with Flipkart-style filter toggle.
 *
 * Props:
 *   title         string           — page title
 *   subtitle      string           — optional subtitle
 *   data          array            — full dataset
 *   loading       bool
 *   onRefresh     () => void
 *   onAdd         () => void        — null to hide
 *   renderRow     (item) => node    — custom row content
 *   onView        (item) => void
 *   onEdit        (item) => void    — null to hide
 *   onDelete      (item) => void    — null to hide
 *   searchKeys    string[]
 *   filterContent ReactNode         — filter controls shown in toggle panel
 *   activeFilters number            — count of active filters (shows badge on button)
 *   onResetFilters () => void
 *   emptyText     string
 */
export function ListScreen({
  title,
  subtitle,
  data = [],
  loading,
  onRefresh,
  onAdd,
  renderRow,
  onView,
  onEdit,
  onDelete,
  searchKeys = [],
  filterContent,
  activeFilters = 0,
  onResetFilters,
  emptyText = 'No records found.',
}) {
  const [search, setSearch] = React.useState('');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter((item) =>
      searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  const doRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersOpen(o => !o);
  };

  const confirmDelete = (item) =>
    Alert.alert('Delete Record', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
    ]);

  const renderCard = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.55}
      onPress={() => onView?.(item)}
      style={[s.row, index === filtered.length - 1 && { borderBottomWidth: 0 }]}
    >
      <View style={s.rowContent}>
        {renderRow ? renderRow(item) : (
          <Text style={s.rowTitle}>{String(Object.values(item)[1] ?? '—')}</Text>
        )}
      </View>
      <View style={s.rowActions}>
        {onView && (
          <TouchableOpacity onPress={() => onView(item)} style={[s.actionIcon, { backgroundColor: T.primaryLight, borderColor: '#C3D9F0' }]} hitSlop={HIT}>
            <Eye size={14} color={T.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(item)} style={s.actionIcon} hitSlop={HIT}>
            <Pencil size={13} color={T.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => confirmDelete(item)} style={[s.actionIcon, { backgroundColor: T.dangerBg, borderColor: T.dangerBorder }]} hitSlop={HIT}>
            <Trash2 size={13} color={T.danger} strokeWidth={2} />
          </TouchableOpacity>
        )}
        {!onEdit && !onDelete && (
          <ChevronRight size={16} color={T.textFaint} strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{title}</Text>
          {subtitle && <Text style={s.headerSub}>{subtitle}</Text>}
        </View>
        {onAdd && (
          <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.85}>
            <Text style={s.addBtnText}>+ Add New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search + Filter toggle row ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Search size={14} color={T.textFaint} strokeWidth={2} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={T.textFaint}
            style={s.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={HIT}>
              <X size={14} color={T.textFaint} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter toggle button */}
        {filterContent && (
          <TouchableOpacity
            style={[s.filterBtn, filtersOpen && s.filterBtnActive]}
            onPress={toggleFilters}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={15} color={filtersOpen ? T.primaryText : T.textMuted} strokeWidth={2} />
            {activeFilters > 0 && !filtersOpen && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Flipkart-style collapsible filter panel ── */}
      {filterContent && filtersOpen && (
        <View style={s.filterPanel}>
          {filterContent}
          {activeFilters > 0 && onResetFilters && (
            <TouchableOpacity onPress={onResetFilters} style={s.resetBtn} activeOpacity={0.75}>
              <X size={11} color={T.danger} strokeWidth={2.5} />
              <Text style={s.resetBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Table card ── */}
      {loading && !refreshing ? (
        <View style={s.center}>
          <ActivityIndicator color={T.primary} size="large" />
          <Text style={s.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={s.tableCard}>
          {/* Table meta strip */}
          <View style={s.tableStrip}>
            <Text style={s.tableStripText}>
              {filtered.length}{data.length !== filtered.length ? ` of ${data.length}` : ''} record{filtered.length !== 1 ? 's' : ''}
            </Text>
            {(search || activeFilters > 0) && (
              <View style={s.filteredBadge}>
                <Text style={s.filteredBadgeText}>Filtered</Text>
              </View>
            )}
          </View>

          <FlatList
            data={filtered}
            renderItem={renderCard}
            keyExtractor={(item) => String(item.id ?? Math.random())}
            showsVerticalScrollIndicator={false}
            onRefresh={doRefresh}
            refreshing={refreshing}
            contentContainerStyle={filtered.length === 0 && s.emptyContent}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyText}>{search ? `No results for "${search}"` : emptyText}</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const HIT = { top: 8, bottom: 8, left: 8, right: 8 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T.text, fontFamily: T.font, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 },
  addBtn: {
    backgroundColor: T.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: T.radius,
    ...T.shadow,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: T.primaryText, fontFamily: T.font },

  // search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...T.shadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.text, fontFamily: T.font },

  // filter toggle
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: T.radius,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.shadow,
  },
  filterBtnActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', fontFamily: T.font },

  // filter panel
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 12,
    ...T.shadow,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: T.dangerBg,
    borderWidth: 1,
    borderColor: T.dangerBorder,
  },
  resetBtnText: { fontSize: 11, fontWeight: '600', color: T.danger, fontFamily: T.font },

  // table card
  tableCard: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: T.surface,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    ...T.shadow,
  },
  tableStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: T.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tableStripText: { fontSize: 11, fontWeight: '600', color: T.textMuted, fontFamily: T.font },
  filteredBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: T.primaryLight,
    borderWidth: 1,
    borderColor: '#C3D9F0',
  },
  filteredBadgeText: { fontSize: 9, fontWeight: '700', color: T.primary, fontFamily: T.font },

  // rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
    gap: 10,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: T.font },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: T.radiusSm,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // states
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: T.textMuted, fontFamily: T.font },
  emptyContent: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 10 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 13, color: T.textMuted, fontFamily: T.font, textAlign: 'center' },
});
