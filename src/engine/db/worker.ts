/// <reference lib="webworker" />
import sqlite3InitModule, { type Sqlite3Static, type Database } from '@sqlite.org/sqlite-wasm';
import { type DbPackage, DB_PACKAGE_PATHS } from './packages';

export interface WorkerMessageRequest {
  id: string;
  type: 'init' | 'loadPackage' | 'query' | 'status';
  payload?: {
    package?: DbPackage;
    sql?: string;
    params?: (string | number | boolean | null | Uint8Array)[];
  };
}

export interface WorkerMessageResponse {
  id: string;
  type: 'success' | 'error';
  data?: unknown;
  error?: string;
}

let sqlite3: Sqlite3Static | null = null;
const dbInstances = new Map<DbPackage, Database>();
const loadedPackages = new Set<DbPackage>();

/**
 * 载入并反序列化只读分包
 */
async function loadDbPackage(pkg: DbPackage): Promise<void> {
  if (loadedPackages.has(pkg)) {
    return;
  }
  if (!sqlite3) {
    throw new Error('[Worker] SQLite WASM not initialized yet');
  }

  const url = DB_PACKAGE_PATHS[pkg];
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[Worker] Failed to fetch database package ${pkg} from ${url}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  let db: Database;

  if (buffer.byteLength === 0) {
    // 兼容占位空文件，分配只读空内存库
    db = new sqlite3.oo1.DB(':memory:');
  } else {
    const bytes = new Uint8Array(buffer);
    const pData = sqlite3.wasm.allocFromTypedArray(bytes);
    db = new sqlite3.oo1.DB();
    const rc = sqlite3.capi.sqlite3_deserialize(
      db,
      'main',
      pData,
      bytes.byteLength,
      bytes.byteLength,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_READONLY
    );

    if (rc !== 0) {
      throw new Error(`[Worker] sqlite3_deserialize failed for ${pkg} with code ${rc}`);
    }
  }

  dbInstances.set(pkg, db);
  loadedPackages.add(pkg);
}

/**
 * 初始化 SQLite WASM 并按契约启动时仅加载 core.db
 */
async function init(): Promise<void> {
  if (!sqlite3) {
    sqlite3 = await sqlite3InitModule();
  }
  // 按照设计文档 §2.3：启动仅加载 core.db
  await loadDbPackage('core');
}

/**
 * 参数化执行查询 (只读)
 */
async function executeQuery<T = Record<string, unknown>>(
  pkg: DbPackage,
  sql: string,
  params: (string | number | boolean | null | Uint8Array)[] = []
): Promise<T[]> {
  if (!loadedPackages.has(pkg)) {
    await loadDbPackage(pkg);
  }

  const db = dbInstances.get(pkg);
  if (!db) {
    throw new Error(`[Worker] Database package '${pkg}' connection not found`);
  }

  const resultRows: T[] = [];

  db.exec({
    sql,
    bind: params.length > 0 ? (params as any) : undefined,
    rowMode: 'object',
    resultRows: resultRows as any[],
  });

  return resultRows;
}

self.onmessage = async (event: MessageEvent<WorkerMessageRequest>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'init': {
        await init();
        const response: WorkerMessageResponse = {
          id,
          type: 'success',
          data: { loadedPackages: Array.from(loadedPackages) },
        };
        self.postMessage(response);
        break;
      }

      case 'loadPackage': {
        const pkg = payload?.package;
        if (!pkg) {
          throw new Error('[Worker] Missing package in loadPackage request');
        }
        await loadDbPackage(pkg);
        const response: WorkerMessageResponse = {
          id,
          type: 'success',
          data: { loadedPackage: pkg, allLoaded: Array.from(loadedPackages) },
        };
        self.postMessage(response);
        break;
      }

      case 'query': {
        const pkg = payload?.package || 'core';
        const sql = payload?.sql;
        const params = payload?.params || [];

        if (!sql) {
          throw new Error('[Worker] Missing SQL query statement');
        }

        const rows = await executeQuery(pkg, sql, params);
        const response: WorkerMessageResponse = {
          id,
          type: 'success',
          data: rows,
        };
        self.postMessage(response);
        break;
      }

      case 'status': {
        const response: WorkerMessageResponse = {
          id,
          type: 'success',
          data: {
            initialized: sqlite3 !== null,
            loadedPackages: Array.from(loadedPackages),
          },
        };
        self.postMessage(response);
        break;
      }

      default:
        throw new Error(`[Worker] Unknown request type: ${(type as any)}`);
    }
  } catch (err: any) {
    const response: WorkerMessageResponse = {
      id,
      type: 'error',
      error: err?.message || String(err),
    };
    self.postMessage(response);
  }
};
