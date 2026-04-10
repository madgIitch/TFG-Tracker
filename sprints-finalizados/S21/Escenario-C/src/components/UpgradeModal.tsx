import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onGetPremium: () => void;
  title?: string;
  description?: string;
  benefits?: string[];
}

const DEFAULT_BENEFITS = [
  'Swipes diarios ilimitados',
  'Filtros avanzados (edad y genero)',
  'Mas control para encontrar match ideal',
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onGetPremium,
  title = 'Pasa a Premium',
  description = 'Desbloquea funciones avanzadas para mejorar tus resultados.',
  benefits = DEFAULT_BENEFITS,
}) => {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardSurface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="diamond-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>

          <View style={styles.benefitsList}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
            onPress={onGetPremium}
          >
            <Text style={styles.ctaText}>Obtener Premium</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsList: {
    marginTop: 16,
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  ctaButton: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
