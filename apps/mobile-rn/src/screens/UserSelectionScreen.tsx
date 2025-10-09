import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface UserCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  onPress: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ title, description, icon, gradient, onPress }) => (
  <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
    <BlurView intensity={20} style={styles.card}>
      <LinearGradient
        colors={gradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={32} color="white" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </LinearGradient>
    </BlurView>
  </TouchableOpacity>
);

export default function UserSelectionScreen() {
  const { user, setUser } = useAuth();
  const navigation = useNavigation();

  const handleRoleSelection = (role: 'worker' | 'client' | 'admin') => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      navigation.navigate('MainTabs' as never);
    }
  };

  const userCards = [
    {
      title: 'Worker',
      description: 'Manage tasks, view schedules, and track progress',
      icon: 'construct' as keyof typeof Ionicons.glyphMap,
      gradient: ['#10b981', '#059669'],
      role: 'worker' as const,
    },
    {
      title: 'Client',
      description: 'Monitor projects, view reports, and communicate',
      icon: 'business' as keyof typeof Ionicons.glyphMap,
      gradient: ['#3b82f6', '#1d4ed8'],
      role: 'client' as const,
    },
    {
      title: 'Admin',
      description: 'Oversee operations, manage users, and analytics',
      icon: 'settings' as keyof typeof Ionicons.glyphMap,
      gradient: ['#8b5cf6', '#7c3aed'],
      role: 'admin' as const,
    },
  ];

  return (
    <LinearGradient
      colors={['#1e40af', '#3b82f6', '#60a5fa']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        <View style={styles.cardsContainer}>
          {userCards.map((card, index) => (
            <UserCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              gradient={card.gradient}
              onPress={() => handleRoleSelection(card.role)}
            />
          ))}
        </View>

        <View style={styles.infoContainer}>
          <BlurView intensity={20} style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <Text style={styles.infoText}>
                You can switch between roles at any time from the main dashboard
              </Text>
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 30,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardGradient: {
    padding: 24,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    marginTop: 20,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});
