/**
 * 🎯 React Native Compatible EventEmitter
 * Simple EventEmitter implementation for React Native
 * Shared across all packages to avoid Node.js dependencies
 */

export type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Add event listener
   */
  on(event: string, callback: EventCallback): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    return this;
  }

  /**
   * Add one-time event listener
   */
  once(event: string, callback: EventCallback): this {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    return this.on(event, onceCallback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: EventCallback): this {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }

  /**
   * Emit event
   */
  emit(event: string, ...args: any[]): boolean {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    const callbacks = this.events.get(event);
    return callbacks ? callbacks.length : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}