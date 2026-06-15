// src/store/themeStore.ts
// Store global (Zustand) responsável por guardar e persistir as preferências
// de aparência do usuário: tema (claro/escuro) e tamanho da fonte.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos possíveis de tema disponíveis no app
export type ThemeType = 'dark' | 'light';

// Tamanhos de fonte que o usuário pode escolher na tela de Perfil
export type FontScale = 'small' | 'normal' | 'large' | 'extra-large';

interface ThemeStore {
  theme: ThemeType;
  fontScale: FontScale;
  // Altera o tema atual e salva a escolha no armazenamento do dispositivo
  setTheme: (theme: ThemeType) => Promise<void>;
  // Altera o tamanho da fonte atual e salva a escolha no armazenamento do dispositivo
  setFontScale: (scale: FontScale) => Promise<void>;
  // Carrega as preferências salvas anteriormente (chamado ao abrir o app)
  loadPreferences: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  // Valores padrão: tema escuro e fonte normal
  theme: 'dark',
  fontScale: 'normal',

  setTheme: async (theme: ThemeType) => {
    try {
      // Salva a preferência localmente para persistir entre sessões
      await AsyncStorage.setItem('app_theme', theme);
      // Atualiza o estado global — todas as telas que usam useTheme() são re-renderizadas
      set({ theme });
    } catch (err) {
      console.error('Erro ao salvar tema:', err);
    }
  },

  setFontScale: async (scale: FontScale) => {
    try {
      await AsyncStorage.setItem('app_fontScale', scale);
      set({ fontScale: scale });
    } catch (err) {
      console.error('Erro ao salvar escala de fonte:', err);
    }
  },

  // Lê as preferências salvas no dispositivo e atualiza o estado global.
  // Deve ser chamada uma vez ao iniciar o app (ver App.tsx).
  loadPreferences: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      const savedFontScale = await AsyncStorage.getItem('app_fontScale');

      if (savedTheme) {
        set({ theme: savedTheme as ThemeType });
      }
      if (savedFontScale) {
        set({ fontScale: savedFontScale as FontScale });
      }
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    }
  },
}));
