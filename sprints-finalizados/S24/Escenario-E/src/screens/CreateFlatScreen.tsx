import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyboardWrapper } from '../components/KeyboardWrapper';
import { CityZoneSelector } from '../components/CityZoneSelector';
import { AuthContext } from '../context/AuthContext';
import { roomService } from '../services/roomService';
import { profileService } from '../services/profileService';
import type { GenderPolicy } from '../types/room';
import type { Gender } from '../types/gender';
import { makeStyles } from './CreateFlatScreen.styles';

export const CreateFlatScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const authContext = useContext(AuthContext);
  const userGender = authContext?.user?.gender ?? null;
  const [profileGender, setProfileGender] = useState<Gender | null>(null);
  const [address, setAddress] = useState('');
  const [citySelection, setCitySelection] = useState({
    cityId: null as string | null,
    cityName: '',
    zoneId: null as string | null,
    zoneName: '',
  });
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>('mixed');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfileGender = async () => {
      try {
        const profile = await profileService.getProfile();
        if (isMounted) {
          setProfileGender(profile?.gender ?? null);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };

    void loadProfileGender();
    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedGender = profileGender ?? userGender;
  const allowedPolicies = useMemo(() => {
    if (resolvedGender === 'male') {
      return new Set<GenderPolicy>(['men_only', 'mixed']);
    }
    if (!resolvedGender || resolvedGender === 'undisclosed') {
      return new Set<GenderPolicy>(['men_only', 'mixed', 'flinta']);
    }
    return new Set<GenderPolicy>(['flinta', 'mixed']);
  }, [resolvedGender]);

  const selectPolicy = (policy: GenderPolicy) => {
    if (!allowedPolicies.has(policy)) {
      Alert.alert(
        'Restriccion',
        'Esta opcion no esta disponible segun tu genero.'
      );
      return;
    }
    setGenderPolicy(policy);
  };

  const handleSave = async () => {
    const addressValue = address.trim();
    if (!addressValue) {
      Alert.alert('Error', 'La direccion es obligatoria');
      return;
    }
    if (!citySelection.cityId) {
      Alert.alert('Error', 'Selecciona una ciudad');
      return;
    }
    if (!allowedPolicies.has(genderPolicy)) {
      Alert.alert(
        'Restriccion',
        'Selecciona un tipo de convivencia valido para tu genero.'
      );
      return;
    }

    try {
      setSaving(true);
      await roomService.createFlat({
        address: addressValue,
        city: citySelection.cityName,
        city_id: citySelection.cityId,
        district: citySelection.zoneName || undefined,
        district_id: citySelection.zoneId || undefined,
        gender_policy: genderPolicy,
      });
      Alert.alert('Exito', 'Piso creado');
      navigation.goBack();
    } catch (error) {
      console.error('Error creando piso:', error);
      Alert.alert('Error', 'No se pudo crear el piso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardWrapper style={styles.container} scrollable={false}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Crear piso
        </Text>
        <View style={styles.headerActions}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="tertiary"
            size="small"
          />
          <Button
            title="Guardar"
            onPress={handleSave}
            size="small"
            loading={saving}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Direccion"
          value={address}
          onChangeText={setAddress}
          required
        />
        <CityZoneSelector
          mode="single"
          value={citySelection}
          onChange={setCitySelection}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de convivencia</Text>
          <View style={styles.segmentRow}>
            {[
              { id: 'mixed' as const, label: 'Mixto' },
              { id: 'men_only' as const, label: 'Solo hombres' },
              { id: 'flinta' as const, label: 'FLINTA' },
            ].map((option) => {
              const isActive = genderPolicy === option.id;
              const isDisabled = !allowedPolicies.has(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.segmentButton,
                    isActive && styles.segmentButtonActive,
                    isDisabled && styles.segmentButtonDisabled,
                  ]}
                  onPress={() => selectPolicy(option.id)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      isActive && styles.segmentButtonTextActive,
                      isDisabled && styles.segmentButtonTextDisabled,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.sectionHint}>
            FLINTA: mujeres, personas no binarias y otras identidades; hombres no.
          </Text>
        </View>
      </ScrollView>
    </KeyboardWrapper>
  );
};

