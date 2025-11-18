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
 * Ensures object store exists even if database was recreated after deletion
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Helper function to create object store
    const createObjectStore = (db: IDBDatabase): void => {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("widgetKey", "widgetKey", { unique: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    // Try to open database with retry logic
    const attemptOpen = (version: number, retryCount = 0): void => {
      const request = indexedDB.open(DB_NAME, version);

      request.onerror = () => {
        // If database doesn't exist or is being deleted, try creating it
        if (retryCount < 3) {
          // Wait a bit and retry with a new version
          setTimeout(() => {
            attemptOpen(version + 1, retryCount + 1);
          }, 100 * (retryCount + 1));
        } else {
          reject(new Error("Failed to open database after retries"));
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        
        // Ensure object store exists (in case database was recreated after deletion)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Close current connection
          db.close();
          
          // Reopen with incremented version to trigger onupgradeneeded
          const upgradeVersion = version + 1;
          const upgradeRequest = indexedDB.open(DB_NAME, upgradeVersion);
          
          upgradeRequest.onerror = () => {
            reject(new Error("Failed to upgrade database"));
          };
          
          upgradeRequest.onsuccess = () => {
            resolve(upgradeRequest.result);
          };
          
          upgradeRequest.onupgradeneeded = (event) => {
            const upgradeDb = (event.target as IDBOpenDBRequest).result;
            createObjectStore(upgradeDb);
          };
        } else {
          resolve(db);
        }
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        createObjectStore(db);
      };
    };

    // Start with initial version
    attemptOpen(DB_VERSION);
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
      const schemas = request.result as SchemaProject[];
      console.log(`[DB] Loaded ${schemas.length} schemas from IndexedDB:`, 
        schemas.map(s => ({
          name: s.name,
          selfChannelKey: s.selfChannelKey,
        }))
      );
      resolve(schemas);
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
  console.log("[DB] Saving schema to IndexedDB:", {
    id: schema.id,
    name: schema.name,
    selfChannelKey: schema.selfChannelKey,
    channelKeys: schema.channelKeys,
  });

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(schema);

    request.onsuccess = () => {
      console.log("[DB] Schema saved successfully");
      resolve();
    };

    request.onerror = () => {
      console.error("[DB] Failed to save schema");
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

/**
 * Extract all schemaRef widget keys from UINode tree
 */
export function extractSchemaRefsFromNode(
  node: unknown,
  refs: Set<string> = new Set(),
): Set<string> {
  if (!node || typeof node !== "object") {
    return refs;
  }

  const nodeObj = node as Record<string, unknown>;

  // Check if this node has schemaRef
  if (nodeObj.schemaRef && typeof nodeObj.schemaRef === "string") {
    refs.add(nodeObj.schemaRef);
  }

  // Recursively check children
  if (Array.isArray(nodeObj.children)) {
    for (const child of nodeObj.children) {
      extractSchemaRefsFromNode(child, refs);
    }
  }

  return refs;
}

/**
 * Recursively collect all nested schemas for export
 * Scans both nestedSchemas field AND schemaRef in UINode tree
 * Prevents circular dependencies with Set tracking
 */
export async function collectNestedSchemasForExport(
  widgetKey: string,
  collected: Set<string> = new Set(),
): Promise<SchemaProject[]> {
  // Prevent infinite recursion
  if (collected.has(widgetKey)) {
    return [];
  }

  collected.add(widgetKey);

  const schema = await getSchemaByWidgetKey(widgetKey);
  if (!schema) {
    return [];
  }

  const result: SchemaProject[] = [schema];
  const refsToProcess = new Set<string>();

  // 1. Collect from nestedSchemas field
  if (schema.nestedSchemas && schema.nestedSchemas.length > 0) {
    schema.nestedSchemas.forEach((key) => refsToProcess.add(key));
  }

  // 2. Collect from schemaRef in UINode tree
  const schemaRefs = extractSchemaRefsFromNode(schema.schema);
  schemaRefs.forEach((key) => refsToProcess.add(key));

  // 3. Recursively collect all referenced schemas
  for (const nestedKey of refsToProcess) {
    const nestedSchemas = await collectNestedSchemasForExport(
      nestedKey,
      collected,
    );
    result.push(...nestedSchemas);
  }

  return result;
}

