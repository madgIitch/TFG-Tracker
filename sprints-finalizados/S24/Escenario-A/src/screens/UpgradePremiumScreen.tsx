import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeContext';

const BENEFITS = [
  'Swipes ilimitados todos los dias.',
  'Filtros avanzados de genero y edad.',
  'Mejor posicion en recomendaciones.',
];

export const UpgradePremiumScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="diamond" size={28} color={theme.colors.warning} />
        </View>
        <Text style={styles.title}>Premium de HomiMatch</Text>
        <Text style={styles.subtitle}>
          Pantalla placeholder para el checkout. Aqui conectaremos la compra en el siguiente
          sprint.
        </Text>

        <View style={styles.list}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={styles.listText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <Button title="Obtener Premium" onPress={() => undefined} />
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: theme.colors.background,
      padding: 20,
      justifyContent: 'center',
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 20,
      gap: 12,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.warningLight,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    list: {
      marginTop: 6,
      gap: 8,
    },
    listItem: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    listText: {
      fontSize: 14,
      color: theme.colors.text,
      flexShrink: 1,
    },
  });
