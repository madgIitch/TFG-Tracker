import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="star" size={48} color="#F59E0B" />
          </View>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Pásate a Premium
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Disfruta de la mejor experiencia y encuentra tu piso ideal más rápido.
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="infinite" size={24} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Swipes ilimitados</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="options" size={24} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Filtros avanzados</Text>
            </View>
          </View>

          <Button 
            title="Obtener Premium" 
            onPress={() => {
              onClose();
              Alert.alert(
                '¡Próximamente!',
                'La suscripción Premium estará disponible muy pronto.'
              );
            }} 
            style={styles.ctaButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 350,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  features: {
    gap: 16,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  ctaButton: {
    marginBottom: 16,
  },
});
