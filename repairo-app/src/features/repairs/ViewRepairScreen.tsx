import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import StatusBadge from '@/components/StatusBadge';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';
import { formatUTCToLocal } from '@/utils/date';
import type { Worker } from '@/features/repairs/services/worker.service';
import { workerService } from '@/features/repairs/services/worker.service';

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.heroSection}>
          {vehicleImg ? (
            <Image source={{ uri: vehicleImg }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={styles.placeholderHero}>
              <Ionicons name={vehicleIcon} size={84} color="#3D7A78" style={styles.placeholderIcon} />
            </View>
          )}

          {/* Floating Actions on Hero */}
          <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
            <Pressable style={styles.headerBtn} onPress={onClose}>
              <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
            </Pressable>
            <Pressable style={[styles.headerBtn, styles.editBtn]} onPress={onEdit}>
              <Ionicons name="create-outline" size={22} color="#3D7A78" />
            </Pressable>
          </View>
        </View>

        {/* Info Content Wrapper */}
        <View style={styles.infoWrapper}>
          {/* Main Title Block */}
          <View style={styles.titleBlock}>
            <ThemedText style={styles.vehicleNo}>{repair.vehicle_number}</ThemedText>
            <ThemedText style={styles.modelText}>
              {repair.brand || repair.model_name ? `${repair.brand || ''} ${repair.model_name || ''}`.trim() : 'Unspecified Model'}
            </ThemedText>

            <View style={styles.badgeRow}>
              <StatusBadge status={repair.status} size="md" dot />
              {repair.priority && (() => {
                const pri = getPriorityStyle(repair.priority);
                return (
                  <View style={[styles.priorityBadge, pri.bg]}>
                    <ThemedText style={[styles.priorityText, pri.text]}>
                      {repair.priority} Priority
                    </ThemedText>
                  </View>
                );
              })()}
              <View style={styles.typeBadge}>
                <ThemedText style={styles.typeText}>{repair.vehicle_type || 'Car'}</ThemedText>
              </View>
            </View>
          </View>

          {/* Customer Card */}
          <Card title="Customer Contact">
            <View style={styles.customerRow}>
              <View style={styles.customerInfo}>
                <ThemedText style={styles.customerName}>{repair.owner_name || 'Walk-in Customer'}</ThemedText>
                <ThemedText style={styles.customerPhone}>{repair.phone_number || 'No phone number'}</ThemedText>
              </View>
              <View style={styles.actionButtons}>
                {repair.phone_number && (
                  <Pressable style={styles.actionCircle} onPress={handleCall}>
                    <Ionicons name="call" size={18} color="#3D7A78" />
                  </Pressable>
                )}
                {(repair.phone_number || repair.whatsapp_number) && (
                  <Pressable style={[styles.actionCircle, styles.whatsappCircle]} onPress={handleWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  </Pressable>
                )}
              </View>
            </View>
          </Card>

          {/* Job Details Card */}
          <Card title="Job Details">
            <DetailRow
              label="Attending Worker"
              value={(() => {
                if (repair.attending_worker_id) {
                  const w = workers.find((item) => String(item.id) === String(repair.attending_worker_id));
                  if (w) return w.name;
                }
                return repair.attending_worker_name || 'Unassigned';
              })()}
              icon="person-outline"
            />
            <DetailRow label="Repair Registered" value={formatUTCToLocal(repair.repair_date)} icon="calendar-outline" />
            <DetailRow label="Expected Completion" value={formatUTCToLocal(repair.expected_completion) || 'Not specified'} icon="calendar-outline" />
            <DetailRow label="KM Reading" value={repair.km_reading ? `${repair.km_reading} KM` : 'Not recorded'} icon="speedometer-outline" />
          </Card>

          {/* Service/Complaints Items Card */}
          <Card title="Services & Complaints">
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
                            <ActivityIndicator size="small" color="#3D7A78" />
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
                                  color={isCompleted ? "#FFFFFF" : "#3D7A78"} 
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
                                  color={isFailed ? "#FFFFFF" : "#E53E3E"} 
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
              <Ionicons name="add-circle-outline" size={18} color="#3D7A78" />
              <ThemedText style={styles.addComplaintBtnText}>Add Additional Complaint</ThemedText>
            </Pressable>
          </Card>

          {/* Additional Photos Card */}
          {repair.images && repair.images.length > 1 && (
            <Card title="Photos">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
                {repair.images.map((url, index) => (
                  <Pressable key={index}>
                    <Image source={{ uri: url }} style={styles.photoThumb} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            </Card>
          )}

          {/* Bill Overview Card */}
          {repair.bill_id && (
            <Card title="Billing Details">
              <View style={styles.billRow}>
                <ThemedText style={styles.billLabel}>Payment Status</ThemedText>
                <View style={[styles.statusBadgeSmall, { backgroundColor: repair.payment_status === 'Paid' ? '#EBF8FF' : '#FFF5F5' }]}>
                  <ThemedText style={[styles.statusBadgeTextSmall, { color: repair.payment_status === 'Paid' ? '#2B6CB0' : '#C53030' }]}>
                    {repair.payment_status || 'Unpaid'}
                  </ThemedText>
                </View>
              </View>
              <Pressable style={styles.viewBillBtn} onPress={onEdit}>
                <ThemedText style={styles.viewBillText}>Manage Invoice & Billing</ThemedText>
                <Ionicons name="arrow-forward" size={14} color="#3D7A78" />
              </Pressable>
            </Card>
          )}
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
                placeholderTextColor="#8A8A80"
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
              placeholderTextColor="#8A8A80"
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
              placeholderTextColor="#8A8A80"
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
                style={[styles.modalBtn, styles.modalAddBtn, { backgroundColor: '#E53E3E' }]}
                onPress={handleReasonSubmit}
              >
                <ThemedText style={styles.modalAddBtnText}>Submit Reason</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={18} color="#8A8A80" style={styles.detailIcon} />
      <View style={styles.detailTextContainer}>
        <ThemedText style={styles.detailLabel}>{label}</ThemedText>
        <ThemedText style={styles.detailValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4', // Premium cream bg
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    height: 250,
    width: '100%',
    position: 'relative',
    backgroundColor: '#EAE5D9',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHero: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3D7A78' + '0C', // Light teal tint
  },
  placeholderIcon: {
    opacity: 0.6,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editBtn: {
    backgroundColor: '#FFFFFF',
  },
  infoWrapper: {
    paddingHorizontal: 16,
    gap: 14,
    marginTop: -20, // Slide info block slightly over image
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8F7F4',
    paddingTop: 24,
  },
  titleBlock: {
    marginBottom: 6,
  },
  vehicleNo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  modelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A8A80',
    marginTop: 2,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityLow: { backgroundColor: '#F0FFF4' },
  priorityMedium: { backgroundColor: '#FEFCBF' },
  priorityHigh: { backgroundColor: '#FEEBC8' },
  priorityUrgent: { backgroundColor: '#FED7D7' },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityTextLow: { color: '#38A169' },
  priorityTextMedium: { color: '#B7791F' },
  priorityTextHigh: { color: '#DD6B20' },
  priorityTextUrgent: { color: '#E53E3E' },
  typeBadge: {
    backgroundColor: '#F0ECE3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A80',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3D7A78',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cardContent: {
    gap: 12,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  customerPhone: {
    fontSize: 13,
    color: '#8A8A80',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3D7A78' + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappCircle: {
    backgroundColor: '#25D366' + '10',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A80',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
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
    color: '#1A1A1A',
    fontWeight: '500',
    marginRight: 12,
  },
  interactiveTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE3',
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
    backgroundColor: '#F0ECE3',
  },
  actionBtnCompleted: {
    backgroundColor: '#3D7A78',
  },
  actionBtnFailed: {
    backgroundColor: '#E53E3E',
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
    fontSize: 12,
    color: '#E53E3E',
    fontStyle: 'italic',
    marginTop: 2,
  },
  noTasks: {
    fontSize: 13,
    color: '#8A8A80',
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
    backgroundColor: '#F0ECE3',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE3',
    paddingBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
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
    paddingTop: 4,
  },
  viewBillText: {
    color: '#3D7A78',
    fontSize: 13,
    fontWeight: '700',
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
  closeBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3D7A78',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  closeBtnText: {
    color: '#3D7A78',
    fontSize: 15,
    fontWeight: '700',
  },
  addComplaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3D7A78',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#3D7A78' + '0A',
    marginTop: 14,
  },
  addComplaintBtnText: {
    color: '#3D7A78',
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
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A80',
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
    borderColor: '#F0ECE3',
    backgroundColor: '#F8F7F4',
  },
  categoryChipSelected: {
    backgroundColor: '#3D7A78',
    borderColor: '#3D7A78',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A80',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#F0ECE3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#F8F7F4',
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
    backgroundColor: '#F0ECE3',
  },
  modalCancelBtnText: {
    color: '#8A8A80',
    fontSize: 14,
    fontWeight: '700',
  },
  modalAddBtn: {
    backgroundColor: '#3D7A78',
  },
  modalAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
