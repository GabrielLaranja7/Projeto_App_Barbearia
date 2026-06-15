import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';
import {
  getAppointmentsByDate, deleteAppointment,
  getAvailableSlots, saveAvailableSlots, confirmAppointment,
} from '../../services/firebase';

const today = () => new Date().toISOString().split('T')[0];

const ALL_TIMES = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00',
];

export default function AdminAgendamentosScreen({ navigation }: any) {
  const [tab, setTab] = useState<'agendados' | 'horarios'>('agendados');
  const [selectedDate, setSelectedDate] = useState(today());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateInput, setDateInput] = useState(selectedDate);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' as any, onConfirm: () => {} });

  const loadAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAppointmentsByDate(selectedDate);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailableSlots(selectedDate);
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    const init = async () => {
      await loadAgendamentos(); // Sempre carrega agendamentos para saber o que está booked
      if (tab === 'horarios') {
        await loadSlots();
      }
    };
    init();
  }, [tab, selectedDate, loadAgendamentos, loadSlots]);

  const handleConfirmAppointment = (id: string, userName: string) => {
    setAlertConfig({
      visible: true,
      title: 'Confirmar Agendamento',
      message: `Deseja confirmar o agendamento de ${userName}?`,
      type: 'confirm',
      onConfirm: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        setLoading(true);
        await confirmAppointment(id);
        await loadAgendamentos();
        setLoading(false);
      }
    });
  };

  const handleRemoveAppointment = (id: string, userName: string) => {
    setAlertConfig({
      visible: true,
      title: 'Remover Agendamento',
      message: `Deseja remover o agendamento de ${userName}?`,
      type: 'confirm',
      onConfirm: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        await deleteAppointment(id);
        loadAgendamentos();
      }
    });
  };

  const toggleSlot = (time: string) => {
    setSlots(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort()
    );
  };

  const handleSaveSlots = async () => {
    setLoading(true);
    try {
      await saveAvailableSlots(selectedDate, slots);
      setAlertConfig({ visible: true, title: 'Sucesso', message: 'Horários atualizados! Os clientes já podem ver.', type: 'success' });
    } catch {
      setAlertConfig({ visible: true, title: 'Erro', message: 'Não foi possível salvar os horários.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDate = (date: string) => {
    setSelectedDate(date);
    setDateInput(date);
    setShowDateModal(false);
  };

  const formatDateDisplay = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>Gerencie horários e agendamentos</Text>
        </View>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDateModal(true)}>
          <Ionicons name="calendar-outline" size={16} color={Colors.gold.default} />
          <Text style={styles.dateBtnText}>{formatDateDisplay(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'agendados' && styles.tabActive]}
          onPress={() => setTab('agendados')}
        >
          <Text style={[styles.tabText, tab === 'agendados' && styles.tabTextActive]}>
            Agendados ({appointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'horarios' && styles.tabActive]}
          onPress={() => setTab('horarios')}
        >
          <Text style={[styles.tabText, tab === 'horarios' && styles.tabTextActive]}>
            Abrir Horários
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.gold.default} style={{ marginTop: 40 }} />
      ) : tab === 'agendados' ? (
        <FlatList
          data={appointments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyText}>Nenhum agendamento para este dia</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <View style={styles.timeTag}>
                <Text style={styles.timeTagText}>{item.horario}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentName}>{item.userName}</Text>
                <Text style={styles.appointmentService}>{item.servicoNome}</Text>
                <View style={styles.row}>
                  <Text style={styles.appointmentValue}>R$ {item.valor}</Text>
                  <View style={[styles.statusBadge, item.status === 'confirmado' && styles.statusConfirmado]}>
                    <Text style={[styles.statusText, item.status === 'confirmado' && styles.statusTextConfirmado]}>{item.status ?? 'pendente'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.actions}>
                {item.status !== 'confirmado' && (
                  <TouchableOpacity
                    onPress={() => handleConfirmAppointment(item.id, item.userName)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="checkmark-circle" size={26} color="#4caf50" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleRemoveAppointment(item.id, item.userName)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="close-circle" size={26} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.slotsHint}>
            Selecione os horários que estarão disponíveis em{' '}
            <Text style={{ color: Colors.gold.default }}>{formatDateDisplay(selectedDate)}</Text>.
            Clientes verão apenas os horários que você ativar.
          </Text>

          <View style={styles.timeGrid}>
            {ALL_TIMES.map(time => {
              const active = slots.includes(time);
              const booked = appointments.some(a => a.horario === time);
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeChip,
                    active && styles.timeChipActive,
                    booked && styles.timeChipBooked,
                  ]}
                  onPress={() => !booked && toggleSlot(time)}
                  disabled={booked}
                >
                  <Text style={[
                    styles.timeChipText,
                    active && styles.timeChipTextActive,
                    booked && styles.timeChipTextBooked,
                  ]}>{time}</Text>
                  {booked && (
                    <Text style={styles.bookedLabel}>Ocupado</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSlots}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.bg.primary} />
            <Text style={styles.saveBtnText}>Salvar Horários</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal de seleção de data */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.dateModal}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Selecionar Data</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <Calendar
              theme={{
                backgroundColor: Colors.bg.secondary,
                calendarBackground: Colors.bg.secondary,
                textSectionTitleColor: Colors.text.muted,
                selectedDayBackgroundColor: Colors.gold.default,
                selectedDayTextColor: Colors.bg.primary,
                todayTextColor: Colors.gold.default,
                dayTextColor: Colors.text.primary,
                textDisabledColor: Colors.text.disabled,
                monthTextColor: Colors.text.primary,
                arrowColor: Colors.gold.default,
              }}
              onDayPress={(day: any) => handleSetDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, disableTouchEvent: true }
              }}
              enableSwipeMonths={true}
            />
          </View>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        onConfirm={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, paddingTop: 16 },
  backBtn: { padding: 4 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.muted },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bg.secondary, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.gold.muted,
  },
  dateBtnText: { color: Colors.gold.default, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, backgroundColor: Colors.bg.secondary, borderRadius: Radius.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.gold.default },
  tabText: { color: Colors.text.muted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.bg.primary, fontWeight: FontWeight.bold },
  list: { padding: Spacing.xl, paddingBottom: 40 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: Colors.text.disabled, fontSize: FontSize.base },
  appointmentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.secondary, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border.subtle, gap: 12,
  },
  timeTag: {
    backgroundColor: Colors.gold.muted, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.sm, minWidth: 54, alignItems: 'center',
  },
  timeTagText: { color: Colors.gold.default, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  appointmentInfo: { flex: 1 },
  appointmentName: { color: Colors.text.primary, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  appointmentService: { color: Colors.text.secondary, fontSize: FontSize.sm, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  appointmentValue: { color: Colors.gold.default, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusBadge: {
    backgroundColor: Colors.bg.tertiary, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusConfirmado: { backgroundColor: '#4caf5033' },
  statusText: { color: Colors.text.disabled, fontSize: FontSize.xs },
  statusTextConfirmado: { color: '#4caf50', fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 4 },
  slotsHint: { color: Colors.text.muted, fontSize: FontSize.sm, marginBottom: Spacing.xl, lineHeight: 20 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xl },
  timeChip: {
    width: '29%', paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center',
    backgroundColor: Colors.bg.secondary, borderWidth: 1, borderColor: Colors.border.default,
  },
  timeChipActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.default },
  timeChipBooked: { backgroundColor: '#e24b4a22', borderColor: '#e24b4a55', opacity: 0.7 },
  timeChipText: { color: Colors.text.secondary, fontWeight: FontWeight.medium, fontSize: FontSize.sm },
  timeChipTextActive: { color: Colors.gold.default, fontWeight: FontWeight.bold },
  timeChipTextBooked: { color: Colors.error },
  bookedLabel: { color: Colors.error, fontSize: 9, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.gold.default, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 16, borderRadius: Radius.md,
  },
  saveBtnText: { color: Colors.bg.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.xl },
  dateModal: { backgroundColor: Colors.bg.secondary, borderRadius: Radius.xl, padding: Spacing.lg, width: '100%' },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingHorizontal: 4 },
  dateModalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
});
