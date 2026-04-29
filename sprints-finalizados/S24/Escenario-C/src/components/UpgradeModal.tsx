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
import { PremiumUpgradeCard, PREMIUM_BENEFITS } from './PremiumUpgradeCard';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onGetPremium: () => void;
  title?: string;
  description?: string;
  benefits?: string[];
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onGetPremium,
  title = 'Pasa a Premium',
  description = 'Desbloquea funciones avanzadas para mejorar tus resultados.',
  benefits = PREMIUM_BENEFITS,
}) => {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        onPress={onClose}
      >
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

          <PremiumUpgradeCard
            title={title}
            description={description}
            benefits={benefits}
            ctaLabel="Obtener Premium"
            onUpgradePress={onGetPremium}
            compact
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
});
