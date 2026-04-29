import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { roomService } from '../services/roomService';
import { profileService } from '../services/profileService';
import { locationService } from '../services/locationService';
import { SearchableSelect } from '../components/SearchableSelect';
import { FormKeyboardLayout } from '../components/FormKeyboardLayout';
import type { GenderPolicy } from '../types/room';
import type { Gender } from '../types/gender';
import type { CityOption, ZoneOption } from '../types/location';
import { createCreateFlatStyles } from '../styles/screens/CreateFlatScreen.styles';
import { GlassBackground } from '../components/GlassBackground';

export const CreateFlatScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createCreateFlatStyles(theme), [theme]);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const routeParams = route.params as { flatId?: string } | undefined;
  const editFlatId = routeParams?.flatId ?? null;
  const isEditMode = Boolean(editFlatId);
  const authContext = useContext(AuthContext);
  const userGender = authContext?.user?.gender ?? null;
  const [profileGender, setProfileGender] = useState<Gender | null>(null);
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<string | null>(null);
  const [cityLabel, setCityLabel] = useState('');
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [districtLabel, setDistrictLabel] = useState('');
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [zoneOptions, setZoneOptions] = useState<ZoneOption[]>([]);
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>('mixed');
  const [saving, setSaving] = useState(false);
  const [loadingFlat, setLoadingFlat] = useState(false);

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

  useEffect(() => {
    const loadFlatForEdit = async () => {
      if (!isEditMode || !editFlatId) return;
      try {
        setLoadingFlat(true);
        const flats = await roomService.getMyFlats();
        const target = flats.find((flat) => flat.id === editFlatId);
        if (!target) {
          Alert.alert('Error', 'No se encontro el piso a editar');
          navigation.goBack();
          return;
        }
        setAddress(target.address ?? '');
        setCityId(target.city_id ?? null);
        setCityLabel(target.city ?? '');
        setDistrictId(target.district_id ?? null);
        setDistrictLabel(target.district ?? '');
        setGenderPolicy((target.gender_policy as GenderPolicy) ?? 'mixed');

        if (target.city_id) {
          const zones = await locationService.searchZones(target.city_id, '');
          setZoneOptions(zones);
        }
      } catch (error) {
        console.error('Error cargando piso para editar:', error);
        Alert.alert('Error', 'No se pudo cargar el piso');
        navigation.goBack();
      } finally {
        setLoadingFlat(false);
      }
    };

    void loadFlatForEdit();
  }, [editFlatId, isEditMode, navigation]);

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

  const searchCities = async (query: string) => {
    try {
      const options = await locationService.searchCities(query);
      setCityOptions(options);
    } catch (error) {
      console.error('Error buscando ciudades:', error);
      setCityOptions([]);
    }
  };

  const searchZones = async (query: string) => {
    if (!cityId) {
      setZoneOptions([]);
      return;
    }
    try {
      const options = await locationService.searchZones(cityId, query);
      setZoneOptions(options);
    } catch (error) {
      console.error('Error buscando zonas:', error);
      setZoneOptions([]);
    }
  };

  const selectPolicy = (policy: GenderPolicy) => {
    if (!allowedPolicies.has(policy)) {
      Alert.alert('Restriccion', 'Esta opcion no esta disponible segun tu genero.');
      return;
    }
    setGenderPolicy(policy);
  };

  const handleSave = async () => {
    const addressValue = address.trim();
    if (!addressValue || !cityId) {
      Alert.alert('Error', 'Direccion y ciudad son obligatorias');
      return;
    }
    if (!districtId) {
      Alert.alert('Error', 'Selecciona una zona');
      return;
    }
    if (!allowedPolicies.has(genderPolicy)) {
      Alert.alert('Restriccion', 'Selecciona un tipo de convivencia valido para tu genero.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        address: addressValue,
        city_id: cityId,
        district_id: districtId,
        city: cityLabel,
        district: districtLabel,
        gender_policy: genderPolicy,
      };
      if (isEditMode && editFlatId) {
        await roomService.updateFlat(editFlatId, payload);
        Alert.alert('Exito', 'Piso actualizado');
      } else {
        await roomService.createFlat(payload);
        Alert.alert('Exito', 'Piso creado');
      }
      navigation.goBack();
    } catch (error) {
      console.error(isEditMode ? 'Error actualizando piso:' : 'Error creando piso:', error);
      Alert.alert('Error', isEditMode ? 'No se pudo actualizar el piso' : 'No se pudo crear el piso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormKeyboardLayout
      containerStyle={styles.container}
      contentStyle={styles.content}
      extraOffset={92}
      header={
        <>
          <GlassBackground />
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isEditMode ? 'Editar piso' : 'Crear piso'}
            </Text>
            <View style={styles.headerActions}>
              <Button
                title="Cancelar"
                onPress={() => navigation.goBack()}
                variant="tertiary"
                size="small"
              />
              <Button
                title={isEditMode ? 'Actualizar' : 'Guardar'}
                onPress={handleSave}
                size="small"
                loading={saving || loadingFlat}
              />
            </View>
          </View>
        </>
      }
    >
      {loadingFlat ? (
        <Text style={styles.sectionHint}>Cargando datos del piso...</Text>
      ) : null}
      <Input label="Direccion" value={address} onChangeText={setAddress} required />
      <SearchableSelect
        label="Ciudad"
        required
        valueLabel={cityLabel || undefined}
        options={cityOptions.map((city) => ({ id: city.id, label: city.name }))}
        onSearch={searchCities}
        onSelect={(option) => {
          setCityId(option.id);
          setCityLabel(option.label);
          setDistrictId(null);
          setDistrictLabel('');
          setZoneOptions([]);
        }}
      />
      <SearchableSelect
        label="Zona"
        required
        placeholder={cityId ? 'Buscar zona...' : 'Selecciona ciudad primero'}
        valueLabel={districtLabel || undefined}
        options={zoneOptions.map((zone) => ({ id: zone.id, label: zone.name }))}
        onSearch={searchZones}
        onSelect={(option) => {
          setDistrictId(option.id);
          setDistrictLabel(option.label);
        }}
        disabled={!cityId}
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
    </FormKeyboardLayout>
  );
};
