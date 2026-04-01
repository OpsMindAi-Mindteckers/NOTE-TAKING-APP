/**
 * NoteList Component - Displays all notes
 * Uses: NoteManager, EventSystem, Logger
 */

import { useState, useEffect } from 'react';
import { noteManager } from '../modules/noteManager.js';
import { eventSystem, AppEvents } from '../modules/eventSystem.js';
import { appLogger } from '../modules/logger.js';
import NoteItem from './NoteItem.jsx';
import './NoteList.css';

export default function NoteList({ onSelectNote, selectedNoteId }) {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);

  useEffect(() => {
    appLogger.info('NoteList component mounted');
    
    // Load initial notes
    const loadedNotes = noteManager.getAllNotes();
    setNotes(loadedNotes);
    updateFilteredNotes(loadedNotes, searchQuery);

    // Setup event listeners
    const unsubscribeCreated = eventSystem.on(AppEvents.NOTE_CREATED, () => {
      appLogger.debug('NoteList: NOTE_CREATED event received');
      const updatedNotes = noteManager.getAllNotes();
      setNotes(updatedNotes);
      updateFilteredNotes(updatedNotes, searchQuery);
    });

    const unsubscribeUpdated = eventSystem.on(AppEvents.NOTE_UPDATED, () => {
      appLogger.debug('NoteList: NOTE_UPDATED event received');
      const updatedNotes = noteManager.getAllNotes();
      setNotes(updatedNotes);
      updateFilteredNotes(updatedNotes, searchQuery);
    });

    const unsubscribeDeleted = eventSystem.on(AppEvents.NOTE_DELETED, () => {
      appLogger.debug('NoteList: NOTE_DELETED event received');
      const updatedNotes = noteManager.getAllNotes();
      setNotes(updatedNotes);
      updateFilteredNotes(updatedNotes, searchQuery);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      appLogger.info('NoteList component unmounted');
    };
  }, []);

  const updateFilteredNotes = (notesArray, query) => {
    if (!query.trim()) {
      setFilteredNotes(notesArray);
    } else {
      const results = noteManager.searchNotes(query);
      setFilteredNotes(results);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    updateFilteredNotes(notes, query);
    appLogger.debug(`NoteList search: "${query}"`);
  };

  return (
    <div className="note-list">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <span className="note-count">{filteredNotes.length}</span>
      </div>
      
      <div className="notes-container">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            {notes.length === 0 ? 'No notes yet. Create one!' : 'No matching notes found.'}
          </div>
        ) : (
          filteredNotes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => {
                onSelectNote(note.id);
                appLogger.debug(`NoteList: Selected note ${note.id}`);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
