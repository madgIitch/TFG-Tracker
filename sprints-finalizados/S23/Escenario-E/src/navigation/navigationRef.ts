// src/navigation/navigationRef.ts
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(screen: string, params?: Record<string, string>): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen as never, params as never);
  }
}
