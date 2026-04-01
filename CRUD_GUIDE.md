# CRUD Operations Guide - Complete Reference

## 📋 Overview

The Note Keeper app now includes a comprehensive **CRUD (Create, Read, Update, Delete) Service Module** that provides professional-grade data management with advanced features.

## 🎯 CRUD Demo Features

Access the CRUD demo by clicking the **"🔄 CRUD Demo"** button in the header.

### Demo Uses a `Product` Entity Example

The demo showcases all CRUD operations using products as an example entity. The same patterns can be applied to notes, tasks, users, or any other data type.

---

## 🛠️ Core CRUD Operations

### 1. **CREATE** - Add New Items

```javascript
const item = crudService.create({
  name: 'Product Name',
  price: 99.99,
  category: 'electronics'
});
```

**Features:**
- ✅ Auto-generates unique IDs
- ✅ Adds timestamps (createdAt, updatedAt)
- ✅ Soft-delete support (isDeleted flag)
- ✅ Emits event: `product:created`
- ✅ Logs all operations

**Batch Create:**
```javascript
const items = crudService.createBatch([
  { name: 'Item 1', price: 10.00 },
  { name: 'Item 2', price: 20.00 },
  { name: 'Item 3', price: 30.00 }
]);
```

---

### 2. **READ** - Get Items

#### Read All Items
```javascript
const allItems = crudService.read();
// Returns: array of active (non-deleted) items
```

#### Read by ID
```javascript
const item = crudService.readById('product_123');
// Returns: single item or null
```

#### Read with Filter
```javascript
const electronics = crudService.readWhere(
  item => item.category === 'electronics'
);
// Returns: filtered array
```

#### Read with Pagination
```javascript
const page = crudService.readPaginated(2, 10);
// Returns: {
//   data: [...items],
//   page: 2,
//   pageSize: 10,
//   totalItems: 45,
//   totalPages: 5,
//   hasNextPage: true,
//   hasPreviousPage: true
// }
```

---

### 3. **UPDATE** - Modify Items

#### Update Single Item
```javascript
const updated = crudService.update('product_123', {
  name: 'Updated Name',
  price: 199.99
});
// Updates only specified fields
// Preserves ID and createdAt
// Updates updatedAt to current time
```

**Features:**
- ✅ Partial updates (only update what you change)
- ✅ Prevents ID changes
- ✅ Updates timestamp automatically
- ✅ Emits event: `product:updated`
- ✅ Returns updated item

#### Batch Update
```javascript
const updated = crudService.updateBatch([
  { id: 'product_1', changes: { price: 99.99 } },
  { id: 'product_2', changes: { category: 'sale' } }
]);
```

---

### 4. **DELETE** - Remove Items

#### Hard Delete (Permanent)
```javascript
const success = crudService.delete('product_123');
// Removes item completely from storage
// Emits event: `product:deleted`
// Returns: true/false
```

#### Soft Delete (Recoverable)
```javascript
const success = crudService.softDelete('product_123');
// Marks as deleted but keeps data
// Item filtered out from read operations
// Can be restored later
// Useful for: audit trails, undo, compliance
```

#### Restore Soft-Deleted Item
```javascript
const restored = crudService.restore('product_123');
// Un-deletes previously soft-deleted item
// Returns: restored item or null
```

#### Batch Delete
```javascript
const deleted = crudService.deleteBatch([
  'product_1',
  'product_2',
  'product_3'
]);
```

#### Delete All
```javascript
const success = crudService.deleteAll();
// Removes all items permanently
// Use with caution!
```

---

## 🔍 Advanced Operations

### **SEARCH** - Full-Text Search

```javascript
const results = crudService.search('laptop', ['name', 'category']);
// Searches across multiple fields
// Case-insensitive
// Partial matches
// Returns: filtered array
```

### **SORT** - Order Results

```javascript
const sorted = crudService.sort('price', 'asc');
// asc = ascending order (A→Z, 0→9)
// desc = descending order (Z→A, 9→0)

// Sort by name descending
const byName = crudService.sort('name', 'desc');
```

### **VALIDATE** - Check Data Integrity

```javascript
const schema = {
  required: ['name', 'price'],
  fields: {
    name: 'string',
    price: 'number',
    category: 'string'
  }
};

const result = crudService.validate(testItem, schema);
// Returns: { valid: true/false, errors: [...] }
```

### **COUNT** - Get Statistics

```javascript
const counts = crudService.count();
// Returns: {
//   total: 45,      // Total items (including deleted)
//   active: 42,     // Active items (non-deleted)
//   deleted: 3      // Soft-deleted items
// }
```

### **STATISTICS** - Comprehensive Stats

```javascript
const stats = crudService.statistics();
// Returns: {
//   entity: 'product',
//   total: 45,
//   active: 42,
//   deleted: 3,
//   createdRecently: 5,   // Created in last 24h
//   updatedRecently: 8    // Updated in last 24h
// }
```

---

## 💾 Data Import/Export

### **EXPORT** - Backup Data

```javascript
const data = crudService.export();
// Returns: {
//   entity: 'product',
//   exportedAt: '2024-03-24T14:32:45.123Z',
//   totalItems: 45,
//   data: [...all items...]
// }

// Save to file (in UI)
const json = JSON.stringify(data, null, 2);
```

### **IMPORT** - Restore Data

```javascript
const count = crudService.import(importedArray);
// Imports array of items
// Auto-generates IDs if missing
// Preserves timestamps
// Returns: number of imported items
```

---

## 🔗 Event System Integration

All CRUD operations emit events for reactive updates:

```javascript
// Listen to creation event
eventSystem.on('product:created', (item) => {
  console.log('New product:', item);
});

// Listen to update event
eventSystem.on('product:updated', (item) => {
  console.log('Updated product:', item);
});

// Listen to deletion event
eventSystem.on('product:deleted', (item) => {
  console.log('Deleted product:', item);
});

// Listen to batch operations
eventSystem.on('product:batch-created', ({ count }) => {
  console.log(`Created ${count} products`);
});
```

---

## 📊 Data Structure

Each item automatically includes metadata:

```javascript
{
  id: 'product_1699000382000_abc123',  // Auto-generated
  name: 'Laptop',
  price: 999.99,
  category: 'electronics',
  createdAt: '2024-03-24T14:32:45.123Z',  // Auto-added
  updatedAt: '2024-03-24T14:35:12.456Z',  // Auto-maintained
  isDeleted: false,                       // Soft-delete flag
}
```

---

## 🎓 Usage Examples

### Example 1: Create and Read

```javascript
// Create a new product
const laptop = crudService.create({
  name: 'Gaming Laptop',
  price: 1299.99,
  category: 'electronics'
});

// Read all products
const allProducts = crudService.read();

// Find specific product
const found = crudService.readById(laptop.id);
```

### Example 2: Search and Filter

```javascript
// Search for electronics
const electronics = crudService.search('laptop', ['name', 'category']);

// Or use filter
const expensive = crudService.readWhere(item => item.price > 500);

// Get first page
const page1 = crudService.readPaginated(1, 10);
```

### Example 3: Update with Validation

```javascript
// Validate before update
const updateData = { name: 'New Name', price: 99.99 };
const schema = {
  required: ['name', 'price'],
  fields: { name: 'string', price: 'number' }
};

const validation = crudService.validate(updateData, schema);
if (validation.valid) {
  crudService.update('product_123', updateData);
}
```

### Example 4: Soft Delete and Restore

```javascript
// Soft delete (safe, reversible)
crudService.softDelete('product_123');

// Item no longer appears in read()
const active = crudService.read(); // product_123 not included

// But can be restored
crudService.restore('product_123');
// Now it appears again in read()
```

### Example 5: Export and Import

```javascript
// Export all data
const backup = crudService.export();
localStorage.setItem('productBackup', JSON.stringify(backup));

// Later, import from file
const imported = crudService.import(backup.data);
console.log(`Restored ${imported} items`);
```

---

## 🏗️ Creating Specialized CRUD Services

The base `CRUDService` can be extended for specific needs:

```javascript
// src/modules/crud.js already includes:
class TagCRUD extends CRUDService {
  constructor() {
    super('tag');
  }

  getByCategory(category) {
    return this.readWhere(tag => tag.category === category);
  }

  getUsageCount(tagId) {
    const tag = this.readById(tagId);
    return tag ? tag.usageCount || 0 : 0;
  }
}

// Use it
const tagService = new TagCRUD();
const newTag = tagService.create({ name: 'important', category: 'priority' });
```

---

## 📱 Demo Page Features

The CRUD Demo page is organized into 4 tabs:

### Tab 1: Items List (📋)
- View all items
- Real-time search
- Sort by any field (↑ ascending, ↓ descending)
- Pagination support
- Quick edit/delete buttons

### Tab 2: Create/Edit (➕)
- Create new items with validation
- Edit existing items
- Load sample data (batch create)
- Validate data before save

### Tab 3: Operations (⚙️)
- **Import** items from JSON file
- **Export** items to JSON file
- **Delete All** items (with confirmation)
- **Refresh** statistics

### Tab 4: Statistics (📊)
- Total items count
- Active items count
- Deleted items count
- Items created today
- Items updated today

---

## 🔐 Logging Integration

All CRUD operations are automatically logged:

```javascript
[14:32:45] [CRUDService] [INFO] product created: product_1699000382000_abc123
[14:32:46] [CRUDService] [DEBUG] Retrieved 45 active product entities
[14:32:47] [CRUDService] [INFO] product updated: product_1699000382000_abc123
[14:32:48] [CRUDService] [INFO] product permanently deleted: product_1699000382000_abc123
```

View logs by clicking **"📋 Logs"** in the header.

---

## ⚙️ Configuring for Different Entities

To use CRUD for Notes instead of Products:

```javascript
import { CRUDService } from './modules/crud.js';

const noteCRUD = new CRUDService('note');

// Now all operations use 'note' naming:
const note = noteCRUD.create({ title: 'My Note', content: '...' });
// Emits: note:created
// Logs: [CRUDService] [INFO] note created: note_...
```

---

## 🚀 Best Practices

1. **Always Validate** - Check data before creating/updating
   ```javascript
   const validation = crudService.validate(data, schema);
   if (validation.valid) { /* proceed */ }
   ```

2. **Use Soft Delete** - Preserve data for compliance
   ```javascript
   crudService.softDelete(id);  // Safer than delete
   ```

3. **Listen to Events** - Keep UI in sync
   ```javascript
   eventSystem.on('product:created', () => {
     updateUI();
   });
   ```

4. **Export Backups** - Regularly backup your data
   ```javascript
   const backup = crudService.export();
   ```

5. **Use Pagination** - For large datasets
   ```javascript
   const page = crudService.readPaginated(1, 20);
   ```

6. **Search Efficiently** - Specify fields to search
   ```javascript
   crudService.search(query, ['name', 'description']);
   ```

---

## 📚 Module Files

- **crud.js** - CRUD Service implementation
- **CRUDDemo.jsx** - Interactive demo component
- **CRUDDemo.css** - Styling for demo

---

## 🎯 Summary

The CRUD Service provides:
- ✅ Complete Create, Read, Update, Delete operations
- ✅ Batch operations for multiple items
- ✅ Advanced features (search, sort, paginate, validate)
- ✅ Soft delete with restore capability
- ✅ Import/Export for data backup
- ✅ Event system integration
- ✅ Automatic logging
- ✅ Reusable for any entity type

Perfect for building data-driven applications with professional-grade data management!
