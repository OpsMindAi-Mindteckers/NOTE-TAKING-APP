/**
 * CRUD Demo Component - Demonstrates all CRUD operations
 * Shows how to use the CRUDService for any entity type
 * Uses: Logger, EventSystem, CRUDService
 */

import { useState, useEffect } from 'react';
import { appLogger } from '../modules/logger.js';
import { eventSystem } from '../modules/eventSystem.js';
import { CRUDService, TagCRUD } from '../modules/crud.js';
import './CRUDDemo.css';

export default function CRUDDemo() {
  // Demo using Products as example entity
  const [crudService] = useState(() => {
    const service = new CRUDService('product');
    appLogger.info('CRUDDemo: CRUD Service initialized');
    return service;
  });

  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  // Load items on component mount
  useEffect(() => {
    appLogger.info('CRUDDemo component mounted');
    const allItems = crudService.read();
    setItems(allItems);
    updateStats();

    // Listen to CRUD events
    const unsubscribe = eventSystem.on('product:created', () => {
      appLogger.debug('CRUDDemo: product:created event received');
      setItems(crudService.read());
      updateStats();
    });

    return () => {
      unsubscribe();
      appLogger.info('CRUDDemo component unmounted');
    };
  }, [crudService]);

  const updateStats = () => {
    const newStats = crudService.statistics();
    setStats(newStats);
    appLogger.debug('CRUDDemo: Statistics updated');
  };

  // CREATE operation
  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }

    const newProduct = {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      category: formData.category || 'uncategorized'
    };

    const created = crudService.create(newProduct);
    if (created) {
      appLogger.info('CRUDDemo: Product created successfully');
      setItems(crudService.read());
      setFormData({ name: '', price: '', category: '' });
      updateStats();
    }
  };

  // READ - Filter and search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setItems(crudService.read());
      return;
    }

    const results = crudService.search(searchQuery, ['name', 'category']);
    setItems(results);
    appLogger.info(`CRUDDemo: Search found ${results.length} results`);
  };

  // UPDATE operation
  const handleUpdate = (id) => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }

    const updated = crudService.update(id, {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      category: formData.category || 'uncategorized'
    });

    if (updated) {
      appLogger.info(`CRUDDemo: Product updated: ${id}`);
      setItems(crudService.read());
      setEditingId(null);
      setFormData({ name: '', price: '', category: '' });
      updateStats();
    }
  };

  // DELETE operation (hard delete)
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to permanently delete this product?')) {
      const success = crudService.delete(id);
      if (success) {
        appLogger.info(`CRUDDemo: Product deleted: ${id}`);
        setItems(crudService.read());
        updateStats();
      }
    }
  };

  // SOFT DELETE operation
  const handleSoftDelete = (id) => {
    const success = crudService.softDelete(id);
    if (success) {
      appLogger.info(`CRUDDemo: Product soft deleted: ${id}`);
      setItems(crudService.read());
      updateStats();
    }
  };

  // RESTORE operation
  const handleRestore = (id) => {
    const restored = crudService.restore(id);
    if (restored) {
      appLogger.info(`CRUDDemo: Product restored: ${id}`);
      setItems(crudService.read());
      updateStats();
    }
  };

  // SORT operation
  const handleSort = (field) => {
    setSortField(field);
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sorted = crudService.sort(field, newOrder);
    setItems(sorted);
    appLogger.debug(`CRUDDemo: Sorted by ${field} (${newOrder})`);
  };

  // PAGINATION
  const handlePaginate = (page) => {
    setCurrentPage(page);
    appLogger.debug(`CRUDDemo: Paginated to page ${page}`);
  };

  const paginatedData = crudService.readPaginated(currentPage, pageSize);

  // BATCH operations
  const handleBatchCreate = () => {
    const sampleData = [
      { name: 'Laptop', price: 999.99, category: 'electronics' },
      { name: 'Mouse', price: 29.99, category: 'electronics' },
      { name: 'Keyboard', price: 79.99, category: 'electronics' },
      { name: 'Monitor', price: 299.99, category: 'electronics' }
    ];

    const created = crudService.createBatch(sampleData);
    appLogger.info(`CRUDDemo: Batch created ${created.length} products`);
    setItems(crudService.read());
    updateStats();
  };

  // EXPORT operation
  const handleExport = () => {
    const exported = crudService.export();
    const dataStr = JSON.stringify(exported, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr));
    element.setAttribute('download', `products-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    appLogger.info('CRUDDemo: Data exported');
  };

  // IMPORT operation
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const count = crudService.import(data.data || data);
        setItems(crudService.read());
        updateStats();
        appLogger.info(`CRUDDemo: Imported ${count} products`);
        alert(`Successfully imported ${count} products!`);
      } catch (error) {
        appLogger.error('CRUDDemo: Import failed', error);
        alert('Failed to import data. Make sure it\'s valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  // VALIDATE operation
  const handleValidate = () => {
    const schema = {
      required: ['name', 'price'],
      fields: {
        name: 'string',
        price: 'number',
        category: 'string'
      }
    };

    const testProduct = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category
    };

    const validation = crudService.validate(testProduct, schema);
    appLogger.info('CRUDDemo: Validation result', validation);
    alert(validation.valid ? 'Product is valid!' : `Validation errors:\n${validation.errors.join('\n')}`);
  };

  const handleDeleteAll = () => {
    if (confirm('Delete ALL products? This cannot be undone.')) {
      const success = crudService.deleteAll();
      if (success) {
        appLogger.info('CRUDDemo: All products deleted');
        setItems([]);
        updateStats();
      }
    }
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category
    });
    appLogger.debug(`CRUDDemo: Started editing product ${item.id}`);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', category: '' });
  };

  return (
    <div className="crud-demo">
      <div className="crud-header-section">
        <h2>🔄 CRUD Operations Demo</h2>
        <p>Complete Create, Read, Update, Delete operations with advanced features</p>
      </div>

      {/* Tab Navigation */}
      <div className="crud-tabs">
        <button
          className={`crud-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Items List
        </button>
        <button
          className={`crud-tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          ➕ Create/Edit
        </button>
        <button
          className={`crud-tab ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => setActiveTab('operations')}
        >
          ⚙️ Operations
        </button>
        <button
          className={`crud-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      {/* Tab Content */}

      {/* Items List Tab */}
      {activeTab === 'list' && (
        <div className="crud-tab-content">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="crud-search-input"
            />
            <button onClick={handleSearch} className="crud-btn primary">
              🔍 Search
            </button>
            <button onClick={() => {
              setSearchQuery('');
              setItems(crudService.read());
            }} className="crud-btn secondary">
              Clear
            </button>
          </div>

          <div className="sort-section">
            <label>Sort by:</label>
            <button
              className={`crud-sort-btn ${sortField === 'name' ? 'active' : ''}`}
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`crud-sort-btn ${sortField === 'price' ? 'active' : ''}`}
              onClick={() => handleSort('price')}
            >
              Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`crud-sort-btn ${sortField === 'category' ? 'active' : ''}`}
              onClick={() => handleSort('category')}
            >
              Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="items-list">
            {paginatedData.data.length === 0 ? (
              <div className="empty-message">No items found. Create one to get started!</div>
            ) : (
              <>
                {paginatedData.data.map(item => (
                  <div key={item.id} className="crud-item">
                    <div className="item-content">
                      <h4>{item.name}</h4>
                      <p className="item-meta">
                        <span className="item-category">{item.category}</span>
                        <span className="item-price">${item.price.toFixed(2)}</span>
                        <span className="item-date">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div className="item-actions">
                      <button
                        className="crud-btn-sm edit"
                        onClick={() => handleEditStart(item)}
                      >
                        ✏️
                      </button>
                      <button
                        className="crud-btn-sm delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {paginatedData.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={!paginatedData.hasPreviousPage}
                      onClick={() => handlePaginate(currentPage - 1)}
                      className="crud-btn secondary"
                    >
                      ← Previous
                    </button>
                    <span className="pagination-info">
                      Page {paginatedData.page} of {paginatedData.totalPages}
                    </span>
                    <button
                      disabled={!paginatedData.hasNextPage}
                      onClick={() => handlePaginate(currentPage + 1)}
                      className="crud-btn secondary"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Tab */}
      {activeTab === 'form' && (
        <div className="crud-tab-content">
          <div className="crud-form">
            <h3>{editingId ? '✏️ Edit Product' : '➕ Create New Product'}</h3>
            
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                placeholder="e.g., electronics, books, etc."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              {editingId ? (
                <>
                  <button
                    onClick={() => handleUpdate(editingId)}
                    className="crud-btn primary"
                  >
                    💾 Update Product
                  </button>
                  <button onClick={handleEditCancel} className="crud-btn secondary">
                    ✕ Cancel Edit
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleCreate} className="crud-btn primary">
                    ➕ Create Product
                  </button>
                  <button onClick={handleValidate} className="crud-btn secondary">
                    ✓ Validate
                  </button>
                </>
              )}
            </div>

            <div className="quick-actions">
              <button onClick={handleBatchCreate} className="crud-btn accent">
                📦 Load Sample Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div className="crud-tab-content">
          <div className="operations-grid">
            <div className="operation-card">
              <h4>📥 Import Data</h4>
              <p>Load products from JSON file</p>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="file-input"
              />
            </div>

            <div className="operation-card">
              <h4>📤 Export Data</h4>
              <p>Download all products as JSON</p>
              <button onClick={handleExport} className="crud-btn primary">
                📤 Export
              </button>
            </div>

            <div className="operation-card">
              <h4>🗑️ Delete All</h4>
              <p>Remove all products permanently</p>
              <button onClick={handleDeleteAll} className="crud-btn danger">
                🗑️ Delete All
              </button>
            </div>

            <div className="operation-card">
              <h4>📊 Refresh Stats</h4>
              <p>Update statistics display</p>
              <button onClick={updateStats} className="crud-btn secondary">
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="operations-info">
            <h4>Available CRUD Operations:</h4>
            <ul>
              <li><strong>CREATE:</strong> Add new product (+ batch create)</li>
              <li><strong>READ:</strong> View all products with search/filter</li>
              <li><strong>UPDATE:</strong> Edit product details</li>
              <li><strong>DELETE:</strong> Remove products (+ soft delete, restore)</li>
              <li><strong>SORT:</strong> Order by any field</li>
              <li><strong>PAGINATE:</strong> View in pages</li>
              <li><strong>SEARCH:</strong> Full-text search</li>
              <li><strong>VALIDATE:</strong> Check data integrity</li>
              <li><strong>EXPORT/IMPORT:</strong> Backup and restore data</li>
            </ul>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="crud-tab-content">
          {stats && (
            <div className="stats-grid">
              <div className="stat-box">
                <label>Total Items</label>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-box">
                <label>Active Items</label>
                <span className="stat-value">{stats.active}</span>
              </div>
              <div className="stat-box">
                <label>Deleted Items</label>
                <span className="stat-value">{stats.deleted}</span>
              </div>
              <div className="stat-box">
                <label>Created Today</label>
                <span className="stat-value">{stats.createdRecently}</span>
              </div>
              <div className="stat-box">
                <label>Updated Today</label>
                <span className="stat-value">{stats.updatedRecently}</span>
              </div>
            </div>
          )}

          <div className="statistics-info">
            <h4>CRUD Service Statistics</h4>
            <p>The CRUD service tracks all operations including:</p>
            <ul>
              <li>Total items created</li>
              <li>Items updated recently</li>
              <li>Soft-deleted items (can be restored)</li>
              <li>Data creation and update timestamps</li>
              <li>Entity validation history</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
