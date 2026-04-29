import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

type Option = {
  id: string;
  label: string;
  subtitle?: string;
};

type LocationSearchSelectProps = {
  label: string;
  placeholder?: string;
  valueLabel?: string;
  selectedOption?: Option | null;
  onSearch: (query: string) => Promise<Option[]>;
  onSelect: (option: Option) => void;
  onClear?: () => void;
  disabled?: boolean;
  helperText?: string;
};

export const LocationSearchSelect: React.FC<LocationSearchSelectProps> = ({
  label,
  placeholder,
  valueLabel,
  selectedOption,
  onSearch,
  onSelect,
  onClear,
  disabled,
  helperText,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!expanded || query.trim().length < 2 || disabled) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      onSearch(query)
        .then((items) => {
          if (!active) return;
          setOptions(items);
        })
        .catch(() => {
          if (!active) return;
          setOptions([]);
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [expanded, query, onSearch, disabled]);

  const displayValue = selectedOption?.label ?? valueLabel ?? '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {displayValue ? (
        <View style={styles.selectedChipRow}>
          <View style={styles.selectedChip}>
            <Text style={styles.selectedChipText}>{displayValue}</Text>
          </View>
          {onClear ? (
            <Pressable
              disabled={disabled}
              onPress={onClear}
              style={styles.clearChipButton}
            >
              <Text style={styles.clearChipText}>Quitar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.inputWrap, disabled && styles.inputWrapDisabled]}>
        <Ionicons
          name="search-outline"
          size={16}
          color={theme.colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          value={query}
          editable={!disabled}
          onChangeText={(text) => {
            setQuery(text);
            if (!expanded) setExpanded(true);
          }}
          onFocus={() => setExpanded(true)}
          placeholder={placeholder ?? 'Buscar...'}
          placeholderTextColor={theme.colors.textTertiary}
          style={styles.input}
        />
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Pressable
            onPress={() => {
              setExpanded((prev) => !prev);
              if (expanded) {
                setQuery('');
                setOptions([]);
              }
            }}
            disabled={disabled}
          >
            <Ionicons
              name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={16}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      {expanded && !disabled ? (
        <View style={styles.dropdown}>
          {options.length === 0 ? (
            <Text style={styles.emptyText}>
              {query.trim().length < 2
                ? 'Escribe al menos 2 letras.'
                : 'Sin resultados.'}
            </Text>
          ) : (
            options.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => {
                  onSelect(option);
                  setExpanded(false);
                  setQuery('');
                  setOptions([]);
                }}
                style={styles.optionRow}
              >
                <Text style={styles.optionTitle}>{option.label}</Text>
                {option.subtitle ? (
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    selectedChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    selectedChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.primaryLight,
    },
    selectedChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    clearChipButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardSurface,
    },
    clearChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    inputWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      backgroundColor: theme.colors.cardSurface,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
    },
    inputWrapDisabled: {
      opacity: 0.6,
    },
    inputIcon: {
      marginRight: 2,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      paddingVertical: 10,
    },
    helperText: {
      marginTop: 6,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    dropdown: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.cardSurface,
      overflow: 'hidden',
    },
    emptyText: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    optionRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    optionTitle: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    optionSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
