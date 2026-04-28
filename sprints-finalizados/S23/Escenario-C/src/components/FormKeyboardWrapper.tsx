import React, { useRef } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useKeyboardAutoScroll } from '../hooks/useKeyboardAutoScroll';

type FormKeyboardWrapperProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraOffset?: number;
  showsVerticalScrollIndicator?: boolean;
};

export const FormKeyboardWrapper: React.FC<FormKeyboardWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  extraOffset,
  showsVerticalScrollIndicator = false,
}) => {
  const scrollRef = useRef<KeyboardAwareScrollView | null>(null);
  useKeyboardAutoScroll(scrollRef, extraOffset ?? (Platform.OS === 'ios' ? 12 : 96));

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'ios' ? 12 : 0}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};
