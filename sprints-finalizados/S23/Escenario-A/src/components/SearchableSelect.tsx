import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

export type SearchableOption = {
  id: string;
  label: string;
};

type SearchableSelectProps = {
  label: string;
  placeholder?: string;
  valueLabel?: string;
  options: SearchableOption[];
  onSearch: (query: string) => void;
  onSelect: (option: SearchableOption) => void;
  required?: boolean;
  disabled?: boolean;
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Buscar...',
  valueLabel,
  options,
  onSearch,
  onSelect,
  required = false,
  disabled = false,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 16,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 8,
        },
        required: {
          color: theme.colors.error,
        },
        selectButton: {
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.glassBgStrong,
          opacity: disabled ? 0.6 : 1,
        },
        selectText: {
          color: valueLabel ? theme.colors.text : theme.colors.textTertiary,
          fontSize: 15,
          flex: 1,
          marginRight: 10,
        },
        modalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(2, 6, 23, 0.6)',
          justifyContent: 'center',
          padding: 20,
        },
        modalCard: {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          maxHeight: '75%',
          overflow: 'hidden',
        },
        modalHeader: {
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        modalTitle: {
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: '700',
        },
        searchInput: {
          margin: 12,
          marginTop: 10,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: theme.colors.text,
          backgroundColor: theme.colors.glassBgStrong,
        },
        optionRow: {
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        optionText: {
          color: theme.colors.text,
          fontSize: 14,
        },
        emptyText: {
          color: theme.colors.textSecondary,
          paddingHorizontal: 14,
          paddingVertical: 18,
        },
      }),
    [disabled, theme.colors, valueLabel]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          if (disabled) return;
          setVisible(true);
          onSearch('');
        }}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text numberOfLines={1} style={styles.selectText}>
          {valueLabel ?? placeholder}
        </Text>
        <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={(next) => {
                setQuery(next);
                onSearch(next);
              }}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="none"
            />
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.emptyText}>Sin resultados</Text>
              ) : (
                options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionRow}
                    onPress={() => {
                      onSelect(option);
                      setVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
