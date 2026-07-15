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
    if (!repair.complaints) return [];
    try {
      return typeof repair.complaints === 'string'
        ? JSON.parse(repair.complaints)
        : repair.complaints;
    } catch {
      return [];
    }
  });
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Repair');
  const [newComplaintText, setNewComplaintText] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

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
    const categoryName = newCategory.trim() || 'General';
    const complaintDesc = newComplaintText.trim();
    if (!complaintDesc) return;

    let categoryExists = false;
    const updatedBlocks = localComplaints.map((block) => {
      if (block.type.toLowerCase() === categoryName.toLowerCase()) {
        categoryExists = true;
        return {
          ...block,
          tasks: [...(block.tasks || []), { text: complaintDesc, fixed: false, failed: false }]
        };
      }
      return block;
    });

    const finalBlocks = categoryExists 
      ? updatedBlocks 
      : [...updatedBlocks, { type: categoryName, tasks: [{ text: complaintDesc, fixed: false, failed: false }] }];

    setLocalComplaints(finalBlocks);
    setShowAddModal(false);
    setNewComplaintText('');
    setNewCategory('Repair');
    setIsCustomCategory(false);

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
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Job Card</ThemedText>
        <Pressable style={styles.headerEdit} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={theme.primaryForeground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info Card */}
        <View style={styles.vehicleCard}>
          <Pressable
            style={styles.vehicleImageWrap}
            onPress={() => {
              if (allImages.length > 0) {
                setImageViewerIndex(0);
                setImageViewerVisible(true);
              }
            }}
          >
            {vehicleImg ? (
              <Image source={{ uri: vehicleImg }} style={styles.vehicleImage} contentFit="cover" />
            ) : (
              <View style={[styles.vehicleImage, styles.vehicleImagePlaceholder]}>
                <Ionicons name={vehicleIcon} size={32} color={theme.primary} />
              </View>
            )}
          </Pressable>
          <View style={styles.vehicleInfo}>
            <View style={styles.plate}>
              <View style={styles.plateBadge}>
                <ThemedText style={styles.plateBadgeText}>{getCurrentUser()?.shopCountry || 'IND'}</ThemedText>
              </View>
              <ThemedText style={styles.plateNumber} numberOfLines={1}>{repair.vehicle_number}</ThemedText>
            </View>
            <ThemedText style={styles.vehicleModel} numberOfLines={1}>
              {repair.brand || repair.model_name ? `${repair.brand || ''} ${repair.model_name || ''}`.trim() : 'Unspecified Model'}
            </ThemedText>
            <View style={styles.badgeRow}>
              <StatusBadge status={repair.status} size="sm" dot />
              {repair.priority && (() => {
                const pri = getPriorityStyle(repair.priority);
                return (
                  <View style={[styles.priBadge, pri.bg]}>
                    <ThemedText style={[styles.priBadgeText, pri.text]}>{repair.priority}</ThemedText>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>

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
              {repair.phone_number && (
                <Pressable style={styles.circleBtn} onPress={handleCall}>
                  <Ionicons name="call" size={15} color={theme.primary} />
                </Pressable>
              )}
              {(repair.phone_number || repair.whatsapp_number) && (
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
          <DetailRow styles={styles} theme={theme}
            label="Worker"
            value={(() => {
              if (repair.attending_worker_id) {
                const w = workers.find((item) => String(item.id) === String(repair.attending_worker_id));
                if (w) return w.name;
              }
              return repair.attending_worker_name || 'Unassigned';
            })()}
            icon="person-outline"
          />
          <DetailRow styles={styles} theme={theme} label="Registered" value={formatUTCToLocal(repair.repair_date)} icon="calendar-outline" />
          <DetailRow styles={styles} theme={theme} label="Completion" value={formatUTCToLocal(repair.expected_completion) || 'Not set'} icon="calendar-outline" />
          <DetailRow styles={styles} theme={theme} label="KM" value={repair.km_reading ? `${repair.km_reading} KM` : 'Not recorded'} icon="speedometer-outline" />
        </View>

        {/* Services & Complaints */}
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Services & Complaints</ThemedText>
            {localComplaints.length > 0 ? (
              localComplaints.map((block: any, bi: number) => (
                <View key={bi} style={[styles.serviceBlock, bi > 0 && styles.serviceDivider]}>
                  <ThemedText style={styles.serviceBlockType}>{block.type}</ThemedText>
                  {block.tasks && block.tasks.filter((t: any) => t.text?.trim()).map((task: any, ti: number) => {
                    const isCompleted = !!task.fixed;
                    const isFailed = !!task.failed;
                    const taskKey = `${bi}-${ti}`;
                    const isLoading = updatingTask === taskKey;

                    return (
                      <View key={ti} style={styles.interactiveTaskRow}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <ThemedText style={[
                            styles.taskText,
                            isCompleted && styles.taskTextCompleted,
                            isFailed && styles.taskTextFailed
                          ]}>
                            {task.text}
                          </ThemedText>
                          {isFailed && task.reason && (
                            <ThemedText style={styles.taskReasonText}>
                              ↳ Reason: {task.reason}
                            </ThemedText>
                          )}
                        </View>

                        <View style={styles.taskActions}>
                          {isLoading ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                          ) : (
                            <>
                              <Pressable 
                                style={[
                                  styles.actionBtnIcon, 
                                  isCompleted && styles.actionBtnCompleted
                                ]} 
                                onPress={() => saveTaskStatusChange(bi, ti, { fixed: !task.fixed, failed: false, reason: '' })}
                                disabled={updatingTask !== null}
                              >
                                <Ionicons 
                                  name={isCompleted ? "checkmark" : "checkmark-outline"} 
                                  size={16} 
                                  color={isCompleted ? "#FFFFFF" : theme.primary} 
                                />
                              </Pressable>

                              <Pressable 
                                style={[
                                  styles.actionBtnIcon, 
                                  isFailed && styles.actionBtnFailed
                                ]} 
                                onPress={() => handleToggleFailed(bi, ti)}
                                disabled={updatingTask !== null}
                              >
                                <Ionicons 
                                  name={isFailed ? "close" : "close-outline"} 
                                  size={16} 
                                  color={isFailed ? "#FFFFFF" : theme.destructive} 
                                />
                              </Pressable>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  {(!block.tasks || block.tasks.filter((t: any) => t.text?.trim()).length === 0) && (
                    <ThemedText style={styles.noTasks}>No issues listed</ThemedText>
                  )}
                </View>
              ))
            ) : (
              <ThemedText style={styles.noTasks}>No services recorded</ThemedText>
            )}
            <Pressable 
              style={styles.addComplaintBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
              <ThemedText style={styles.addComplaintBtnText}>Add Additional Complaint</ThemedText>
            </Pressable>
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
              {repair.bill_id && (
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

      {/* Add Additional Complaint Modal Sheet */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Add Additional Complaint</ThemedText>
            
            {/* Category selection */}
            <ThemedText style={styles.modalLabel}>Category</ThemedText>
            <View style={styles.categoryPickerRow}>
              {['Repair', 'Servicing', 'Inspection'].map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    newCategory === cat && styles.categoryChipSelected
                  ]}
                  onPress={() => {
                    setNewCategory(cat);
                    setIsCustomCategory(false);
                  }}
                >
                  <ThemedText style={[
                    styles.categoryChipText,
                    newCategory === cat && styles.categoryChipTextSelected
                  ]}>
                    {cat}
                  </ThemedText>
                </Pressable>
              ))}
              <Pressable
                style={[
                  styles.categoryChip,
                  isCustomCategory && styles.categoryChipSelected
                ]}
                onPress={() => {
                  setIsCustomCategory(true);
                  setNewCategory('');
                }}
              >
                <ThemedText style={[
                  styles.categoryChipText,
                  isCustomCategory && styles.categoryChipTextSelected
                ]}>
                  + Other
                </ThemedText>
              </Pressable>
            </View>

            {isCustomCategory && (
              <TextInput
                style={styles.modalInput}
                placeholder="Enter custom category (e.g., Electrical)"
                placeholderTextColor={theme.textSecondary}
                value={newCategory}
                onChangeText={setNewCategory}
              />
            )}

            {/* Complaint Text */}
            <ThemedText style={styles.modalLabel}>Complaint Details</ThemedText>
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
                  setNewCategory('Repair');
                  setIsCustomCategory(false);
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
        <GenerateBillScreen
          repair={repair}
          onClose={handleBillClose}
          onSuccess={handleBillSuccess}
        />
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
    backgroundColor: theme.backgroundElement,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
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

  // ── Vehicle card ──
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    alignItems: 'stretch',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.backgroundSelected,
    marginBottom: 4,
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
    fontSize: 17,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vehicleModel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  priorityLow: { backgroundColor: '#F0FFF4' },
  priorityMedium: { backgroundColor: '#FEFCBF' },
  priorityHigh: { backgroundColor: '#FEEBC8' },
  priorityUrgent: { backgroundColor: '#FED7D7' },
  priorityTextLow: { color: '#38A169' },
  priorityTextMedium: { color: '#B7791F' },
  priorityTextHigh: { color: '#DD6B20' },
  priorityTextUrgent: { color: '#E53E3E' },

  // ── Cards ──
  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
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
    marginBottom: 12,
  },

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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
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
    borderRadius: 14,
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
    borderColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: theme.primary + '0A',
    marginTop: 14,
  },
  addComplaintBtnText: {
    color: theme.primary,
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
