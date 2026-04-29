import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyboardWrapper } from '../components/KeyboardWrapper';
import { CityZoneSelector } from '../components/CityZoneSelector';
import { roomService } from '../services/roomService';
import { makeStyles } from './EditFlatLocationScreen.styles';

type RouteParams = {
  EditFlatLocation: {
    flatId: string;
    address: string;
    cityName: string;
    cityId: string;
    zoneName?: string;
    zoneId?: string;
  };
};

export const EditFlatLocationScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'EditFlatLocation'>>();
  const { flatId, address: initialAddress, cityName, cityId, zoneName, zoneId } =
    route.params;

  const [address, setAddress] = useState(initialAddress);
  const [citySelection, setCitySelection] = useState({
    cityId: (cityId ?? null) as string | null,
    cityName: cityName ?? '',
    zoneId: (zoneId ?? null) as string | null,
    zoneName: zoneName ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const addressValue = address.trim();
    if (!addressValue) {
      Alert.alert('Error', 'La dirección es obligatoria');
      return;
    }
    if (!citySelection.cityId) {
      Alert.alert('Error', 'Selecciona una ciudad');
      return;
    }

    try {
      setSaving(true);
      await roomService.updateFlat(flatId, {
        address: addressValue,
        city: citySelection.cityName,
        city_id: citySelection.cityId,
        district: citySelection.zoneName || undefined,
        district_id: citySelection.zoneId || undefined,
      });
      Alert.alert('Éxito', 'Ubicación actualizada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      Alert.alert('Error', 'No se pudo actualizar la ubicación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardWrapper style={styles.container} scrollable={false}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Editar ubicación
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
          label="Dirección"
          value={address}
          onChangeText={setAddress}
          required
        />
        <CityZoneSelector
          mode="single"
          value={citySelection}
          onChange={setCitySelection}
        />
      </ScrollView>
    </KeyboardWrapper>
  );
};
