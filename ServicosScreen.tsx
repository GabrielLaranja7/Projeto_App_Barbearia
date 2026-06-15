// src/theme/dynamicTheme.ts
// Define todas as paletas de cores e escalas de fonte do app, e fornece a
// função getDynamicTheme(), que combina o tema (claro/escuro) escolhido pelo
// usuário com a escala de fonte escolhida, gerando um "tema completo" usado
// pelo hook useTheme() em todas as telas.

import { ThemeType, FontScale } from '../store/themeStore';

// Paleta de cores usada quando o usuário está no tema ESCURO (padrão do app)
const darkColors = {
  bg: {
    primary:   '#0d0d0d',
    secondary: '#141414',
    tertiary:  '#1a1a1a',
    card:      '#141414',
    input:     '#1a1a1a',
  },
  border: {
    subtle:  '#1e1e1e',
    default: '#2a2a2a',
    strong:  '#333333',
  },
  gold: {
    light:   '#e8b96a',
    default: '#c9973a',
    dark:    '#a67820',
    muted:   '#3d2e10',
  },
  text: {
    primary:   '#ffffff',
    secondary: '#aaaaaa',
    muted:     '#666666',
    disabled:  '#444444',
  },
  success: '#4caf50',
  error:   '#e24b4a',
  warning: '#ef9f27',
};

// Paleta de cores usada quando o usuário ativa o tema CLARO
const lightColors = {
  bg: {
    primary:   '#ffffff',
    secondary: '#f5f5f5',
    tertiary:  '#eeeeee',
    card:      '#f9f9f9',
    input:     '#f0f0f0',
  },
  border: {
    subtle:  '#e8e8e8',
    default: '#d0d0d0',
    strong:  '#b8b8b8',
  },
  gold: {
    light:   '#e8b96a',
    default: '#c9973a',
    dark:    '#a67820',
    muted:   '#f0e6d2',
  },
  text: {
    primary:   '#1a1a1a',
    secondary: '#555555',
    muted:     '#999999',
    disabled:  '#bbbbbb',
  },
  success: '#4caf50',
  error:   '#e24b4a',
  warning: '#ef9f27',
};

// Conjuntos de tamanho de fonte. O usuário escolhe um destes na tela de Perfil
// (Pequeno / Normal / Grande / Extra Grande) e o valor escolhido é aplicado
// em FontSize.* em todas as telas que usam o hook useTheme()
const fontScales = {
  small: {
    xs:   8,
    sm:   10,
    md:   12,
    base: 14,
    lg:   16,
    xl:   18,
    xxl:  22,
    hero: 28,
  },
  normal: {
    xs:   10,
    sm:   12,
    md:   14,
    base: 16,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 34,
  },
  large: {
    xs:   12,
    sm:   14,
    md:   16,
    base: 18,
    lg:   20,
    xl:   24,
    xxl:  32,
    hero: 40,
  },
  'extra-large': {
    xs:   14,
    sm:   16,
    md:   18,
    base: 20,
    lg:   22,
    xl:   26,
    xxl:  36,
    hero: 44,
  },
};

export function getThemeColors(theme: ThemeType) {
  return theme === 'dark' ? darkColors : lightColors;
}

export function getFontSizes(scale: FontScale) {
  return fontScales[scale];
}

export function getDynamicTheme(theme: ThemeType, fontScale: FontScale) {
  return {
    Colors: getThemeColors(theme),
    FontSize: getFontSizes(fontScale),
    Spacing: {
      xs:  4,
      sm:  8,
      md:  12,
      lg:  16,
      xl:  20,
      xxl: 28,
      xxxl: 40,
    },
    Radius: {
      sm:   6,
      md:   10,
      lg:   14,
      xl:   20,
      full: 999,
    },
    FontWeight: {
      regular: '400' as const,
      medium:  '500' as const,
      bold:    '700' as const,
    },
    Shadow: {
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    },
  };
}
