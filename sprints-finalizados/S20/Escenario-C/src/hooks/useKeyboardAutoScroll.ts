import { RefObject, useEffect } from 'react';
import { Keyboard, Platform, TextInput } from 'react-native';

type KeyboardScrollable = {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number | unknown,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean
  ) => void;
};

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
  scrollRef: RefObject<unknown | null>,
  extraOffset = 96
) => {
  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    const subscription = Keyboard.addListener(eventName, () => {
      const focusedInput = getFocusedInputHandle();
      const currentScrollable = scrollRef.current as KeyboardScrollable | null;
      if (!focusedInput || !currentScrollable) {
        return;
      }

      currentScrollable.scrollResponderScrollNativeHandleToKeyboard?.(
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
