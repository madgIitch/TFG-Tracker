import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../components/Button';
import { ChipGroup } from '../components/ChipGroup';
import { FormSection } from '../components/FormSection';
import { GlassBackground } from '../components/GlassBackground';
import { PremiumLockWrapper } from '../components/PremiumLockWrapper';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  CITY_OPTIONS,
  ESTILO_VIDA_OPTIONS,
  INTERESES_OPTIONS,
  ROOM_COUNT_OPTIONS,
  USER_TYPE_OPTIONS,
  ZONAS_OPTIONS,
} from '../constants/swipeFilters';
import {
  DEFAULT_SWIPE_FILTERS,
  countActiveFilters,
  useSwipeFilters,
} from '../context/SwipeFiltersContext';
import type { Gender, GenderFilter } from '../types/gender';
import type { HousingSituation } from '../types/profile';
import type { HousingFilter, SwipeFilters, UserTypeFilter } from '../types/swipeFilters';
import { profileService } from '../services/profileService';
import styles from '../styles/screens/FiltersScreen.styles';

const AGE_MIN = 18;
const AGE_MAX = 60;

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

const snapToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

export const FiltersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { filters, resetFilters, setFilters } = useSwipeFilters();
  const [draft, setDraft] = useState<SwipeFilters>(filters);
  const [profileHousing, setProfileHousing] = useState<HousingSituation | null>(null);
  const [profileGender, setProfileGender] = useState<Gender | null>(null);
  const [isDraggingBudget, setIsDraggingBudget] = useState(false);
  const [isDraggingAge, setIsDraggingAge] = useState(false);

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

    loadProfile().catch((error) => {
      console.error('[FiltersScreen] Error cargando perfil:', error);
    });
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
    resetAll().catch((error) => {
      console.error('[FiltersScreen] Error reseteando filtros:', error);
    });
  }, [profileHousing, resetFilters]);

  const handleApply = async () => {
    let budgetMin = clamp(draft.budgetMin, BUDGET_MIN, BUDGET_MAX);
    let budgetMax = clamp(draft.budgetMax, BUDGET_MIN, BUDGET_MAX);
    if (budgetMin > budgetMax) {
      const temp = budgetMin;
      budgetMin = budgetMax;
      budgetMax = temp;
    }

    const minAge = clamp(draft.ageRange[0], AGE_MIN, AGE_MAX);
    const maxAge = clamp(draft.ageRange[1], AGE_MIN, AGE_MAX);

    await setFilters({
      ...draft,
      budgetMin,
      budgetMax,
      ageRange: [Math.min(minAge, maxAge), Math.max(minAge, maxAge)],
    });

    navigation.goBack();
  };

  const handleResetDraft = () => {
    setDraft(DEFAULT_SWIPE_FILTERS);
  };

  const housingLabel = useMemo(
    () =>
      HOUSING_OPTIONS.find((option) => option.id === draft.housingSituation)?.label ??
      'Indiferente',
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
  const activeFilters = countActiveFilters(draft);
  const title = `Filtros - ${activeFilters} activos`;
  const disableScroll = isDraggingBudget || isDraggingAge;

  const toggleUserType = (userType: UserTypeFilter) => {
    setDraft((prev) => {
      if (userType === 'any') {
        return { ...prev, userType: ['any'] };
      }

      const withoutAny = prev.userType.filter((item) => item !== 'any');
      const exists = withoutAny.includes(userType);
      const next = exists
        ? withoutAny.filter((item) => item !== userType)
        : [...withoutAny, userType];

      return { ...prev, userType: next };
    });
  };

  return (
    <View style={styles.container}>
      <GlassBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {activeFilters > 0 ? (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterBadgeText}>{activeFilters}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity onPress={handleResetDraft}>
          <Text style={styles.resetText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!disableScroll}
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

            <PremiumLockWrapper featureName="Filtro de genero">
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
            </PremiumLockWrapper>

            <PremiumLockWrapper featureName="Filtro de edad">
              <FormSection title="Rango de edad" iconName="calendar-outline">
                <View style={styles.budgetValues}>
                  <Text style={styles.budgetValue}>Min: {draft.ageRange[0]}</Text>
                  <Text style={styles.budgetValue}>Max: {draft.ageRange[1]}</Text>
                </View>
                <RangeSlider
                  minBound={AGE_MIN}
                  maxBound={AGE_MAX}
                  step={1}
                  minValue={draft.ageRange[0]}
                  maxValue={draft.ageRange[1]}
                  labels={[`${AGE_MIN}`, `${AGE_MAX}`]}
                  onDragStateChange={setIsDraggingAge}
                  onChangeMin={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      ageRange: [value, prev.ageRange[1]],
                    }))
                  }
                  onChangeMax={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      ageRange: [prev.ageRange[0], value],
                    }))
                  }
                />
              </FormSection>
            </PremiumLockWrapper>

            <FormSection title="Ciudad" iconName="business-outline">
              <ChipGroup
                label="Selecciona ciudades"
                options={CITY_OPTIONS}
                selectedIds={draft.city}
                onSelect={(id) => {
                  setDraft((prev) => ({
                    ...prev,
                    city: prev.city.includes(id)
                      ? prev.city.filter((item) => item !== id)
                      : [...prev.city, id],
                  }));
                }}
                multiline
              />
            </FormSection>

            <FormSection title="Numero de habitaciones" iconName="bed-outline">
              <View style={styles.segmentRow}>
                {ROOM_COUNT_OPTIONS.map((option) => {
                  const isActive = draft.roomCount.includes(option.id);
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
                          roomCount: prev.roomCount.includes(option.id)
                            ? prev.roomCount.filter((item) => item !== option.id)
                            : [...prev.roomCount, option.id],
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

            <FormSection title="Tipo de usuario" iconName="person-outline">
              <View style={styles.segmentRow}>
                {USER_TYPE_OPTIONS.map((option) => {
                  const isActive = draft.userType.includes(
                    option.id as UserTypeFilter
                  );
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.segmentButton,
                        isActive && styles.segmentButtonActive,
                      ]}
                      onPress={() => toggleUserType(option.id as UserTypeFilter)}
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
                minBound={BUDGET_MIN}
                maxBound={BUDGET_MAX}
                step={BUDGET_STEP}
                minValue={draft.budgetMin}
                maxValue={draft.budgetMax}
                labels={['0', '600', '1200+']}
                onDragStateChange={setIsDraggingBudget}
                onChangeMin={(value) =>
                  setDraft((prev) => ({ ...prev, budgetMin: value }))
                }
                onChangeMax={(value) =>
                  setDraft((prev) => ({ ...prev, budgetMax: value }))
                }
              />
            </FormSection>

            <FormSection title="Zonas" iconName="map-outline">
              <ChipGroup
                label="Selecciona zonas"
                options={ZONAS_OPTIONS}
                selectedIds={draft.zones}
                onSelect={(id) => {
                  setDraft((prev) => ({
                    ...prev,
                    zones: prev.zones.includes(id)
                      ? prev.zones.filter((zona) => zona !== id)
                      : [...prev.zones, id],
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
                      lifestyle: prev.lifestyle.includes(id)
                        ? prev.lifestyle.filter((chip) => chip !== id)
                        : [...prev.lifestyle, id],
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
                    interests: prev.interests.includes(id)
                      ? prev.interests.filter((item) => item !== id)
                      : [...prev.interests, id],
                  }));
                }}
                multiline
              />
            </FormSection>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <View style={styles.footerButtonSecondary}>
            <Button title="Resetear todo" variant="secondary" onPress={handleResetDraft} />
          </View>
          <View style={styles.footerButtonPrimary}>
            <Button title="Aplicar filtros" onPress={handleApply} />
          </View>
        </View>
      </View>
    </View>
  );
};

const RangeSlider: React.FC<{
  minBound: number;
  maxBound: number;
  step: number;
  minValue: number;
  maxValue: number;
  labels: string[];
  onDragStateChange: (isDragging: boolean) => void;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
}> = ({
  minBound,
  maxBound,
  step,
  minValue,
  maxValue,
  labels,
  onDragStateChange,
  onChangeMin,
  onChangeMax,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const minValueRef = React.useRef(minValue);
  const maxValueRef = React.useRef(maxValue);
  const activeThumbRef = React.useRef<'min' | 'max' | null>(null);

  useEffect(() => {
    minValueRef.current = minValue;
    maxValueRef.current = maxValue;
  }, [minValue, maxValue]);

  const valueToX = (value: number) => {
    if (!trackWidth) return 0;
    return ((value - minBound) / (maxBound - minBound)) * trackWidth;
  };

  const xToValue = (x: number) => {
    if (!trackWidth) return minBound;
    const raw = minBound + (x / trackWidth) * (maxBound - minBound);
    return clamp(snapToStep(raw, step), minBound, maxBound);
  };

  const minX = valueToX(minValue);
  const maxX = valueToX(maxValue);
  const ticks = Math.floor((maxBound - minBound) / step);

  return (
    <View
      style={styles.sliderContainer}
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width);
      }}
      pointerEvents="box-only"
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        if (!trackWidth) return;
        onDragStateChange(true);
        const touchX = event.nativeEvent.locationX;
        const minPos = valueToX(minValueRef.current);
        const maxPos = valueToX(maxValueRef.current);
        activeThumbRef.current =
          Math.abs(touchX - minPos) <= Math.abs(touchX - maxPos) ? 'min' : 'max';
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
      <View style={[styles.sliderThumb, { left: minX - 10 }]} />
      <View style={[styles.sliderThumb, { left: maxX - 10 }]} />
      <View style={styles.sliderTicks}>
        {Array.from({ length: ticks + 1 }).map((_, index) => (
          <View key={`tick-${index}`} style={styles.sliderTick} />
        ))}
      </View>
      <View style={styles.sliderLabels}>
        {labels.map((label) => (
          <Text key={label} style={styles.sliderLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

