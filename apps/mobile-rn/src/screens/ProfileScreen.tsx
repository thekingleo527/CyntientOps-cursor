/**
 * 👤 Profile Screen
 * Minimal profile screen with a logout button at the bottom.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { WorkerProfileView, ClientProfileView, AdminProfileView } from '@cyntientops/ui-components';

type ProfileRoute = RouteProp<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
  const route = useRoute<ProfileRoute>();
  const navigation = useNavigation<any>();
  const userName: string = (route.params as any)?.userName || 'User';
  const userRole: string = (route.params as any)?.userRole || 'worker';
  const userId: string | undefined = (route.params as any)?.userId;
  const onLogout: (() => void) | undefined = (route.params as any)?.onLogout;

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{userName}</Text>
        <Text style={styles.subtitle}>{userRole.toUpperCase()}</Text>

        <View style={styles.profileContent}>
          {userRole === 'worker' && userId && (
            <WorkerProfileView workerId={userId} onLogout={onLogout} />
          )}
          {userRole === 'client' && userId && (
            <ClientProfileView clientId={userId} onLogout={onLogout} />
          )}
          {userRole === 'admin' && userId && (
            <AdminProfileView adminId={userId} onLogout={onLogout} />
          )}
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, padding: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#9ca3af', marginTop: 4 },
  profileContent: { marginTop: 12, flex: 1 },
  spacer: { flex: 1 },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700' },
});

export default ProfileScreen;
