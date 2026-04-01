/**
 * NoteItem Component - Individual note item in list
 * Uses: NoteManager, EventSystem, Logger
 */

import { appLogger } from '../modules/logger.js';
import { noteManager } from '../modules/noteManager.js';
import './NoteItem.css';

export default function NoteItem({ note, isSelected, onSelect }) {
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateContent = (content, maxLength = 80) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete note "${note.title}"?`)) {
      noteManager.deleteNote(note.id);
      appLogger.info(`NoteItem: Deleted note ${note.id}`);
    }
  };

  return (
    <div
      className={`note-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="note-item-header">
        <h3 className="note-item-title">{note.title}</h3>
        <button
          className="delete-btn"
          onClick={handleDelete}
          title="Delete note"
        >
          ✕
        </button>
      </div>
      
      <p className="note-item-content">{truncateContent(note.content || '')}</p>
      
      <div className="note-item-footer">
        <span className="note-item-date">{formatDate(note.updatedAt)}</span>
        {note.tags && note.tags.length > 0 && (
          <div className="note-item-tags">
            {note.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
