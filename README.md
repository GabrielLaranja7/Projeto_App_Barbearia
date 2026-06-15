import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Modal, ActivityIndicator 
} from 'react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useFirebase } from '../../hooks/useFirebase';
import { useAuthStore } from '../../store/authStore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { checkAndRemoveSlot } from '../../services/firebase';

export default function AgendamentoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const user = useAuthStore(s => s.user);
  const { Colors, FontSize, FontWeight, Radius, Spacing } = useTheme();
  // Estilos gerados dinamicamente a partir do tema atual (claro/escuro)
  const styles = getStyles(Colors, FontSize, FontWeight, Radius, Spacing);
  const { getServicos, createAgendamento, getAvailableSlots } = useFirebase();
  
  // Estados
  const [servicos, setServicos] = useState<any[]>([]);
  const [servicoSel, setServicoSel] = useState<any>(route.params?.service || null);
  const [selectedDate, setSelectedDate] = useState(route.params?.time ? new Date().toISOString().split('T')[0] : '');
  const [selectedTime, setSelectedTime] = useState(route.params?.time || '');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' as any });
  const unsubscribeRef = useRef<any>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setSelectedTime('');
      // Listener em tempo real para horários disponíveis
      const unsubscribe = onSnapshot(doc(db, 'slots', selectedDate), (snapshot) => {
        if (snapshot.exists()) {
          setAvailableTimes(snapshot.data().times || []);
        } else {
          setAvailableTimes([]);
        }
      }, (error) => {
        console.warn('Erro ao ouvir horários:', error);
        getAvailableSlots(selectedDate).then(slots => setAvailableTimes(slots));
      });
      unsubscribeRef.current = unsubscribe;
      return () => unsubscribe();
    }
  }, [selectedDate]);

  async function loadData() {
    const data = await getServicos();
    setServicos(data);
  }

  const isFormValid = servicoSel && selectedDate && selectedTime;

  const handleConfirmAgendamento = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Primeiro, criar o agendamento
      const appointmentRef = await createAgendamento({
        userId: user.id,
        userName: user.name,
        servicoId: servicoSel.id,
        servicoNome: servicoSel.nome,
        valor: servicoSel.promoPrice || servicoSel.price || servicoSel.valor,
        data: selectedDate,
        horario: selectedTime,
        status: 'pendente',
        createdAt: new Date().toISOString()
      });

      // Depois, remover o horário da lista de disponíveis
      const slotRemoved = await checkAndRemoveSlot(selectedDate, selectedTime);
      
      if (!slotRemoved) {
        console.warn('Aviso: Não foi possível remover o slot, mas o agendamento foi criado.');
      }

      setShowReview(false);
      setShowSuccess(true);
    } catch (err) {
      setAlertConfig({ visible: true, title: 'Erro', message: 'Não foi possível realizar o agendamento.', type: 'error' });
      console.error('Erro ao agendar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Seleção de Serviço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Escolha o Serviço</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {servicos.map((s) => (
              <TouchableOpacity 
                key={s.id} 
                style={[styles.serviceCard, servicoSel?.id === s.id && styles.selectedCard]}
                onPress={() => setServicoSel(s)}
              >
                <Ionicons 
                  name="cut-outline" 
                  size={24} 
                  color={servicoSel?.id === s.id ? Colors.bg.primary : Colors.gold.default} 
                />
                <Text style={[styles.serviceName, servicoSel?.id === s.id && styles.selectedText]}>{s.nome}</Text>
                <Text style={[styles.servicePrice, servicoSel?.id === s.id && styles.selectedText]}>R$ {s.promoPrice || s.price || s.valor}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2. Seleção de Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Selecione a Data</Text>
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
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, disableTouchEvent: true }
            }}
            minDate={new Date().toISOString().split('T')[0]}
          />
        </View>

        {/* 3. Seleção de Horário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Horários Disponíveis</Text>
          {!selectedDate ? (
            <Text style={{ color: Colors.text.disabled, fontSize: FontSize.sm }}>Selecione uma data primeiro.</Text>
          ) : availableTimes.length === 0 ? (
            <Text style={{ color: Colors.text.disabled, fontSize: FontSize.sm }}>Nenhum horário disponível para este dia.</Text>
          ) : (
            <View style={styles.timeGrid}>
              {availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeButton, selectedTime === time && styles.selectedCard]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeText, selectedTime === time && styles.selectedText]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão de Revisão */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnMain, !isFormValid && styles.btnDisabled]}
          disabled={!isFormValid}
          onPress={() => setShowReview(true)}
        >
          <Text style={styles.btnMainText}>Revisar Agendamento</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.bg.primary} />
        </TouchableOpacity>
      </View>

      {/* Modal de Revisão */}
      <Modal visible={showReview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reviewContent}>
            <Text style={styles.reviewTitle}>Detalhes do Agendamento</Text>
            
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Servico:</Text>
              <Text style={styles.reviewValue}>{servicoSel?.nome}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Data:</Text>
              <Text style={styles.reviewValue}>{selectedDate}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Horario:</Text>
              <Text style={styles.reviewValue}>{selectedTime}</Text>
            </View>
            <View style={[styles.reviewRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>R$ {servicoSel?.promoPrice || servicoSel?.price || servicoSel?.valor}</Text>
            </View>

            <TouchableOpacity 
              style={styles.btnConfirm} 
              onPress={handleConfirmAgendamento}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.bg.primary} /> : <Text style={styles.btnConfirmText}>Confirmar e Agendar</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnBack} onPress={() => setShowReview(false)}>
              <Text style={styles.btnBackText}>Voltar e Alterar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successContent}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={50} color={Colors.bg.primary} />
            </View>
            <Text style={styles.successTitle}>Agendado com Sucesso!</Text>
            <Text style={styles.successDesc}>Seu horário foi reservado. Confira em "Meus Agendamentos"!</Text>
            <TouchableOpacity 
              style={styles.btnFinish} 
              onPress={() => {
                setShowSuccess(false);
                setServicoSel(null);
                setSelectedDate('');
                setSelectedTime('');
                navigation.navigate('HomeTab');
              }}
            >
              <Text style={styles.btnFinishText}>Voltar para Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
}

// Função que gera os estilos da tela com base no tema dinâmico (cores/tamanhos)
function getStyles(Colors: any, FontSize: any, FontWeight: any, Radius: any, Spacing: any) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  scrollContent: { padding: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  horizontalList: { flexDirection: 'row' },
  serviceCard: { width: 140, backgroundColor: Colors.bg.secondary, padding: Spacing.lg, borderRadius: Radius.lg, marginRight: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle },
  selectedCard: { backgroundColor: Colors.gold.default, borderColor: Colors.gold.default },
  serviceName: { color: Colors.text.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 8, textAlign: 'center' },
  servicePrice: { color: Colors.gold.default, fontSize: FontSize.md, fontWeight: FontWeight.bold, marginTop: 4 },
  selectedText: { color: Colors.bg.primary, fontWeight: FontWeight.bold },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeButton: { width: '22%', height: 44, backgroundColor: Colors.bg.secondary, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.subtle },
  timeText: { color: Colors.text.secondary, fontWeight: FontWeight.medium },
  footer: { padding: Spacing.xl, backgroundColor: Colors.bg.primary, borderTopWidth: 0.5, borderTopColor: Colors.border.subtle },
  btnMain: { backgroundColor: Colors.gold.default, height: 56, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnDisabled: { opacity: 0.3 },
  btnMainText: { color: Colors.bg.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: Spacing.xl },
  reviewContent: { backgroundColor: Colors.bg.secondary, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.gold.default },
  reviewTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.xl, textAlign: 'center' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle },
  reviewLabel: { color: Colors.text.disabled, fontSize: FontSize.sm },
  reviewValue: { color: Colors.text.primary, fontSize: FontSize.base, fontWeight: FontWeight.medium },
  totalRow: { marginTop: Spacing.lg, borderBottomWidth: 0 },
  totalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  totalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gold.default },
  btnConfirm: { backgroundColor: Colors.gold.default, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl },
  btnConfirmText: { color: Colors.bg.primary, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  btnBack: { height: 50, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnBackText: { color: Colors.text.disabled, fontSize: FontSize.sm },
  successContent: { backgroundColor: Colors.bg.secondary, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.gold.default },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.gold.default, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  successTitle: { fontSize: 24, fontWeight: FontWeight.bold, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.md },
  successDesc: { fontSize: FontSize.base, color: Colors.text.muted, textAlign: 'center', marginBottom: Spacing.xxl },
  btnFinish: { backgroundColor: Colors.gold.default, width: '100%', height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  btnFinishText: { color: Colors.bg.primary, fontSize: FontSize.base, fontWeight: FontWeight.bold }
});
}
