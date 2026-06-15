import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useServices } from '../../hooks/useFirebase';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

const HORARIOS = ['09:00', '10:30', '11:00', '14:00', '16:30'];

const EQUIPE = [
  { iniciais: 'JO', nome: 'João',   esp: 'Fundador · Degradê',  estrelas: 5 },
  { iniciais: 'RL', nome: 'Rafael', esp: 'Barba clássica',       estrelas: 5 },
  { iniciais: 'MK', nome: 'Marcos', esp: 'Corte + coloração',    estrelas: 4 },
];

const REVIEWS = [
  {
    iniciais: 'MR', nome: 'Marcos Rocha', tempo: 'há 2 dias', estrelas: 5,
    texto: 'Melhor barbearia que já fui. O João é um artista, saí completamente diferente.',
    servico: 'Corte + barba',
  },
  {
    iniciais: 'TP', nome: 'Thiago Pires', tempo: 'há 5 dias', estrelas: 5,
    texto: 'Atendimento top e preço justo. Já sou cliente fiel há 3 anos.',
    servico: 'Corte masculino',
  },
];

// ─── Componentes menores ───────────────────────────────────────
function Estrelas({ n, size = 12 }: { n: number; size?: number }) {
  const { Colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < n ? 'star' : 'star-outline'}
          size={size}
          color={Colors.gold.default}
        />
      ))}
    </View>
  );
}

// ─── Saudação dinâmica ─────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Tela principal ────────────────────────────────────────────
export default function HomeScreen() {
  const navigation      = useNavigation<any>();
  const { isAuthenticated, user } = useAuthStore();
  const { Colors, FontSize, FontWeight, Spacing, Radius } = useTheme();
  const [horarioSel, setHorarioSel] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const { services, loading } = useServices();
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const unsubscribe = onSnapshot(doc(db, 'slots', today), (snapshot) => {
      if (snapshot.exists()) {
        const times = snapshot.data().times || [];
        setAvailableTimes(times);
        if (times.length > 0) setHorarioSel(times[0]);
      } else {
        setAvailableTimes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.id && !user?.isGuest) {
      const q = query(
        collection(db, 'appointments'),
        where('userId', '==', user.id),
        where('status', '==', 'confirmado'),
        where('notified', '==', false)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUnreadNotifications(data);
      });

      return () => unsubscribe();
    }
  }, [user?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { markNotificationAsRead } = require('../../services/firebase');
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg.primary }]}>
      <StatusBar barStyle={Colors.text.primary === '#ffffff' ? 'light-content' : 'dark-content'} backgroundColor={Colors.bg.primary} />

      {/* ── Topbar ── */}
      <View style={[styles.topbar, { borderBottomColor: Colors.border.subtle }]}>
        <View style={styles.logoMark}>
          <View style={[styles.diamond, { backgroundColor: Colors.gold.default }]}>
            <Text style={[styles.diamondLetter, { color: Colors.bg.primary }]}>J</Text>
          </View>
          <View>
            <Text style={[styles.logoSub, { color: Colors.text.muted }]}>{getGreeting()}, 👋</Text>
            <Text style={[styles.logoText, { color: Colors.text.primary }]}>{user?.name?.split(' ')[0] || 'Visitante'}</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          {isAuthenticated && !user?.isGuest && (
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => unreadNotifications.length > 0 && setShowNotificationModal(true)}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.text.secondary} />
              {unreadNotifications.length > 0 && (
                <View style={[styles.notifDot, { backgroundColor: Colors.gold.default, borderColor: Colors.bg.primary }]} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <View style={[styles.bar, { backgroundColor: Colors.gold.default }]} />
            <View style={[styles.bar, { backgroundColor: Colors.gold.default }]} />
            <View style={[styles.bar, { backgroundColor: Colors.gold.default }]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Notificações */}
      <Modal visible={showNotificationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.notifContent, { backgroundColor: Colors.bg.secondary, borderColor: Colors.gold.default }]}>
            <View style={styles.notifHeader}>
              <Text style={[styles.notifTitle, { color: Colors.text.primary }]}>Notificações</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notifList}>
              {unreadNotifications.map((n) => (
                <View key={n.id} style={[styles.notifItem, { borderBottomColor: Colors.border.subtle }]}>
                  <View style={[styles.notifIcon, { backgroundColor: Colors.gold.muted }]}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.gold.default} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifText, { color: Colors.text.primary }]}>
                      Seu agendamento de <Text style={{ fontWeight: 'bold' }}>{n.servicoNome}</Text> foi confirmado!
                    </Text>
                    <Text style={[styles.notifTime, { color: Colors.text.muted }]}>
                      {n.data.split('-').reverse().join('/')} às {n.horario}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.notifReadBtn}
                    onPress={() => handleMarkAsRead(n.id)}
                  >
                    <Ionicons name="eye-outline" size={18} color={Colors.text.disabled} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.notifCloseBtn, { backgroundColor: Colors.gold.default }]}
              onPress={() => setShowNotificationModal(false)}
            >
              <Text style={[styles.notifCloseBtnText, { color: Colors.bg.primary }]}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.default }]}>
            <View style={[styles.heroDot, { backgroundColor: Colors.gold.default }]} />
            <Text style={[styles.heroBadgeText, { color: Colors.text.muted }]}>Bem-vindo de volta</Text>
          </View>
          <Text style={[styles.heroH1, { color: Colors.text.primary }]}>Sua <Text style={[styles.heroGold, { color: Colors.gold.default }]}>melhor versão</Text> começa aqui</Text>
          <Text style={[styles.heroDesc, { color: Colors.text.muted }]}>Agende seu corte com os melhores barbeiros da cidade</Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.gold.default }]} onPress={() => navigation.navigate('MainFlow', { screen: 'Tabs', params: { screen: 'AgendaTab' } })}>
              <Ionicons name="calendar-outline" size={18} color={Colors.bg.primary} />
              <Text style={[styles.btnPrimaryText, { color: Colors.bg.primary }]}>Agendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnGhost, { borderColor: Colors.border.default }]} onPress={() => navigation.navigate('ServicosTab')}>
              <Ionicons name="cut-outline" size={18} color={Colors.text.muted} />
              <Text style={[styles.btnGhostText, { color: Colors.text.muted }]}>Serviços</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={[styles.statsRow, { borderTopColor: Colors.border.subtle, borderBottomColor: Colors.border.subtle }]}>
          <View style={[styles.statBox, styles.statBorder, { borderRightColor: Colors.border.subtle }]}>
            <Text style={[styles.statNum, { color: Colors.gold.default }]}>4.9</Text>
            <Text style={[styles.statLbl, { color: Colors.text.muted }]}>Avaliação</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder, { borderRightColor: Colors.border.subtle }]}>
            <Text style={[styles.statNum, { color: Colors.gold.default }]}>2.3k</Text>
            <Text style={[styles.statLbl, { color: Colors.text.muted }]}>Clientes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.gold.default }]}>8+</Text>
            <Text style={[styles.statLbl, { color: Colors.text.muted }]}>Anos</Text>
          </View>
        </View>

        {/* ── Nossos Serviços ── */}
        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: Colors.text.primary }]}>Nossos Serviços</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServicosTab')}>
              <Text style={[styles.secLink, { color: Colors.gold.default }]}>Ver tudo</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gold.default} />
            </View>
          ) : services.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: Colors.bg.secondary }]}>
              <Text style={[styles.emptyText, { color: Colors.text.muted }]}>Nenhum serviço disponível</Text>
            </View>
          ) : (
            services.slice(0, 4).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.servicoItem, { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.subtle }]}
                onPress={() => navigation.navigate('ServiceDetails', { service: s })}
              >
                <View style={[styles.servicoIcon, { backgroundColor: Colors.bg.tertiary }]}>
                  <Ionicons name="cut-outline" size={20} color={Colors.gold.default} />
                </View>
                <View style={styles.servicoInfo}>
                  <Text style={[styles.servicoNome, { color: Colors.text.primary }]}>{s.nome}</Text>
                  <Text style={[styles.servicoDesc, { color: Colors.text.muted }]}>{s.descricao}</Text>
                </View>
                <View style={styles.servicoRight}>
                  <Text style={[styles.servicoValor, { color: Colors.gold.default, fontWeight: 'bold' }]}>
                    R$ {s.promoPrice || s.price}
                  </Text>
                  {s.promoPrice && s.price && (
                    <Text style={{ fontSize: 10, color: Colors.text.disabled, textDecorationLine: 'line-through' }}>
                      R$ {s.price}
                    </Text>
                  )}
                  <Text style={[styles.secMuted, { color: Colors.text.muted, fontSize: 11 }]}>{s.duration}min</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── Agendar Horário ── */}
        <View style={styles.section}>
          <Text style={[styles.secTitle, { color: Colors.text.primary }]}>Agendar Horário</Text>
          <View style={[styles.agendaCard, { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.subtle }]}>
            {availableTimes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: Colors.text.muted }]}>Nenhum horário disponível</Text>
              </View>
            ) : (
              <>
                <View style={styles.agendaTop}>
                  <View>
                    <Text style={[styles.agendaLabel, { color: Colors.text.disabled }]}>Próxima disponibilidade</Text>
                    <Text style={[styles.agendaDate, { color: Colors.text.primary }]}>Hoje · {horarioSel}h</Text>
                  </View>
                  <View style={[styles.vagasBadge, { backgroundColor: `${Colors.gold.default}15` }]}>
                    <Text style={[styles.vagasText, { color: Colors.gold.default }]}>{availableTimes.length} vagas livres</Text>
                  </View>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horariosRow}
                >
                  {availableTimes.slice(0, 6).map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.horarioPill, horarioSel === h && { backgroundColor: Colors.gold.default }, { backgroundColor: horarioSel === h ? Colors.gold.default : Colors.bg.tertiary, borderColor: Colors.border.default }]}
                      onPress={() => setHorarioSel(h)}
                    >
                      <Text style={[styles.horarioText, horarioSel === h && { color: Colors.bg.primary, fontWeight: FontWeight.bold }, { color: horarioSel === h ? Colors.bg.primary : Colors.text.muted }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={[styles.btnAgendarFull, { backgroundColor: Colors.bg.tertiary, borderColor: Colors.gold.default }]} onPress={() => navigation.navigate('MainFlow', { screen: 'Tabs', params: { screen: 'AgendaTab', params: { time: horarioSel } } })}>
                  <Text style={[styles.btnAgendarFullText, { color: Colors.gold.default }]}>Confirmar para {horarioSel}h</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── Equipe ── */}
        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: Colors.text.primary }]}>Nossa equipe</Text>
            <TouchableOpacity><Text style={[styles.secLink, { color: Colors.gold.default }]}>Perfis</Text></TouchableOpacity>
          </View>
          <View style={styles.equipeRow}>
            {EQUIPE.map((b) => (
              <TouchableOpacity key={b.nome} style={[styles.barbCard, { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.subtle }]} activeOpacity={0.7}>
                <View style={[styles.barbAvatar, { backgroundColor: Colors.bg.tertiary, borderColor: Colors.gold.default }]}>
                  <Text style={[styles.barbIniciais, { color: Colors.gold.default }]}>{b.iniciais}</Text>
                </View>
                <Text style={[styles.barbNome, { color: Colors.text.primary }]}>{b.nome}</Text>
                <Text style={[styles.barbEsp, { color: Colors.text.muted }]}>{b.esp}</Text>
                <Estrelas n={b.estrelas} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Reviews ── */}
        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: Colors.text.primary }]}>O que dizem</Text>
            <TouchableOpacity><Text style={[styles.secLink, { color: Colors.gold.default }]}>127 avaliações</Text></TouchableOpacity>
          </View>
          {REVIEWS.map((r) => (
            <View key={r.nome} style={[styles.reviewCard, { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.subtle }]}>
              <View style={styles.reviewTop}>
                <View style={[styles.reviewAvatar, { backgroundColor: Colors.bg.tertiary }]}>
                  <Text style={[styles.reviewIniciais, { color: Colors.text.disabled }]}>{r.iniciais}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewNome, { color: Colors.text.primary }]}>{r.nome}</Text>
                  <Text style={[styles.reviewTempo, { color: Colors.text.disabled }]}>{r.tempo}</Text>
                </View>
                <Estrelas n={r.estrelas} />
              </View>
              <Text style={[styles.reviewTexto, { color: Colors.text.muted }]}>"{r.texto}"</Text>
              <View style={[styles.reviewTag, { backgroundColor: Colors.bg.tertiary }]}>
                <Text style={[styles.reviewTagText, { color: Colors.text.disabled }]}>{r.servico}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Como chegar ── */}
        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: Colors.text.primary }]}>Como chegar</Text>
            <TouchableOpacity><Text style={[styles.secLink, { color: Colors.gold.default }]}>Abrir mapa</Text></TouchableOpacity>
          </View>
          <View style={[styles.localCard, { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.subtle }]}>
            <View style={[styles.mapPlaceholder, { backgroundColor: Colors.bg.tertiary }]}>
              <Ionicons name="map-outline" size={28} color={Colors.gold.default} />
              <Text style={[styles.mapHint, { color: Colors.text.disabled }]}>Rua das Palmeiras, 147 · Botafogo</Text>
            </View>
            <View style={styles.localInfo}>
              <View>
                <Text style={[styles.localRua, { color: Colors.text.primary }]}>Barbearia João</Text>
                <Text style={[styles.localBairro, { color: Colors.text.muted }]}>Rio de Janeiro · RJ</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.localAberto, { color: '#4ADE80' }]}>Aberto</Text>
                <Text style={[styles.localHrs, { color: Colors.text.disabled }]}>Seg–Sáb · 8h–20h</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  emptyContainer: { padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 100, borderRadius: 10 },
  emptyText: { fontSize: 14 },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  logoMark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diamond: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondLetter: { fontSize: 16, fontWeight: '700' },
  logoText: { fontSize: 14, fontWeight: '500' },
  logoSub:  { fontSize: 10 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn:    { position: 'relative' },
  notifDot: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  notifContent: { borderRadius: 20, padding: 20, borderWidth: 1, maxHeight: '60%' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  notifTitle: { fontSize: 18, fontWeight: 'bold' },
  notifList: { marginBottom: 20 },
  notifItem: { flexDirection: 'row', gap: 12, paddingVertical: 15, borderBottomWidth: 0.5 },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 12, marginTop: 4 },
  notifReadBtn: { padding: 5, justifyContent: 'center' },
  notifCloseBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  notifCloseBtnText: { fontWeight: 'bold' },
  hamburger: { gap: 4, padding: 4 },
  bar: { height: 1.5, borderRadius: 2, width: 20 },
  hero: { padding: 16, paddingBottom: 28 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 10 },
  heroH1: { fontSize: 30, fontWeight: '500', lineHeight: 38, marginBottom: 16 },
  heroGold: {},
  heroDesc: { fontSize: 12, lineHeight: 22, marginBottom: 16 },
  heroActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '500' },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  btnGhostText: { fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  statBox: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  statBorder: { borderRightWidth: 0.5 },
  statNum: { fontSize: 22, fontWeight: '500' },
  statLbl: { fontSize: 10, marginTop: 2 },
  section: { padding: 16, paddingTop: 12 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  secTitle: { fontSize: 18, fontWeight: '500' },
  secLink: { fontSize: 12 },
  secMuted: { fontSize: 10 },
  servicoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  servicoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  servicoInfo: { flex: 1 },
  servicoNome: { fontSize: 16, fontWeight: '500' },
  servicoDesc: { fontSize: 10, marginTop: 2 },
  servicoRight: { alignItems: 'flex-end', gap: 4 },
  servicoValor: { fontSize: 16, fontWeight: '700' },
  agendaCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
  },
  agendaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  agendaLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  agendaDate: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  vagasBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  vagasText: { fontSize: 10, fontWeight: '700' },
  horariosRow: { flexDirection: 'row', gap: 10, marginBottom: 16, paddingRight: 16 },
  horarioPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  horarioPillSel: {},
  horarioText: { fontSize: 12 },
  horarioTextSel: {},
  btnAgendarFull: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnAgendarFullText: { fontSize: 12, fontWeight: '700' },
  equipeRow: { flexDirection: 'row', gap: 12 },
  barbCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
  },
  barbAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  barbIniciais: { fontSize: 14, fontWeight: '700' },
  barbNome: { fontSize: 12, fontWeight: '500' },
  barbEsp: { fontSize: 10, marginBottom: 4, textAlign: 'center' },
  reviewCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  reviewIniciais: { fontSize: 10, fontWeight: '700' },
  reviewNome: { fontSize: 12, fontWeight: '500' },
  reviewTempo: { fontSize: 10 },
  reviewTexto: { fontSize: 12, lineHeight: 20, fontStyle: 'italic' },
  reviewTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  reviewTagText: { fontSize: 10 },
  localCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  mapPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapHint: { fontSize: 10 },
  localInfo: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  localRua: { fontSize: 16, fontWeight: '500' },
  localBairro: { fontSize: 10, marginTop: 2 },
  localAberto: { fontSize: 10, fontWeight: '700' },
  localHrs: { fontSize: 10, marginTop: 2 },
});
