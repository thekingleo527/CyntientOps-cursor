/**
 * Mock expo-location for development
 */

export const Location = {
  requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
  requestBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
  getForegroundPermissionsAsync: async () => ({ status: 'granted' }),
  getBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
  getCurrentPositionAsync: async () => ({
    coords: {
      latitude: 40.7589,
      longitude: -73.9851,
      altitude: 10,
      accuracy: 5,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  }),
  watchPositionAsync: async () => ({
    remove: () => {},
  }),
  geocodeAsync: async (address: string) => [{
    latitude: 40.7589,
    longitude: -73.9851,
    altitude: 10,
    accuracy: 5,
  }],
  reverseGeocodeAsync: async (location: { latitude: number; longitude: number }) => [{
    city: 'New York',
    region: 'NY',
    country: 'US',
    postalCode: '10001',
    name: 'Mock Address',
  }],
};

export const LocationAccuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export default Location;
