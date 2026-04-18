import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(screen: string, params?: Record<string, unknown>): void {
  if (!navigationRef.isReady()) return;
  (navigationRef as any).navigate(screen, params);
}
