// src/store/authStore.ts
// Store global (Zustand) responsável pela autenticação do usuário: login,
// cadastro como visitante, logout e persistência da sessão no dispositivo.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Representa um usuário autenticado (cliente, admin ou visitante)
export interface User {
  id:      string;
  name:    string;
  phone:   string;
  email?:  string;
  avatar?: string;
  isGuest?: boolean;
  role?:   'client' | 'admin';
}

interface AuthState {
  isAuthenticated: boolean;
  user:            User | null;
  token:           string | null;

  // Salva o usuário autenticado e marca a sessão como ativa
  login:        (user: User, token: string) => Promise<void>;
  // Cria uma sessão temporária de "visitante" (sem cadastro no Firestore)
  loginAsGuest: (name: string) => Promise<void>;
  // Encerra a sessão atual e limpa os dados salvos
  logout:       () => Promise<void>;
  // Restaura a sessão salva (chamado ao abrir o app)
  hydrate:      () => Promise<void>;
  // Atualiza parcialmente os dados do usuário logado (ex: nome, telefone)
  updateUser:   (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user:  null,
  token: null,

  // Salva os dados do usuário e o token no armazenamento do dispositivo,
  // e atualiza o estado global para refletir que o usuário está logado
  login: async (user, token) => {
    await AsyncStorage.setItem('@bj:user',  JSON.stringify(user));
    await AsyncStorage.setItem('@bj:token', token);
    set({ isAuthenticated: true, user, token });
  },

  // Cria um usuário "visitante" temporário, sem precisar de cadastro.
  // Usado por quem quer apenas explorar o app rapidamente.
  loginAsGuest: async (name: string) => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name,
      phone: 'Visitante',
      isGuest: true,
      role: 'client',
    };
    await AsyncStorage.setItem('@bj:user', JSON.stringify(guestUser));
    await AsyncStorage.setItem('@bj:token', 'guest_token');
    set({ isAuthenticated: true, user: guestUser, token: 'guest_token' });
  },

  // Remove os dados salvos e volta o app para o estado "não autenticado"
  logout: async () => {
    await AsyncStorage.multiRemove(['@bj:user', '@bj:token']);
    set({ isAuthenticated: false, user: null, token: null });
  },

  // Tenta restaurar uma sessão previamente salva no dispositivo.
  // Se encontrar usuário e token salvos, marca o usuário como autenticado
  // automaticamente (evita pedir login novamente a cada abertura do app).
  hydrate: async () => {
    try {
      const [userRaw, tokenRaw] = await AsyncStorage.multiGet(['@bj:user', '@bj:token']);
      const user  = userRaw[1]  ? JSON.parse(userRaw[1]) : null;
      const token = tokenRaw[1] ?? null;
      if (user && token) {
        set({ isAuthenticated: true, user, token });
      }
    } catch {
      // sessão inválida — ignora
    }
  },

  // Atualiza apenas os campos informados do usuário logado (ex: ao editar
  // o perfil), mesclando com os dados existentes e salvando novamente
  updateUser: async (updates) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem('@bj:user', JSON.stringify(updated));
    set({ user: updated });
  },
}));
