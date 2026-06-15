// src/components/common/CustomAlert.tsx
// Componente de alerta/modal customizado, usado no lugar do Alert nativo do
// React Native para manter a identidade visual do app (cores, ícones, etc.)
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Hook de tema dinâmico: garante que o alerta também respeite o tema
// claro/escuro e o tamanho de fonte escolhidos pelo usuário
import { useTheme } from '../../hooks/useTheme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  // Define o ícone e a cor de destaque do alerta
  type?: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancelar'
}: CustomAlertProps) {
  // Obtém cores e tamanhos do tema atual
  const { Colors, FontSize, FontWeight, Radius, Spacing } = useTheme();
  const styles = getStyles(Colors, FontSize, FontWeight, Radius, Spacing);

  // Define qual ícone e cor usar de acordo com o tipo do alerta
  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: '#4CAF50' };
      case 'error':   return { name: 'alert-circle',     color: Colors.error };
      case 'warning': return { name: 'warning',          color: Colors.gold.default };
      case 'confirm': return { name: 'help-circle',     color: Colors.gold.default };
      default:        return { name: 'information-circle', color: Colors.gold.default };
    }
  };

  const icon = getIcon();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Círculo de fundo com o ícone correspondente ao tipo do alerta */}
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name as any} size={40} color={icon.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            {/* Botão "Cancelar" só aparece em alertas de confirmação */}
            {type === 'confirm' && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            {/* Botão principal: confirma a ação ou apenas fecha o alerta */}
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton, { backgroundColor: type === 'error' ? Colors.error : Colors.gold.default }]} 
              onPress={onConfirm || onClose}
            >
              <Text style={styles.confirmButtonText}>
                {type === 'confirm' ? confirmText : 'Entendi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Monta os estilos do alerta com base no tema atual (cores/tamanhos dinâmicos)
function getStyles(Colors: any, FontSize: any, FontWeight: any, Radius: any, Spacing: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    alertContainer: {
      width: '100%',
      backgroundColor: Colors.bg.secondary,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: Colors.text.primary,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: FontSize.base,
      color: Colors.text.muted,
      textAlign: 'center',
      marginBottom: Spacing.xl,
      lineHeight: 22,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      width: '100%',
    },
    button: {
      flex: 1,
      height: 50,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmButton: {
      backgroundColor: Colors.gold.default,
    },
    confirmButtonText: {
      color: Colors.bg.primary,
      fontWeight: FontWeight.bold,
      fontSize: FontSize.base,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.border.default,
    },
    cancelButtonText: {
      color: Colors.text.muted,
      fontWeight: FontWeight.medium,
      fontSize: FontSize.base,
    },
  });
}
