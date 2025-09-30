/**
 * Mock expo-av for development
 */

export const Audio = {
  Recording: {
    startAsync: async () => {},
    stopAndUnloadAsync: async () => {},
  },
  Sound: {
    createAsync: async () => ({ sound: { playAsync: async () => {} } }),
  },
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  setAudioModeAsync: async () => {},
  RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4: 'mpeg4',
  RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC: 'aac',
  RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC: 'mpeg4aac',
  RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH: 'high',
};

export default Audio;
