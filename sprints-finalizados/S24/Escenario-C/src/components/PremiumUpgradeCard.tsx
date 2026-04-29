import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';

export const PREMIUM_BENEFITS = [
  'Swipes diarios ilimitados',
  'Filtros avanzados por edad y genero',
  'Mayor control sobre tus busquedas',
];

interface PremiumUpgradeCardProps {
  title?: string;
  description?: string;
  benefits?: string[];
  ctaLabel?: string;
  onUpgradePress?: () => void;
  compact?: boolean;
}

export const PremiumUpgradeCard: React.FC<PremiumUpgradeCardProps> = ({
  title = 'Pasa a Premium',
  description = 'Desbloquea las funciones de busqueda avanzada y elimina limites diarios.',
  benefits = PREMIUM_BENEFITS,
  ctaLabel = 'Mejorar plan',
  onUpgradePress,
  compact = false,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: theme.colors.cardSurface,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={styles.titleRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.colors.surfaceLight }]}>
          <Ionicons name="diamond-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.benefitsList}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={[styles.benefitText, { color: theme.colors.text }]}>{benefit}</Text>
          </View>
        ))}
      </View>

      {onUpgradePress ? (
        <Button
          title={ctaLabel}
          onPress={onUpgradePress}
          iconName="arrow-forward"
          accessibilityHint="Abre la pantalla para cambiar a Premium"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  cardCompact: {
    padding: 14,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 9,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
});
