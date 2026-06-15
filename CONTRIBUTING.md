import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { getAdminStats } from '../../services/firebase';

interface Stats {
  agendamentosHoje: number;
  receitaHoje: number;
  totalUsuarios: number;
  agendamentosSemana: number;
}

export default function AdminDashboardScreen({ navigation }: any) {
  const { logout, user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    {
      icon: 'cut-outline' as const,
      label: 'Serviços',
      desc: 'Gerenciar cortes e preços',
      screen: 'AdminServicos',
      color: Colors.gold.default,
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Agenda',
      desc: 'Horários e agendamentos',
      screen: 'AdminAgendamentos',
      color: '#4caf50',
    },
    {
      icon: 'bar-chart-outline' as const,
      label: 'Financeiro',
      desc: 'Receitas e relatórios',
      screen: 'AdminFinanceiro',
      color: '#2196f3',
    },
    {
      icon: 'people-outline' as const,
      label: 'Usuários',
      desc: 'Clientes cadastrados',
      screen: 'AdminUsuarios',
      color: '#9c27b0',
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] ?? 'João'} 👋</Text>
          <Text style={styles.subtitle}>Painel do Administrador</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={Colors.gold.default} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.agendamentosHoje ?? 0}</Text>
              <Text style={styles.statLabel}>Hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#4caf50' }]}>
                R${(stats?.receitaHoje ?? 0).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Receita hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#2196f3' }]}>{stats?.totalUsuarios ?? 0}</Text>
              <Text style={styles.statLabel}>Clientes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#9c27b0' }]}>{stats?.agendamentosSemana ?? 0}</Text>
              <Text style={styles.statLabel}>Semana</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Gerenciar</Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.disabled} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.muted, marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  scroll: { padding: Spacing.xl, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  statCard: {
    flex: 1, backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gold.default },
  statLabel: { fontSize: 10, color: Colors.text.disabled, marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  grid: { gap: 12 },
  menuCard: {
    backgroundColor: Colors.bg.secondary, borderRadius: Radius.lg,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border.subtle,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  menuDesc: { fontSize: FontSize.sm, color: Colors.text.muted, marginTop: 2 },
});
