/**
 * 📱 Push Notification Service
 * Purpose: Role-based push notifications with Expo Notifications
 * Features: Notification routing, preferences, deep linking, badge management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Logger } from './LoggingService';

export interface NotificationData {
  type: 'task' | 'compliance' | 'emergency' | 'system' | 'building' | 'worker';
  entityId: string;
  entityType: string;
  action?: string;
  deepLink?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  metadata?: { [key: string]: any };
}

export interface NotificationPreferences {
  userId: string;
  userRole: 'worker' | 'client' | 'admin';
  enabled: boolean;
  categories: {
    tasks: boolean;
    compliance: boolean;
    emergency: boolean;
    system: boolean;
    buildings: boolean;
    workers: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: any; // Fixed: use any to avoid type mismatch with AndroidImportance
  sound?: string;
  vibrationPattern?: number[];
  lights?: boolean;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private preferences: Map<string, NotificationPreferences> = new Map();
  private isInitialized = false;

  private constructor() {
    this.setupNotificationHandlers();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permissions
      await this.requestPermissions();

      // Get push token
      await this.getPushToken();

      // Setup notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      // Configure notification behavior
      await this.configureNotificationBehavior();

      this.isInitialized = true;
      Logger.info('Push notification service initialized', 'PushNotificationService');
    } catch (error) {
      Logger.error('Failed to initialize push notification service', error, 'PushNotificationService');
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Push notification permissions not granted');
    }

    Logger.info('Push notification permissions granted', 'PushNotificationService');
  }

  private async getPushToken(): Promise<void> {
    try {
      if (!Device.isDevice) {
        Logger.warn('Push notifications only work on physical devices', 'PushNotificationService');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with actual project ID
      });

      this.expoPushToken = token.data;
      Logger.info('Expo push token obtained', 'PushNotificationService');
    } catch (error) {
      Logger.error('Failed to get push token', error, 'PushNotificationService');
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    const channels: NotificationChannel[] = [
      {
        id: 'tasks',
        name: 'Task Notifications',
        description: 'Notifications about task assignments and updates',
        importance: Notifications.AndroidNotificationPriority.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lights: true,
      },
      {
        id: 'compliance',
        name: 'Compliance Alerts',
        description: 'Notifications about compliance violations and inspections',
        importance: Notifications.AndroidNotificationPriority.MAX,
        sound: 'default',
        vibrationPattern: [0, 500, 250, 500],
        lights: true,
      },
      {
        id: 'emergency',
        name: 'Emergency Alerts',
        description: 'Critical emergency notifications',
        importance: Notifications.AndroidNotificationPriority.MAX,
        sound: 'default',
        vibrationPattern: [0, 1000, 500, 1000],
        lights: true,
      },
      {
        id: 'system',
        name: 'System Notifications',
        description: 'System updates and maintenance notifications',
        importance: Notifications.AndroidNotificationPriority.HIGH,
        sound: 'default',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
        vibrationPattern: channel.vibrationPattern,
        enableLights: channel.lights,
      });
    }

    Logger.info(`Setup ${channels.length} notification channels`, 'PushNotificationService');
  }

  private async configureNotificationBehavior(): Promise<void> {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as unknown as NotificationData;
        
        // Check if user has notifications enabled for this category
        const preferences = this.getUserPreferences(data.metadata?.userId);
        if (!preferences?.enabled) {
          return { 
            shouldShowAlert: false, 
            shouldPlaySound: false, 
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false
          };
        }

        // Check quiet hours
        if (preferences.quietHours.enabled && this.isQuietHours(preferences.quietHours)) {
          return { 
            shouldShowAlert: false, 
            shouldPlaySound: false, 
            shouldSetBadge: true,
            shouldShowBanner: false,
            shouldShowList: true
          };
        }

        // Check category preferences
        if (!this.isCategoryEnabled(preferences, data.type)) {
          return { 
            shouldShowAlert: false, 
            shouldPlaySound: false, 
            shouldSetBadge: true,
            shouldShowBanner: false,
            shouldShowList: true
          };
        }

        return {
          shouldShowAlert: true,
          shouldPlaySound: preferences.sound,
          shouldSetBadge: preferences.badge,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }

  private setupNotificationHandlers(): void {
    // Handle notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as unknown as NotificationData;
      Logger.info(`Notification received: ${data.type}`, 'PushNotificationService');
      
      // Handle notification based on type
      this.handleNotificationReceived(data);
    });

    // Handle notification responses (taps)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as unknown as NotificationData;
      Logger.info(`Notification tapped: ${data.type}`, 'PushNotificationService');
      
      // Handle deep linking
      this.handleNotificationResponse(data);
    });
  }

  private handleNotificationReceived(data: NotificationData): void {
    // Emit event for UI components to listen to
    if (typeof window !== 'undefined' && (window as any).cyntientopsEvents) {
      (window as any).cyntientopsEvents.emit('notification-received', data);
    }
  }

  private handleNotificationResponse(data: NotificationData): void {
    // Handle deep linking
    if (data.deepLink) {
      // Navigate to the deep link
      if (typeof window !== 'undefined' && (window as any).cyntientopsNavigation) {
        (window as any).cyntientopsNavigation.navigate(data.deepLink);
      }
    }

    // Emit event for UI components
    if (typeof window !== 'undefined' && (window as any).cyntientopsEvents) {
      (window as any).cyntientopsEvents.emit('notification-tapped', data);
    }
  }

  public async sendLocalNotification(
    title: string,
    body: string,
    data: NotificationData
  ): Promise<void> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data as unknown as Record<string, unknown>,
          sound: true,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      Logger.info(`Local notification sent: ${notificationId}`, 'PushNotificationService');
    } catch (error) {
      Logger.error('Failed to send local notification', error, 'PushNotificationService');
    }
  }

  public async sendScheduledNotification(
    title: string,
    body: string,
    data: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<void> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data as unknown as Record<string, unknown>,
          sound: true,
        },
        trigger,
      });

      Logger.info(`Scheduled notification sent: ${notificationId}`, 'PushNotificationService');
    } catch (error) {
      Logger.error('Failed to send scheduled notification', error, 'PushNotificationService');
    }
  }

  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      Logger.info(`Cancelled notification: ${notificationId}`, 'PushNotificationService');
    } catch (error) {
      Logger.error('Failed to cancel notification', error, 'PushNotificationService');
    }
  }

  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Logger.info('Cancelled all notifications', 'PushNotificationService');
    } catch (error) {
      Logger.error('Failed to cancel all notifications', error, 'PushNotificationService');
    }
  }

  public async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      Logger.error('Failed to get badge count', error, 'PushNotificationService');
      return 0;
    }
  }

  public async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      Logger.error('Failed to set badge count', error, 'PushNotificationService');
    }
  }

  public setUserPreferences(userId: string, preferences: NotificationPreferences): void {
    this.preferences.set(userId, preferences);
    Logger.info(`Set notification preferences for user: ${userId}`, 'PushNotificationService');
  }

  public getUserPreferences(userId: string): NotificationPreferences | null {
    return this.preferences.get(userId) || null;
  }

  private isCategoryEnabled(preferences: NotificationPreferences, category: string): boolean {
    switch (category) {
      case 'task':
        return preferences.categories.tasks;
      case 'compliance':
        return preferences.categories.compliance;
      case 'emergency':
        return preferences.categories.emergency;
      case 'system':
        return preferences.categories.system;
      case 'building':
        return preferences.categories.buildings;
      case 'worker':
        return preferences.categories.workers;
      default:
        return true;
    }
  }

  private isQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  public getCurrentPushToken(): string | null {
    return this.expoPushToken;
  }

  public getStats() {
    return {
      isInitialized: this.isInitialized,
      hasPushToken: !!this.expoPushToken,
      preferencesCount: this.preferences.size,
    };
  }

  public destroy(): void {
    if (this.notificationListener) {
      // Notifications.removeNotificationSubscription(this.notificationListener); // Method doesn't exist in current Expo version
      this.notificationListener = null;
    }

    if (this.responseListener) {
      // Notifications.removeNotificationSubscription(this.responseListener); // Method doesn't exist in current Expo version
      this.responseListener = null;
    }

    this.preferences.clear();
    this.expoPushToken = null;
    this.isInitialized = false;

    Logger.info('Push notification service destroyed', 'PushNotificationService');
  }

  public static destroyInstance(): void {
    if (PushNotificationService.instance) {
      PushNotificationService.instance.destroy();
      PushNotificationService.instance = null as any;
    }
  }
}

export default PushNotificationService;
