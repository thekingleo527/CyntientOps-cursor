import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useServices } from '../../providers/AppProvider';

type RouteParams = { buildingId: string };

const LL97DetailScreen: React.FC = () => {
  const services = useServices();
  const route = useRoute();
  const { buildingId } = (route.params || {}) as RouteParams;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch emissions via NYC API through service container
        const nyc = services.apiClients.nyc;
        const bbl = nyc.extractBBL(buildingId);
        const emissions = await nyc.getLL97Emissions(bbl);
        if (!mounted) return;
        setItems(Array.isArray(emissions) ? emissions : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load LL97 emissions');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [buildingId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LL97 Emissions ({items.length})</Text>
      <FlatList
        data={items}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Year: {item.calendar_year || item.year}</Text>
            <Text style={styles.cardSub}>Total: {item.total_ghg_emissions_intensity || item.totalEmissions}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  error: { color: '#f87171', fontSize: 16 },
  card: { backgroundColor: '#111', padding: 12, borderRadius: 8, marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardSub: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
});

export default LL97DetailScreen;

