/**
 * Mock expo-speech for development
 */

export const Speech = {
  speak: async (text: string) => {
    console.log('Speech:', text);
  },
  stop: async () => {
    console.log('Speech stopped');
  },
};

export default Speech;
