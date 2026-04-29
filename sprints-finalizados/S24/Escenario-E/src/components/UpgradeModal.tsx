import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { styles } from './UpgradeModal.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BENEFITS = [
  { icon: 'flash', text: 'Swipes ilimitados cada día' },
  { icon: 'options', text: 'Filtros avanzados (género, edad)' },
  { icon: 'sparkles', text: 'Ver compatibilidad detallada' },
  { icon: 'headset', text: 'Soporte prioritario' },
];

export const UpgradeModal: React.FC<Props> = ({ visible, onClose }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  const handleGetPremium = () => {
    onClose();
    navigation.navigate('Premium');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView
        blurType="light"
        blurAmount={20}
        reducedTransparencyFallbackColor="rgba(255,255,255,0.8)"
        style={styles.backdrop}
      >
        <View style={styles.backdropOverlay} />
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={28} color="#7C3AED" />
          </View>
          <Text style={styles.title}>Hazte Premium</Text>
          <Text style={styles.subtitle}>Desbloquea todas las funciones</Text>
          <View style={styles.benefitsList}>
            {BENEFITS.map((b) => (
              <View key={b.icon} style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Ionicons name={b.icon} size={16} color="#7C3AED" />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetPremium}>
            <Text style={styles.ctaText}>Obtener Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.dismissText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};
