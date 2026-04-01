/**
 * AppHeader Component - Application header with stats and controls
 * Uses: NoteManager, Logger
 */

import { useState, useEffect } from 'react';
import { noteManager } from '../modules/noteManager.js';
import { eventSystem, AppEvents } from '../modules/eventSystem.js';
import { appLogger } from '../modules/logger.js';
import './AppHeader.css';

export default function AppHeader() {
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalCharacters: 0,
    totalWords: 0,
    avgWordsPerNote: 0,
    allTags: []
  });
  const [showStats, setShowStats] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    appLogger.info('AppHeader component mounted');
    updateStats();

    // Update stats when notes change
    const unsubscribeCreated = eventSystem.on(AppEvents.NOTE_CREATED, updateStats);
    const unsubscribeUpdated = eventSystem.on(AppEvents.NOTE_UPDATED, updateStats);
    const unsubscribeDeleted = eventSystem.on(AppEvents.NOTE_DELETED, updateStats);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      appLogger.info('AppHeader component unmounted');
    };
  }, []);

  const updateStats = () => {
    const newStats = noteManager.getStatistics();
    setStats(newStats);
    appLogger.debug('AppHeader: Stats updated');
  };

  const handleClearAll = () => {
    if (stats.totalNotes === 0) {
      alert('No notes to clear');
      return;
    }

    if (confirm(`Delete all ${stats.totalNotes} notes? This cannot be undone.`)) {
      noteManager.clearAll();
      updateStats();
      appLogger.info('AppHeader: All notes cleared');
    }
  };

  const handleExportLogs = () => {
    const logs = appLogger.exportLogs();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logs));
    element.setAttribute('download', `app-logs-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    appLogger.info('AppHeader: Logs exported');
  };

  return (
    <div className="app-header">
      <div className="header-content">
        <h1 className="app-title">📝 Note Keeper</h1>
        
        <div className="header-controls">
          <button
            className="control-btn"
            onClick={() => setShowStats(!showStats)}
            title="Toggle statistics"
          >
            📊 Stats
          </button>
          <button
            className="control-btn"
            onClick={() => setShowLogs(!showLogs)}
            title="Toggle logs"
          >
            📋 Logs
          </button>
          <button
            className="control-btn danger"
            onClick={handleClearAll}
            title="Clear all notes"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {showStats && (
        <div className="stats-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Notes</span>
              <span className="stat-value">{stats.totalNotes}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Words</span>
              <span className="stat-value">{stats.totalWords}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Characters</span>
              <span className="stat-value">{stats.totalCharacters}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg Words/Note</span>
              <span className="stat-value">{stats.avgWordsPerNote}</span>
            </div>
          </div>
          
          {stats.allTags.length > 0 && (
            <div className="tags-stats">
              <span className="stats-label">Tags ({stats.allTags.length}):</span>
              <div className="tags-list">
                {stats.allTags.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showLogs && (
        <div className="logs-panel">
          <div className="logs-header">
            <h3>Application Logs</h3>
            <div className="logs-controls">
              <button
                className="log-btn"
                onClick={handleExportLogs}
              >
                📥 Export
              </button>
              <button
                className="log-btn"
                onClick={() => {
                  appLogger.clearLogs();
                  appLogger.info('Logs cleared');
                }}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          <div className="logs-list">
            {appLogger.getLogs().slice().reverse().map((log, idx) => (
              <div key={idx} className={`log-entry ${log.level.toLowerCase()}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-module">[{log.module}]</span>
                <span className={`log-level ${log.level.toLowerCase()}`}>{log.level}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
