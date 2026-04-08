/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));
jest.mock('@react-native-firebase/messaging', () => {
  const messagingMock = () => ({
    requestPermission: jest.fn().mockResolvedValue(1),
    registerDeviceForRemoteMessages: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    deleteToken: jest.fn().mockResolvedValue(undefined),
  });

  messagingMock.AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };

  return messagingMock;
});
jest.mock('../src/navigation/AppNavigator', () => ({
  AppNavigator: () => null,
}));
jest.mock('../src/config/google', () => ({
  configureGoogleSignIn: jest.fn(),
}));
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
