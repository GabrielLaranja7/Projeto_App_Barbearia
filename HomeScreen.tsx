// src/navigation/index.tsx
// Define toda a estrutura de navegação do app: fluxo de autenticação,
// fluxo do cliente (abas + menu lateral) e fluxo do administrador.
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
// Hook de tema dinâmico: garante que a barra de abas e o menu lateral
// também respeitem o tema claro/escuro escolhido pelo usuário
import { useTheme } from '../hooks/useTheme';

import LoginScreen          from '../screens/auth/LoginScreen';
import VerifyCodeScreen     from '../screens/auth/VerifyCodeScreen';
import HomeScreen           from '../screens/app/HomeScreen';
import ServicosScreen       from '../screens/app/ServicosScreen';
import AgendamentoScreen    from '../screens/app/AgendamentoScreen';
import PerfilScreen         from '../screens/app/PerfilScreen';
import ServiceDetailsScreen from '../screens/app/ServiceDetailsScreen';
import CustomDrawer         from '../components/common/CustomDrawer';

// Telas do Administrador
import AdminDashboardScreen    from '../screens/app/AdminDashboardScreen';
import AdminServicosScreen     from '../screens/app/AdminServicosScreen';
import AdminAgendamentosScreen from '../screens/app/AdminAgendamentosScreen';
import AdminFinanceiroScreen   from '../screens/app/AdminFinanceiroScreen';
import AdminUsuariosScreen     from '../screens/app/AdminUsuariosScreen';

// Tipos de cada navegador, usados para checagem de tipos nas chamadas de navigation.navigate()
export type RootStackParamList = { Auth: undefined; Main: undefined; AdminRoot: undefined };
export type AuthStackParamList = { Login: undefined; VerifyCode: { phone: string } };
export type TabParamList       = { HomeTab: undefined; AgendaTab: { service?: any }; ServicosTab: undefined; PerfilTab: undefined };
export type DrawerParamList    = { MainFlow: undefined };
export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminServicos: undefined;
  AdminAgendamentos: undefined;
  AdminFinanceiro: undefined;
  AdminUsuarios: undefined;
};

const RootStack  = createNativeStackNavigator<RootStackParamList>();
const AuthStack  = createNativeStackNavigator<AuthStackParamList>();
const Tab        = createBottomTabNavigator<TabParamList>();
const Drawer     = createDrawerNavigator<DrawerParamList>();
const MainStack  = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

// ─── Fluxo de Autenticação (Login / Verificação) ───────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"      component={LoginScreen} />
      <AuthStack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Fluxo do Administrador ────────────────────────────────────
// Pilha de telas exibida apenas para o usuário com role "admin"
function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard"    component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminServicos"      component={AdminServicosScreen} />
      <AdminStack.Screen name="AdminAgendamentos"  component={AdminAgendamentosScreen} />
      <AdminStack.Screen name="AdminFinanceiro"    component={AdminFinanceiroScreen} />
      <AdminStack.Screen name="AdminUsuarios"      component={AdminUsuariosScreen} />
    </AdminStack.Navigator>
  );
}

// ─── Abas inferiores do cliente (Início, Agenda, Serviços, Perfil) ──
function TabNavigator() {
  // Obtém as cores do tema atual para estilizar a barra de abas
  const { Colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.bg.secondary, borderTopColor: Colors.border.subtle, borderTopWidth: 0.5, height: 64, paddingBottom: 10 },
        tabBarActiveTintColor:   Colors.gold.default,
        tabBarInactiveTintColor: Colors.text.disabled,
        tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          // Mapeia cada aba para seu respectivo ícone (preenchido quando ativo)
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab:     focused ? 'home'     : 'home-outline',
            AgendaTab:   focused ? 'calendar' : 'calendar-outline',
            ServicosTab: focused ? 'cut'      : 'cut-outline',
            PerfilTab:   focused ? 'person'   : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"     component={HomeScreen}        options={{ title: 'Início' }} />
      <Tab.Screen name="AgendaTab"   component={AgendamentoScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen name="ServicosTab" component={ServicosScreen}    options={{ title: 'Serviços' }} />
      <Tab.Screen name="PerfilTab"   component={PerfilScreen}      options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// Pilha que permite navegar das Tabs para a tela de detalhes de um serviço
function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs"           component={TabNavigator} />
      <MainStack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    </MainStack.Navigator>
  );
}

// ─── Menu lateral (Drawer) do cliente ──────────────────────────
function DrawerNavigator() {
  // Obtém as cores do tema atual para estilizar o menu lateral
  const { Colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown:             false,
        drawerPosition:          'right',
        drawerStyle:             { backgroundColor: Colors.bg.secondary, width: '76%' },
        overlayColor:            'rgba(0,0,0,0.75)',
        drawerActiveTintColor:   Colors.gold.default,
        drawerInactiveTintColor: Colors.text.muted,
      }}
    >
      <Drawer.Screen name="MainFlow" component={MainStackNavigator} options={{ title: 'Início' }} />
    </Drawer.Navigator>
  );
}

// ─── Navegador raiz ─────────────────────────────────────────────
// Decide qual fluxo mostrar com base no estado de autenticação:
// - Não autenticado  → fluxo de Login/Cadastro
// - Autenticado admin → painel administrativo
// - Autenticado cliente → app principal (abas + menu lateral)
export default function Navigation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user            = useAuthStore((s) => s.user);
  const isAdmin         = user?.role === 'admin';

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth"      component={AuthNavigator} />
        ) : isAdmin ? (
          <RootStack.Screen name="AdminRoot" component={AdminNavigator} />
        ) : (
          <RootStack.Screen name="Main"      component={DrawerNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
