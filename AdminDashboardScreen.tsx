// src/screens/auth/VerifyCodeScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';
import { AuthStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
  route:      RouteProp<AuthStackParamList, 'VerifyCode'>;
};

const CODE_LENGTH = 6;

export default function VerifyCodeScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [code, setCode]       = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);
  const login  = useAuthStore((s) => s.login);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(text: string, index: number) {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next  = [...code];
    next[index] = digit;
    setCode(next);
    setError('');
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== '') && digit) {
      verifyCode(next.join(''));
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function verifyCode(fullCode: string) {
  setLoading(true);
  setError('');

  try {
    // Simulação de chamada de API
    await new Promise((r) => setTimeout(r, 1200));

    if (fullCode === '123456') {
      await login(
        { id: '1', name: 'Cliente', phone },
        'mock-token-abc123',
      );
      // Se o login mudar o estado global e navegar, perfeito.
      // Se não navegar, o setLoading(false) no finally vai parar o giro.
    } else {
      setError('Código inválido. Verifique e tente novamente.');
      setCode(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    }
  } catch (e) {
    setError('Ocorreu um erro inesperado. Tente novamente.');
    console.error(e);
  } finally {
    // Isso garante que o ActivityIndicator suma em qualquer situação
    setLoading(false); 
  }
}


  async function resend() {
    setCountdown(60);
    setError('');
    // TODO: chamar API de reenvio
  }

  const phoneMasked = `(${phone.slice(0,2)}) ${phone.slice(2,7)}-${phone.slice(7)}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>

      <View style={styles.logoWrap}>
        <View style={styles.diamond}>
          <Text style={styles.diamondLetter}>J</Text>
        </View>
      </View>

      <Text style={styles.title}>Verifique seu telefone</Text>
      <Text style={styles.subtitle}>
        Enviamos um código de 6 dígitos para{'\n'}
        <Text style={styles.phoneHL}>{phoneMasked}</Text>
      </Text>

      {/* Inputs OTP */}
      <View style={styles.otpRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            style={[styles.otpBox, digit ? styles.otpFilled : null, error ? styles.otpError : null]}
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!loading}
          />
        ))}
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.gold.default} />
          <Text style={styles.loadingText}>Verificando código...</Text>
        </View>
      )}

      {/* Reenvio */}
      <View style={styles.resendWrap}>
        {countdown > 0 ? (
          <Text style={styles.countdownText}>
            Reenviar código em <Text style={styles.countdownNum}>{countdown}s</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={resend}>
            <Text style={styles.resendBtn}>Reenviar código</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>
        Para fins de teste, use o código{' '}
        <Text style={{ color: Colors.gold.default }}>123456</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.xl,
    alignItems: 'center',
  },
  back: {
    position: 'absolute',
    top: Spacing.xxxl,
    left: Spacing.xl,
    padding: Spacing.sm,
  },
  logoWrap: { marginBottom: Spacing.xxl },
  diamond: {
    width: 48,
    height: 48,
    backgroundColor: Colors.gold.default,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondLetter: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.bg.primary,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  phoneHL: {
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otpBox: {
    width: 44,
    height: 52,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  otpFilled: {
    borderColor: Colors.gold.default,
    backgroundColor: Colors.gold.muted,
  },
  otpError: {
    borderColor: Colors.error,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  resendWrap: { marginTop: Spacing.xl },
  countdownText: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  countdownNum: {
    color: Colors.gold.default,
    fontWeight: FontWeight.medium,
  },
  resendBtn: {
    fontSize: FontSize.sm,
    color: Colors.gold.default,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.text.disabled,
    marginTop: Spacing.xxxl,
    textAlign: 'center',
  },
});
