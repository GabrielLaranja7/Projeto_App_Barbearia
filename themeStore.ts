// src/hooks/useTheme.ts
// Hook central de tematização: combina a preferência de tema/fonte salva pelo
// usuário (themeStore) com a tabela de cores e tamanhos (dynamicTheme) e
// devolve um objeto pronto para ser usado nos estilos das telas.
//
// Toda tela que precisa respeitar o tema claro/escuro e o tamanho de fonte
// escolhido pelo usuário deve chamar este hook e usar os valores retornados
// (Colors, FontSize, etc.) ao montar seu StyleSheet — em vez de importar
// diretamente de 'src/theme/index.ts' (que é sempre o tema escuro fixo).
import { useThemeStore } from '../store/themeStore';
import { getDynamicTheme } from '../theme/dynamicTheme';

export function useTheme() {
  const { theme, fontScale } = useThemeStore();
  // Monta o conjunto completo de cores/tamanhos de acordo com o tema e a
  // escala de fonte selecionados pelo usuário
  const dynamicTheme = getDynamicTheme(theme, fontScale);

  return {
    theme,
    fontScale,
    Colors: dynamicTheme.Colors,
    FontSize: dynamicTheme.FontSize,
    Spacing: dynamicTheme.Spacing,
    Radius: dynamicTheme.Radius,
    FontWeight: dynamicTheme.FontWeight,
    Shadow: dynamicTheme.Shadow,
  };
}
