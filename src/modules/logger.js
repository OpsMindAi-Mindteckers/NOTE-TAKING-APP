/**
 * Logger Module - Centralized logging system for the entire application
 * Provides different log levels and timestamps for monitoring app behavior
 */

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

class Logger {
  constructor(moduleName = 'App') {
    this.moduleName = moduleName;
    this.logs = [];
    this.maxLogs = 100;
    this.console = typeof console !== 'undefined' ? console : null;
  }

  /**
   * Generate timestamp in HH:MM:SS format
   */
  getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString();
  }

  /**
   * Format log message with module name and timestamp
   */
  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const baseMsg = `[${timestamp}] [${this.moduleName}] [${level}] ${message}`;
    return { baseMsg, timestamp, data };
  }

  /**
   * Store log in memory (limited to maxLogs entries)
   */
  storeLog(level, message, data) {
    const logEntry = {
      timestamp: this.getTimestamp(),
      module: this.moduleName,
      level,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Keep logs array at maxLogs size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message, data = null) {
    const formatted = this.formatMessage(LogLevel.DEBUG, message, data);
    if (this.console) this.console.log(formatted.baseMsg, data || '');
    this.storeLog(LogLevel.DEBUG, message, data);
  }

  info(message, data = null) {
    const formatted = this.formatMessage(LogLevel.INFO, message, data);
    if (this.console) this.console.info(formatted.baseMsg, data || '');
    this.storeLog(LogLevel.INFO, message, data);
  }

  warn(message, data = null) {
    const formatted = this.formatMessage(LogLevel.WARN, message, data);
    if (this.console) this.console.warn(formatted.baseMsg, data || '');
    this.storeLog(LogLevel.WARN, message, data);
  }

  error(message, data = null) {
    const formatted = this.formatMessage(LogLevel.ERROR, message, data);
    if (this.console) this.console.error(formatted.baseMsg, data || '');
    this.storeLog(LogLevel.ERROR, message, data);
  }

  /**
   * Get all stored logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    this.logs = [];
    this.info('Logs cleared');
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create app-wide logger instance
const appLogger = new Logger('AppLogger');

export { Logger, LogLevel, appLogger };
