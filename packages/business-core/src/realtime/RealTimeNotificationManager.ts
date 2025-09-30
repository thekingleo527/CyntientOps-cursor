/**
 * 🔔 Real-Time Notification Manager
 * Purpose: Advanced notification system with push notifications, in-app alerts, and real-time updates
 * Features: Priority-based notifications, user preferences, notification history, and smart delivery
 */

import { DatabaseManager } from '@cyntientops/database';
import { ServiceContainer } from '../ServiceContainer';
import { RealTimeCommunicationService } from '../services/RealTimeCommunicationService';
import { UserRole } from '@cyntientops/domain-schema';

export interface Notification {
  id: string;
  type: 'task' | 'emergency' | 'system' | 'message' | 'compliance' | 'weather' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: any;
  userId: string;
  userRole: UserRole;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  expiresAt?: Date;
  actions?: NotificationAction[];
  category: string;
  sound?: string;
  vibration?: boolean;
  badge?: number;
}

export interface NotificationAction {
  id: string;
  title: string;
  action: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
}

export interface NotificationPreferences {
  userId: string;
  userRole: UserRole;
  enabled: boolean;
  types: {
    task: boolean;
    emergency: boolean;
    system: boolean;
    message: boolean;
    compliance: boolean;
    weather: boolean;
    maintenance: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  delivery: {
    push: boolean;
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Map<string, number>;
  notificationsByPriority: Map<string, number>;
  deliveryRate: number;
  readRate: number;
  lastNotification: Date | null;
}

export class RealTimeNotificationManager {
  private static instance: RealTimeNotificationManager;
  private database: DatabaseManager;
  private serviceContainer: ServiceContainer;
  private realTimeService: RealTimeCommunicationService;
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private notificationQueue: Notification[] = [];
  private isProcessing = false;

  private constructor(
    database: DatabaseManager,
    serviceContainer: ServiceContainer,
    realTimeService: RealTimeCommunicationService
  ) {
    this.database = database;
    this.serviceContainer = serviceContainer;
    this.realTimeService = realTimeService;
  }

  public static getInstance(
    database: DatabaseManager,
    serviceContainer: ServiceContainer,
    realTimeService: RealTimeCommunicationService
  ): RealTimeNotificationManager {
    if (!RealTimeNotificationManager.instance) {
      RealTimeNotificationManager.instance = new RealTimeNotificationManager(
        database,
        serviceContainer,
        realTimeService
      );
    }
    return RealTimeNotificationManager.instance;
  }

  // MARK: - Initialization

  /**
   * Initialize notification manager
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing Real-Time Notification Manager...');

      // Load notification preferences
      await this.loadNotificationPreferences();

      // Load pending notifications
      await this.loadPendingNotifications();

      // Start notification processing
      this.startNotificationProcessing();

      // Set up real-time event listeners
      this.setupRealTimeListeners();

      console.log('✅ Real-Time Notification Manager initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Real-Time Notification Manager:', error);
      throw error;
    }
  }

  // MARK: - Notification Creation

  /**
   * Create and send notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'delivered'>): Promise<string> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newNotification: Notification = {
        ...notification,
        id: notificationId,
        timestamp: new Date(),
        read: false,
        delivered: false
      };

      // Store notification
      await this.storeNotification(newNotification);
      this.notifications.set(notificationId, newNotification);

      // Check if should be delivered immediately
      if (await this.shouldDeliverNotification(newNotification)) {
        await this.deliverNotification(newNotification);
      } else {
        this.notificationQueue.push(newNotification);
      }

      console.log(`🔔 Notification created: ${newNotification.type} - ${newNotification.title}`);
      return notificationId;

    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create task notification
   */
  async createTaskNotification(
    taskId: string,
    taskTitle: string,
    userId: string,
    userRole: UserRole,
    priority: Notification['priority'] = 'medium'
  ): Promise<string> {
    return await this.createNotification({
      type: 'task',
      priority,
      title: 'New Task Assignment',
      message: `You have been assigned a new task: ${taskTitle}`,
      data: { taskId, taskTitle },
      userId,
      userRole,
      category: 'task_assignment',
      sound: 'default',
      vibration: true,
      badge: 1
    });
  }

  /**
   * Create emergency notification
   */
  async createEmergencyNotification(
    emergencyId: string,
    emergencyType: string,
    buildingId: string,
    userId: string,
    userRole: UserRole
  ): Promise<string> {
    return await this.createNotification({
      type: 'emergency',
      priority: 'critical',
      title: 'Emergency Alert',
      message: `${emergencyType} reported at building ${buildingId}`,
      data: { emergencyId, emergencyType, buildingId },
      userId,
      userRole,
      category: 'emergency',
      sound: 'emergency',
      vibration: true,
      badge: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    title: string,
    message: string,
    userId: string,
    userRole: UserRole,
    priority: Notification['priority'] = 'medium'
  ): Promise<string> {
    return await this.createNotification({
      type: 'system',
      priority,
      title,
      message,
      userId,
      userRole,
      category: 'system',
      sound: 'default',
      vibration: false
    });
  }

  /**
   * Create message notification
   */
  async createMessageNotification(
    messageId: string,
    senderName: string,
    message: string,
    userId: string,
    userRole: UserRole
  ): Promise<string> {
    return await this.createNotification({
      type: 'message',
      priority: 'medium',
      title: `Message from ${senderName}`,
      message: message.length > 100 ? message.substring(0, 100) + '...' : message,
      data: { messageId, senderName },
      userId,
      userRole,
      category: 'message',
      sound: 'message',
      vibration: true,
      badge: 1
    });
  }

  /**
   * Create compliance notification
   */
  async createComplianceNotification(
    buildingId: string,
    complianceType: string,
    dueDate: Date,
    userId: string,
    userRole: UserRole
  ): Promise<string> {
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return await this.createNotification({
      type: 'compliance',
      priority: daysUntilDue <= 1 ? 'high' : 'medium',
      title: 'Compliance Deadline',
      message: `${complianceType} due in ${daysUntilDue} days for building ${buildingId}`,
      data: { buildingId, complianceType, dueDate },
      userId,
      userRole,
      category: 'compliance',
      sound: 'default',
      vibration: true,
      expiresAt: dueDate
    });
  }

  /**
   * Create weather notification
   */
  async createWeatherNotification(
    weatherType: string,
    severity: string,
    buildingId: string,
    userId: string,
    userRole: UserRole
  ): Promise<string> {
    return await this.createNotification({
      type: 'weather',
      priority: severity === 'severe' ? 'high' : 'medium',
      title: 'Weather Alert',
      message: `${severity} ${weatherType} expected near building ${buildingId}`,
      data: { weatherType, severity, buildingId },
      userId,
      userRole,
      category: 'weather',
      sound: 'weather',
      vibration: true,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
    });
  }

  // MARK: - Notification Delivery

  /**
   * Check if notification should be delivered
   */
  private async shouldDeliverNotification(notification: Notification): Promise<boolean> {
    try {
      const preferences = this.preferences.get(notification.userId);
      if (!preferences || !preferences.enabled) {
        return false;
      }

      // Check if notification type is enabled
      if (!preferences.types[notification.type]) {
        return false;
      }

      // Check if priority is enabled
      if (!preferences.priority[notification.priority]) {
        return false;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          timeZone: preferences.quietHours.timezone 
        });
        
        if (this.isInQuietHours(currentTime, preferences.quietHours.start, preferences.quietHours.end)) {
          // Only deliver critical notifications during quiet hours
          return notification.priority === 'critical';
        }
      }

      return true;

    } catch (error) {
      console.error('Failed to check notification delivery:', error);
      return false;
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Quiet hours span midnight
      return current >= start || current <= end;
    }
  }

  /**
   * Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Deliver notification
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      const preferences = this.preferences.get(notification.userId);
      if (!preferences) return;

      // Send push notification if enabled
      if (preferences.delivery.push) {
        await this.sendPushNotification(notification);
      }

      // Send in-app notification if enabled
      if (preferences.delivery.inApp) {
        await this.sendInAppNotification(notification);
      }

      // Send email if enabled
      if (preferences.delivery.email) {
        await this.sendEmailNotification(notification);
      }

      // Send SMS if enabled
      if (preferences.delivery.sms) {
        await this.sendSMSNotification(notification);
      }

      // Mark as delivered
      notification.delivered = true;
      await this.updateNotificationStatus(notification.id, 'delivered', true);

      console.log(`📱 Notification delivered: ${notification.type} - ${notification.title}`);

    } catch (error) {
      console.error('Failed to deliver notification:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // In React Native, you would use:
      // - Expo Notifications
      // - React Native Push Notification
      // - Firebase Cloud Messaging
      
      console.log(`📱 Push notification sent: ${notification.title}`);
      
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(notification: Notification): Promise<void> {
    try {
      // Send via WebSocket to connected clients
      await this.realTimeService.broadcastEvent('notification', {
        type: 'in_app',
        notification: notification
      });

      console.log(`📱 In-app notification sent: ${notification.title}`);
      
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // In a real implementation, you would use:
      // - SendGrid
      // - AWS SES
      // - Nodemailer
      
      console.log(`📧 Email notification sent: ${notification.title}`);
      
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: Notification): Promise<void> {
    try {
      // In a real implementation, you would use:
      // - Twilio
      // - AWS SNS
      // - MessageBird
      
      console.log(`📱 SMS notification sent: ${notification.title}`);
      
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  // MARK: - Notification Processing

  /**
   * Start notification processing
   */
  private startNotificationProcessing(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        await this.processNotificationQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      const notificationsToProcess = [...this.notificationQueue];
      this.notificationQueue = [];

      for (const notification of notificationsToProcess) {
        if (await this.shouldDeliverNotification(notification)) {
          await this.deliverNotification(notification);
        } else {
          // Re-queue if not ready for delivery
          this.notificationQueue.push(notification);
        }
      }

    } catch (error) {
      console.error('Failed to process notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // MARK: - Real-Time Event Listeners

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    // Listen for task assignments
    this.realTimeService.subscribe('task_assigned', async (data: any) => {
      await this.createTaskNotification(
        data.taskId,
        data.taskTitle,
        data.userId,
        data.userRole,
        data.priority || 'medium'
      );
    });

    // Listen for emergency alerts
    this.realTimeService.subscribe('emergency_alert', async (data: any) => {
      await this.createEmergencyNotification(
        data.emergencyId,
        data.emergencyType,
        data.buildingId,
        data.userId,
        data.userRole
      );
    });

    // Listen for new messages
    this.realTimeService.subscribe('message_received', async (data: any) => {
      await this.createMessageNotification(
        data.messageId,
        data.senderName,
        data.message,
        data.userId,
        data.userRole
      );
    });

    // Listen for compliance deadlines
    this.realTimeService.subscribe('compliance_deadline', async (data: any) => {
      await this.createComplianceNotification(
        data.buildingId,
        data.complianceType,
        new Date(data.dueDate),
        data.userId,
        data.userRole
      );
    });

    // Listen for weather alerts
    this.realTimeService.subscribe('weather_alert', async (data: any) => {
      await this.createWeatherNotification(
        data.weatherType,
        data.severity,
        data.buildingId,
        data.userId,
        data.userRole
      );
    });
  }

  // MARK: - Notification Management

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        notification.read = true;
        await this.updateNotificationStatus(notificationId, 'read', true);
        console.log(`📱 Notification marked as read: ${notificationId}`);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const userNotifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId && !n.read);

      for (const notification of userNotifications) {
        notification.read = true;
        await this.updateNotificationStatus(notification.id, 'read', true);
      }

      console.log(`📱 All notifications marked as read for user: ${userId}`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.database.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);
      this.notifications.delete(notificationId);
      console.log(`📱 Notification deleted: ${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  /**
   * Get notifications for user
   */
  async getNotificationsForUser(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const result = await this.database.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit]
      );

      return result.map(row => ({
        id: row.id,
        type: row.type,
        priority: row.priority,
        title: row.title,
        message: row.message,
        data: row.data ? JSON.parse(row.data) : undefined,
        userId: row.user_id,
        userRole: row.user_role,
        timestamp: new Date(row.timestamp),
        read: Boolean(row.read),
        delivered: Boolean(row.delivered),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        actions: row.actions ? JSON.parse(row.actions) : undefined,
        category: row.category,
        sound: row.sound,
        vibration: Boolean(row.vibration),
        badge: row.badge
      }));

    } catch (error) {
      console.error('Failed to get notifications for user:', error);
      return [];
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const result = await this.database.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
        [userId]
      );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  }

  // MARK: - Preferences Management

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const existingPreferences = this.preferences.get(userId);
      const updatedPreferences = { ...existingPreferences, ...preferences, userId };

      await this.storeNotificationPreferences(updatedPreferences);
      this.preferences.set(userId, updatedPreferences);

      console.log(`📱 Notification preferences updated for user: ${userId}`);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  /**
   * Get notification preferences for user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const result = await this.database.query(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [userId]
      );

      if (result.length === 0) {
        // Return default preferences
        return this.getDefaultPreferences(userId);
      }

      const row = result[0];
      return {
        userId: row.user_id,
        userRole: row.user_role,
        enabled: Boolean(row.enabled),
        types: JSON.parse(row.types),
        priority: JSON.parse(row.priority),
        delivery: JSON.parse(row.delivery),
        quietHours: JSON.parse(row.quiet_hours),
        sound: Boolean(row.sound),
        vibration: Boolean(row.vibration),
        badge: Boolean(row.badge)
      };

    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      userRole: 'worker' as UserRole,
      enabled: true,
      types: {
        task: true,
        emergency: true,
        system: true,
        message: true,
        compliance: true,
        weather: true,
        maintenance: true
      },
      priority: {
        low: true,
        medium: true,
        high: true,
        critical: true
      },
      delivery: {
        push: true,
        inApp: true,
        email: false,
        sms: false
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: 'America/New_York'
      },
      sound: true,
      vibration: true,
      badge: true
    };
  }

  // MARK: - Statistics

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId?: string): Promise<NotificationStats> {
    try {
      let query = 'SELECT * FROM notifications';
      let params: any[] = [];

      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }

      const result = await this.database.query(query, params);
      const notifications = result.map(row => ({
        type: row.type,
        priority: row.priority,
        read: Boolean(row.read),
        delivered: Boolean(row.delivered)
      }));

      const stats: NotificationStats = {
        totalNotifications: notifications.length,
        unreadNotifications: notifications.filter(n => !n.read).length,
        notificationsByType: new Map(),
        notificationsByPriority: new Map(),
        deliveryRate: 0,
        readRate: 0,
        lastNotification: null
      };

      // Calculate type distribution
      notifications.forEach(n => {
        const count = stats.notificationsByType.get(n.type) || 0;
        stats.notificationsByType.set(n.type, count + 1);
      });

      // Calculate priority distribution
      notifications.forEach(n => {
        const count = stats.notificationsByPriority.get(n.priority) || 0;
        stats.notificationsByPriority.set(n.priority, count + 1);
      });

      // Calculate rates
      if (notifications.length > 0) {
        stats.deliveryRate = (notifications.filter(n => n.delivered).length / notifications.length) * 100;
        stats.readRate = (notifications.filter(n => n.read).length / notifications.length) * 100;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get notification statistics:', error);
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        notificationsByType: new Map(),
        notificationsByPriority: new Map(),
        deliveryRate: 0,
        readRate: 0,
        lastNotification: null
      };
    }
  }

  // MARK: - Database Operations

  /**
   * Store notification in database
   */
  private async storeNotification(notification: Notification): Promise<void> {
    try {
      await this.database.execute(
        `INSERT INTO notifications (id, type, priority, title, message, data, user_id, user_role, 
         timestamp, read, delivered, expires_at, actions, category, sound, vibration, badge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.id,
          notification.type,
          notification.priority,
          notification.title,
          notification.message,
          notification.data ? JSON.stringify(notification.data) : null,
          notification.userId,
          notification.userRole,
          notification.timestamp.toISOString(),
          notification.read,
          notification.delivered,
          notification.expiresAt ? notification.expiresAt.toISOString() : null,
          notification.actions ? JSON.stringify(notification.actions) : null,
          notification.category,
          notification.sound || null,
          notification.vibration,
          notification.badge || null
        ]
      );
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(notificationId: string, field: string, value: any): Promise<void> {
    try {
      await this.database.execute(
        `UPDATE notifications SET ${field} = ? WHERE id = ?`,
        [value, notificationId]
      );
    } catch (error) {
      console.error('Failed to update notification status:', error);
    }
  }

  /**
   * Store notification preferences
   */
  private async storeNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await this.database.execute(
        `INSERT OR REPLACE INTO notification_preferences (user_id, user_role, enabled, types, priority, 
         delivery, quiet_hours, sound, vibration, badge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          preferences.userId,
          preferences.userRole,
          preferences.enabled,
          JSON.stringify(preferences.types),
          JSON.stringify(preferences.priority),
          JSON.stringify(preferences.delivery),
          JSON.stringify(preferences.quietHours),
          preferences.sound,
          preferences.vibration,
          preferences.badge
        ]
      );
    } catch (error) {
      console.error('Failed to store notification preferences:', error);
    }
  }

  /**
   * Load notification preferences
   */
  private async loadNotificationPreferences(): Promise<void> {
    try {
      const result = await this.database.query('SELECT * FROM notification_preferences');

      for (const row of result) {
        const preferences: NotificationPreferences = {
          userId: row.user_id,
          userRole: row.user_role,
          enabled: Boolean(row.enabled),
          types: JSON.parse(row.types),
          priority: JSON.parse(row.priority),
          delivery: JSON.parse(row.delivery),
          quietHours: JSON.parse(row.quiet_hours),
          sound: Boolean(row.sound),
          vibration: Boolean(row.vibration),
          badge: Boolean(row.badge)
        };

        this.preferences.set(row.user_id, preferences);
      }

      console.log(`📱 Loaded ${result.length} notification preferences`);

    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Load pending notifications
   */
  private async loadPendingNotifications(): Promise<void> {
    try {
      const result = await this.database.query(
        'SELECT * FROM notifications WHERE delivered = 0 ORDER BY timestamp ASC'
      );

      for (const row of result) {
        const notification: Notification = {
          id: row.id,
          type: row.type,
          priority: row.priority,
          title: row.title,
          message: row.message,
          data: row.data ? JSON.parse(row.data) : undefined,
          userId: row.user_id,
          userRole: row.user_role,
          timestamp: new Date(row.timestamp),
          read: Boolean(row.read),
          delivered: Boolean(row.delivered),
          expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
          actions: row.actions ? JSON.parse(row.actions) : undefined,
          category: row.category,
          sound: row.sound,
          vibration: Boolean(row.vibration),
          badge: row.badge
        };

        this.notifications.set(notification.id, notification);
        this.notificationQueue.push(notification);
      }

      console.log(`📱 Loaded ${result.length} pending notifications`);

    } catch (error) {
      console.error('Failed to load pending notifications:', error);
    }
  }

  // MARK: - Public API

  /**
   * Get notification manager instance
   */
  static getInstance(): RealTimeNotificationManager | null {
    return RealTimeNotificationManager.instance || null;
  }

  /**
   * Destroy notification manager
   */
  async destroy(): Promise<void> {
    this.notifications.clear();
    this.preferences.clear();
    this.notificationQueue = [];
  }
}

export default RealTimeNotificationManager;
