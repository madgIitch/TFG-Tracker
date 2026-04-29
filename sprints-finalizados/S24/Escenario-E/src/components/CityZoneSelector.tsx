// src/components/CityZoneSelector.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { cityService, type City, type CityPlace } from '../services/cityService';

export interface CityZoneEntry {
  city_id: string;
  city_name: string;
  zone_ids: string[];
  zone_names: string[];
}

interface SingleValue {
  cityId: string | null;
  cityName: string;
  zoneId: string | null;
  zoneName: string;
}

type Props =
  | { mode: 'single'; value: SingleValue; onChange: (v: SingleValue) => void }
  | { mode: 'multi'; value: CityZoneEntry[]; onChange: (v: CityZoneEntry[]) => void };

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ─── Single mode ────────────────────────────────────────────────────────────

function SingleCityZoneSelector({ value, onChange }: {
  value: SingleValue;
  onChange: (v: SingleValue) => void;
}) {
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [zoneQuery, setZoneQuery] = useState('');
  const [zoneResults, setZoneResults] = useState<CityPlace[]>([]);
  const [zoneLoading, setZoneLoading] = useState(false);
  const debCity = useDebounce(cityQuery, 300);
  const debZone = useDebounce(zoneQuery, 300);

  useEffect(() => {
    if (!debCity.trim() || value.cityId) {
      setCityResults([]);
      return;
    }
    setCityLoading(true);
    cityService.searchCities(debCity)
      .then(setCityResults)
      .catch(() => setCityResults([]))
      .finally(() => setCityLoading(false));
  }, [debCity, value.cityId]);

  useEffect(() => {
    if (!value.cityId) { setZoneResults([]); return; }
    setZoneLoading(true);
    cityService.getCityPlaces(value.cityId, debZone)
      .then(setZoneResults)
      .catch(() => setZoneResults([]))
      .finally(() => setZoneLoading(false));
  }, [value.cityId, debZone]);

  const selectCity = (city: City) => {
    onChange({ cityId: city.id, cityName: city.name, zoneId: null, zoneName: '' });
    setCityQuery('');
    setCityResults([]);
  };

  const clearCity = () => {
    onChange({ cityId: null, cityName: '', zoneId: null, zoneName: '' });
    setZoneQuery('');
    setZoneResults([]);
  };

  const selectZone = (place: CityPlace) => {
    onChange({ ...value, zoneId: place.id, zoneName: place.name });
    setZoneQuery('');
  };

  const clearZone = () => {
    onChange({ ...value, zoneId: null, zoneName: '' });
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>Ciudad</Text>
      {value.cityId ? (
        <View style={styles.chipRow}>
          <View style={styles.chipSelected}>
            <Text style={styles.chipSelectedText}>{value.cityName}</Text>
            <TouchableOpacity onPress={clearCity} hitSlop={8}>
              <Ionicons name="close" size={14} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ciudad..."
              placeholderTextColor="#9CA3AF"
              value={cityQuery}
              onChangeText={setCityQuery}
              autoCorrect={false}
            />
            {cityLoading && <ActivityIndicator size="small" color="#7C3AED" style={styles.searchSpinner} />}
          </View>
          {cityResults.length > 0 && (
            <View style={styles.dropdown}>
              {cityResults.slice(0, 6).map((c) => (
                <TouchableOpacity key={c.id} style={styles.dropdownRow} onPress={() => selectCity(c)}>
                  <Text style={styles.dropdownText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {value.cityId && (
        <>
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Zona (opcional)</Text>
          {value.zoneId ? (
            <View style={styles.chipRow}>
              <View style={styles.chipSelected}>
                <Text style={styles.chipSelectedText}>{value.zoneName}</Text>
                <TouchableOpacity onPress={clearZone} hitSlop={8}>
                  <Ionicons name="close" size={14} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar zona..."
                  placeholderTextColor="#9CA3AF"
                  value={zoneQuery}
                  onChangeText={setZoneQuery}
                  autoCorrect={false}
                />
                {zoneLoading && <ActivityIndicator size="small" color="#7C3AED" style={styles.searchSpinner} />}
              </View>
              {zoneResults.length > 0 && (
                <View style={styles.dropdown}>
                  {zoneResults.slice(0, 6).map((p) => (
                    <TouchableOpacity key={p.id} style={styles.dropdownRow} onPress={() => selectZone(p)}>
                      <Text style={styles.dropdownText}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

// ─── Multi mode ─────────────────────────────────────────────────────────────

function MultiCityZoneSelector({ value, onChange }: {
  value: CityZoneEntry[];
  onChange: (v: CityZoneEntry[]) => void;
}) {
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  // per-city zone search query keyed by city_id
  const [zoneQueries, setZoneQueries] = useState<Record<string, string>>({});
  const [zoneResults, setZoneResults] = useState<Record<string, CityPlace[]>>({});
  const [zoneLoading, setZoneLoading] = useState<Record<string, boolean>>({});
  const debCity = useDebounce(cityQuery, 300);
  const debZoneRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!debCity.trim()) { setCityResults([]); return; }
    const existingIds = new Set(value.map((e) => e.city_id));
    setCityLoading(true);
    cityService.searchCities(debCity)
      .then((cities) => setCityResults(cities.filter((c) => !existingIds.has(c.id))))
      .catch(() => setCityResults([]))
      .finally(() => setCityLoading(false));
  }, [debCity, value]);

  const handleZoneQuery = useCallback((cityId: string, q: string) => {
    setZoneQueries((prev) => ({ ...prev, [cityId]: q }));
    if (debZoneRefs.current[cityId]) clearTimeout(debZoneRefs.current[cityId]);
    debZoneRefs.current[cityId] = setTimeout(() => {
      setZoneLoading((prev) => ({ ...prev, [cityId]: true }));
      cityService.getCityPlaces(cityId, q)
        .then((places) => {
          setZoneResults((prev) => ({ ...prev, [cityId]: places }));
        })
        .catch(() => setZoneResults((prev) => ({ ...prev, [cityId]: [] })))
        .finally(() => setZoneLoading((prev) => ({ ...prev, [cityId]: false })));
    }, 300);
  }, []);

  const addCity = (city: City) => {
    onChange([...value, { city_id: city.id, city_name: city.name, zone_ids: [], zone_names: [] }]);
    setCityQuery('');
    setCityResults([]);
    // pre-load zones
    cityService.getCityPlaces(city.id)
      .then((places) => setZoneResults((prev) => ({ ...prev, [city.id]: places })))
      .catch(() => {});
  };

  const removeCity = (cityId: string) => {
    onChange(value.filter((e) => e.city_id !== cityId));
  };

  const toggleZone = (cityId: string, zoneId: string, zoneName: string) => {
    onChange(value.map((entry) => {
      if (entry.city_id !== cityId) return entry;
      if (entry.zone_ids.includes(zoneId)) {
        return {
          ...entry,
          zone_ids: entry.zone_ids.filter((id) => id !== zoneId),
          zone_names: entry.zone_names.filter((_, i) => entry.zone_ids[i] !== zoneId),
        };
      }
      return {
        ...entry,
        zone_ids: [...entry.zone_ids, zoneId],
        zone_names: [...entry.zone_names, zoneName],
      };
    }));
  };

  return (
    <View>
      {value.map((entry) => {
        const zones = zoneResults[entry.city_id] ?? [];
        const zq = zoneQueries[entry.city_id] ?? '';
        const isLoadingZones = zoneLoading[entry.city_id] ?? false;

        return (
          <View key={entry.city_id} style={styles.cityBlock}>
            <View style={styles.cityBlockHeader}>
              <Text style={styles.cityBlockName}>{entry.city_name}</Text>
              <TouchableOpacity onPress={() => removeCity(entry.city_id)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Zone chips */}
            <View style={styles.chipRow}>
              {entry.zone_ids.map((zid, idx) => (
                <TouchableOpacity
                  key={zid}
                  style={styles.chipSelected}
                  onPress={() => toggleZone(entry.city_id, zid, entry.zone_names[idx] ?? '')}
                >
                  <Text style={styles.chipSelectedText}>{entry.zone_names[idx] ?? zid}</Text>
                  <Ionicons name="close" size={12} color="#7C3AED" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Zone search */}
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { flex: 1 }]}
                placeholder="Buscar zona..."
                placeholderTextColor="#9CA3AF"
                value={zq}
                onChangeText={(t) => handleZoneQuery(entry.city_id, t)}
                autoCorrect={false}
              />
              {isLoadingZones && <ActivityIndicator size="small" color="#7C3AED" style={styles.searchSpinner} />}
            </View>
            {zones.length > 0 && (
              <View style={styles.zoneChipRow}>
                {zones.slice(0, 12).map((p) => {
                  const selected = entry.zone_ids.includes(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chipUnselected, selected && styles.chipSelected]}
                      onPress={() => toggleZone(entry.city_id, p.id, p.name)}
                    >
                      <Text style={[styles.chipUnselectedText, selected && styles.chipSelectedText]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Add city */}
      <Text style={styles.fieldLabel}>Añadir ciudad</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ciudad..."
          placeholderTextColor="#9CA3AF"
          value={cityQuery}
          onChangeText={setCityQuery}
          autoCorrect={false}
        />
        {cityLoading && <ActivityIndicator size="small" color="#7C3AED" style={styles.searchSpinner} />}
      </View>
      {cityResults.length > 0 && (
        <View style={styles.dropdown}>
          {cityResults.slice(0, 6).map((c) => (
            <TouchableOpacity key={c.id} style={styles.dropdownRow} onPress={() => addCity(c)}>
              <Ionicons name="add" size={14} color="#7C3AED" style={{ marginRight: 6 }} />
              <Text style={styles.dropdownText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Public export ───────────────────────────────────────────────────────────

export const CityZoneSelector: React.FC<Props> = (props) => {
  if (props.mode === 'single') {
    return <SingleCityZoneSelector value={props.value} onChange={props.onChange} />;
  }
  return <MultiCityZoneSelector value={props.value} onChange={props.onChange} />;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  searchSpinner: {
    marginLeft: 8,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  dropdownRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 8,
  },
  zoneChipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  chipSelected: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  chipSelectedText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500' as const,
  },
  chipUnselected: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipUnselectedText: {
    fontSize: 13,
    color: '#374151',
  },
  cityBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  cityBlockHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  cityBlockName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
};
