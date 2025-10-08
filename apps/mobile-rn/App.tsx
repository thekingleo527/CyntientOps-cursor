import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0f8ff', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e40af' }}>⚡ Lightning</Text>
      <Text style={{ fontSize: 16, color: '#10b981', marginTop: 5 }}>Ultra-Fast Build</Text>
    </View>
  );
}
