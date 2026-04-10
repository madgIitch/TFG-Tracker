import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#5B21B6', '#1F2937']}
        style={styles.hero}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>HomiMatch Premium</Text>
          <Text style={styles.heroBadge}>Próximamente</Text>
        </View>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.bodyTitle}>La mejor experiencia, muy pronto</Text>
        <Text style={styles.bodyText}>
          Estamos trabajando para traerte la mejor experiencia Premium. Swipes ilimitados, filtros avanzados y mucho más.
        </Text>
        <View style={styles.benefitsList}>
          {[
            { icon: 'flash', text: 'Swipes ilimitados cada día' },
            { icon: 'options', text: 'Filtros avanzados (género, edad)' },
            { icon: 'sparkles', text: 'Ver compatibilidad detallada' },
            { icon: 'headset', text: 'Soporte prioritario' },
          ].map((b) => (
            <View key={b.icon} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={18} color="#7C3AED" />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.notifyBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.notifyBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  hero: {
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 28,
  },
  benefitsList: {
    gap: 16,
    marginBottom: 36,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  notifyBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  notifyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
