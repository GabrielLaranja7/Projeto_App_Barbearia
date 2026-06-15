import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Switch
} from 'react-native';
import CustomAlert from './CustomAlert';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
// Hook de tema dinâmico: fornece cores e tamanhos de acordo com as
// preferências de tema (claro/escuro) e fonte do usuário
import { useTheme } from '../../hooks/useTheme';

// Menu lateral (Drawer) do app do cliente: mostra dados do usuário, links
// de navegação rápida e as opções de aparência (tema e tamanho de fonte)
export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, fontScale, setFontScale } = useThemeStore();
  // C = Colors, FS = FontSize, SP = Spacing, R = Radius (nomes curtos para os estilos)
  const { Colors: C, FontSize: FS, Spacing: SP, Radius: R } = useTheme();
  const navigation = props.navigation;
  const [alertConfig, setAlertConfig] = React.useState({
    visible: false, title: '', message: '', type: 'info' as any, onConfirm: () => {}
  });

  // Fecha o menu lateral e navega para a rota desejada
  const navigateTo = (route: string, params?: any) => {
    navigation.closeDrawer();
    navigation.navigate(route, params);
  };

  const isDark = theme === 'dark';

  // Opções de tamanho de fonte exibidas no menu (Pequeno, Médio, Grande, Extra Grande)
  const fontScaleOptions: Array<{ label: string; value: typeof fontScale }> = [
    { label: 'P', value: 'small' },
    { label: 'M', value: 'normal' },
    { label: 'G', value: 'large' },
    { label: 'XG', value: 'extra-large' },
  ];

  // Exibe um alerta de confirmação antes de encerrar a sessão
  async function handleLogout() {
    setAlertConfig({
      visible: true,
      title: 'Sair',
      message: 'Deseja realmente sair da sua conta?',
      type: 'confirm',
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        logout();
      }
    });
  }

  // Gera os estilos com base no tema atual (claro/escuro + tamanho de fonte)
  const styles = makeStyles(C, FS, SP, R);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.substring(0, 1).toUpperCase() || 'V'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Visitante'}</Text>
          <Text style={styles.userEmail}>{user?.isGuest ? 'Modo Visitante' : 'Cliente VIP'}</Text>
        </View>
        {/* Editar perfil */}
        {!user?.isGuest && (
          <TouchableOpacity
            onPress={() => navigateTo('MainFlow', { screen: 'Tabs', params: { screen: 'PerfilTab' } })}
            style={styles.editBtn}
          >
            <Ionicons name="pencil-outline" size={18} color={C.gold.default} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Menu Principal ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Menu Principal</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MainFlow', { screen: 'Tabs', params: { screen: 'HomeTab' } })}>
          <Ionicons name="home-outline" size={22} color={C.gold.default} />
          <Text style={styles.menuLabel}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MainFlow', { screen: 'Tabs', params: { screen: 'ServicosTab' } })}>
          <Ionicons name="cut-outline" size={22} color={C.gold.default} />
          <Text style={styles.menuLabel}>Serviços</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MainFlow', { screen: 'Tabs', params: { screen: 'AgendaTab' } })}>
          <Ionicons name="calendar-outline" size={22} color={C.gold.default} />
          <Text style={styles.menuLabel}>Agendar Horário</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MainFlow', { screen: 'Tabs', params: { screen: 'PerfilTab' } })}>
          <Ionicons name="person-outline" size={22} color={C.gold.default} />
          <Text style={styles.menuLabel}>Meu Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MainFlow', { screen: 'Tabs', params: { screen: 'ServicosTab' } })}>
          <Ionicons name="pricetag-outline" size={22} color={C.gold.default} />
          <Text style={styles.menuLabel}>Tabela de Valores</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ── Aparência ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Aparência</Text>

        {/* Dark / Light mode */}
        <View style={styles.menuItem}>
          <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={22} color={C.gold.default} />
          <Text style={styles.menuLabel}>{isDark ? 'Modo Escuro' : 'Modo Claro'}</Text>
          <Switch
            style={{ marginLeft: 'auto' }}
            value={isDark}
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
            trackColor={{ false: C.border.default, true: C.gold.muted }}
            thumbColor={C.gold.default}
          />
        </View>

        {/* Tamanho de fonte */}
        <View style={[styles.menuItem, { flexDirection: 'column', alignItems: 'flex-start', gap: SP.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.md }}>
            <Ionicons name="text-outline" size={22} color={C.gold.default} />
            <Text style={styles.menuLabel}>Tamanho da Fonte</Text>
          </View>
          <View style={styles.fontScaleRow}>
            {fontScaleOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.fontScaleBtn, fontScale === opt.value && styles.fontScaleBtnActive]}
                onPress={() => setFontScale(opt.value)}
              >
                <Text style={[styles.fontScaleBtnText, fontScale === opt.value && styles.fontScaleBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Suporte / Sair ─────────────────────────── */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setAlertConfig({ visible: true, title: 'Suporte', message: 'Abrindo WhatsApp do suporte...', type: 'info', onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })) })}>
          <Ionicons name="logo-whatsapp" size={22} color={C.text.muted} />
          <Text style={styles.menuLabel}>Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={C.error} />
          <Text style={[styles.menuLabel, { color: C.error }]}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.version}>Barbearia João v2.5.0</Text>
      </View>

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

// Monta o StyleSheet do menu lateral usando as cores/tamanhos do tema atual
function makeStyles(C: any, FS: any, SP: any, R: any) {
  return StyleSheet.create({
    container:           { flex: 1, backgroundColor: C.bg.primary },
    header:              { padding: SP.xl, paddingTop: 44, borderBottomWidth: 0.5, borderBottomColor: C.border.subtle, flexDirection: 'row', alignItems: 'center', gap: SP.md },
    avatar:              { width: 54, height: 54, borderRadius: 27, backgroundColor: C.gold.default, alignItems: 'center', justifyContent: 'center' },
    avatarText:          { fontSize: FS.xl, fontWeight: '700', color: C.bg.primary },
    userName:            { fontSize: FS.base, fontWeight: '700', color: C.text.primary },
    userEmail:           { fontSize: FS.sm, color: C.text.muted, marginTop: 2 },
    editBtn:             { padding: SP.sm },
    scroll:              { flex: 1 },
    scrollContent:       { padding: SP.lg, paddingBottom: SP.xxl },
    sectionTitle:        { fontSize: FS.xs, fontWeight: '700', color: C.text.disabled, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: SP.md, marginLeft: SP.sm, marginTop: SP.sm },
    menuItem:            { flexDirection: 'row', alignItems: 'center', paddingVertical: SP.md, paddingHorizontal: SP.md, borderRadius: R.md, marginBottom: 6, gap: SP.md },
    menuLabel:           { fontSize: FS.base, color: C.text.primary, fontWeight: '500' },
    divider:             { height: 0.5, backgroundColor: C.border.subtle, marginVertical: SP.lg, marginHorizontal: SP.sm },
    fontScaleRow:        { flexDirection: 'row', gap: SP.sm, marginLeft: SP.xxl + SP.md },
    fontScaleBtn:        { paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, borderRadius: R.sm, borderWidth: 1, borderColor: C.border.default, minWidth: 40, alignItems: 'center' },
    fontScaleBtnActive:  { borderColor: C.gold.default, backgroundColor: C.gold.muted },
    fontScaleBtnText:    { fontSize: FS.sm, color: C.text.muted, fontWeight: '500' },
    fontScaleBtnTextActive: { color: C.gold.default, fontWeight: '700' },
    footer:              { padding: SP.xl, borderTopWidth: 0.5, borderTopColor: C.border.subtle },
    version:             { fontSize: FS.xs, color: C.text.disabled, textAlign: 'center' },
  });
}
