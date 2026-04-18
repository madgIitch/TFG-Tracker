import { useCallback, useEffect, useRef } from 'react';
import { findNodeHandle, Keyboard, Platform, ScrollView, TextInput } from 'react-native';

type Options = {
  extraOffset?: number;
  focusDelayMs?: number;
};

export const useKeyboardAutoScroll = (options: Options = {}) => {
  const { extraOffset = 72, focusDelayMs = 50 } = options;
  const scrollRef = useRef<ScrollView | null>(null);

  const scrollToFocusedInput = useCallback(() => {
    const focusedInput =
      TextInput.State.currentlyFocusedInput?.() ??
      (TextInput.State.currentlyFocusedField?.() as number | null);

    if (!focusedInput || !scrollRef.current) {
      return;
    }

    const nodeHandle =
      typeof focusedInput === 'number'
        ? focusedInput
        : findNodeHandle(focusedInput as unknown as object);

    if (!nodeHandle) {
      return;
    }

    const responder = scrollRef.current as unknown as {
      scrollResponderScrollNativeHandleToKeyboard?: (
        nodeHandle: number,
        additionalOffset?: number,
        preventNegativeScrollOffset?: boolean
      ) => void;
    };

    responder.scrollResponderScrollNativeHandleToKeyboard?.(
      nodeHandle,
      extraOffset,
      true
    );
  }, [extraOffset]);

  const handleInputFocus = useCallback(() => {
    setTimeout(scrollToFocusedInput, focusDelayMs);
  }, [focusDelayMs, scrollToFocusedInput]);

  useEffect(() => {
    const eventName =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const subscription = Keyboard.addListener(eventName, () => {
      setTimeout(scrollToFocusedInput, focusDelayMs);
    });

    return () => {
      subscription.remove();
    };
  }, [focusDelayMs, scrollToFocusedInput]);

  return {
    scrollRef,
    handleInputFocus,
  };
};
