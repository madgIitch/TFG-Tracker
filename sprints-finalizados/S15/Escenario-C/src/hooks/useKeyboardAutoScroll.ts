import { RefObject, useEffect } from 'react';
import { Keyboard, Platform, ScrollView, TextInput } from 'react-native';

const getFocusedInputHandle = () => {
  const currentlyFocusedInput = TextInput.State.currentlyFocusedInput?.();
  if (currentlyFocusedInput) {
    return currentlyFocusedInput;
  }

  const currentlyFocusedField = TextInput.State.currentlyFocusedField?.();
  if (currentlyFocusedField) {
    return currentlyFocusedField;
  }

  return null;
};

export const useKeyboardAutoScroll = (
  scrollRef: RefObject<ScrollView | null>,
  extraOffset = 96
) => {
  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    const subscription = Keyboard.addListener(eventName, () => {
      const focusedInput = getFocusedInputHandle();
      if (!focusedInput || !scrollRef.current) {
        return;
      }

      scrollRef.current.scrollResponderScrollNativeHandleToKeyboard(
        focusedInput,
        extraOffset,
        true
      );
    });

    return () => {
      subscription.remove();
    };
  }, [extraOffset, scrollRef]);
};
