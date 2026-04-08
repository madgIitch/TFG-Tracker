import React, { useEffect } from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwipeFiltersProvider, useSwipeFilters, DEFAULT_SWIPE_FILTERS } from '../../src/context/SwipeFiltersContext';
import { Text } from 'react-native';

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

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    onMessage: jest.fn(),
    getToken: jest.fn(),
  })),
}));

const TestComponent = () => {
  const { filters, setFilters, resetFilters, loading } = useSwipeFilters();
  
  if (loading) return <Text>Loading...</Text>;
  
  return (
    <>
      <Text testID="filters">{JSON.stringify(filters)}</Text>
      <Text testID="update" onPress={() => setFilters({ ...filters, ageMin: 22 })}>Update</Text>
      <Text testID="reset" onPress={() => resetFilters()}>Reset</Text>
    </>
  );
};

describe('SwipeFiltersContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads default filters initially when storage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    
    const { getByTestId, queryByText } = render(
      <SwipeFiltersProvider>
        <TestComponent />
      </SwipeFiltersProvider>
    );
    
    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
    expect(getByTestId('filters').props.children).toBe(JSON.stringify(DEFAULT_SWIPE_FILTERS));
  });

  it('loads stored filters from AsyncStorage', async () => {
    const storedFilters = { ...DEFAULT_SWIPE_FILTERS, budgetMax: 800 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedFilters));
    
    const { getByTestId, queryByText } = render(
      <SwipeFiltersProvider>
        <TestComponent />
      </SwipeFiltersProvider>
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
    expect(getByTestId('filters').props.children).toBe(JSON.stringify(storedFilters));
  });

  it('updates filters and persists them to AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    
    const { getByTestId, queryByText } = render(
      <SwipeFiltersProvider>
        <TestComponent />
      </SwipeFiltersProvider>
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
    
    await act(async () => {
      getByTestId('update').props.onPress();
    });

    const expectedFilters = { ...DEFAULT_SWIPE_FILTERS, ageMin: 22 };
    expect(getByTestId('filters').props.children).toBe(JSON.stringify(expectedFilters));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('swipeFilters', JSON.stringify(expectedFilters));
  });

  it('resets filters back to default values', async () => {
    const storedFilters = { ...DEFAULT_SWIPE_FILTERS, ageMin: 22 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedFilters));
    
    const { getByTestId, queryByText } = render(
      <SwipeFiltersProvider>
        <TestComponent />
      </SwipeFiltersProvider>
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
    
    await act(async () => {
      getByTestId('reset').props.onPress();
    });

    expect(getByTestId('filters').props.children).toBe(JSON.stringify(DEFAULT_SWIPE_FILTERS));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('swipeFilters', JSON.stringify(DEFAULT_SWIPE_FILTERS));
  });
});
