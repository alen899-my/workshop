import WorkshopBackdrop from '@/components/WorkshopBackdrop';
import { UI } from '@/constants/theme';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image as RNImage,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import StatusBadge from '@/components/StatusBadge';
import {
  PrimaryButton,
  ServiceChecklist,
  ServiceInfoCard,
  TechnicianCard,
  VehicleImage,
} from '@/components/design-system';
import { getCurrentUser } from '@/services/auth.service';
import type { Repair } from '@/features/repairs/services/repair.service';
import GenerateBillScreen from '@/features/repairs/GenerateBillScreen';
import { repairService } from '@/features/repairs/services/repair.service';
import { formatUTCToLocal } from '@/utils/date';
import type { Worker } from '@/features/repairs/services/worker.service';
import { workerService } from '@/features/repairs/services/worker.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import { useRBAC } from '@/hooks/use-rbac';
import type { Customer } from '@/features/customers/services/customer.service';
import { customerService } from '@/features/customers/services/customer.service';
import CustomerActionsModal from '@/features/customers/components/CustomerActionsModal';
import CustomerDetailScreen from '@/features/customers/CustomerDetailScreen';
import PastVisitsScreen from '@/features/customers/PastVisitsScreen';
import CustomerVehiclesScreen from '@/features/customers/CustomerVehiclesScreen';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import { toJobList } from './utils/jobs';

interface ViewRepairScreenProps {
  repair: Repair;
  onClose: () => void;
  onEdit: () => void;
  onUpdateRepair?: (updated: Repair) => void;
}

const VEHICLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Car: 'car-outline',
  Bike: 'bicycle-outline',
  Scooter: 'bicycle-outline',
  Bicycle: 'bicycle-outline',
  Auto: 'car-sport-outline',
  Truck: 'car-outline',
};

export default function ViewRepairScreen({
  repair,
  onClose,
  onEdit,
  onUpdateRepair,
}: ViewRepairScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);

  const getPriorityStyle = (p?: string) => {
    if (p === 'Low') return { bg: styles.priorityLow, text: styles.priorityTextLow };
    if (p === 'High') return { bg: styles.priorityHigh, text: styles.priorityTextHigh };
    if (p === 'Urgent') return { bg: styles.priorityUrgent, text: styles.priorityTextUrgent };
    return { bg: styles.priorityMedium, text: styles.priorityTextMedium };
  };

  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    workerService.getWorkers().then((res) => {
      if (res.success && res.data) {
        setWorkers(res.data);
      }
    });
  }, []);

  const handleCall = () => {
    if (repair.phone_number) {
      Linking.openURL(`tel:${repair.phone_number.replace(/\s/g, '')}`);
    }
  };

  const handleWhatsApp = () => {
    const num = repair.whatsapp_number || repair.phone_number;
    if (num) {
      const cleanNum = num.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanNum}&text=Hello, this is regarding your vehicle repair job.`);
    }
  };

  const [localComplaints, setLocalComplaints] = useState<any[]>(() => {
    const jobs = toJobList(repair.complaints, repair.service_type || 'Repair');
    return [{ type: jobs.type, tasks: jobs.tasks }];
  });
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newComplaintText, setNewComplaintText] = useState('');

  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [customerActionsModal, setCustomerActionsModal] = useState(false);
  const [customerDetailModal, setCustomerDetailModal] = useState<Customer | null>(null);
  const [customerPastVisitsModal, setCustomerPastVisitsModal] = useState<Customer | null>(null);
  const [customerVehiclesModal, setCustomerVehiclesModal] = useState<Customer | null>(null);
  const [deleteCustomerConfirm, setDeleteCustomerConfirm] = useState<Customer | null>(null);
  const [customerToast, setCustomerToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const { can } = useRBAC();
  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (repair.vehicle_image) imgs.push(repair.vehicle_image);
    if (repair.images?.length) {
      repair.images.forEach((url) => {
        if (!imgs.includes(url)) imgs.push(url);
      });
    }
    return imgs;
  }, [repair.vehicle_image, repair.images]);
  const flatListRef = useRef<FlatList>(null);

  const handleBillClose = useCallback(() => {
    setBillModalVisible(false);
  }, []);

  const handleBillSuccess = useCallback(() => {
    setBillModalVisible(false);
    onUpdateRepair?.(repair);
  }, [onUpdateRepair, repair]);

  const handleAddComplaint = async () => {
    const complaintDesc = newComplaintText.trim();
    if (!complaintDesc) return;

    const current = toJobList(localComplaints, repair.service_type || 'Repair');
    const finalBlocks = [{ type: current.type, tasks: [...current.tasks, { text: complaintDesc, fixed: false, failed: false }] }];

    setLocalComplaints(finalBlocks);
    setShowAddModal(false);
    setNewComplaintText('');

    try {
      const fd = new FormData();
      fd.append('vehicle_number', String(repair.vehicle_number || ''));
      fd.append('vehicle_type', String(repair.vehicle_type || 'Car'));
      fd.append('brand', String(repair.brand || ''));
      fd.append('model_name', String(repair.model_name || ''));
      fd.append('owner_name', String(repair.owner_name || ''));
      fd.append('phone_number', String(repair.phone_number || ''));
      if (repair.whatsapp_number) fd.append('whatsapp_number', String(repair.whatsapp_number));
      fd.append('km_reading', String(repair.km_reading || ''));
      fd.append('priority', String(repair.priority || 'Medium'));
      fd.append('status', String(repair.status || 'Pending'));
      fd.append('service_type', String(repair.service_type || 'Repair'));
      fd.append('complaints', JSON.stringify(finalBlocks));
      if (repair.repair_date) fd.append('repair_date', String(repair.repair_date));
      if (repair.attending_worker_id) fd.append('attending_worker_id', String(repair.attending_worker_id));
      if (repair.expected_completion) fd.append('expected_completion', String(repair.expected_completion));

      const res = await repairService.update(repair.id, fd);
      if (res.success && res.data && onUpdateRepair) {
        onUpdateRepair(res.data);
      }
    } catch (e) {
      console.error('Failed to sync added complaint:', e);
    }
  };

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [activeReasonTask, setActiveReasonTask] = useState<{ bi: number; ti: number } | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const handleToggleFailed = (bi: number, ti: number) => {
    const task = localComplaints[bi].tasks[ti];
    if (task.failed) {
      saveTaskStatusChange(bi, ti, { failed: false, fixed: false, reason: '' });
    } else {
      setActiveReasonTask({ bi, ti });
      setReasonText(task.reason || '');
      setShowReasonModal(true);
    }
  };

  const handleReasonSubmit = () => {
    if (!activeReasonTask || !reasonText.trim()) return;
    const { bi, ti } = activeReasonTask;
    saveTaskStatusChange(bi, ti, { failed: true, fixed: false, reason: reasonText.trim() });
    setShowReasonModal(false);
    setActiveReasonTask(null);
    setReasonText('');
  };

  const saveTaskStatusChange = async (
    blockIndex: number, 
    taskIndex: number, 
    updates: { fixed?: boolean; failed?: boolean; reason?: string }
  ) => {
    const taskKey = `${blockIndex}-${taskIndex}`;
    const updatedBlocks = localComplaints.map((block, bi) => {
      if (bi !== blockIndex) return block;
      return {
        ...block,
        tasks: block.tasks.map((task: any, ti: number) => {
          if (ti !== taskIndex) return task;
          return {
            ...task,
            ...updates,
          };
        }),
      };
    });

    setLocalComplaints(updatedBlocks);
    setUpdatingTask(taskKey);

    try {
      const fd = new FormData();
      fd.append('vehicle_number', String(repair.vehicle_number || ''));
      fd.append('vehicle_type', String(repair.vehicle_type || 'Car'));
      fd.append('brand', String(repair.brand || ''));
      fd.append('model_name', String(repair.model_name || ''));
      fd.append('owner_name', String(repair.owner_name || ''));
      fd.append('phone_number', String(repair.phone_number || ''));
      if (repair.whatsapp_number) fd.append('whatsapp_number', String(repair.whatsapp_number));
      fd.append('km_reading', String(repair.km_reading || ''));
      fd.append('priority', String(repair.priority || 'Medium'));
      fd.append('status', String(repair.status || 'Pending'));
      fd.append('service_type', String(repair.service_type || 'Repair'));
      fd.append('complaints', JSON.stringify(updatedBlocks));
      if (repair.repair_date) fd.append('repair_date', String(repair.repair_date));
      if (repair.attending_worker_id) fd.append('attending_worker_id', String(repair.attending_worker_id));
      if (repair.expected_completion) fd.append('expected_completion', String(repair.expected_completion));

      const res = await repairService.update(repair.id, fd);
      if (res.success) {
        if (res.data && onUpdateRepair) {
          onUpdateRepair(res.data);
        }
      } else {
        setLocalComplaints(localComplaints);
      }
    } catch {
      setLocalComplaints(localComplaints);
    } finally {
      setUpdatingTask(null);
    }
  };

  const vehicleImg = repair.vehicle_image || (repair.images && repair.images[0]);
  const vehicleIcon = VEHICLE_ICONS[repair.vehicle_type || 'Car'] || 'car-outline';

  const nextStatus = repair.status === 'Pending' ? 'Started' : repair.status === 'Started' ? 'Completed' : null;
  const primaryActionLabel = !repair.bill_id && repair.status === 'Completed'
    ? 'Create invoice'
    : nextStatus === 'Started'
      ? 'Start repair'
      : nextStatus === 'Completed'
        ? 'Mark completed'
        : 'Manage invoice';

  const handlePrimaryAction = async () => {
    if (!repair.bill_id && repair.status === 'Completed') {
      setBillModalVisible(true);
      return;
    }
    if (!nextStatus) {
      setBillModalVisible(true);
      return;
    }
    setAdvancing(true);
    try {
      const fd = new FormData();
      fd.append('vehicle_number', String(repair.vehicle_number || ''));
      fd.append('vehicle_type', String(repair.vehicle_type || 'Car'));
      fd.append('brand', String(repair.brand || ''));
      fd.append('model_name', String(repair.model_name || ''));
      fd.append('owner_name', String(repair.owner_name || ''));
      fd.append('phone_number', String(repair.phone_number || ''));
      if (repair.whatsapp_number) fd.append('whatsapp_number', String(repair.whatsapp_number));
      fd.append('km_reading', String(repair.km_reading || ''));
      fd.append('priority', String(repair.priority || 'Medium'));
      fd.append('status', nextStatus);
      fd.append('service_type', String(repair.service_type || 'Repair'));
      fd.append('complaints', JSON.stringify(localComplaints));
      if (repair.repair_date) fd.append('repair_date', String(repair.repair_date));
      if (repair.attending_worker_id) fd.append('attending_worker_id', String(repair.attending_worker_id));
      if (repair.expected_completion) fd.append('expected_completion', String(repair.expected_completion));
      const res = await repairService.update(repair.id, fd);
      if (res.success && res.data && onUpdateRepair) onUpdateRepair(res.data);
    } catch (e) {
      console.error('Failed to advance repair status:', e);
    } finally {
      setAdvancing(false);
    }
  };

  const assignedWorker = (() => {
    if (repair.attending_worker_id) {
      const w = workers.find((item) => String(item.id) === String(repair.attending_worker_id));
      if (w) return w;
    }
    return repair.attending_worker_name ? { id: 0, name: repair.attending_worker_name, role: 'Technician' } : null;
  })();

  const checklistItems = useMemo(() => {
    const items: { id: string; title: string; detail?: string; checked: boolean; failed?: boolean; busy?: boolean }[] = [];
    localComplaints.forEach((block: any, bi: number) => {
      (block.tasks || []).filter((t: any) => t.text?.trim()).forEach((task: any, ti: number) => {
        const key = `${bi}-${ti}`;
        items.push({
          id: key,
          title: block.type && block.tasks.length > 1 ? `${task.text}` : task.text,
          detail: task.failed && task.reason ? `Not completed — ${task.reason}` : undefined,
          checked: !!task.fixed,
          failed: !!task.failed,
          busy: updatingTask === key,
        });
      });
    });
    return items;
  }, [localComplaints, updatingTask]);

  const handleChecklistToggle = (id: string) => {
    const [bi, ti] = id.split('-').map(Number);
    const task = localComplaints[bi]?.tasks?.[ti];
    if (!task || updatingTask !== null) return;
    if (task.failed) {
      handleToggleFailed(bi, ti);
      return;
    }
    saveTaskStatusChange(bi, ti, { fixed: !task.fixed, failed: false, reason: '' });
  };

  const showCustomerToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setCustomerToast({ visible: true, message, type });
  }, []);

  const handleCustomerPress = useCallback(async () => {
    let found: Customer = {
      id: 0,
      shop_id: repair.shop_id,
      name: repair.owner_name || 'Unknown',
      phone: repair.phone_number || '',
    };
    try {
      if (repair.vehicle_id) {
        const vRes = await vehicleService.getById(repair.vehicle_id);
        if (vRes.success && vRes.data?.customer_id) {
          const cRes = await customerService.getById(vRes.data.customer_id);
          if (cRes.success && cRes.data) found = cRes.data;
        }
      }
      if (!found.id && repair.phone_number) {
        const allRes = await customerService.getAll();
        if (allRes.success) {
          const match = allRes.data.find((c) => c.phone === repair.phone_number);
          if (match) found = match;
        }
      }
    } catch {}
    setSelectedCustomer(found);
    setCustomerActionsModal(true);
  }, [repair.shop_id, repair.owner_name, repair.phone_number, repair.vehicle_id]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCustomerViewDetails = useCallback((c: Customer) => {
    setCustomerActionsModal(false);
    setTimeout(() => setCustomerDetailModal(c), 300);
  }, []);

  const handleCustomerPastVisits = useCallback((c: Customer) => {
    setCustomerActionsModal(false);
    setTimeout(() => setCustomerPastVisitsModal(c), 300);
  }, []);

  const handleCustomerVehicles = useCallback((c: Customer) => {
    setCustomerActionsModal(false);
    setTimeout(() => setCustomerVehiclesModal(c), 300);
  }, []);

  const handleCustomerEdit = useCallback((c: Customer) => {
    setCustomerActionsModal(false);
    showCustomerToast('Edit from job card', 'info');
  }, [showCustomerToast]);

  const handleCustomerDelete = useCallback((c: Customer) => {
    setCustomerActionsModal(false);
    if (!can('delete:customers')) {
      showCustomerToast('Access Denied', 'error');
      return;
    }
    setDeleteCustomerConfirm(c);
  }, [can, showCustomerToast]);

  const handleConfirmDeleteCustomer = useCallback(async () => {
    if (!deleteCustomerConfirm) return;
    const c = deleteCustomerConfirm;
    setDeleteCustomerConfirm(null);
    const res = await customerService.delete(c.id);
    if (res.success) {
      showCustomerToast('Customer deleted successfully');
    } else {
      showCustomerToast(res.error || 'Failed to delete customer', 'error');
    }
  }, [deleteCustomerConfirm, showCustomerToast]);

  return (
    <ThemedView style={styles.container}>
      <WorkshopBackdrop />
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Repair overview</ThemedText>
        <View>
          <Pressable style={styles.headerBack} onPress={() => setShowOverflow((v) => !v)} accessibilityLabel="More options">
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
          </Pressable>
          {showOverflow && (
            <View style={styles.overflowMenu}>
              <Pressable
                style={({ pressed }) => [styles.overflowItem, pressed && { opacity: 0.6 }]}
                onPress={() => { setShowOverflow(false); onEdit(); }}
              >
                <Ionicons name="create-outline" size={15} color={theme.text} />
                <ThemedText style={styles.overflowText}>Edit details</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.overflowItem, pressed && { opacity: 0.6 }]}
                onPress={() => { setShowOverflow(false); handleCustomerPress(); }}
              >
                <Ionicons name="person-outline" size={15} color={theme.text} />
                <ThemedText style={styles.overflowText}>View customer</ThemedText>
              </Pressable>
              {Boolean(repair.phone_number?.trim()) && (
                <Pressable
                  style={({ pressed }) => [styles.overflowItem, pressed && { opacity: 0.6 }]}
                  onPress={() => { setShowOverflow(false); handleCall(); }}
                >
                  <Ionicons name="call-outline" size={15} color={theme.text} />
                  <ThemedText style={styles.overflowText}>Call customer</ThemedText>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vehicle hero */}
        <Pressable
          onPress={() => {
            if (allImages.length > 0) {
              setImageViewerIndex(0);
              setImageViewerVisible(true);
            }
          }}
        >
          <VehicleImage uri={vehicleImg} icon={vehicleIcon} />
        </Pressable>
        <View style={styles.vehicleInfoBlock}>
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText style={styles.vehicleModel} numberOfLines={1}>{[repair.brand, repair.model_name].filter(Boolean).join(' ') || repair.vehicle_type || 'Vehicle'}</ThemedText>
            <ThemedText style={styles.plateNumber}>{repair.vehicle_number}</ThemedText>
          </View>
          <StatusBadge status={repair.status} size="md" dot />
        </View>
        {/* Service information */}
        <View style={styles.infoPair}>
          <ServiceInfoCard icon="construct-outline" label="Service" value={repair.service_type || 'Repair'} />
          <ServiceInfoCard
            icon="calendar-outline"
            label="Due"
            value={formatUTCToLocal(repair.expected_completion) || 'Not set'}
          />
        </View>

        {/* Service checklist — charcoal, interactive, persisted via API */}
        <ServiceChecklist items={checklistItems} onToggle={handleChecklistToggle} />
        <Pressable
          style={styles.addComplaintBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
          <ThemedText style={styles.addComplaintBtnText}>Add Additional Complaint</ThemedText>
        </Pressable>

        {can('edit:repair') && can('view:inventory') && (
          <PrimaryButton title="Parts & inventory" icon="cube-outline" variant="outline" onPress={() => setBillModalVisible(true)} />
        )}

        {/* Assigned technician */}
        <TechnicianCard
          name={assignedWorker?.name || 'Unassigned'}
          role={assignedWorker ? (assignedWorker.role || 'Technician') : 'No technician assigned yet'}
        />

        {/* Customer Contact */}
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Customer</ThemedText>
          <View style={styles.customerRow}>
            <Pressable style={styles.customerLeft} onPress={handleCustomerPress}>
              <Ionicons name="person-outline" size={16} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.customerName}>{repair.owner_name || 'Walk-in Customer'}</ThemedText>
                <ThemedText style={styles.customerPhone}>{repair.phone_number || 'No phone'}</ThemedText>
              </View>
            </Pressable>
            <View style={styles.customerActions}>
              {Boolean(repair.phone_number?.trim()) && (
                <Pressable style={styles.circleBtn} onPress={handleCall}>
                  <Ionicons name="call" size={15} color={theme.primary} />
                </Pressable>
              )}
              {Boolean(repair.phone_number?.trim() || repair.whatsapp_number?.trim()) && (
                <Pressable style={[styles.circleBtn, { backgroundColor: '#25D366' + '15' }]} onPress={handleWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Details</ThemedText>
          <DetailRow styles={styles} theme={theme} label="Registered" value={formatUTCToLocal(repair.repair_date)} icon="calendar-outline" />
          <DetailRow styles={styles} theme={theme} label="KM" value={repair.km_reading ? `${repair.km_reading} KM` : 'Not recorded'} icon="speedometer-outline" />
        </View>

          {/* Additional Photos Card */}
          {repair.images && repair.images.length > 1 && (
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Photos</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
                {repair.images.map((url, index) => (
                  <Pressable key={index} onPress={() => {
                    const idx = allImages.indexOf(url);
                    setImageViewerIndex(idx >= 0 ? idx : index);
                    setImageViewerVisible(true);
                  }}>
                    <Image source={{ uri: url }} style={styles.photoThumb} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bill Overview Card */}
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Billing</ThemedText>
            <View style={styles.billRow}>
              <View style={styles.billStatusLeft}>
                <ThemedText style={styles.billLabel}>
                  {repair.bill_id ? 'Payment Status' : 'Invoice'}
                </ThemedText>
                <ThemedText style={styles.billValue}>
                  {repair.bill_id
                    ? (repair.payment_status === 'Paid' ? 'Payment received' : 'Pending payment')
                    : 'No invoice yet'}
                </ThemedText>
              </View>
              {Boolean(repair.bill_id) && (
                <View style={[styles.statusBadgeSmall, {
                  backgroundColor: repair.payment_status === 'Paid' ? '#DCFCE7' : '#FEF9C3'
                }]}>
                  <ThemedText style={[styles.statusBadgeTextSmall, {
                    color: repair.payment_status === 'Paid' ? '#16A34A' : '#CA8A04'
                  }]}>
                    {repair.payment_status === 'Paid' ? 'Paid' : 'Unpaid'}
                  </ThemedText>
                </View>
              )}
            </View>
            <Pressable style={styles.viewBillBtn} onPress={() => setBillModalVisible(true)}>
              <ThemedText style={styles.viewBillText}>
                {repair.bill_id ? 'Manage Invoice & Billing' : 'Create Invoice'}
              </ThemedText>
              <Ionicons name="arrow-forward" size={14} color={theme.primary} />
            </Pressable>
          </View>
      </ScrollView>

      {/* Bottom action area — safe-area aware */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerTextWrap}>
          <ThemedText style={styles.footerLabel}>
            {repair.bill_id ? 'Payment status' : 'Invoice'}
          </ThemedText>
          <ThemedText style={styles.footerValue} numberOfLines={1}>
            {repair.bill_id
              ? repair.payment_status === 'Paid'
                ? 'Payment received'
                : 'Pending payment'
              : 'No invoice yet'}
          </ThemedText>
        </View>
        <View style={styles.footerBtn}>
          <PrimaryButton
            title={advancing ? 'Updating…' : primaryActionLabel}
            onPress={advancing ? undefined : handlePrimaryAction}
            icon="arrow-forward"
          />
        </View>
      </View>

      {/* Add Additional Complaint Modal Sheet */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Add Job Item</ThemedText>

            {/* Job Details */}
            <ThemedText style={styles.modalLabel}>Job Details</ThemedText>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              multiline
              numberOfLines={3}
              placeholder="Describe the complaint or task..."
              placeholderTextColor={theme.textSecondary}
              value={newComplaintText}
              onChangeText={setNewComplaintText}
            />

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewComplaintText('');
                }}
              >
                <ThemedText style={styles.modalCancelBtnText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalAddBtn]}
                onPress={handleAddComplaint}
              >
                <ThemedText style={styles.modalAddBtnText}>Add to Job</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reason for not completing modal */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReasonModal(false);
          setActiveReasonTask(null);
          setReasonText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Reason for Not Completing</ThemedText>
            
            <ThemedText style={styles.modalLabel}>Explain why this complaint was not completed:</ThemedText>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              multiline
              numberOfLines={3}
              placeholder="e.g. Parts out of stock, customer requested to defer, special tool needed..."
              placeholderTextColor={theme.textSecondary}
              value={reasonText}
              onChangeText={setReasonText}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setShowReasonModal(false);
                  setActiveReasonTask(null);
                  setReasonText('');
                }}
              >
                <ThemedText style={styles.modalCancelBtnText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalAddBtn, { backgroundColor: theme.destructive }]}
                onPress={handleReasonSubmit}
              >
                <ThemedText style={styles.modalAddBtnText}>Submit Reason</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Lightbox */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.lightboxOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <Pressable
            style={styles.lightboxClose}
            hitSlop={16}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          {allImages.length > 1 && (
            <View style={styles.lightboxCounter}>
              <ThemedText style={styles.lightboxCounterText}>
                {imageViewerIndex + 1} / {allImages.length}
              </ThemedText>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            initialScrollIndex={imageViewerIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setImageViewerIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.lightboxPage}>
                <Image
                  source={{ uri: item }}
                  style={styles.lightboxImage}
                  contentFit="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Billing Screen Modal */}
      <Modal visible={billModalVisible} animationType="slide" onRequestClose={handleBillClose}>
        {billModalVisible && <GenerateBillScreen
          repair={repair}
          onClose={handleBillClose}
          onSuccess={handleBillSuccess}
        />}
      </Modal>

      {/* Customer modals */}
      <CustomerActionsModal
        visible={customerActionsModal}
        customer={selectedCustomer}
        onClose={() => setCustomerActionsModal(false)}
        onViewDetails={handleCustomerViewDetails}
        onPastVisits={handleCustomerPastVisits}
        onVehicles={handleCustomerVehicles}
        onEdit={handleCustomerEdit}
        onDelete={handleCustomerDelete}
        canEdit={can('edit:customers')}
        canDelete={can('delete:customers')}
      />

      <Modal visible={!!customerDetailModal} animationType="slide" onRequestClose={() => setCustomerDetailModal(null)}>
        {customerDetailModal && (
          <CustomerDetailScreen
            customer={customerDetailModal}
            onClose={() => setCustomerDetailModal(null)}
            onEdit={(c) => { setCustomerDetailModal(null); showCustomerToast('Edit from job card', 'info'); }}
            onDelete={(c) => { setCustomerDetailModal(null); setDeleteCustomerConfirm(c); }}
          />
        )}
      </Modal>

      <Modal visible={!!customerPastVisitsModal} animationType="slide" onRequestClose={() => setCustomerPastVisitsModal(null)}>
        {customerPastVisitsModal && (
          <PastVisitsScreen
            customer={customerPastVisitsModal}
            onClose={() => setCustomerPastVisitsModal(null)}
          />
        )}
      </Modal>

      <Modal visible={!!customerVehiclesModal} animationType="slide" onRequestClose={() => setCustomerVehiclesModal(null)}>
        {customerVehiclesModal && (
          <CustomerVehiclesScreen
            customer={customerVehiclesModal}
            onClose={() => setCustomerVehiclesModal(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={!!deleteCustomerConfirm}
        title="Delete Customer"
        message={deleteCustomerConfirm ? `Delete customer "${deleteCustomerConfirm.name}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => setDeleteCustomerConfirm(null)}
        type="destructive"
      />

      <Toast visible={customerToast.visible} message={customerToast.message} type={customerToast.type} onHide={() => setCustomerToast((p) => ({ ...p, visible: false }))} />
    </ThemedView>
  );
}



const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
    gap: 10,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomColor: theme.border,
    zIndex: 10,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: theme.text,
    letterSpacing: -0.2,
  },
  overflowMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 200,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  overflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  overflowText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },

  // ── Vehicle hero ──
  vehicleInfoBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: theme.card, borderRadius: 20 },

  // ── Vehicle hero (styles kept flat; hero image comes from VehicleImage) ──
  vehicleCard: {
    backgroundColor: 'transparent',
  },
  vehicleImageWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.backgroundSelected,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.backgroundSelected,
    alignSelf: 'flex-start',
  },
  plateBadge: {
    backgroundColor: theme.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  plateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.panelText,
    letterSpacing: 0.5,
  },
  plateNumber: { fontSize: 13, fontWeight: '400', color: theme.textSecondary },
  vehicleModel: {
    fontSize: 24,
    fontWeight: '400',
    color: theme.text,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  priBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityLow: { backgroundColor: theme.successTint },
  priorityMedium: { backgroundColor: theme.backgroundSelected },
  priorityHigh: { backgroundColor: '#F6E3C8' },
  priorityUrgent: { backgroundColor: '#F6D9D4' },
  priorityTextLow: { color: theme.success },
  priorityTextMedium: { color: theme.warning },
  priorityTextHigh: { color: '#B35A1B' },
  priorityTextUrgent: { color: theme.error },

  // ── Cards ──
  card: {
    backgroundColor: theme.card,
    borderRadius: UI.card.borderRadius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 12 },
  infoPair: {
    flexDirection: 'row',
    gap: 12,
  },

  // ── Bottom action area ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  footerTextWrap: { flex: 1, gap: 1 },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  footerBtn: { flex: 1.4 },

  // ── Customer ──
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  customerPhone: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Details ──
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider },
  detailLabel: { fontSize: 12, fontWeight: '400', color: theme.textSecondary },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 1,
  },
  serviceBlock: {
    gap: 6,
  },
  serviceDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    paddingTop: 12,
    marginTop: 6,
  },
  serviceBlockType: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
    marginRight: 12,
  },
  interactiveTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: UI.card.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.divider,
  },
  actionBtnCompleted: {
    backgroundColor: theme.primary,
  },
  actionBtnFailed: {
    backgroundColor: theme.destructive,
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
    fontSize: 12,
    color: theme.destructive,
    fontStyle: 'italic',
    marginTop: 2,
  },
  noTasks: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  photosScroll: {
    gap: 8,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: theme.divider,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    paddingBottom: 12,
  },
  billStatusLeft: {
    gap: 2,
    flex: 1,
  },
  billLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  viewBillText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  addComplaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.accent,
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: theme.backgroundSelected,
    marginTop: 4,
  },
  addComplaintBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 23, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.card,
    width: '90%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.divider,
    backgroundColor: theme.background,
  },
  categoryChipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  categoryChipTextSelected: {
    color: theme.primaryForeground,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.background,
    width: '100%',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: theme.divider,
  },
  modalCancelBtnText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalAddBtn: {
    backgroundColor: theme.primary,
  },
  modalAddBtnText: {
    color: theme.primaryForeground,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Image Lightbox ──
  lightboxOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCounter: {
    position: 'absolute',
    top: 64,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  lightboxCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lightboxPage: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
}), [theme]);
  return styles;
};

function DetailRow({ label, value, icon, styles, theme: t }: { label: string; value: string; icon: any; styles: any; theme: any }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={t.textSecondary} />
      <View style={{ flex: 1, gap: 1 }}>
        <ThemedText style={styles.detailLabel}>{label}</ThemedText>
        <ThemedText style={styles.detailValue}>{value}</ThemedText>
      </View>
    </View>
  );
}
