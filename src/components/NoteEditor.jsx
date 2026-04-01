/**
 * NoteEditor Component - Create and edit notes
 * Uses: NoteManager, EventSystem, Logger
 */

import { useState, useEffect } from 'react';
import { noteManager } from '../modules/noteManager.js';
import { eventSystem, AppEvents } from '../modules/eventSystem.js';
import { appLogger } from '../modules/logger.js';
import './NoteEditor.css';

export default function NoteEditor({ selectedNoteId, onNoteCreated }) {
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState([]);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    appLogger.info('NoteEditor component mounted');
    
    if (selectedNoteId) {
      loadNote(selectedNoteId);
    } else {
      resetEditor();
    }

    // Listen for note updates from other sources
    const unsubscribeUpdated = eventSystem.on(AppEvents.NOTE_UPDATED, (data) => {
      if (selectedNoteId && data.id === selectedNoteId) {
        appLogger.debug('NoteEditor: NOTE_UPDATED event received, reloading');
        loadNote(selectedNoteId);
      }
    });

    return () => {
      unsubscribeUpdated();
      appLogger.info('NoteEditor component unmounted');
    };
  }, [selectedNoteId]);

  const loadNote = (noteId) => {
    const loadedNote = noteManager.getNoteById(noteId);
    if (loadedNote) {
      setNote(loadedNote);
      setTitle(loadedNote.title);
      setContent(loadedNote.content);
      setTags(loadedNote.tags || []);
      setIsSaved(true);
      appLogger.debug(`NoteEditor: Loaded note ${noteId}`);
    }
  };

  const resetEditor = () => {
    setNote(null);
    setTitle('');
    setContent('');
    setTags([]);
    setIsSaved(true);
    appLogger.debug('NoteEditor: Reset to empty state');
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      appLogger.warn('NoteEditor: Cannot save empty note');
      alert('Note must have at least a title or content');
      return;
    }

    try {
      if (note) {
        // Update existing note
        noteManager.updateNote(note.id, { title, content, tags });
        appLogger.info(`NoteEditor: Saved existing note ${note.id}`);
      } else {
        // Create new note
        const newNote = noteManager.createNote(title, content);
        if (newNote && tags.length > 0) {
          tags.forEach(tag => noteManager.addTag(newNote.id, tag));
        }
        setNote(newNote);
        appLogger.info(`NoteEditor: Created new note ${newNote.id}`);
        onNoteCreated(newNote.id);
      }
      setIsSaved(true);
    } catch (error) {
      appLogger.error('NoteEditor: Error saving note', error);
      alert('Error saving note');
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
      setIsSaved(false);
      appLogger.debug(`NoteEditor: Added tag ${tag}`);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setIsSaved(false);
    appLogger.debug(`NoteEditor: Removed tag ${tagToRemove}`);
  };

  const handleNewNote = () => {
    if (!isSaved && (title || content)) {
      if (!confirm('You have unsaved changes. Create new note anyway?')) {
        return;
      }
    }
    resetEditor();
    appLogger.info('NoteEditor: Started new note');
  };

  return (
    <div className="note-editor">
      <div className="editor-header">
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={handleTitleChange}
          className="editor-title-input"
        />
        <span className={`save-status ${isSaved ? 'saved' : 'unsaved'}`}>
          {isSaved ? '✓ Saved' : '● Unsaved'}
        </span>
      </div>

      <textarea
        placeholder="Start typing your note..."
        value={content}
        onChange={handleContentChange}
        className="editor-content-textarea"
      />

      <div className="tags-section">
        <div className="tag-input-container">
          <input
            type="text"
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            className="tag-input"
          />
          <button onClick={handleAddTag} className="add-tag-btn">Add Tag</button>
        </div>
        
        <div className="tags-list">
          {tags.map(tag => (
            <span key={tag} className="tag-badge">
              {tag}
              <button
                className="remove-tag-btn"
                onClick={() => handleRemoveTag(tag)}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button onClick={handleSave} className="save-btn primary">
          {note ? 'Update Note' : 'Create Note'}
        </button>
        <button onClick={handleNewNote} className="new-btn secondary">
          New Note
        </button>
      </div>

      {note && (
        <div className="note-meta">
          <small>Created: {new Date(note.createdAt).toLocaleString()}</small>
          {note.createdAt !== note.updatedAt && (
            <small>Modified: {new Date(note.updatedAt).toLocaleString()}</small>
          )}
        </div>
      )}
    </div>
  );
}
