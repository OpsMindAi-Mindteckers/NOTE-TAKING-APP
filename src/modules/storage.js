/**
 * Storage Module - Handles persistent data storage using localStorage
 * Connects to: Logger, EventSystem
 */

import { appLogger } from './logger.js';
import { eventSystem, AppEvents } from './eventSystem.js';

class StorageManager {
  constructor() {
    this.storageKey = 'noteApp_notes';
    this.logger = appLogger;
    this.logger.info('StorageManager initialized');
    this.initStorage();
  }

  /**
   * Initialize storage with default data if not exists
   */
  initStorage() {
    try {
      const existingNotes = this.getNotes();
      if (!existingNotes || existingNotes.length === 0) {
        this.logger.info('Initializing storage with empty notes array');
        this.setNotes([]);
      } else {
        this.logger.info(`Loaded ${existingNotes.length} notes from storage`);
        eventSystem.emit(AppEvents.STORAGE_CHANGED, { action: 'init', count: existingNotes.length });
      }
    } catch (error) {
      this.logger.error('Failed to initialize storage', error);
      this.setNotes([]);
    }
  }

  /**
   * Save notes to localStorage
   */
  setNotes(notes) {
    try {
      const data = JSON.stringify(notes);
      localStorage.setItem(this.storageKey, data);
      this.logger.debug(`Saved ${notes.length} notes to storage`);
      eventSystem.emit(AppEvents.STORAGE_CHANGED, { action: 'write', count: notes.length });
      return true;
    } catch (error) {
      this.logger.error('Failed to save notes to storage', error);
      eventSystem.emit(AppEvents.ERROR_OCCURRED, { module: 'Storage', error: error.message });
      return false;
    }
  }

  /**
   * Retrieve notes from localStorage
   */
  getNotes() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const notes = data ? JSON.parse(data) : [];
      this.logger.debug(`Retrieved ${notes.length} notes from storage`);
      return notes;
    } catch (error) {
      this.logger.error('Failed to retrieve notes from storage', error);
      eventSystem.emit(AppEvents.ERROR_OCCURRED, { module: 'Storage', error: error.message });
      return [];
    }
  }

  /**
   * Get a single note by ID
   */
  getNoteById(id) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      this.logger.debug(`Retrieved note with id: ${id}`);
    } else {
      this.logger.warn(`Note not found with id: ${id}`);
    }
    return note || null;
  }

  /**
   * Add a new note to storage
   */
  addNote(note) {
    try {
      const notes = this.getNotes();
      notes.push(note);
      this.setNotes(notes);
      this.logger.info(`Note added: ${note.id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to add note', error);
      return false;
    }
  }

  /**
   * Update an existing note
   */
  updateNote(id, updates) {
    try {
      const notes = this.getNotes();
      const index = notes.findIndex(n => n.id === id);
      
      if (index === -1) {
        this.logger.warn(`Cannot update: Note not found with id: ${id}`);
        return false;
      }

      notes[index] = { ...notes[index], ...updates };
      this.setNotes(notes);
      this.logger.info(`Note updated: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to update note', error);
      return false;
    }
  }

  /**
   * Delete a note
   */
  deleteNote(id) {
    try {
      const notes = this.getNotes();
      const initialCount = notes.length;
      const filtered = notes.filter(n => n.id !== id);

      if (filtered.length === initialCount) {
        this.logger.warn(`Cannot delete: Note not found with id: ${id}`);
        return false;
      }

      this.setNotes(filtered);
      this.logger.info(`Note deleted: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete note', error);
      return false;
    }
  }

  /**
   * Clear all notes
   */
  clearAllNotes() {
    try {
      this.setNotes([]);
      this.logger.info('All notes cleared');
      return true;
    } catch (error) {
      this.logger.error('Failed to clear notes', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const notes = this.getNotes();
    return {
      totalNotes: notes.length,
      totalCharacters: notes.reduce((sum, note) => sum + (note.content || '').length, 0),
      totalWords: notes.reduce((sum, note) => sum + (note.content || '').split(/\s+/).length, 0)
    };
  }
}

// Create global storage instance
const storage = new StorageManager();

export { StorageManager, storage };
