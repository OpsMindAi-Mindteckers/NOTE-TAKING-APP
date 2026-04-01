/**
 * Event System Module - Enables inter-module communication
 * Provides a pub/sub pattern for modules to communicate without tight coupling
 */

import { appLogger, Logger } from './logger.js';

class EventSystem {
  constructor() {
    this.events = {};
    appLogger.info('EventSystem initialized');
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Function to call when event is emitted
   * @returns {function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(callback);
    appLogger.debug(`Listener subscribed to event: ${eventName}`);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event only once
   */
  once(eventName, callback) {
    const wrappedCallback = (data) => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };
    
    this.on(eventName, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName, callback) {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    appLogger.debug(`Listener unsubscribed from event: ${eventName}`);
  }

  /**
   * Emit an event
   */
  emit(eventName, data = null) {
    if (!this.events[eventName]) {
      appLogger.debug(`No listeners for event: ${eventName}`);
      return;
    }

    appLogger.debug(`Event emitted: ${eventName}`, data);
    
    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        appLogger.error(`Error in event listener for ${eventName}`, error);
      }
    });
  }

  /**
   * Get list of all event names
   */
  getEventNames() {
    return Object.keys(this.events);
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(eventName) {
    return this.events[eventName] ? this.events[eventName].length : 0;
  }

  /**
   * Remove all listeners
   */
  clear() {
    this.events = {};
    appLogger.info('All event listeners cleared');
  }
}

// Create global event system instance
const eventSystem = new EventSystem();

// Define event constants for better maintainability
export const AppEvents = {
  NOTE_CREATED: 'note:created',
  NOTE_UPDATED: 'note:updated',
  NOTE_DELETED: 'note:deleted',
  NOTE_SELECTED: 'note:selected',
  NOTES_LOADED: 'notes:loaded',
  STORAGE_CHANGED: 'storage:changed',
  ERROR_OCCURRED: 'error:occurred'
};

export { EventSystem, eventSystem };
