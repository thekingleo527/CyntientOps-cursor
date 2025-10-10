/**
 * 🔔 Task Notification Service
 * Purpose: Manage push notifications for routine tasks
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { WorkerScheduleItem } from '../OperationalDataManager';

export interface NotificationConfig {
  transitionAlert: boolean; // Alert when task transitions from NEXT → NOW
  reminderMinutes: number; // Minutes before task to send reminder (0 = disabled)
  urgentAlerts: boolean; // Alert for overdue tasks
}

export interface ScheduledNotification {
  id: string;
  notificationId: string;
  taskId: string;
  type: 'transition' | 'reminder' | 'urgent';
  scheduledTime: Date;
}

export class TaskNotificationService {
  private static instance: TaskNotificationService | null = null;
  private notificationConfig: NotificationConfig = {
    transitionAlert: true,
    reminderMinutes: 15,
    urgentAlerts: true
  };
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  private constructor() {
    this.setupNotificationHandler();
  }

  public static getInstance(): TaskNotificationService {
    if (!TaskNotificationService.instance) {
      TaskNotificationService.instance = new TaskNotificationService();
    }
    return TaskNotificationService.instance;
  }

  /**
   * Initialize notification system and request permissions
   */
  public async initialize(): Promise<boolean> {
    try {
      // Set notification handler for foreground notifications
      this.setupNotificationHandler();

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Task Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
        });

        await Notifications.setNotificationChannelAsync('urgent', {
          name: 'Urgent Task Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#ef4444',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Setup notification handler for foreground notifications
   */
  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Update notification configuration
   */
  public setConfig(config: Partial<NotificationConfig>): void {
    this.notificationConfig = {
      ...this.notificationConfig,
      ...config
    };
  }

  /**
   * Get current notification configuration
   */
  public getConfig(): NotificationConfig {
    return { ...this.notificationConfig };
  }

  /**
   * Schedule all notifications for a task
   */
  public async scheduleTaskNotifications(task: WorkerScheduleItem): Promise<void> {
    const now = new Date();

    // Don't schedule notifications for past tasks
    if (task.endTime < now) {
      return;
    }

    // Schedule transition notification (when task becomes NOW)
    if (this.notificationConfig.transitionAlert && task.startTime > now) {
      await this.scheduleTransitionNotification(task);
    }

    // Schedule reminder notification
    if (this.notificationConfig.reminderMinutes > 0 && task.startTime > now) {
      await this.scheduleReminderNotification(task);
    }

    // Schedule urgent notification if task is overdue
    if (this.notificationConfig.urgentAlerts && task.status === 'pending') {
      const overdueTime = new Date(task.endTime.getTime() + 5 * 60 * 1000); // 5 min after end
      if (overdueTime > now) {
        await this.scheduleUrgentNotification(task, overdueTime);
      }
    }
  }

  /**
   * Schedule notification when task transitions to NOW
   */
  private async scheduleTransitionNotification(task: WorkerScheduleItem): Promise<void> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚀 Task Starting Now',
          body: `${task.title} at ${task.buildingName}`,
          data: {
            taskId: task.id,
            routineId: task.routineId,
            type: 'transition'
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: task.startTime,
          channelId: 'default'
        },
      });

      const scheduledNotif: ScheduledNotification = {
        id: `${task.id}_transition`,
        notificationId,
        taskId: task.id,
        type: 'transition',
        scheduledTime: task.startTime
      };

      this.scheduledNotifications.set(scheduledNotif.id, scheduledNotif);
    } catch (error) {
      console.error('Failed to schedule transition notification:', error);
    }
  }

  /**
   * Schedule reminder notification before task starts
   */
  private async scheduleReminderNotification(task: WorkerScheduleItem): Promise<void> {
    try {
      const reminderTime = new Date(
        task.startTime.getTime() - this.notificationConfig.reminderMinutes * 60 * 1000
      );

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Upcoming Task',
          body: `${task.title} in ${this.notificationConfig.reminderMinutes} minutes`,
          data: {
            taskId: task.id,
            routineId: task.routineId,
            type: 'reminder'
          },
          sound: 'default',
        },
        trigger: {
          date: reminderTime,
          channelId: 'default'
        },
      });

      const scheduledNotif: ScheduledNotification = {
        id: `${task.id}_reminder`,
        notificationId,
        taskId: task.id,
        type: 'reminder',
        scheduledTime: reminderTime
      };

      this.scheduledNotifications.set(scheduledNotif.id, scheduledNotif);
    } catch (error) {
      console.error('Failed to schedule reminder notification:', error);
    }
  }

  /**
   * Schedule urgent notification for overdue task
   */
  private async scheduleUrgentNotification(task: WorkerScheduleItem, triggerTime: Date): Promise<void> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 URGENT: Task Overdue',
          body: `${task.title} is overdue! Complete immediately.`,
          data: {
            taskId: task.id,
            routineId: task.routineId,
            type: 'urgent'
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 250, 500],
        },
        trigger: {
          date: triggerTime,
          channelId: 'urgent'
        },
      });

      const scheduledNotif: ScheduledNotification = {
        id: `${task.id}_urgent`,
        notificationId,
        taskId: task.id,
        type: 'urgent',
        scheduledTime: triggerTime
      };

      this.scheduledNotifications.set(scheduledNotif.id, scheduledNotif);
    } catch (error) {
      console.error('Failed to schedule urgent notification:', error);
    }
  }

  /**
   * Send immediate notification for task NOW
   */
  public async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
    }
  }

  /**
   * Cancel scheduled notifications for a task
   */
  public async cancelTaskNotifications(taskId: string): Promise<void> {
    const notificationsToCancel: string[] = [];

    for (const [key, notification] of this.scheduledNotifications.entries()) {
      if (notification.taskId === taskId) {
        notificationsToCancel.push(notification.notificationId);
        this.scheduledNotifications.delete(key);
      }
    }

    if (notificationsToCancel.length > 0) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationsToCancel[0]);
        // Note: Expo doesn't support batch cancellation, so we cancel one at a time
        for (let i = 1; i < notificationsToCancel.length; i++) {
          await Notifications.cancelScheduledNotificationAsync(notificationsToCancel[i]);
        }
      } catch (error) {
        console.error('Failed to cancel notifications:', error);
      }
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  public async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get scheduled notifications for a specific task
   */
  public getTaskNotifications(taskId: string): ScheduledNotification[] {
    const notifications: ScheduledNotification[] = [];

    for (const notification of this.scheduledNotifications.values()) {
      if (notification.taskId === taskId) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Clear notification badge
   */
  public async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  /**
   * Get notification badge count
   */
  public async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Listen for notification responses (when user taps notification)
   */
  public addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Listen for received notifications (when notification arrives)
   */
  public addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }
}
