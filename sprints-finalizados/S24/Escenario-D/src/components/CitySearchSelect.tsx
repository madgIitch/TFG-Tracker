import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { locationService } from '../services/locationService';
import type { CityOption } from '../types/location';
import { useTheme } from '../theme/ThemeContext';

interface CitySearchSelectProps {
  value: string | null; // city ID
  onSelect: (cityId: string | null, cityName: string | null) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  initialCityName?: string;
}

export const CitySearchSelect: React.FC<CitySearchSelectProps> = ({
  value,
  onSelect,
  label = 'Ciudad',
  error,
  placeholder = 'Buscar ciudad...',
  initialCityName,
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState(initialCityName || '');
  const [results, setResults] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(
    value && initialCityName ? { id: value, name: initialCityName } : null
  );

  useEffect(() => {
    if (value && initialCityName && !selectedCity) {
      setSelectedCity({ id: value, name: initialCityName });
      setQuery(initialCityName);
    } else if (!value) {
      setSelectedCity(null);
      setQuery('');
    }
  }, [value, initialCityName]);

  const searchCities = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const cities = await locationService.searchCities(text);
      setResults(cities);
    } catch (err) {
      console.error('Error fetching cities', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused && query !== selectedCity?.name) {
      const timeoutId = setTimeout(() => searchCities(query), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [query, isFocused, searchCities, selectedCity]);

  const handleSelect = (city: CityOption) => {
    setSelectedCity({ id: city.id, name: city.name });
    setQuery(city.name);
    setIsFocused(false);
    onSelect(city.id, city.name);
  };

  const clearSelection = () => {
    setSelectedCity(null);
    setQuery('');
    setResults([]);
    onSelect(null, null);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
        isFocused && { borderColor: colors.primary }
      ]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (selectedCity && text !== selectedCity.name) {
              onSelect(null, null);
              setSelectedCity(null);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Un pequeño delay para permitir el click en la lista
            setTimeout(() => setIsFocused(false), 500);
          }}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
        {selectedCity && !loading && (
          <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
            <Text style={{ color: colors.textTertiary }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      {isFocused && query.length > 0 && !selectedCity && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {results.length > 0 ? (
            <ScrollView
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              style={{ maxHeight: 200 }}
            >
              {results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.resultItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.resultText, { color: colors.text }]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            !loading && <Text style={[styles.noResults, { color: colors.textTertiary }]}>No se encontraron ciudades</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000, // Para que el dropdown pase por encima de otros inputs
    elevation: 10, // Necesario en Android para sobreponer a elementos con elevation (Premium Badge)
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  resultsContainer: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
  },
  provinceText: {
    fontSize: 12,
  },
  noResults: {
    padding: 12,
    textAlign: 'center',
  },
});
