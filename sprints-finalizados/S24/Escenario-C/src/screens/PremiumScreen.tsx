import React, { useMemo } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { PremiumUpgradeCard } from '../components/PremiumUpgradeCard';
import { usePremium } from '../context/PremiumContext';
import { createStyles } from '../styles/screens/PremiumScreen.styles';

export const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { isPremium, loading } = usePremium();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Volver"
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{isPremium ? 'Plan activo' : 'Mejora opcional'}</Text>
          <Text style={styles.title}>Homi Premium</Text>
          <Text style={styles.subtitle}>
            Mas control para encontrar piso o companeros sin limites diarios ni filtros bloqueados.
          </Text>
        </View>

        <PremiumUpgradeCard
          title={isPremium ? 'Ya tienes Premium' : 'Lo que desbloqueas'}
          description={
            isPremium
              ? 'Tu cuenta ya puede usar las funciones avanzadas incluidas en Premium.'
              : 'Premium esta pensado para busquedas activas con mas precision y menos esperas.'
          }
        />

        <View style={styles.comparison}>
          <Text style={styles.sectionTitle}>Free vs Premium</Text>
          <View style={styles.planRow}>
            <View style={styles.planColumn}>
              <Text style={styles.planName}>Free</Text>
              <Text style={styles.planItem}>Swipes diarios limitados</Text>
              <Text style={styles.planItem}>Filtros basicos</Text>
              <Text style={styles.planItem}>Matches y chat incluidos</Text>
            </View>
            <View style={[styles.planColumn, styles.planColumnPremium]}>
              <Text style={styles.planName}>Premium</Text>
              <Text style={styles.planItem}>Swipes diarios ilimitados</Text>
              <Text style={styles.planItem}>Filtros avanzados</Text>
              <Text style={styles.planItem}>Menos friccion en busquedas activas</Text>
            </View>
          </View>
        </View>

        <Button
          title={isPremium ? 'Premium activo' : 'Gestionar suscripcion'}
          onPress={() =>
            Alert.alert(
              'Suscripcion',
              'La gestion de suscripciones estara disponible proximamente.'
            )
          }
          loading={loading}
          disabled={isPremium || loading}
          iconName={isPremium ? 'checkmark-circle' : 'diamond-outline'}
          accessibilityHint="Muestra el estado actual de la suscripcion"
        />
      </View>
    </View>
  );
};
