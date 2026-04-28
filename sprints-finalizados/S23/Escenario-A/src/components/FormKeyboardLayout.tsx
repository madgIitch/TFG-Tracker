import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useKeyboardAutoScroll } from '../hooks/useKeyboardAutoScroll';

type FormKeyboardLayoutProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraOffset?: number;
  keyboardVerticalOffsetIOS?: number;
  scrollEnabled?: boolean;
};

export const FormKeyboardLayout: React.FC<FormKeyboardLayoutProps> = ({
  children,
  header,
  containerStyle,
  contentStyle,
  contentContainerStyle,
  extraOffset = 88,
  keyboardVerticalOffsetIOS = 20,
  scrollEnabled = true,
}) => {
  const { scrollRef } = useKeyboardAutoScroll({ extraOffset });

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffsetIOS : 0}
    >
      {header}
      <ScrollView
        ref={scrollRef}
        style={[{ flex: 1 }, contentStyle]}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        scrollEnabled={scrollEnabled}
      >
        <View>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
