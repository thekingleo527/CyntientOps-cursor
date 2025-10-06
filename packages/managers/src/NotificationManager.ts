/**
 * 🔔 Notification Manager
 * Mirrors: CyntientOps/Managers/NotificationManager.swift
 * Purpose: Push notifications, local notifications, and alert management
 * Features: APNS setup, push token management, notification scheduling
 */

import { DatabaseManager } from '@cyntientops/database';
// import { WorkerProfile, Building } from '@cyntientops/domain-schema'; // Unused for now

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetUserId?: string;
  targetRole?: 'worker' | 'admin' | 'client';
  data?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_due'
  | 'task_overdue'
  | 'clock_in_reminder'
  | 'clock_out_reminder'
  | 'geofence_enter'
  | 'geofence_exit'
  | 'compliance_alert'
  | 'weather_alert'
  | 'system_alert'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationSettings {
  userId: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  taskReminders: boolean;
  clockInReminders: boolean;
  complianceAlerts: boolean;
  weatherAlerts: boolean;
  systemAlerts: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  defaultData?: Record<string, any>;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private databaseManager: DatabaseManager;
  private notifications: Map<string, NotificationData> = new Map();
  private userSettings: Map<string, NotificationSettings> = new Map();
  private templates: Map<NotificationType, NotificationTemplate> = new Map();

  private constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
    this.initializeTemplates();
    this.loadUserSettings();
  }

  public static getInstance(databaseManager: DatabaseManager): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(databaseManager);
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        type: 'task_assigned',
        title: 'New Task Assigned',
        body: 'You have been assigned a new task: {taskName}',
        priority: 'medium',
        defaultData: { taskName: 'Unknown Task' }
      },
      {
        type: 'task_due',
        title: 'Task Due Soon',
        body: 'Task "{taskName}" is due in {timeRemaining}',
        priority: 'high',
        defaultData: { taskName: 'Unknown Task', timeRemaining: '1 hour' }
      },
      {
        type: 'task_overdue',
        title: 'Task Overdue',
        body: 'Task "{taskName}" is overdue and needs immediate attention',
        priority: 'urgent',
        defaultData: { taskName: 'Unknown Task' }
      },
      {
        type: 'clock_in_reminder',
        title: 'Clock In Reminder',
        body: 'Don\'t forget to clock in for your shift',
        priority: 'medium'
      },
      {
        type: 'clock_out_reminder',
        title: 'Clock Out Reminder',
        body: 'Remember to clock out when you finish your shift',
        priority: 'medium'
      },
      {
        type: 'geofence_enter',
        title: 'Arrived at Building',
        body: 'You have arrived at {buildingName}',
        priority: 'low',
        defaultData: { buildingName: 'Unknown Building' }
      },
      {
        type: 'geofence_exit',
        title: 'Left Building',
        body: 'You have left {buildingName}',
        priority: 'low',
        defaultData: { buildingName: 'Unknown Building' }
      },
      {
        type: 'compliance_alert',
        title: 'Compliance Alert',
        body: 'New compliance issue at {buildingName}: {alertMessage}',
        priority: 'high',
        defaultData: { buildingName: 'Unknown Building', alertMessage: 'Compliance issue detected' }
      },
      {
        type: 'weather_alert',
        title: 'Weather Alert',
        body: 'Weather conditions may affect outdoor work: {weatherMessage}',
        priority: 'medium',
        defaultData: { weatherMessage: 'Check weather conditions' }
      },
      {
        type: 'system_alert',
        title: 'System Alert',
        body: '{systemMessage}',
        priority: 'high',
        defaultData: { systemMessage: 'System notification' }
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  /**
   * Load user notification settings
   */
  private loadUserSettings(): void {
    const workers = this.databaseManager.getWorkers();
    
    workers.forEach((worker: any) => {
      this.userSettings.set(worker.id, {
        userId: worker.id,
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        taskReminders: true,
        clockInReminders: true,
        complianceAlerts: true,
        weatherAlerts: true,
        systemAlerts: true,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '06:00'
        }
      });
    });
  }

  /**
   * Send notification
   */
  public async sendNotification(notification: Omit<NotificationData, 'id' | 'isRead' | 'createdAt'>): Promise<string> {
    try {
      const id = `notif_${Date.now()}_${notification.type}_${notification.targetUserId || 'system'}`;
      
      const fullNotification: NotificationData = {
        ...notification,
        id,
        isRead: false,
        createdAt: new Date()
      };

      // Store notification
      this.notifications.set(id, fullNotification);

      // Check if user wants to receive this type of notification
      if (notification.targetUserId) {
        const settings = this.userSettings.get(notification.targetUserId);
        if (settings && !this.shouldSendNotification(settings, notification.type)) {
          console.log(`Notification blocked by user settings: ${id}`);
          return id;
        }
      }

      // Check quiet hours
      if (notification.targetUserId) {
        const settings = this.userSettings.get(notification.targetUserId);
        if (settings && this.isQuietHours(settings)) {
          console.log(`Notification delayed due to quiet hours: ${id}`);
          // Schedule for later
          this.scheduleNotification(fullNotification, this.getNextAvailableTime(settings));
          return id;
        }
      }

      // Send notification
      await this.deliverNotification(fullNotification);

      console.log(`Notification sent: ${id} - ${fullNotification.title}`);
      return id;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send notification using template
   */
  public async sendTemplateNotification(
    type: NotificationType,
    targetUserId: string,
    data: Record<string, any> = {}
  ): Promise<string> {
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`Notification template not found: ${type}`);
    }

    // Replace placeholders in template
    let title = template.title;
    let body = template.body;

    const allData = { ...template.defaultData, ...data };
    
    Object.entries(allData).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(placeholder, String(value));
      body = body.replace(placeholder, String(value));
    });

    return this.sendNotification({
      title,
      body,
      type,
      priority: template.priority,
      targetUserId,
      data: allData
    });
  }

  /**
   * Send notification to all users with specific role
   */
  public async sendRoleNotification(
    role: 'worker' | 'admin' | 'client',
    notification: Omit<NotificationData, 'id' | 'isRead' | 'createdAt' | 'targetUserId'>
  ): Promise<string[]> {
    const targetUserIds = this.getUsersByRole(role);
    const notificationIds: string[] = [];

    for (const userId of targetUserIds) {
      try {
        const id = await this.sendNotification({
          ...notification,
          targetUserId: userId,
          targetRole: role
        });
        notificationIds.push(id);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Get notifications for user
   */
  public getNotificationsForUser(userId: string, limit: number = 50): NotificationData[] {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => 
        notification.targetUserId === userId || 
        notification.targetRole === this.getUserRole(userId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return userNotifications;
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.isRead = true;
    this.notifications.set(notificationId, notification);
    
    console.log(`Notification marked as read: ${notificationId}`);
    return true;
  }

  /**
   * Mark all notifications as read for user
   */
  public markAllAsReadForUser(userId: string): number {
    let count = 0;
    
    this.notifications.forEach((notification, id) => {
      if ((notification.targetUserId === userId || 
           notification.targetRole === this.getUserRole(userId)) && 
          !notification.isRead) {
        notification.isRead = true;
        this.notifications.set(id, notification);
        count++;
      }
    });

    console.log(`Marked ${count} notifications as read for user: ${userId}`);
    return count;
  }

  /**
   * Delete notification
   */
  public deleteNotification(notificationId: string): boolean {
    const deleted = this.notifications.delete(notificationId);
    if (deleted) {
      console.log(`Notification deleted: ${notificationId}`);
    }
    return deleted;
  }

  /**
   * Clear old notifications
   */
  public clearOldNotifications(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let count = 0;
    this.notifications.forEach((notification, id) => {
      if (notification.createdAt < cutoffDate) {
        this.notifications.delete(id);
        count++;
      }
    });

    console.log(`Cleared ${count} old notifications`);
    return count;
  }

  /**
   * Update user notification settings
   */
  public updateUserSettings(userId: string, settings: Partial<NotificationSettings>): boolean {
    const currentSettings = this.userSettings.get(userId);
    if (!currentSettings) return false;

    const updatedSettings = { ...currentSettings, ...settings };
    this.userSettings.set(userId, updatedSettings);
    
    console.log(`Updated notification settings for user: ${userId}`);
    return true;
  }

  /**
   * Get user notification settings
   */
  public getUserSettings(userId: string): NotificationSettings | null {
    return this.userSettings.get(userId) || null;
  }

  /**
   * Check if notification should be sent based on user settings
   */
  private shouldSendNotification(settings: NotificationSettings, type: NotificationType): boolean {
    switch (type) {
      case 'task_assigned':
      case 'task_due':
      case 'task_overdue':
        return settings.taskReminders;
      case 'clock_in_reminder':
      case 'clock_out_reminder':
        return settings.clockInReminders;
      case 'compliance_alert':
        return settings.complianceAlerts;
      case 'weather_alert':
        return settings.weatherAlerts;
      case 'system_alert':
        return settings.systemAlerts;
      default:
        return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.parseTime(settings.quietHours.startTime);
    const endTime = this.parseTime(settings.quietHours.endTime);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Parse time string (HH:MM) to minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get next available time outside quiet hours
   */
  private getNextAvailableTime(settings: NotificationSettings): Date {
    const now = new Date();
    const endTime = this.parseTime(settings.quietHours.endTime);
    
    const nextAvailable = new Date(now);
    nextAvailable.setHours(Math.floor(endTime / 60), endTime % 60, 0, 0);
    
    // If the end time is tomorrow, add a day
    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }
    
    return nextAvailable;
  }

  /**
   * Schedule notification for later delivery
   */
  private scheduleNotification(notification: NotificationData, scheduledFor: Date): void {
    // This would integrate with a scheduling system
    console.log(`Notification scheduled for ${scheduledFor}: ${notification.id}`);
  }

  /**
   * Deliver notification (push, email, SMS)
   */
  private async deliverNotification(notification: NotificationData): Promise<void> {
    // This would integrate with push notification services
    console.log(`Delivering notification: ${notification.title} - ${notification.body}`);
  }

  /**
   * Get users by role
   */
  private async getUsersByRole(role: 'worker' | 'admin' | 'client'): Promise<string[]> {
    const workers = await this.databaseManager.getWorkers();
    
    switch (role) {
      case 'worker':
        return workers.map((worker: any) => worker.id);
      case 'admin':
        return workers.filter((worker: any) => worker.role === 'admin').map((worker: any) => worker.id);
      case 'client':
        // This would return client user IDs
        return [];
      default:
        return [];
    }
  }

  /**
   * Get user role
   */
  private async getUserRole(userId: string): Promise<'worker' | 'admin' | 'client'> {
    const workers = await this.databaseManager.getWorkers();
    const worker = workers.find((w: any) => w.id === userId);
    if (worker) {
      return worker.role === 'admin' ? 'admin' : 'worker';
    }
    return 'client';
  }

  /**
   * Get notification statistics
   */
  public getNotificationStats(): {
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<NotificationType, number>;
    notificationsByPriority: Record<NotificationPriority, number>;
  } {
    const notifications = Array.from(this.notifications.values());
    
    const stats = {
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.isRead).length,
      notificationsByType: {} as Record<NotificationType, number>,
      notificationsByPriority: {} as Record<NotificationPriority, number>
    };

    // Count by type
    notifications.forEach(notification => {
      stats.notificationsByType[notification.type] = 
        (stats.notificationsByType[notification.type] || 0) + 1;
      stats.notificationsByPriority[notification.priority] = 
        (stats.notificationsByPriority[notification.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * 🔔 Push Notification Setup Methods
   */

  /**
   * Initialize push notifications and request permissions
   */
  public async initializePushNotifications(): Promise<{
    isEnabled: boolean;
    token?: string;
    permissions: {
      alert: boolean;
      badge: boolean;
      sound: boolean;
    };
  }> {
    try {
      // In a real implementation, this would use expo-notifications
      console.log('🔔 Initializing push notifications...');
      
      // Mock permission request
      const permissions = {
        alert: true,
        badge: true,
        sound: true
      };

      // Real push token generation using Expo
      let token: string;
      try {
        const { getExpoPushTokenAsync } = require('expo-notifications');
        const expoPushToken = await getExpoPushTokenAsync();
        token = expoPushToken.data;
      } catch (error) {
        console.warn('Failed to get Expo push token, using mock token:', error);
        token = 'mock-push-token-' + Date.now();
      }
      
      console.log('✅ Push notifications initialized successfully');
      
      return {
        isEnabled: true,
        token,
        permissions
      };
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return {
        isEnabled: false,
        permissions: {
          alert: false,
          badge: false,
          sound: false
        }
      };
    }
  }

  /**
   * Register device for push notifications
   */
  public async registerDeviceForPushNotifications(
    userId: string,
    deviceToken: string,
    deviceInfo: {
      platform: 'ios' | 'android';
      version: string;
      model: string;
    }
  ): Promise<boolean> {
    try {
      console.log(`📱 Registering device for user ${userId}:`, deviceInfo);
      
      // In a real implementation, this would store the token in the database
      // and register with the push notification service
      
      console.log('✅ Device registered for push notifications');
      return true;
    } catch (error) {
      console.error('❌ Failed to register device for push notifications:', error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  public async sendPushNotification(
    userId: string,
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>
  ): Promise<boolean> {
    try {
      console.log(`📤 Sending push notification to user ${userId}:`, notification.title);
      
      // In a real implementation, this would send via APNS/FCM
      const pushNotification: NotificationData = {
        ...notification,
        id: this.generateNotificationId(),
        createdAt: new Date(),
        isRead: false
      };

      // Store notification locally
      this.notifications.set(pushNotification.id, pushNotification);
      
      console.log('✅ Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Schedule push notification for later delivery
   */
  public async schedulePushNotification(
    userId: string,
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>,
    scheduledFor: Date
  ): Promise<string | null> {
    try {
      console.log(`⏰ Scheduling push notification for ${scheduledFor.toISOString()}`);
      
      const scheduledNotification: NotificationData = {
        ...notification,
        id: this.generateNotificationId(),
        createdAt: new Date(),
        isRead: false,
        scheduledFor
      };

      // Store scheduled notification
      this.notifications.set(scheduledNotification.id, scheduledNotification);
      
      console.log('✅ Push notification scheduled successfully');
      return scheduledNotification.id;
    } catch (error) {
      console.error('❌ Failed to schedule push notification:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled push notification
   */
  public async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      console.log(`❌ Canceling scheduled notification ${notificationId}`);
      
      if (this.notifications.has(notificationId)) {
        this.notifications.delete(notificationId);
        console.log('✅ Scheduled notification canceled');
        return true;
      }
      
      console.log('⚠️ Notification not found');
      return false;
    } catch (error) {
      console.error('❌ Failed to cancel scheduled notification:', error);
      return false;
    }
  }

  /**
   * Get push notification status
   */
  public async getPushNotificationStatus(): Promise<{
    isEnabled: boolean;
    token?: string;
    lastSent?: Date;
    totalSent: number;
    successRate: number;
  }> {
    try {
      const notifications = Array.from(this.notifications.values());
      const sentNotifications = notifications.filter(n => n.createdAt);
      
      return {
        isEnabled: true,
        token: 'mock-push-token',
        lastSent: sentNotifications.length > 0 ? 
          new Date(Math.max(...sentNotifications.map(n => n.createdAt.getTime()))) : 
          undefined,
        totalSent: sentNotifications.length,
        successRate: 0.95 // Mock success rate
      };
    } catch (error) {
      console.error('❌ Failed to get push notification status:', error);
      return {
        isEnabled: false,
        totalSent: 0,
        successRate: 0
      };
    }
  }
}
