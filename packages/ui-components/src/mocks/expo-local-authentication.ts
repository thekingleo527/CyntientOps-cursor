/**
 * Mock expo-local-authentication for development
 */

export const LocalAuthentication = {
  hasHardwareAsync: async () => true,
  isEnrolledAsync: async () => true,
  supportedAuthenticationTypesAsync: async () => [1, 2, 3],
  authenticateAsync: async () => ({ success: true }),
  cancelAuthenticate: () => {},
};

export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
};

export default LocalAuthentication;
