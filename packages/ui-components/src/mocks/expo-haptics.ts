/**
 * Mock expo-haptics for development
 */

export const Haptics = {
  impactAsync: async (style: any) => {
    console.log('Haptic feedback:', style);
  },
  notificationAsync: async (type: any) => {
    console.log('Haptic notification:', type);
  },
  selectionAsync: async () => {
    console.log('Haptic selection');
  },
};

export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
};

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
};

export default Haptics;
