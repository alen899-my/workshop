import React, { useEffect, useState } from 'react';
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
import { Colors } from '@/constants/theme';
import type { Repair } from '@/features/repairs/services/repair.service';
import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import { billService } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { taxService } from '@/features/repairs/services/tax.service';
import BillItemEditor from './components/BillItemEditor';
import { getCurrentUser } from '@/services/auth.service';
import { getCurrencySymbol } from '@/hooks/use-currency';
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

  const handleSaveSilent = async (): Promise<boolean> => {
    try {
      const res = await billService.saveBill(repair.id, {
        items: billItems,
        service_charge: serviceCharge,
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
    const currency = getCurrencySymbol(user?.shopCurrency);

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

      const message = encodeURIComponent(`Your invoice is ready: ${data.url}`);
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
          setTaxes(taxRes.data.filter((t) => t.is_active));
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
      const res = await billService.saveBill(repair.id, {
        items: billItems,
        service_charge: serviceCharge,
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
      {/* Custom Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.backBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Generate Invoice</ThemedText>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3D7A78" />
          <ThemedText style={styles.loadingText}>Loading details...</ThemedText>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Vehicle Overview */}
            <View style={styles.vehicleCard}>
              <View>
                <ThemedText style={styles.vehicleNo}>{repair.vehicle_number}</ThemedText>
                <ThemedText style={styles.ownerText}>
                  {repair.owner_name} • {repair.model_name || 'Generic'}
                </ThemedText>
              </View>
            </View>

            {/* Services Done Checklist for billing context */}
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Completed Services Checklist</ThemedText>
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
                                <Ionicons name="checkmark-circle" size={16} color="#3D7A78" />
                              ) : isFailed ? (
                                <Ionicons name="close-circle" size={16} color="#E53E3E" />
                              ) : (
                                <Ionicons
                                  name="checkmark-circle-outline"
                                  size={16}
                                  color="#8A8A80"
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

            {/* Main Billing Editor */}
            <BillItemEditor
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

          {/* Footer Actions (Share, Download, Save) — hidden while keyboard is open */}
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
                    <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.btnTextWhite}>Share Invoice</ThemedText>
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
                  <ActivityIndicator color="#3D7A78" size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="download-outline" size={18} color="#3D7A78" />
                    <ThemedText style={styles.btnTextTeal}>Download PDF</ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
            )}

            {/* Save / Edit Bill */}
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4', // Premium app cream background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8E0CC',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7F4',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8A8A80',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 200,
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: '#3D7A78', // Teal background
    borderRadius: 20,
    padding: 18,
    shadowColor: '#3D7A78',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  vehicleNo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ownerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceBlock: {
    gap: 6,
  },
  serviceDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F0ECE3',
    paddingTop: 12,
    marginTop: 6,
  },
  serviceBlockType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3D7A78',
    marginBottom: 2,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  taskTextWrapper: {
    flex: 1,
    gap: 2,
  },
  taskText: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#8A8A80',
  },
  taskTextFailed: {
    textDecorationLine: 'line-through',
    color: '#E53E3E',
    fontStyle: 'italic',
  },
  taskReasonText: {
    fontSize: 11,
    color: '#E53E3E',
    fontStyle: 'italic',
  },
  noTasks: {
    fontSize: 13,
    color: '#8A8A80',
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F8F7F4',
    borderTopWidth: 1,
    borderTopColor: '#E8E0CC',
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#3D7A78', // Teal background
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  shareBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#25D366', // WhatsApp Green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  downloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3D7A78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextTeal: {
    color: '#3D7A78',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
});
