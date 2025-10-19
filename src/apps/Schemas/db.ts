/**
 * IndexedDB service for schema storage
 * Stores UI schemas with their channel bindings
 */

import type { SchemaProject } from "./types.ts";

const DB_NAME = "schemas-db";
const DB_VERSION = 1;
const STORE_NAME = "schemas";

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("widgetKey", "widgetKey", { unique: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });
}

/**
 * Get all schemas from database
 */
export async function getAllSchemas(): Promise<SchemaProject[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as SchemaProject[]);
    };

    request.onerror = () => {
      reject(new Error("Failed to get schemas"));
    };
  });
}

/**
 * Get schema by ID
 */
export async function getSchema(id: string): Promise<SchemaProject | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as SchemaProject | null);
    };

    request.onerror = () => {
      reject(new Error("Failed to get schema"));
    };
  });
}

/**
 * Get schema by widget key
 */
export async function getSchemaByWidgetKey(
  widgetKey: string
): Promise<SchemaProject | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("widgetKey");
    const request = index.get(widgetKey);

    request.onsuccess = () => {
      resolve(request.result as SchemaProject | null);
    };

    request.onerror = () => {
      reject(new Error("Failed to get schema by widget key"));
    };
  });
}

/**
 * Save schema to database (create or update)
 */
export async function saveSchema(schema: SchemaProject): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(schema);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to save schema"));
    };
  });
}

/**
 * Delete schema from database
 */
export async function deleteSchema(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete schema"));
    };
  });
}

/**
 * Find schema that contains a specific channel key
 */
export async function findSchemaByChannelKey(
  channelKey: string
): Promise<SchemaProject | null> {
  const allSchemas = await getAllSchemas();
  return allSchemas.find((s) => s.channelKeys.includes(channelKey)) || null;
}

/**
 * Generate widget key from channel keys
 */
export function generateWidgetKey(channelKeys: string[]): string {
  if (channelKeys.length === 0) {
    return `widget.custom.${Date.now()}`;
  }

  // Use first channel as base, replace prefix with 'widget'
  const firstChannel = channelKeys[0];
  return `widget.${firstChannel}`;
}

/**
 * Generate unique schema ID
 */
export function generateSchemaId(): string {
  return `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

