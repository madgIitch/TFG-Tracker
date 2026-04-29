import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  iconName?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

interface ErrorBannerProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

interface LoadingStateProps {
  label?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'information-circle-outline',
  title,
  message,
  actionLabel,
  onActionPress,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.emptyContainer,
        {
          backgroundColor: theme.colors.cardSurfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityLabel={message ? `${title}. ${message}` : title}
    >
      <View style={[styles.iconBubble, { backgroundColor: theme.colors.surfaceLight }]}>
        <Ionicons name={iconName} size={22} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          size="small"
          variant="secondary"
          style={styles.stateAction}
        />
      ) : null}
    </View>
  );
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'No se pudo actualizar',
  message,
  actionLabel = 'Reintentar',
  onActionPress,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.errorBanner,
        {
          backgroundColor: theme.colors.errorLight,
          borderColor: theme.colors.error,
        },
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name="warning-outline" size={18} color={theme.colors.error} />
      <View style={styles.errorCopy}>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      </View>
      {onActionPress ? (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          size="small"
          variant="secondary"
          accessibilityHint="Vuelve a intentar cargar la informacion"
        />
      ) : null}
    </View>
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Cargando' }) => {
  const theme = useTheme();

  return (
    <View
      style={styles.loadingContainer}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  stateAction: {
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  errorCopy: {
    flex: 1,
    gap: 3,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
