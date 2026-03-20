import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ChipGroup } from '../components/ChipGroup';
import { FormSection } from '../components/FormSection';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  AGE_MIN,
  AGE_MAX,
  ROOMS_MIN,
  ROOMS_MAX,
  CITIES_OPTIONS,
  USER_TYPE_OPTIONS,
  ESTILO_VIDA_OPTIONS,
  INTERESES_OPTIONS,
  ZONAS_OPTIONS,
} from '../constants/swipeFilters';
import { useSwipeFilters, DEFAULT_SWIPE_FILTERS } from '../context/SwipeFiltersContext';
import { usePremium } from '../context/PremiumContext';
import type { HousingFilter, SwipeFilters } from '../types/swipeFilters';
import type { GenderFilter, Gender } from '../types/gender';
import type { HousingSituation } from '../types/profile';
import { profileService } from '../services/profileService';
import { styles } from '../styles/screens/FiltersScreen.styles';

const RULE_OPTIONS = [
  { id: 'ruido', label: 'Ruido' },
  { id: 'visitas', label: 'Visitas' },
  { id: 'limpieza', label: 'Limpieza' },
  { id: 'fumar', label: 'Fumar' },
  { id: 'mascotas', label: 'Mascotas' },
  { id: 'cocina', label: 'Dejar la cocina limpia tras usarla' },
  { id: 'banos', label: 'Mantener banos en orden' },
  { id: 'basura', label: 'Sacar la basura segun el turno' },
  { id: 'seguridad', label: 'Cerrar siempre la puerta con llave' },
  { id: 'otros', label: 'Otros' },
];

const SUB_RULE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  ruido: [
    { id: 'ruido_22_08', label: 'Silencio 22:00 - 08:00' },
    { id: 'ruido_23_08', label: 'Silencio 23:00 - 08:00' },
    { id: 'ruido_flexible', label: 'Horario flexible' },
    { id: 'ruido_otros', label: 'Otros' },
  ],
  visitas: [
    { id: 'visitas_si', label: 'Si, con aviso' },
    { id: 'visitas_no', label: 'No permitidas' },
    { id: 'visitas_sin_dormir', label: 'Si, pero sin dormir' },
    { id: 'visitas_libre', label: 'Sin problema' },
    { id: 'visitas_otros', label: 'Otros' },
  ],
  limpieza: [
    { id: 'limpieza_semanal', label: 'Turnos semanales' },
    { id: 'limpieza_quincenal', label: 'Turnos quincenales' },
    { id: 'limpieza_por_uso', label: 'Limpieza por uso' },
    { id: 'limpieza_profesional', label: 'Servicio de limpieza' },
    { id: 'limpieza_otros', label: 'Otros' },
  ],
  fumar: [
    { id: 'fumar_no', label: 'No fumar' },
    { id: 'fumar_terraza', label: 'Solo en terraza/balcon' },
    { id: 'fumar_si', label: 'Permitido en zonas comunes' },
    { id: 'fumar_otros', label: 'Otros' },
  ],
  mascotas: [
    { id: 'mascotas_no', label: 'No se permiten' },
    { id: 'mascotas_gatos', label: 'Solo gatos' },
    { id: 'mascotas_perros', label: 'Solo perros' },
    { id: 'mascotas_acuerdo', label: 'Permitidas bajo acuerdo' },
    { id: 'mascotas_otros', label: 'Otros' },
  ],
};

const FLEXIBLE_OPTION = { id: 'flexible', label: 'Flexible' };

const HOUSING_OPTIONS: { id: HousingFilter; label: string }[] = [
  { id: 'any', label: 'Indiferente' },
  { id: 'seeking', label: 'Busca piso' },
  { id: 'offering', label: 'Tiene piso' },
];

const GENDER_OPTIONS: { id: GenderFilter; label: string }[] = [
  { id: 'any', label: 'Indiferente' },
  { id: 'male', label: 'Hombre' },
  { id: 'flinta', label: 'Flinta' },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const snapToStep = (value: number) =>
  Math.round(value / BUDGET_STEP) * BUDGET_STEP;

export const FiltersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const { filters, resetFilters, setFilters } = useSwipeFilters();
  const { isPremium } = usePremium();
  const [draft, setDraft] = useState<SwipeFilters>(filters);
  const [profileHousing, setProfileHousing] = useState<HousingSituation | null>(
    null
  );
  const [profileGender, setProfileGender] = useState<Gender | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Calcular número de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (draft.housingSituation !== DEFAULT_SWIPE_FILTERS.housingSituation) count++;
    if (draft.gender !== DEFAULT_SWIPE_FILTERS.gender) count++;
    if (draft.budgetMin !== DEFAULT_SWIPE_FILTERS.budgetMin || draft.budgetMax !== DEFAULT_SWIPE_FILTERS.budgetMax) count++;
    if (draft.ageMin !== DEFAULT_SWIPE_FILTERS.ageMin || draft.ageMax !== DEFAULT_SWIPE_FILTERS.ageMax) count++;
    if (draft.roomsMin !== DEFAULT_SWIPE_FILTERS.roomsMin || draft.roomsMax !== DEFAULT_SWIPE_FILTERS.roomsMax) count++;
    if ((draft.city?.length || 0) > 0) count++;
    if ((draft.userType?.length || 0) > 0) count++;
    if ((draft.zones?.length || 0) > 0) count++;
    if ((draft.lifestyle?.length || 0) > 0) count++;
    if ((draft.interests?.length || 0) > 0) count++;
    const ruleKeys = Object.keys(draft.rules || {});
    if (ruleKeys.some(k => draft.rules![k] !== null)) count++;
    return count;
  }, [draft]);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (isMounted) {
          setProfileHousing(profile?.housing_situation ?? null);
          setProfileGender(profile?.gender ?? null);
        }
      } catch (error) {
        console.error('[FiltersScreen] Error cargando perfil:', error);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (profileHousing === 'offering' && draft.housingSituation !== 'any') {
      setDraft((prev) => ({
        ...prev,
        housingSituation: 'any',
      }));
    }
  }, [draft.housingSituation, profileHousing]);

  useEffect(() => {
    if (profileHousing !== 'offering') return;
    const resetAll = async () => {
      await resetFilters();
      setDraft(DEFAULT_SWIPE_FILTERS);
    };
    resetAll();
  }, [profileHousing, resetFilters]);

  const handleApply = async () => {
    let budgetMin = clamp(draft.budgetMin, BUDGET_MIN, BUDGET_MAX);
    let budgetMax = clamp(draft.budgetMax, BUDGET_MIN, BUDGET_MAX);
    if (budgetMin > budgetMax) {
      const temp = budgetMin;
      budgetMin = budgetMax;
      budgetMax = temp;
    }
    
    let ageMin = clamp(draft.ageMin ?? AGE_MIN, AGE_MIN, AGE_MAX);
    let ageMax = clamp(draft.ageMax ?? AGE_MAX, AGE_MIN, AGE_MAX);
    if (ageMin > ageMax) {
      const temp = ageMin;
      ageMin = ageMax;
      ageMax = temp;
    }
    
    let roomsMin = clamp(draft.roomsMin ?? ROOMS_MIN, ROOMS_MIN, ROOMS_MAX);
    let roomsMax = clamp(draft.roomsMax ?? ROOMS_MAX, ROOMS_MIN, ROOMS_MAX);
    if (roomsMin > roomsMax) {
      const temp = roomsMin;
      roomsMin = roomsMax;
      roomsMax = temp;
    }

    await setFilters({
      ...draft,
      budgetMin,
      budgetMax,
      ageMin,
      ageMax,
      roomsMin,
      roomsMax,
    });

    navigation.goBack();
  };

  const handleResetDraft = () => {
    setDraft(DEFAULT_SWIPE_FILTERS);
  };

  const housingLabel = useMemo(
    () =>
      HOUSING_OPTIONS.find((option) => option.id === draft.housingSituation)
        ?.label ?? 'Indiferente',
    [draft.housingSituation]
  );
  const genderOptions = useMemo(() => {
    if (draft.housingSituation !== 'offering') return GENDER_OPTIONS;
    if (profileGender === 'male') {
      return GENDER_OPTIONS.filter((option) => option.id !== 'flinta');
    }
    if (!profileGender || profileGender === 'undisclosed') {
      return GENDER_OPTIONS;
    }
    return GENDER_OPTIONS.filter((option) => option.id !== 'male');
  }, [draft.housingSituation, profileGender]);

  useEffect(() => {
    if (
      draft.housingSituation === 'offering' &&
      !genderOptions.some((option) => option.id === draft.gender)
    ) {
      setDraft((prev) => ({
        ...prev,
        gender: 'any',
      }));
    }
  }, [draft.gender, draft.housingSituation, genderOptions]);
  const showLifestyleFilters =
    draft.housingSituation === 'any' || draft.housingSituation === 'seeking';
  const showRuleFilters =
    draft.housingSituation === 'any' || draft.housingSituation === 'offering';


  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>
          Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
        </Text>
        <TouchableOpacity onPress={handleResetDraft}>
          <Text style={styles.resetText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingSlider}
      >
        {profileHousing === 'offering' ? (
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={20} color="#111827" />
            <Text style={styles.noticeTitle}>Filtros ocultos</Text>
            <Text style={styles.noticeText}>
              Como tienes piso, te mostramos perfiles segun las condiciones y
              precios de tus habitaciones disponibles.
            </Text>
          </View>
        ) : (
          <>
            <FormSection title="Situacion vivienda" iconName="home-outline">
              <Text style={styles.label}>Actual: {housingLabel}</Text>
              <View style={styles.segmentRow}>
                  {HOUSING_OPTIONS.map((option) => {
                    const isActive = draft.housingSituation === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.segmentButton,
                          isActive && styles.segmentButtonActive,
                        ]}
                        onPress={() =>
                          setDraft((prev) => ({
                            ...prev,
                            housingSituation: option.id,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isActive && styles.segmentButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FormSection>

            <FormSection title="Genero" iconName="people-outline">
              <Text style={styles.label}>Preferencia</Text>
              <View style={styles.segmentRow}>
                  {genderOptions.map((option) => {
                    const isActive = draft.gender === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.segmentButton,
                          isActive && styles.segmentButtonActive,
                        ]}
                        onPress={() =>
                          setDraft((prev) => ({
                            ...prev,
                            gender: option.id,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isActive && styles.segmentButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FormSection>

            {showRuleFilters ? (
              <FormSection title="Reglas del piso" iconName="clipboard-outline">
                <Text style={styles.label}>Preferencias</Text>
                <View style={styles.rulesList}>
                  {RULE_OPTIONS.map((rule) => {
                    const options = SUB_RULE_OPTIONS[rule.id]
                      ? [...SUB_RULE_OPTIONS[rule.id], FLEXIBLE_OPTION]
                      : [{ id: rule.id, label: 'Obligatorio' }, FLEXIBLE_OPTION];
                    const active = draft.rules?.[rule.id] ?? null;
                    return (
                      <View key={rule.id} style={styles.ruleBlock}>
                        <Text style={styles.ruleTitle}>{rule.label}</Text>
                        <View style={styles.ruleOptions}>
                          {options.map((option) => {
                            const isActive = active === option.id;
                            return (
                              <TouchableOpacity
                                key={option.id}
                                style={[
                                  styles.ruleChip,
                                  isActive && styles.ruleChipActive,
                                ]}
                                onPress={() =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    rules: {
                                      ...(prev.rules ?? {}),
                                      [rule.id]: isActive ? null : option.id,
                                    },
                                  }))
                                }
                              >
                                <Text
                                  style={[
                                    styles.ruleChipText,
                                    isActive && styles.ruleChipTextActive,
                                  ]}
                                >
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </FormSection>
            ) : null}

            <FormSection title="Presupuesto" iconName="cash-outline">
              <View style={styles.budgetValues}>
                <Text style={styles.budgetValue}>Min: {draft.budgetMin} EUR</Text>
                <Text style={styles.budgetValue}>Max: {draft.budgetMax} EUR</Text>
              </View>
              <RangeSlider
                minValue={draft.budgetMin}
                maxValue={draft.budgetMax}
                minBound={BUDGET_MIN}
                maxBound={BUDGET_MAX}
                step={BUDGET_STEP}
                onDragStateChange={setIsDraggingSlider}
                onChangeMin={(value) =>
                  setDraft((prev) => ({ ...prev, budgetMin: value }))
                }
                onChangeMax={(value) =>
                  setDraft((prev) => ({ ...prev, budgetMax: value }))
                }
                labelMin={`${BUDGET_MIN}`}
                labelMid={`${BUDGET_MIN + (BUDGET_MAX - BUDGET_MIN) / 2}`}
                labelMax={`${BUDGET_MAX}+`}
              />
            </FormSection>

            {/* --- Premium Filters --- */}
            <View style={{ opacity: isPremium ? 1 : 0.6 }} pointerEvents={isPremium ? 'auto' : 'none'}>
              {!isPremium && (
                <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="lock-closed" size={16} color="#F59E0B" />
                  <Text style={{ marginLeft: 4, color: '#F59E0B', fontWeight: 'bold' }}>Premium</Text>
                </View>
              )}
              
              <FormSection title="Edad" iconName="calendar-outline">
                <View style={styles.budgetValues}>
                  <Text style={styles.budgetValue}>Min: {draft.ageMin ?? AGE_MIN} años</Text>
                  <Text style={styles.budgetValue}>Max: {draft.ageMax ?? AGE_MAX} años</Text>
                </View>
                <RangeSlider
                  minValue={draft.ageMin ?? AGE_MIN}
                  maxValue={draft.ageMax ?? AGE_MAX}
                  minBound={AGE_MIN}
                  maxBound={AGE_MAX}
                  step={1}
                  onDragStateChange={setIsDraggingSlider}
                  onChangeMin={(value) =>
                    setDraft((prev) => ({ ...prev, ageMin: value }))
                  }
                  onChangeMax={(value) =>
                    setDraft((prev) => ({ ...prev, ageMax: value }))
                  }
                  labelMin={`${AGE_MIN}`}
                  labelMid={`${Math.round(AGE_MIN + (AGE_MAX - AGE_MIN) / 2)}`}
                  labelMax={`${AGE_MAX}`}
                />
              </FormSection>

              <FormSection title="Numero de habitaciones" iconName="bed-outline">
                <View style={styles.budgetValues}>
                  <Text style={styles.budgetValue}>Min: {draft.roomsMin ?? ROOMS_MIN}</Text>
                  <Text style={styles.budgetValue}>Max: {draft.roomsMax ?? ROOMS_MAX}</Text>
                </View>
                <RangeSlider
                  minValue={draft.roomsMin ?? ROOMS_MIN}
                  maxValue={draft.roomsMax ?? ROOMS_MAX}
                  minBound={ROOMS_MIN}
                  maxBound={ROOMS_MAX}
                  step={1}
                  onDragStateChange={setIsDraggingSlider}
                  onChangeMin={(value) =>
                    setDraft((prev) => ({ ...prev, roomsMin: value }))
                  }
                  onChangeMax={(value) =>
                    setDraft((prev) => ({ ...prev, roomsMax: value }))
                  }
                  labelMin={`${ROOMS_MIN}`}
                  labelMid={`${Math.round(ROOMS_MIN + (ROOMS_MAX - ROOMS_MIN) / 2)}`}
                  labelMax={`${ROOMS_MAX}`}
                />
              </FormSection>

              <FormSection title="Tipo de usuario" iconName="person-outline">
                <ChipGroup
                  label="Selecciona tipo de usuario"
                  options={USER_TYPE_OPTIONS}
                  selectedIds={draft.userType}
                  onSelect={(id) => {
                    setDraft((prev) => ({
                      ...prev,
                      userType: (prev.userType || []).includes(id)
                        ? (prev.userType || []).filter((t) => t !== id)
                        : [...(prev.userType || []), id],
                    }));
                  }}
                  multiline
                />
              </FormSection>

              <FormSection title="Ciudad" iconName="business-outline">
                <ChipGroup
                  label="Selecciona ciudad"
                  options={CITIES_OPTIONS}
                  selectedIds={draft.city}
                  onSelect={(id) => {
                    setDraft((prev) => ({
                      ...prev,
                      city: (prev.city || []).includes(id)
                        ? (prev.city || []).filter((c) => c !== id)
                        : [...(prev.city || []), id],
                    }));
                  }}
                  multiline
                />
              </FormSection>
            </View>
            {/* ---------------------------- */}

            <FormSection title="Zonas" iconName="map-outline">
              <ChipGroup
                label="Selecciona zonas"
                options={ZONAS_OPTIONS}
                selectedIds={draft.zones}
                onSelect={(id) => {
                  setDraft((prev) => ({
                    ...prev,
                    zones: (prev.zones || []).includes(id)
                      ? (prev.zones || []).filter((zona) => zona !== id)
                      : [...(prev.zones || []), id],
                  }));
                }}
                multiline
              />
            </FormSection>

            {showLifestyleFilters ? (
              <FormSection title="Estilo de vida" iconName="sparkles-outline">
                <ChipGroup
                  label="Selecciona estilos"
                  options={ESTILO_VIDA_OPTIONS}
                  selectedIds={draft.lifestyle}
                  onSelect={(id) => {
                    setDraft((prev) => ({
                      ...prev,
                      lifestyle: (prev.lifestyle || []).includes(id)
                        ? (prev.lifestyle || []).filter((chip) => chip !== id)
                        : [...(prev.lifestyle || []), id],
                    }));
                  }}
                  multiline
                />
              </FormSection>
            ) : null}

            <FormSection title="Intereses clave" iconName="heart-outline">
              <ChipGroup
                label="Selecciona intereses"
                options={INTERESES_OPTIONS}
                selectedIds={draft.interests}
                onSelect={(id) => {
                  setDraft((prev) => ({
                    ...prev,
                    interests: (prev.interests || []).includes(id)
                      ? (prev.interests || []).filter((item) => item !== id)
                      : [...(prev.interests || []), id],
                  }));
                }}
                multiline
              />
            </FormSection>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Aplicar filtros" onPress={handleApply} />
      </View>
    </View>
  );
};

const RangeSlider: React.FC<{
  minValue: number;
  maxValue: number;
  minBound: number;
  maxBound: number;
  step: number;
  onDragStateChange: (isDragging: boolean) => void;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  labelMin: string;
  labelMid: string;
  labelMax: string;
}> = ({ minValue, maxValue, minBound, maxBound, step, onDragStateChange, onChangeMin, onChangeMax, labelMin, labelMid, labelMax }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const minStartRef = React.useRef(0);
  const maxStartRef = React.useRef(0);
  const minValueRef = React.useRef(minValue);
  const maxValueRef = React.useRef(maxValue);
  const startTouchRef = React.useRef(0);

  useEffect(() => {
    minValueRef.current = minValue;
    maxValueRef.current = maxValue;
  }, [minValue, maxValue]);

  const valueToX = (value: number) => {
    if (!trackWidth) return 0;
    return ((value - minBound) / (maxBound - minBound)) * trackWidth;
  };

  const snapToStepCustom = (value: number) =>
    Math.round(value / step) * step;

  const xToValue = (x: number) => {
    if (!trackWidth) return minBound;
    const raw = minBound + (x / trackWidth) * (maxBound - minBound);
    return clamp(snapToStepCustom(raw), minBound, maxBound);
  };

  const activeThumbRef = React.useRef<'min' | 'max' | null>(null);

  const minX = valueToX(minValue);
  const maxX = valueToX(maxValue);
  const ticks = Math.floor((maxBound - minBound) / step);

  return (
    <View
      style={styles.sliderContainer}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        setTrackWidth(width);
      }}
      pointerEvents="box-only"
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        if (!trackWidth) return;
        onDragStateChange(true);
        const touchX = event.nativeEvent.locationX;
        startTouchRef.current = touchX;
        const minPos = valueToX(minValueRef.current);
        const maxPos = valueToX(maxValueRef.current);
        activeThumbRef.current =
          Math.abs(touchX - minPos) <= Math.abs(touchX - maxPos) ? 'min' : 'max';
        minStartRef.current = minPos;
        maxStartRef.current = maxPos;
      }}
      onResponderMove={(event) => {
        if (!trackWidth || !activeThumbRef.current) return;
        const nextX = clamp(event.nativeEvent.locationX, 0, trackWidth);
        if (activeThumbRef.current === 'min') {
          const bounded = clamp(nextX, 0, valueToX(maxValueRef.current));
          onChangeMin(xToValue(bounded));
        } else {
          const bounded = clamp(nextX, valueToX(minValueRef.current), trackWidth);
          onChangeMax(xToValue(bounded));
        }
      }}
      onResponderRelease={() => {
        activeThumbRef.current = null;
        onDragStateChange(false);
      }}
      onResponderTerminate={() => {
        activeThumbRef.current = null;
        onDragStateChange(false);
      }}
    >
      <View style={styles.sliderTrack} />
      <View
        style={[
          styles.sliderTrackActive,
          { left: minX, width: Math.max(0, maxX - minX) },
        ]}
      />
      <View
        style={[styles.sliderThumb, { left: minX - 10 }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      />
      <View
        style={[styles.sliderThumb, { left: maxX - 10 }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      />
      <View style={styles.sliderTicks}>
        {ticks <= 50 && Array.from({ length: ticks + 1 }).map((_, index) => (
          <View key={`tick-${index}`} style={styles.sliderTick} />
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{labelMin}</Text>
        <Text style={styles.sliderLabel}>{labelMid}</Text>
        <Text style={styles.sliderLabel}>{labelMax}</Text>
      </View>
    </View>
  );
};
