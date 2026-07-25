import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { Repair } from '@/features/repairs/services/repair.service';
import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import { billService } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { taxService } from '@/features/repairs/services/tax.service';
import BillItemEditor, { BillItemEditorHandle } from './components/BillItemEditor';
import { getCurrentUser } from '@/services/auth.service';
import { formatCurrency, getCurrencySymbol, useCurrency } from '@/hooks/use-currency';
import { buildInvoiceHtml } from './utils/invoice-html';

interface GenerateBillScreenProps {
  repair: Repair;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateBillScreen({
  repair,
  onClose,
  onSuccess,
}: GenerateBillScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(repair.payment_status || 'Unpaid');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [taxSnapshot, setTaxSnapshot] = useState<TaxSnapshotItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [hasExistingBill, setHasExistingBill] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const editorRef = useRef<BillItemEditorHandle>(null);

  const handleSaveSilent = async (): Promise<boolean> => {
    try {
      const snapshot = editorRef.current?.getSnapshot();
      const items = snapshot?.items || billItems;
      const sc = snapshot?.serviceCharge ?? serviceCharge;
      const res = await billService.saveBill(repair.id, {
        items,
        service_charge: sc,
        tax_snapshot: taxSnapshot,
        // tax_total stores all taxes for record; backend calculates total_amount using exclusive only
        tax_total: taxSnapshot.reduce((s, t) => s + Number(t.amount || 0), 0),
        payment_status: paymentStatus,
        payment_method: paymentStatus === 'Paid' ? paymentMethod : null,
      });
      return res.success;
    } catch (err) {
      console.error('Failed to save bill silently:', err);
      return false;
    }
  };

  const generatePDFBase64 = async () => {
    const user = getCurrentUser();
    const shopName = user?.shopName || repair.shop_name || 'Garage';
    const currencyCode = user?.shopCurrency || 'INR';
    const currency = getCurrencySymbol(currencyCode);

    const serviceBlocks = (() => {
      if (!repair.complaints) return undefined;
      try {
        const raw = typeof repair.complaints === 'string'
          ? JSON.parse(repair.complaints)
          : repair.complaints;
        if (!Array.isArray(raw)) return undefined;
        return raw.map((block: any) => ({
          type: block.type || 'Service',
          tasks: (block.tasks || [])
            .filter((t: any) => t.text?.trim())
            .map((t: any) => ({
              text: t.text,
              fixed: !!t.fixed,
              failed: !!t.failed,
              reason: t.reason,
            })),
        })).filter((b: any) => b.tasks.length > 0);
      } catch {
        return undefined;
      }
    })();

    let vehicleImageSrc: string | undefined;
    const imgSrc = repair.vehicle_image || (Array.isArray(repair.images) ? repair.images[0] : undefined);
    if (imgSrc) {
      if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
        vehicleImageSrc = imgSrc;
      } else if (imgSrc.startsWith('file://')) {
        try {
          const base64 = await FileSystem.readAsStringAsync(imgSrc, {
            encoding: FileSystem.EncodingType.Base64,
          });
          vehicleImageSrc = `data:image/jpeg;base64,${base64}`;
        } catch {}
      }
    }

    const html = buildInvoiceHtml({
      shopName,
      invoiceNumber: String(repair.id),
      date: repair.repair_date || repair.created_at,
      ownerName: repair.owner_name || '',
      vehicleNumber: repair.vehicle_number,
      vehicleModel: repair.model_name,
      customerPhone: repair.phone_number || repair.whatsapp_number,
      technician: repair.attending_worker_name,
      kmReading: repair.km_reading,
      vehicleImageSrc,
      serviceBlocks,
      items: billItems,
      serviceCharge,
      taxSnapshot,
      paymentStatus,
      paymentMethod,
      currency,
      currencyCode,
    });

    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    return base64!;
  };

  const handleShareInvoice = async () => {
    setSharing(true);
    try {
      const saveOk = await handleSaveSilent();
      if (!saveOk) {
        alert('Could not save latest billing details first. Please try again.');
        return;
      }

      const token = await getStoredToken();
      const res = await fetch(`${ENV.API_URL}/repairs/${repair.id}/pdf?action=store`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!data.success || !data.url) {
        alert('Could not generate invoice. Please try again.');
        return;
      }

      const phone = repair.whatsapp_number || repair.phone_number;
      if (!phone) {
        alert('No customer phone number available.');
        return;
      }

      const subtotal = billItems.reduce((s, it) => s + (Number(it.cost) || 0) * (Number(it.qty) || 0), 0);
      const exclusiveTaxTotal = taxSnapshot
        .filter(t => !t.is_inclusive)
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const grandTotal = subtotal + Number(serviceCharge || 0) + exclusiveTaxTotal;
      const user = getCurrentUser();

      const itemLines = billItems
        .filter(it => it.name?.trim())
        .map(it => {
          const amt = (Number(it.cost) || 0) * (Number(it.qty) || 0);
          return `  ${it.name} x${it.qty} = ${formatCurrency(amt, user?.shopCurrency)}`;
        }).join('\n');

      const message = encodeURIComponent(
        `*Invoice from ${getCurrentUser()?.shopName || 'Garage'}*` +
        `\n\n*Vehicle:* ${repair.vehicle_number}${repair.model_name ? ` (${repair.model_name})` : ''}` +
        `\n*Customer:* ${repair.owner_name || 'Walk-in'}` +
        `\n*Status:* ${paymentStatus}` +
        (itemLines ? `\n\n*Items:*\n${itemLines}` : '') +
        `\n\n*Grand Total:* ${formatCurrency(grandTotal, user?.shopCurrency)}` +
        `\n\nFor detailed invoice, view here: ${data.url}`
      );
      await Linking.openURL(`https://wa.me/${phone}?text=${message}`);
    } catch (err) {
      console.error('Failed to share invoice:', err);
      alert('Could not share invoice. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const saveOk = await handleSaveSilent();
      if (!saveOk) {
        alert('Could not save latest billing details first. Please try again.');
        return;
      }
      const base64 = await generatePDFBase64();

      const saf = FileSystem.StorageAccessFramework;
      const permission = await saf.requestDirectoryPermissionsAsync();
      if (!permission.granted) return;

      const fileUri = await saf.createFileAsync(
        permission.directoryUri,
        `invoice_${repair.id}.pdf`,
        'application/pdf',
      );
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Could not download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Parse complaints array
  const serviceBlocks = (() => {
    if (!repair.complaints) return [];
    try {
      return typeof repair.complaints === 'string'
        ? JSON.parse(repair.complaints)
        : repair.complaints;
    } catch {
      return [];
    }
  })();

  // Load existing bill and taxes concurrently to optimize screen load speed
  useEffect(() => {
    const loadData = async () => {
      try {
        const [taxRes, billRes] = await Promise.all([
          taxService.getAll(),
          billService.getByRepairId(repair.id)
        ]);

        if (taxRes.success && taxRes.data) {
          const active = taxRes.data.filter((t) => t.is_active);
          setTaxes(active);

          if (!(billRes.success && billRes.data)) {
            setTaxSnapshot(active.map((t) => ({
              id: t.id,
              name: t.name,
              rate: t.rate,
              amount: 0,
              is_inclusive: t.is_inclusive,
              applies_to: t.applies_to,
            })));
          }
        }

        if (billRes.success && billRes.data) {
          setBillItems(billRes.data.items || []);
          setServiceCharge(billRes.data.service_charge || 0);
          setTaxSnapshot(billRes.data.tax_snapshot || []);
          setPaymentStatus(billRes.data.payment_status || 'Unpaid');
          setPaymentMethod(billRes.data.payment_method || null);
          setHasExistingBill(true);
        }
      } catch (err) {
        console.error('Failed to load billing details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [repair.id]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const snapshot = editorRef.current?.getSnapshot();
      const items = snapshot?.items || billItems;
      const sc = snapshot?.serviceCharge ?? serviceCharge;
      const res = await billService.saveBill(repair.id, {
        items,
        service_charge: sc,
        tax_snapshot: taxSnapshot,
        tax_total: taxSnapshot.reduce((s, t) => s + Number(t.amount || 0), 0),
        payment_status: paymentStatus,
        payment_method: paymentStatus === 'Paid' ? paymentMethod : null,
      });

      if (res.success) {
        setHasExistingBill(true);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save bill:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormAction = hasExistingBill && !isEditing ? () => setIsEditing(true) : handleSave;
  const formActionLabel = hasExistingBill && !isEditing ? 'Edit Bill' : isEditing ? 'Save Changes' : 'Save Billing Details';

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Billing</ThemedText>
        {hasExistingBill && !isEditing ? (
          <Pressable style={styles.headerEdit} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={16} color={theme.primaryForeground} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.loadingText}>Loading details...</ThemedText>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Number Plate */}
            <View style={styles.vehicleCard}>
              <View style={styles.plate}>
                <View style={styles.plateBadge}>
                  <ThemedText style={styles.plateBadgeText}>{getCurrentUser()?.shopCountry || 'IND'}</ThemedText>
                </View>
                <ThemedText style={styles.plateNumber} numberOfLines={1}>{repair.vehicle_number}</ThemedText>
              </View>
              <ThemedText style={styles.vehicleOwner}>
                {repair.owner_name} • {repair.model_name || 'Generic'}
              </ThemedText>
            </View>

            {/* Services Checklist */}
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Services</ThemedText>
              {serviceBlocks.length > 0 ? (
                serviceBlocks.map((block: any, bi: number) => (
                  <View key={bi} style={[styles.serviceBlock, bi > 0 && styles.serviceDivider]}>
                    <ThemedText style={styles.serviceBlockType}>{block.type}</ThemedText>
                    {block.tasks &&
                      block.tasks
                        .filter((t: any) => t.text?.trim())
                        .map((task: any, ti: number) => {
                          const isCompleted = !!task.fixed;
                          const isFailed = !!task.failed;

                          return (
                            <View key={ti} style={styles.taskItem}>
                              {isCompleted ? (
                                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                              ) : isFailed ? (
                                <Ionicons name="close-circle" size={16} color={theme.destructive} />
                              ) : (
                                <Ionicons
                                  name="checkmark-circle-outline"
                                  size={16}
                                  color={theme.textSecondary}
                                />
                              )}
                              <View style={styles.taskTextWrapper}>
                                <ThemedText
                                  style={[
                                    styles.taskText,
                                    isCompleted && styles.taskTextCompleted,
                                    isFailed && styles.taskTextFailed,
                                  ]}
                                >
                                  {task.text}
                                </ThemedText>
                                {isFailed && task.reason && (
                                  <ThemedText style={styles.taskReasonText}>
                                    ↳ Reason: {task.reason}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                          );
                        })}
                    {(!block.tasks ||
                      block.tasks.filter((t: any) => t.text?.trim()).length === 0) && (
                      <ThemedText style={styles.noTasks}>No issues listed</ThemedText>
                    )}
                  </View>
                ))
              ) : (
                <ThemedText style={styles.noTasks}>No services recorded</ThemedText>
              )}
            </View>

            {/* Billing Editor */}
            <BillItemEditor
              ref={editorRef}
              items={billItems}
              onChange={setBillItems}
              serviceCharge={serviceCharge}
              onServiceChargeChange={setServiceCharge}
              paymentStatus={paymentStatus}
              onPaymentStatusChange={(status) => {
                setPaymentStatus(status);
                if (status !== 'Paid') setPaymentMethod(null);
              }}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              taxes={taxes}
              taxSnapshot={taxSnapshot}
              onTaxChange={setTaxSnapshot}
              editable={!hasExistingBill || isEditing}
            />
          </ScrollView>

          {/* Footer Actions */}
          {!keyboardVisible && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {hasExistingBill && (
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.shareBtn,
                  pressed && styles.pressed,
                  sharing && styles.disabled,
                ]}
                onPress={handleShareInvoice}
                disabled={sharing || downloading || submitting}
              >
                {sharing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.shareBtnText}>Share</ThemedText>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.downloadBtn,
                  pressed && styles.pressed,
                  downloading && styles.disabled,
                ]}
                onPress={handleDownloadInvoice}
                disabled={sharing || downloading || submitting}
              >
                {downloading ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="download-outline" size={16} color={theme.primary} />
                    <ThemedText style={styles.downloadBtnText}>PDF</ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.pressed,
                submitting && styles.disabled,
              ]}
              onPress={handleFormAction}
              disabled={sharing || downloading || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.primaryForeground} size="small" />
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={theme.primaryForeground} />
                  <ThemedText style={styles.saveBtnText}>{formActionLabel}</ThemedText>
                </View>
              )}
            </Pressable>
          </View>
          )}
        </>
      )}

    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundElement,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundElement,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  headerEdit: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },

  // ── Loading ──
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },

  // ── Scroll ──
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
    gap: 12,
  },

  // ── Number Plate ──
  vehicleCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  plate: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.backgroundSelected,
  },
  plateBadge: {
    backgroundColor: theme.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  plateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.background,
    letterSpacing: 0.5,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vehicleOwner: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // ── Card ──
  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  // ── Services ──
  serviceBlock: {
    gap: 4,
  },
  serviceDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    paddingTop: 10,
    marginTop: 6,
  },
  serviceBlockType: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 2,
  },
  taskTextWrapper: {
    flex: 1,
    gap: 1,
  },
  taskText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
  },
  taskTextFailed: {
    textDecorationLine: 'line-through',
    color: theme.destructive,
    fontStyle: 'italic',
  },
  taskReasonText: {
    fontSize: 11,
    color: theme.destructive,
    fontStyle: 'italic',
  },
  noTasks: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  shareBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.backgroundElement,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: theme.primaryForeground,
    fontSize: 14,
    fontWeight: '700',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
}), [theme]);
  return styles;
};
