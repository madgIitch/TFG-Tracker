import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Keyboard,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FormKeyboardWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withScroll?: boolean;
}

export const FormKeyboardWrapper: React.FC<FormKeyboardWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  withScroll = true,
}) => {
  const insets = useSafeAreaInsets();

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0; // Ajustar si es necesario según el header

  const Wrapper = withScroll ? ScrollView : View;

  const content = (
    <Wrapper
      style={[styles.scrollContainer, style]}
      contentContainerStyle={[
        withScroll && styles.scrollContentContainer,
        withScroll && { paddingBottom: Math.max(insets.bottom, 24) },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.innerContainer}>{children}</View>
    </Wrapper>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {content}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
  },
});
