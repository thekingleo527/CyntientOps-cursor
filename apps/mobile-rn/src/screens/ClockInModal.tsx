/**
 * ⏰ Clock In Modal
 * Allows workers to select a building, view details, and clock in with GPS.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ServiceContainer } from '@cyntientops/business-core';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ClockInRoute = RouteProp<RootStackParamList, 'ClockInModal'>;

export const ClockInModal: React.FC = () => {
  const route = useRoute<ClockInRoute>();
  const navigation = useNavigation<any>();
  const { workerId } = route.params;

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const assignedBuildings = useMemo(() => {
    const routines = RealDataService.getRoutinesByWorkerId(workerId);
    const ids = Array.from(new Set(routines.map((r: any) => r.buildingId)));
    return ids
      .map(id => RealDataService.getBuildingById(id))
      .filter(Boolean) as Array<{ id: string; name: string; address: string }>;
  }, [workerId]);

  const selectedBuilding = selectedBuildingId
    ? RealDataService.getBuildingById(selectedBuildingId)
    : null;

  const handleClockInHere = async () => {
    if (!selectedBuilding) {
      Alert.alert('Select a building', 'Please select a building first.');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to clock in.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const services = ServiceContainer.getInstance();
      const result = await services.clockIn.clockInWorker({
        workerId,
        buildingId: selectedBuilding.id,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy || 30,
        timestamp: new Date(),
      });
      if (result.success) {
        Alert.alert('Clocked In', `You are now clocked in at ${selectedBuilding.name}.`);
        navigation.goBack();
      } else {
        const message = result.validation.errors.join('\n') || 'Clock in validation failed.';
        Alert.alert('Clock In Failed', message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.item, selectedBuildingId === item.id && styles.itemSelected]}
      onPress={() => setSelectedBuildingId(item.id)}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemAddress}>{item.address}</Text>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigation.navigate('BuildingDetail', { buildingId: item.id })}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Building to Clock In</Text>
      </View>
      <FlatList
        data={assignedBuildings}
        keyExtractor={(b) => b.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.clockButton} onPress={handleClockInHere}>
        <Text style={styles.clockButtonText}>Clock In Here</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 80 },
  item: { backgroundColor: '#111', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#222' },
  itemSelected: { borderColor: '#10b981' },
  itemName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  itemAddress: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  viewButton: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  viewButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  clockButton: { position: 'absolute', left: 16, right: 16, bottom: 20, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  clockButtonText: { color: '#000', fontWeight: '700' },
});

export default ClockInModal;

