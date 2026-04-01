/**
 * CRUD Service Module - Generic CRUD operations for any entity
 * Provides reusable CRUD patterns that can be used for Notes, Tags, Categories, etc.
 * Connects to: Logger, EventSystem
 */

import { appLogger } from './logger.js';
import { eventSystem } from './eventSystem.js';

/**
 * Generic CRUD Service Class
 * Can be extended for specific entities
 */
class CRUDService {
  constructor(entityName, storage = {}) {
    this.entityName = entityName;
    this.logger = appLogger;
    this.storage = storage;
    this.data = [];
    this.logger.info(`CRUDService initialized for: ${entityName}`);
  }

  /**
   * CREATE - Add new entity
   */
  create(entity) {
    try {
      if (!entity || typeof entity !== 'object') {
        this.logger.error(`Cannot create ${this.entityName}: Invalid entity`, entity);
        return null;
      }

      // Add metadata
      const entityWithMeta = {
        ...entity,
        id: entity.id || this.generateId(),
        createdAt: entity.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false // Soft delete support
      };

      this.data.push(entityWithMeta);
      this.logger.info(`${this.entityName} created: ${entityWithMeta.id}`);
      eventSystem.emit(`${this.entityName}:created`, entityWithMeta);

      return entityWithMeta;
    } catch (error) {
      this.logger.error(`Failed to create ${this.entityName}`, error);
      eventSystem.emit('error:occurred', { 
        service: 'CRUD', 
        entity: this.entityName, 
        operation: 'create',
        error: error.message 
      });
      return null;
    }
  }

  /**
   * CREATE BATCH - Add multiple entities
   */
  createBatch(entities) {
    try {
      if (!Array.isArray(entities)) {
        this.logger.error(`Cannot batch create: Expected array, got ${typeof entities}`);
        return [];
      }

      const created = entities.map(entity => this.create(entity)).filter(e => e !== null);
      this.logger.info(`Batch created ${created.length} ${this.entityName} entities`);
      eventSystem.emit(`${this.entityName}:batch-created`, { count: created.length });

      return created;
    } catch (error) {
      this.logger.error(`Failed to batch create ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * READ - Get all entities (excluding soft deleted)
   */
  read() {
    try {
      const activeData = this.data.filter(item => !item.isDeleted);
      this.logger.debug(`Retrieved ${activeData.length} active ${this.entityName} entities`);
      return [...activeData];
    } catch (error) {
      this.logger.error(`Failed to read ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * READ BY ID - Get specific entity
   */
  readById(id) {
    try {
      const entity = this.data.find(item => item.id === id && !item.isDeleted);
      
      if (entity) {
        this.logger.debug(`Retrieved ${this.entityName}: ${id}`);
        return entity;
      } else {
        this.logger.warn(`${this.entityName} not found: ${id}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Failed to read ${this.entityName} by id: ${id}`, error);
      return null;
    }
  }

  /**
   * READ WITH FILTER - Get entities matching predicate
   */
  readWhere(predicate) {
    try {
      if (typeof predicate !== 'function') {
        this.logger.error('Filter predicate must be a function');
        return [];
      }

      const results = this.data.filter(item => !item.isDeleted && predicate(item));
      this.logger.debug(`Filter query returned ${results.length} ${this.entityName} results`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to query ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * READ WITH PAGINATION
   */
  readPaginated(page = 1, pageSize = 10) {
    try {
      const activeData = this.data.filter(item => !item.isDeleted);
      const totalItems = activeData.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      
      if (page < 1 || page > totalPages) {
        this.logger.warn(`Invalid page number: ${page} (total pages: ${totalPages})`);
        return { data: [], page, pageSize, totalItems, totalPages };
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = activeData.slice(start, end);

      this.logger.debug(`Paginated ${this.entityName}: page ${page}/${totalPages}`);
      
      return {
        data: paginatedData,
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      this.logger.error(`Failed to paginate ${this.entityName}`, error);
      return { data: [], page: 1, pageSize, totalItems: 0, totalPages: 0 };
    }
  }

  /**
   * UPDATE - Modify entity
   */
  update(id, updates) {
    try {
      const index = this.data.findIndex(item => item.id === id && !item.isDeleted);
      
      if (index === -1) {
        this.logger.warn(`Cannot update: ${this.entityName} not found (${id})`);
        return null;
      }

      const updatedEntity = {
        ...this.data[index],
        ...updates,
        id: this.data[index].id, // Prevent ID change
        createdAt: this.data[index].createdAt, // Preserve creation date
        updatedAt: new Date().toISOString()
      };

      this.data[index] = updatedEntity;
      this.logger.info(`${this.entityName} updated: ${id}`);
      eventSystem.emit(`${this.entityName}:updated`, updatedEntity);

      return updatedEntity;
    } catch (error) {
      this.logger.error(`Failed to update ${this.entityName}: ${id}`, error);
      return null;
    }
  }

  /**
   * UPDATE BATCH - Update multiple entities
   */
  updateBatch(updates) {
    try {
      if (!Array.isArray(updates)) {
        this.logger.error('Batch updates must be an array');
        return [];
      }

      const updated = updates
        .map(({ id, changes }) => this.update(id, changes))
        .filter(e => e !== null);

      this.logger.info(`Batch updated ${updated.length} ${this.entityName} entities`);
      eventSystem.emit(`${this.entityName}:batch-updated`, { count: updated.length });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to batch update ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * DELETE - Hard delete (permanent)
   */
  delete(id) {
    try {
      const index = this.data.findIndex(item => item.id === id);
      
      if (index === -1) {
        this.logger.warn(`Cannot delete: ${this.entityName} not found (${id})`);
        return false;
      }

      const deleted = this.data.splice(index, 1)[0];
      this.logger.info(`${this.entityName} permanently deleted: ${id}`);
      eventSystem.emit(`${this.entityName}:deleted`, deleted);

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete ${this.entityName}: ${id}`, error);
      return false;
    }
  }

  /**
   * SOFT DELETE - Mark as deleted without removing
   */
  softDelete(id) {
    try {
      const entity = this.data.find(item => item.id === id);
      
      if (!entity) {
        this.logger.warn(`Cannot soft delete: ${this.entityName} not found (${id})`);
        return false;
      }

      entity.isDeleted = true;
      entity.deletedAt = new Date().toISOString();
      
      this.logger.info(`${this.entityName} soft deleted: ${id}`);
      eventSystem.emit(`${this.entityName}:soft-deleted`, entity);

      return true;
    } catch (error) {
      this.logger.error(`Failed to soft delete ${this.entityName}: ${id}`, error);
      return false;
    }
  }

  /**
   * RESTORE - Restore soft-deleted entity
   */
  restore(id) {
    try {
      const entity = this.data.find(item => item.id === id && item.isDeleted);
      
      if (!entity) {
        this.logger.warn(`Cannot restore: Deleted ${this.entityName} not found (${id})`);
        return null;
      }

      entity.isDeleted = false;
      delete entity.deletedAt;
      
      this.logger.info(`${this.entityName} restored: ${id}`);
      eventSystem.emit(`${this.entityName}:restored`, entity);

      return entity;
    } catch (error) {
      this.logger.error(`Failed to restore ${this.entityName}: ${id}`, error);
      return null;
    }
  }

  /**
   * DELETE BATCH - Delete multiple entities
   */
  deleteBatch(ids) {
    try {
      if (!Array.isArray(ids)) {
        this.logger.error('Delete batch requires array of IDs');
        return [];
      }

      const deleted = ids
        .filter(id => this.delete(id))
        .map(id => id); // Return deleted IDs

      this.logger.info(`Batch deleted ${deleted.length} ${this.entityName} entities`);
      eventSystem.emit(`${this.entityName}:batch-deleted`, { count: deleted.length });

      return deleted;
    } catch (error) {
      this.logger.error(`Failed to batch delete ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * DELETE ALL - Clear entire storage
   */
  deleteAll() {
    try {
      const count = this.data.length;
      this.data = [];
      this.logger.info(`All ${this.entityName} entities deleted (${count} total)`);
      eventSystem.emit(`${this.entityName}:all-deleted`, { count });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete all ${this.entityName}`, error);
      return false;
    }
  }

  /**
   * COUNT - Get total count
   */
  count() {
    try {
      const activeCount = this.data.filter(item => !item.isDeleted).length;
      const deletedCount = this.data.filter(item => item.isDeleted).length;
      return {
        total: this.data.length,
        active: activeCount,
        deleted: deletedCount
      };
    } catch (error) {
      this.logger.error(`Failed to count ${this.entityName}`, error);
      return { total: 0, active: 0, deleted: 0 };
    }
  }

  /**
   * SEARCH - Full-text search across fields
   */
  search(query, searchFields = []) {
    try {
      if (!query || !Array.isArray(searchFields) || searchFields.length === 0) {
        this.logger.warn('Search requires query and searchFields array');
        return [];
      }

      const lowerQuery = query.toLowerCase();
      const results = this.data.filter(item => {
        if (item.isDeleted) return false;
        return searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(lowerQuery);
        });
      });

      this.logger.debug(`Search "${query}" found ${results.length} results in ${this.entityName}`);
      return results;
    } catch (error) {
      this.logger.error(`Search failed for ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * SORT - Sort entities by field
   */
  sort(sortField, order = 'asc') {
    try {
      const activeData = this.data.filter(item => !item.isDeleted);
      
      const sorted = [...activeData].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });

      this.logger.debug(`Sorted ${this.entityName} by ${sortField} (${order})`);
      return sorted;
    } catch (error) {
      this.logger.error(`Failed to sort ${this.entityName}`, error);
      return [];
    }
  }

  /**
   * EXPORT - Export all data
   */
  export() {
    try {
      const exportData = {
        entity: this.entityName,
        exportedAt: new Date().toISOString(),
        totalItems: this.data.length,
        data: [...this.data]
      };

      this.logger.info(`Exported ${this.entityName} data: ${this.data.length} items`);
      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export ${this.entityName}`, error);
      return null;
    }
  }

  /**
   * IMPORT - Import data
   */
  import(importedData) {
    try {
      if (!Array.isArray(importedData)) {
        this.logger.error('Import data must be an array');
        return 0;
      }

      this.data = importedData.map(item => ({
        ...item,
        id: item.id || this.generateId(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));

      this.logger.info(`Imported ${this.data.length} items into ${this.entityName}`);
      eventSystem.emit(`${this.entityName}:imported`, { count: this.data.length });

      return this.data.length;
    } catch (error) {
      this.logger.error(`Failed to import ${this.entityName}`, error);
      return 0;
    }
  }

  /**
   * VALIDATE - Validate entity against schema
   */
  validate(entity, schema) {
    try {
      const errors = [];

      // Check required fields
      if (schema.required) {
        schema.required.forEach(field => {
          if (!entity[field]) {
            errors.push(`Missing required field: ${field}`);
          }
        });
      }

      // Validate field types
      if (schema.fields) {
        Object.entries(schema.fields).forEach(([field, type]) => {
          if (entity[field] && typeof entity[field] !== type) {
            errors.push(`Field "${field}" must be of type ${type}`);
          }
        });
      }

      if (errors.length > 0) {
        this.logger.warn(`Validation failed for ${this.entityName}`, errors);
        return { valid: false, errors };
      }

      this.logger.debug(`Validation passed for ${this.entityName}`);
      return { valid: true, errors: [] };
    } catch (error) {
      this.logger.error(`Validation error for ${this.entityName}`, error);
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * STATISTICS - Get data statistics
   */
  statistics() {
    try {
      const counts = this.count();
      const stats = {
        entity: this.entityName,
        ...counts,
        createdRecently: this.data.filter(item => {
          const created = new Date(item.createdAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return created > dayAgo;
        }).length,
        updatedRecently: this.data.filter(item => {
          const updated = new Date(item.updatedAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return updated > dayAgo;
        }).length
      };

      this.logger.debug(`Statistics generated for ${this.entityName}`, stats);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to generate statistics for ${this.entityName}`, error);
      return null;
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${this.entityName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Pre-built CRUD Services for common entities
 */

// Tag CRUD Service
class TagCRUD extends CRUDService {
  constructor() {
    super('tag');
  }

  /**
   * Get tags by category
   */
  getByCategory(category) {
    return this.readWhere(tag => tag.category === category);
  }

  /**
   * Get usage count for tag
   */
  getUsageCount(tagId) {
    const tag = this.readById(tagId);
    return tag ? tag.usageCount || 0 : 0;
  }

  /**
   * Increment usage count
   */
  incrementUsage(tagId) {
    const tag = this.readById(tagId);
    if (tag) {
      tag.usageCount = (tag.usageCount || 0) + 1;
      this.update(tagId, { usageCount: tag.usageCount });
    }
  }
}

// Category CRUD Service
class CategoryCRUD extends CRUDService {
  constructor() {
    super('category');
  }

  /**
   * Get items in category
   */
  getItemCount(categoryId) {
    const category = this.readById(categoryId);
    return category ? category.itemCount || 0 : 0;
  }
}

// Generic data CRUD Service
class DataCRUD extends CRUDService {
  constructor(entityName = 'data') {
    super(entityName);
  }
}

export { CRUDService, TagCRUD, CategoryCRUD, DataCRUD };
