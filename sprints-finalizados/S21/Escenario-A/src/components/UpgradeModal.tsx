import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from './Button';
import { PremiumBadge } from './PremiumBadge';
import { useTheme } from '../theme/ThemeContext';
import { PREMIUM_FEATURE_COPY, PremiumFeature } from '../constants/premiumFeatures';

export type UpgradeModalProps = {
  visible: boolean;
  feature: PremiumFeature;
  onClose: () => void;
  onUpgradePress: () => void;
};

const BENEFITS = [
  'Swipes ilimitados cada dia',
  'Filtros avanzados de matching',
  'Mas prioridad para encontrar perfil compatible',
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  feature,
  onClose,
  onUpgradePress,
}) => {
  const theme = useTheme();
  const featureCopy = useMemo(() => PREMIUM_FEATURE_COPY[feature], [feature]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <PremiumBadge />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Desbloquea {featureCopy.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {featureCopy.description}
          </Text>

          <View style={styles.benefitsList}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={[styles.benefitText, { color: theme.colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button title="Obtener Premium" onPress={onUpgradePress} />
            <Button title="Ahora no" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsList: {
    marginTop: 6,
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    flexShrink: 1,
  },
  actions: {
    marginTop: 10,
    gap: 10,
  },
});
