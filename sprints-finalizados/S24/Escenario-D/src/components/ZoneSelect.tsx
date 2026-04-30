import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { locationService } from '../services/locationService';
import type { CityPlaceOption } from '../types/location';
import { useTheme } from '../theme/ThemeContext';
import { ChipGroup } from './ChipGroup';

interface ZoneSelectProps {
  cityId: string | null;
  value: string | string[]; // single id or array of ids
  onSelect: (value: string | string[] | null) => void;
  multiple?: boolean;
  label?: string;
  error?: string;
}

export const ZoneSelect: React.FC<ZoneSelectProps> = ({
  cityId,
  value,
  onSelect,
  multiple = true,
  label = 'Zonas/Barrios',
  error,
}) => {
  const { colors } = useTheme();
  const [places, setPlaces] = useState<CityPlaceOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cityId) {
      loadPlaces(cityId);
    } else {
      setPlaces([]);
      onSelect(multiple ? [] : null);
    }
  }, [cityId]);

  const loadPlaces = async (id: string) => {
    setLoading(true);
    try {
      const results = await locationService.getCityPlaces(id);
      setPlaces(results);
    } catch (err) {
      console.error('Error fetching city places', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChipSelect = (selectedId: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(selectedId)) {
        onSelect(currentValues.filter(id => id !== selectedId));
      } else {
        onSelect([...currentValues, selectedId]);
      }
    } else {
      onSelect(selectedId === value ? null : selectedId);
    }
  };

  if (!cityId) {
    return (
      <View style={styles.container}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        <Text style={[styles.disabledText, { color: colors.textTertiary }]}>
          Selecciona una ciudad primero para ver sus zonas.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
      </View>
      
      {!loading && places.length === 0 ? (
        <Text style={[styles.disabledText, { color: colors.textTertiary }]}>
          No hay zonas disponibles para esta ciudad.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {places.map((place) => {
              const isSelected = multiple
                ? Array.isArray(value) && value.includes(place.id)
                : value === place.id;
                
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => handleChipSelect(place.id)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: colors.text },
                    isSelected && { color: '#FFFFFF', fontWeight: '600' }
                  ]}>
                    {place.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
      
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginLeft: 8,
  },
  disabledText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
  },
});
