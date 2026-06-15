// src/components/ThemeProvider.tsx
// Componente "wrapper" responsável por carregar as preferências de tema
// salvas no dispositivo assim que o app é aberto.
import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { getDynamicTheme } from '../theme/dynamicTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider: Wrapper que fornece o tema dinâmico globalmente.
 * Ele não renderiza nenhum elemento visual próprio — apenas garante que,
 * ao iniciar o app, as preferências de tema/fonte salvas anteriormente
 * sejam carregadas no estado global (themeStore), para que todas as telas
 * já nasçam com o tema correto.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, fontScale, loadPreferences } = useThemeStore();

  useEffect(() => {
    // Carrega tema e tamanho de fonte salvos (AsyncStorage) ao iniciar o app
    loadPreferences();
  }, []);

  // Calcula o tema dinâmico atual (não é usado diretamente aqui, mas garante
  // que os valores estejam disponíveis para eventuais usos futuros, como
  // ajustar a StatusBar de acordo com o tema)
  const dynamicTheme = getDynamicTheme(theme, fontScale);

  return <>{children}</>;
}
