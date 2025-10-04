/**
 * 🕐 System DateTime Service
 * Purpose: Centralized date and time management for the application
 * Current Time: September 29, 2024, 9:17 PM
 */

export class SystemDateTimeService {
  private static instance: SystemDateTimeService;
  private currentDateTime: Date;
  private timeOffset: number = 0; // Offset in milliseconds from real time

  private constructor() {
    // Set the current system time to September 29, 2024, 9:17 PM
    this.currentDateTime = new Date('2024-09-29T21:17:00.000Z');
  }

  public static getInstance(): SystemDateTimeService {
    if (!SystemDateTimeService.instance) {
      SystemDateTimeService.instance = new SystemDateTimeService();
    }
    return SystemDateTimeService.instance;
  }

  /**
   * Get the current system date and time
   */
  public getCurrentDateTime(): Date {
    const now = new Date();
    const systemTime = new Date(this.currentDateTime.getTime() + (now.getTime() - this.currentDateTime.getTime()) + this.timeOffset);
    return systemTime;
  }

  /**
   * Get the current date (without time)
   */
  public getCurrentDate(): Date {
    const current = this.getCurrentDateTime();
    return new Date(current.getFullYear(), current.getMonth(), current.getDate());
  }

  /**
   * Get the current time (without date)
   */
  public getCurrentTime(): Date {
    const current = this.getCurrentDateTime();
    return new Date(0, 0, 0, current.getHours(), current.getMinutes(), current.getSeconds());
  }

  /**
   * Format date for display
   */
  public formatDate(date: Date, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string {
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      case 'datetime':
        return date.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  public getRelativeTime(date: Date): string {
    const now = this.getCurrentDateTime();
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
      return diffSeconds < 0 ? `${Math.abs(diffSeconds)} seconds ago` : `in ${diffSeconds} seconds`;
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes < 0 ? `${Math.abs(diffMinutes)} minutes ago` : `in ${diffMinutes} minutes`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours < 0 ? `${Math.abs(diffHours)} hours ago` : `in ${diffHours} hours`;
    } else if (Math.abs(diffDays) < 7) {
      return diffDays < 0 ? `${Math.abs(diffDays)} days ago` : `in ${diffDays} days`;
    } else {
      return this.formatDate(date, 'short');
    }
  }

  /**
   * Check if a date is today
   */
  public isToday(date: Date): boolean {
    const today = this.getCurrentDate();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return today.getTime() === checkDate.getTime();
  }

  /**
   * Check if a date is tomorrow
   */
  public isTomorrow(date: Date): boolean {
    const tomorrow = new Date(this.getCurrentDate());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return tomorrow.getTime() === checkDate.getTime();
  }

  /**
   * Check if a date is yesterday
   */
  public isYesterday(date: Date): boolean {
    const yesterday = new Date(this.getCurrentDate());
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return yesterday.getTime() === checkDate.getTime();
  }

  /**
   * Get start of day for a given date
   */
  public getStartOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  /**
   * Get end of day for a given date
   */
  public getEndOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  /**
   * Add time to current date
   */
  public addTime(amount: number, unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'): Date {
    const current = this.getCurrentDateTime();
    const result = new Date(current);

    switch (unit) {
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'weeks':
        result.setDate(result.getDate() + (amount * 7));
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
    }

    return result;
  }

  /**
   * Get business hours (9 AM - 5 PM)
   */
  public isBusinessHours(date?: Date): boolean {
    const checkDate = date || this.getCurrentDateTime();
    const hour = checkDate.getHours();
    return hour >= 9 && hour < 17;
  }

  /**
   * Get next business day
   */
  public getNextBusinessDay(date?: Date): Date {
    const startDate = date || this.getCurrentDateTime();
    const nextDay = new Date(startDate);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (nextDay.getDay() === 0 || nextDay.getDay() === 6); // Skip weekends
    
    return nextDay;
  }

  /**
   * Get DSNY collection time (6 AM - 12 PM)
   */
  public isDSNYCollectionTime(date?: Date): boolean {
    const checkDate = date || this.getCurrentDateTime();
    const hour = checkDate.getHours();
    return hour >= 6 && hour < 12;
  }

  /**
   * Get DSNY set-out time (after 8 PM)
   */
  public isDSNYSetOutTime(date?: Date): boolean {
    const checkDate = date || this.getCurrentDateTime();
    const hour = checkDate.getHours();
    return hour >= 20; // 8 PM or later
  }

  /**
   * Update system time offset (for testing or time zone adjustments)
   */
  public setTimeOffset(offsetMs: number): void {
    this.timeOffset = offsetMs;
  }

  /**
   * Reset to real time
   */
  public resetToRealTime(): void {
    this.currentDateTime = new Date();
    this.timeOffset = 0;
  }

  /**
   * Get time zone information
   */
  public getTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Get current system time as ISO string
   */
  public getCurrentISOString(): string {
    return this.getCurrentDateTime().toISOString();
  }

  /**
   * Parse date string and return Date object
   */
  public parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Get week number of the year
   */
  public getWeekNumber(date?: Date): number {
    const checkDate = date || this.getCurrentDateTime();
    const firstDayOfYear = new Date(checkDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (checkDate.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get month name
   */
  public getMonthName(date?: Date, format: 'short' | 'long' = 'long'): string {
    const checkDate = date || this.getCurrentDateTime();
    return checkDate.toLocaleDateString('en-US', { month: format });
  }

  /**
   * Get day name
   */
  public getDayName(date?: Date, format: 'short' | 'long' = 'long'): string {
    const checkDate = date || this.getCurrentDateTime();
    return checkDate.toLocaleDateString('en-US', { weekday: format });
  }
}

// Export singleton instance
export const systemDateTime = SystemDateTimeService.getInstance();
