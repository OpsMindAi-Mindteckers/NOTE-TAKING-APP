/**
 * Note Manager Module - Handles note CRUD operations
 * Connects to: Logger, EventSystem, Storage
 */

import { appLogger } from './logger.js';
import { eventSystem, AppEvents } from './eventSystem.js';
import { storage } from './storage.js';

class NoteManager {
  constructor() {
    this.logger = appLogger;
    this.logger.info('NoteManager initialized');
    this.loadNotes();
    this.setupEventListeners();
  }

  /**
   * Setup listeners for external events
   */
  setupEventListeners() {
    eventSystem.on(AppEvents.STORAGE_CHANGED, (data) => {
      this.logger.debug('Storage changed event received', data);
      if (data.action === 'write' || data.action === 'init') {
        this.loadNotes();
      }
    });

    this.logger.info('NoteManager event listeners setup complete');
  }

  /**
   * Load notes from storage
   */
  loadNotes() {
    try {
      const notes = storage.getNotes();
      this.notes = notes;
      this.logger.info(`Loaded ${notes.length} notes into manager`);
      eventSystem.emit(AppEvents.NOTES_LOADED, { count: notes.length });
      return notes;
    } catch (error) {
      this.logger.error('Failed to load notes', error);
      eventSystem.emit(AppEvents.ERROR_OCCURRED, { module: 'NoteManager', error: error.message });
      this.notes = [];
      return [];
    }
  }

  /**
   * Get all notes
   */
  getAllNotes() {
    this.logger.debug(`Retrieving all notes (${this.notes.length} total)`);
    return [...this.notes];
  }

  /**
   * Get a note by ID
   */
  getNoteById(id) {
    const note = this.notes.find(n => n.id === id);
    if (!note) {
      this.logger.warn(`Note not found: ${id}`);
    }
    return note || null;
  }

  /**
   * Create a new note
   */
  createNote(title = 'Untitled', content = '') {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const note = {
        id,
        title: title || 'Untitled',
        content,
        createdAt: now,
        updatedAt: now,
        tags: []
      };

      storage.addNote(note);
      this.notes.push(note);

      this.logger.info(`Note created: ${id}`, { title, contentLength: content.length });
      eventSystem.emit(AppEvents.NOTE_CREATED, { id, title });
      
      return note;
    } catch (error) {
      this.logger.error('Failed to create note', error);
      eventSystem.emit(AppEvents.ERROR_OCCURRED, { module: 'NoteManager', error: error.message });
      return null;
    }
  }

  /**
   * Update an existing note
   */
  updateNote(id, updates) {
    try {
      const noteIndex = this.notes.findIndex(n => n.id === id);
      
      if (noteIndex === -1) {
        this.logger.warn(`Cannot update: Note not found (${id})`);
        return null;
      }

      const updatedNote = {
        ...this.notes[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      storage.updateNote(id, updatedNote);
      this.notes[noteIndex] = updatedNote;

      this.logger.info(`Note updated: ${id}`, { title: updatedNote.title });
      eventSystem.emit(AppEvents.NOTE_UPDATED, { id, title: updatedNote.title });
      
      return updatedNote;
    } catch (error) {
      this.logger.error(`Failed to update note (${id})`, error);
      eventSystem.emit(AppEvents.ERROR_OCCURRED, { module: 'NoteManager', error: error.message });
      return null;
    }
  }

  /**
   * Delete a note
   */
  deleteNote(id) {
    try {
      const noteIndex = this.notes.findIndex(n => n.id === id);
      
      if (noteIndex === -1) {
        this.logger.warn(`Cannot delete: Note not found (${id})`);
        return false;
      }

      const deletedNote = this.notes[noteIndex];
      storage.deleteNote(id);
      this.notes.splice(noteIndex, 1);

      this.logger.info(`Note deleted: ${id}`, { title: deletedNote.title });
      eventSystem.emit(AppEvents.NOTE_DELETED, { id, title: deletedNote.title });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete note (${id})`, error);
      eventSystem.emit(AppEvents.ERROR_OCCURRED, { module: 'NoteManager', error: error.message });
      return false;
    }
  }

  /**
   * Search notes by title or content
   */
  searchNotes(query) {
    const lowerQuery = query.toLowerCase();
    const results = this.notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );

    this.logger.debug(`Search query: "${query}" found ${results.length} results`);
    return results;
  }

  /**
   * Get notes by tag
   */
  getNotesByTag(tag) {
    const results = this.notes.filter(note => note.tags.includes(tag));
    this.logger.debug(`Retrieved ${results.length} notes with tag: ${tag}`);
    return results;
  }

  /**
   * Add tag to a note
   */
  addTag(noteId, tag) {
    const note = this.getNoteById(noteId);
    if (!note) {
      this.logger.warn(`Cannot add tag: Note not found (${noteId})`);
      return false;
    }

    if (!note.tags) note.tags = [];
    if (!note.tags.includes(tag)) {
      note.tags.push(tag);
      this.updateNote(noteId, { tags: note.tags });
      this.logger.info(`Tag added to note ${noteId}: ${tag}`);
      return true;
    }
    
    return false;
  }

  /**
   * Remove tag from a note
   */
  removeTag(noteId, tag) {
    const note = this.getNoteById(noteId);
    if (!note) {
      this.logger.warn(`Cannot remove tag: Note not found (${noteId})`);
      return false;
    }

    if (note.tags && note.tags.includes(tag)) {
      note.tags = note.tags.filter(t => t !== tag);
      this.updateNote(noteId, { tags: note.tags });
      this.logger.info(`Tag removed from note ${noteId}: ${tag}`);
      return true;
    }

    return false;
  }

  /**
   * Get note statistics
   */
  getStatistics() {
    const stats = {
      totalNotes: this.notes.length,
      totalCharacters: this.notes.reduce((sum, note) => sum + (note.content || '').length, 0),
      totalWords: this.notes.reduce((sum, note) => sum + (note.content || '').split(/\s+/).filter(w => w).length, 0),
      avgWordsPerNote: 0,
      oldestNote: null,
      newestNote: null,
      allTags: []
    };

    if (stats.totalNotes > 0) {
      stats.avgWordsPerNote = Math.round(stats.totalWords / stats.totalNotes);
      
      const sortedByDate = [...this.notes].sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      stats.oldestNote = sortedByDate[0];
      stats.newestNote = sortedByDate[sortedByDate.length - 1];
      
      stats.allTags = [...new Set(this.notes.flatMap(n => n.tags || []))];
    }

    this.logger.debug('Statistics generated', stats);
    return stats;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all notes
   */
  clearAll() {
    try {
      storage.clearAllNotes();
      this.notes = [];
      this.logger.info('All notes cleared');
      return true;
    } catch (error) {
      this.logger.error('Failed to clear all notes', error);
      return false;
    }
  }
}

// Create global note manager instance
const noteManager = new NoteManager();

export { NoteManager, noteManager };
