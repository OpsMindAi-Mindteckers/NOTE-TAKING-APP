# 📝 Note Keeper - Modular Note-Taking App

A highly modular, production-ready note-taking application built with React and Vite, featuring comprehensive logging, inter-module communication, and persistent storage.

## 🏗️ Architecture

The application follows a modular architecture where each module has a single responsibility and communicates with other modules through a centralized event system.

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                       │
│          (NoteList, NoteEditor, NoteItem, etc)          │
└────────────────┬────────────────────────────────────────┘
                 │ uses
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  NoteManager Module                      │
│            (CRUD operations, Search, Stats)             │
└────────┬─────────────────────────┬─────────────────────┘
         │ listens to              │ emits events to
         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Storage Module      │  │  EventSystem Module  │
│ (localStorage CRUD)  │  │  (Pub/Sub Pattern)   │
└──────────────────────┘  └──────────────────────┘
         ▲
         │ uses
         ▼
    Logger Module
  (Logging & Debug)
```

## 📦 Module Structure

### 1. **Logger Module** (`src/modules/logger.js`)
Centralized logging system for the entire application.

**Features:**
- Multiple log levels: DEBUG, INFO, WARN, ERROR
- Automatic timestamps
- In-memory log storage (limited to 100 entries)
- Export logs as JSON
- Filter logs by level

**Usage:**
```javascript
import { appLogger } from './modules/logger.js';
appLogger.info('App started');
appLogger.debug('Debug info', { data: 'value' });
appLogger.error('Error occurred', error);
```

**Key Methods:**
- `debug(message, data)` - Log debug information
- `info(message, data)` - Log informational messages
- `warn(message, data)` - Log warning messages
- `error(message, data)` - Log error messages
- `getLogs()` - Get all stored logs
- `exportLogs()` - Export logs as JSON string

---

### 2. **Event System Module** (`src/modules/eventSystem.js`)
Enables inter-module communication without tight coupling.

**Features:**
- Pub/Sub pattern implementation
- Subscribe to events with callbacks
- One-time event listeners (`once`)
- Event unsubscription
- Built-in logging of all events

**Key Events:**
- `NOTE_CREATED` - When a note is created
- `NOTE_UPDATED` - When a note is modified
- `NOTE_DELETED` - When a note is removed
- `NOTE_SELECTED` - When a note is selected
- `NOTES_LOADED` - When notes are loaded from storage
- `STORAGE_CHANGED` - When storage is modified
- `ERROR_OCCURRED` - When an error happens

**Usage:**
```javascript
import { eventSystem, AppEvents } from './modules/eventSystem.js';

// Subscribe to an event
const unsubscribe = eventSystem.on(AppEvents.NOTE_CREATED, (data) => {
  console.log('Note created:', data);
});

// Emit an event
eventSystem.emit(AppEvents.NOTE_CREATED, { id: '123', title: 'My Note' });

// Unsubscribe
unsubscribe();
```

---

### 3. **Storage Module** (`src/modules/storage.js`)
Handles persistent data storage using browser localStorage.

**Features:**
- Automatic initialization with default data
- CRUD operations for notes
- Error handling and recovery
- Storage statistics
- Integration with EventSystem for change notifications

**Key Methods:**
- `getNotes()` - Retrieve all notes
- `getNoteById(id)` - Get a specific note
- `addNote(note)` - Add a new note
- `updateNote(id, updates)` - Update an existing note
- `deleteNote(id)` - Delete a note
- `clearAllNotes()` - Remove all notes
- `getStats()` - Get storage statistics

**Usage:**
```javascript
import { storage } from './modules/storage.js';

const notes = storage.getNotes();
storage.addNote({ id: '1', title: 'My Note', content: '...' });
storage.updateNote('1', { title: 'Updated Title' });
storage.deleteNote('1');
```

---

### 4. **Note Manager Module** (`src/modules/noteManager.js`)
High-level note management with business logic.

**Features:**
- Note CRUD operations
- Search functionality (by title/content)
- Tag management
- Statistics generation
- Automatic event emission
- Reactive updates on storage changes

**Key Methods:**
- `getAllNotes()` - Get all notes
- `getNoteById(id)` - Get specific note
- `createNote(title, content)` - Create new note
- `updateNote(id, updates)` - Update note
- `deleteNote(id)` - Delete note
- `searchNotes(query)` - Search by title/content
- `getNotesByTag(tag)` - Filter by tag
- `addTag(noteId, tag)` - Add tag to note
- `removeTag(noteId, tag)` - Remove tag from note
- `getStatistics()` - Get comprehensive stats

**Usage:**
```javascript
import { noteManager } from './modules/noteManager.js';

const note = noteManager.createNote('My First Note', 'Content here');
noteManager.updateNote(note.id, { title: 'Updated' });
noteManager.addTag(note.id, 'important');
const results = noteManager.searchNotes('important');
const stats = noteManager.getStatistics();
```

---

## 🔄 Module Interdependencies

```
┌─────────────────────────────────┐
│     Logger (Foundation)          │
│   - Used by: all modules         │
│   - No dependencies              │
└─────────────────────────────────┘
         ▲
         │ imports
    ┌────┴────────────────┐
    │                     │
┌───┴──────────────┐  ┌──┴───────────────┐
│ EventSystem      │  │ Storage Module   │
│ - No deps        │  │ - Depends on:    │
│ - Logs events    │  │   Logger         │
│                  │  │   EventSystem    │
└──────────────────┘  └──────────────────┘
    ▲      ▲               ▲
    │      └───────┬───────┘
    │            │ imports & listens
┌───┴────────────┴────────────────────┐
│      NoteManager Module             │
│  - Depends on:                       │
│    • Logger                          │
│    • EventSystem                     │
│    • Storage                         │
│  - Orchestrates all modules          │
└─────────────────────────────────────┘
    ▲
    │ used by
    ▼
┌─────────────────────────────────┐
│   React Components              │
│ - Depend on: NoteManager        │
│ - Listen to: EventSystem        │
│ - Use: Logger for debugging     │
└─────────────────────────────────┘
```

---

## 🎯 Component Structure

### AppHeader Component
- Displays application title and statistics
- Provides controls for clearing notes
- Shows application logs
- Displays note statistics

### NoteList Component
- Displays all notes in a list
- Search/filter functionality
- Shows note count
- Listens to note creation/update/delete events

### NoteEditor Component
- Create and edit notes
- Tag management
- Save status indicator
- Note metadata display

### NoteItem Component
- Individual note preview
- Delete button
- Tag display
- Formatted date/time

---

## 🔗 Data Flow

### Creating a Note
```
NoteEditor Component
    ↓
noteManager.createNote()
    ↓ emits
eventSystem.emit(NOTE_CREATED)
    ↓
[1] Storage Module - appLogger logs it
[2] NoteManager - event listener updates internal state
[3] NoteList Component - event listener refreshes UI
[4] AppHeader Component - event listener updates stats
```

### Searching Notes
```
NoteList Component
    ↓ user types in search box
handleSearch()
    ↓
noteManager.searchNotes(query)
    ↓
returns filtered notes
    ↓
appLogger.debug() logs the search
    ↓
UI updates with filtered results
```

### Updating Notes
```
NoteEditor Component
    ↓
noteManager.updateNote()
    ↓
storage.updateNote()
    ↓ emits
eventSystem.emit(STORAGE_CHANGED)
    ↓
noteManager reloads from storage
    ↓ emits
eventSystem.emit(NOTE_UPDATED)
    ↓
All listening components update
```

---

## 📊 Logger Output Example

```
[14:32:45] [AppLogger] [INFO] Application started
[14:32:46] [StorageManager] [INFO] StorageManager initialized
[14:32:47] [EventSystem] [INFO] EventSystem initialized
[14:32:48] [NoteManager] [INFO] NoteManager initialized
[14:32:50] [NoteList] [DEBUG] NoteList search: "important"
[14:33:02] [NoteManager] [INFO] Note created: note_1699000382000_abc123def , {title: "My First Note"}
[14:33:05] [Storage] [DEBUG] Saved 1 notes to storage
[14:33:08] [NoteEditor] [INFO] NoteEditor: Created new note note_1699000382000_abc123def
```

---

## 🚀 Features

- ✅ **Modular Architecture** - Each module is independent and testable
- ✅ **Event-Driven** - Loose coupling through event system
- ✅ **Comprehensive Logging** - Track all operations with timestamps
- ✅ **Local Storage** - Persist notes in browser localStorage
- ✅ **Search & Filter** - Find notes by title or content
- ✅ **Tag System** - Organize notes with tags
- ✅ **Statistics** - View app-wide statistics
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Export Logs** - Download application logs as JSON
- ✅ **Error Handling** - Graceful error management across modules

---

## 📱 Usage Guide

### Creating a Note
1. Click in the title field in the editor
2. Enter your note title
3. Click in the content area and type your note
4. (Optional) Add tags using the tag input
5. Click "Create Note" to save

### Editing a Note
1. Click on a note in the left sidebar to select it
2. Edit the title or content
3. The app shows unsaved changes indicator
4. Click "Update Note" to save changes

### Searching
1. Use the search box in the left sidebar
2. Type to search notes by title or content
3. Results update in real-time

### Adding Tags
1. In the editor, type a tag name in the tag input
2. Press Enter or click "Add Tag"
3. Click the X button to remove tags

### Viewing Statistics
1. Click the "📊 Stats" button in the header
2. View total notes, words, characters, etc.
3. See all tags used in the app

### Exporting Logs
1. Click the "📋 Logs" button in the header
2. Click "📥 Export" to download logs as JSON
3. Click "🗑️ Clear" to clear log history

---

## 🔧 Integration Points

### How Modules Connect:

1. **Logger** → All modules import and use `appLogger`
2. **EventSystem** → All modules emit/listen to events
3. **Storage** → NoteManager uses it for persistence
4. **NoteManager** → Components use it for operations
5. **Components** → Listen to EventSystem for updates

### Adding a New Feature:

1. **Create a new module** in `src/modules/`
2. **Import logger** for logging
3. **Integrate with EventSystem** for notifications
4. **Use NoteManager** for data access
5. **Create components** if UI is needed
6. **Listen to events** for reactive updates

---

## 📝 Example: Adding a New Module

```javascript
// src/modules/analytics.js
import { appLogger } from './logger.js';
import { eventSystem, AppEvents } from './eventSystem.js';

class Analytics {
  constructor() {
    this.logger = appLogger;
    this.setupListeners();
  }

  setupListeners() {
    eventSystem.on(AppEvents.NOTE_CREATED, (data) => {
      this.logger.info('Analytics: Note created tracked', data);
      // Track analytics...
    });
  }
}

const analytics = new Analytics();
export { Analytics, analytics };
```

---

## 🎓 Key Design Patterns Used

1. **Module Pattern** - Encapsulation of related functionality
2. **Pub/Sub Pattern** - EventSystem for decoupled communication
3. **Singleton Pattern** - One instance per module (logger, storage, etc.)
4. **Observer Pattern** - Components listen to state changes
5. **Dependency Injection** - Modules import what they need

---

## 📚 Learning Resources

This app demonstrates:
- React Hooks (useState, useEffect)
- ES6 Modules
- Event-driven architecture
- Local storage APIs
- Component composition
- State management patterns
- Logging best practices

---

## 🐛 Debugging with Logs

Open browser console to see real-time logs:
- All operations are logged with timestamps
- Use "📋 Logs" button in header to view UI logs
- Export logs for offline analysis
- Filter by log level in the UI

---

## 🎨 Styling Architecture

- **CSS Modules** - Each component has its own CSS file
- **CSS Variables** - Centralized color scheme in index.css
- **Responsive Design** - Mobile-first approach
- **Modern CSS** - Flexbox and Grid layouts

---

## 📦 Project Structure

```
note-taking-app/
├── src/
│   ├── modules/
│   │   ├── logger.js          # Logging system
│   │   ├── eventSystem.js     # Event bus
│   │   ├── storage.js         # localStorage wrapper
│   │   └── noteManager.js     # Business logic
│   ├── components/
│   │   ├── AppHeader.jsx      # Header with stats
│   │   ├── AppHeader.css
│   │   ├── NoteList.jsx       # Note list sidebar
│   │   ├── NoteList.css
│   │   ├── NoteEditor.jsx     # Note editor
│   │   ├── NoteEditor.css
│   │   ├── NoteItem.jsx       # Individual note
│   │   └── NoteItem.css
│   ├── App.jsx                # Main component
│   ├── App.css
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ✨ Features Showcase

- **Real-time Search** - Instantly filter notes as you type
- **Auto-save Indicator** - See when notes are saved
- **Tag System** - Organize and filter by tags
- **Statistics Dashboard** - View app statistics
- **Detailed Logging** - Track every operation
- **Export Functionality** - Export logs for analysis
- **Responsive UI** - Works on all screen sizes

---

Built with ❤️ using React, Vite, and modular JavaScript architecture.
