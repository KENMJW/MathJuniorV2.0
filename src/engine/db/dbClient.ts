/**
 * 主线程 SQLite DB 客户端
 * 通过 postMessage/Promise 驱动 Web Worker 执行只读分包查询
 */

import { type DbPackage, getPackageForTable } from './packages';
import type { WorkerMessageRequest, WorkerMessageResponse } from './worker';

export type SqlParam = string | number | boolean | null | Uint8Array;

export class DbClient {
  private worker: Worker | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (err: Error) => void }>();
  private loadedPackages = new Set<DbPackage>();
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 惰性初始化 Worker
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<WorkerMessageResponse>) => {
        const { id, type, data, error } = event.data;
        const pending = this.pendingRequests.get(id);
        if (!pending) return;

        this.pendingRequests.delete(id);
        if (type === 'success') {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error || '[DB] Unknown worker error'));
        }
      };

      this.worker.onerror = (err) => {
        console.error('[DB Worker Error]', err);
      };
    }
    return this.worker;
  }

  private postRequest<T>(type: WorkerMessageRequest['type'], payload?: WorkerMessageRequest['payload']): Promise<T> {
    const worker = this.getWorker();
    const id = `req_${++this.requestId}_${Date.now()}`;

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload } satisfies WorkerMessageRequest);
    });
  }

  /**
   * 初始化数据库引擎。
   * 严格按照契约：启动期仅预载 core.db
   */
  public async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const res = await this.postRequest<{ loadedPackages: DbPackage[] }>('init');
      this.loadedPackages.add('core');
      if (res?.loadedPackages) {
        res.loadedPackages.forEach((p) => this.loadedPackages.add(p));
      }
    })();

    return this.initPromise;
  }

  /**
   * 按需加载指定分包
   */
  public async loadPackage(pkg: DbPackage): Promise<void> {
    await this.init();
    if (this.loadedPackages.has(pkg)) {
      return;
    }
    await this.postRequest('loadPackage', { package: pkg });
    this.loadedPackages.add(pkg);
  }

  /**
   * 检查分包是否已加载
   */
  public isPackageLoaded(pkg: DbPackage): boolean {
    return this.loadedPackages.has(pkg);
  }

  /**
   * 获取所有已载入的分包列表
   */
  public getLoadedPackages(): DbPackage[] {
    return Array.from(this.loadedPackages);
  }

  /**
   * 严格参数化查询分包数据库
   * 强制采用 '?' 占位符传递参数，杜绝 SQL 拼接注入
   */
  public async query<T = Record<string, unknown>>(
    pkg: DbPackage,
    sql: string,
    params: SqlParam[] = []
  ): Promise<T[]> {
    await this.init();
    const rows = await this.postRequest<T[]>('query', {
      package: pkg,
      sql,
      params,
    });
    this.loadedPackages.add(pkg);
    return rows;
  }

  /**
   * 单行查询便捷方法
   */
  public async queryOne<T = Record<string, unknown>>(
    pkg: DbPackage,
    sql: string,
    params: SqlParam[] = []
  ): Promise<T | null> {
    const rows = await this.query<T>(pkg, sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 根据表名自动路由到对应分包进行参数化查询
   */
  public async queryTable<T = Record<string, unknown>>(
    tableName: string,
    sql: string,
    params: SqlParam[] = []
  ): Promise<T[]> {
    const pkg = getPackageForTable(tableName);
    return this.query<T>(pkg, sql, params);
  }

  /**
   * 销毁 Worker 实例
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initPromise = null;
      this.loadedPackages.clear();
      this.pendingRequests.clear();
    }
  }
}

/** 全局单例 */
export const dbClient = new DbClient();
