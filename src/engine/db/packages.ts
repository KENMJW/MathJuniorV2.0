/**
 * 数据库分包契约与映射配置
 * 对应设计文档 §2.3 数据库分包按需加载
 */

export type DbPackage = 'core' | 'master' | 'sandbox' | 'questions';

export const DB_PACKAGES: readonly DbPackage[] = ['core', 'master', 'sandbox', 'questions'] as const;

export const DB_PACKAGE_PATHS: Record<DbPackage, string> = {
  core: '/data/core.db',
  master: '/data/master.db',
  sandbox: '/data/sandbox.db',
  questions: '/data/questions.db',
};

/**
 * 8 张核心表与分包映射关系 (设计文档 §2.3, §4.2)
 */
export const TABLE_PACKAGE_MAP: Record<string, DbPackage> = {
  knowledge_points: 'core',
  logic_lines: 'core',
  knowledge_combinations: 'core',
  knowledge_graph_semesters: 'core',
  master_examples: 'master',
  concept_sandboxes: 'sandbox',
  leap_sandbox_models: 'sandbox',
  questions: 'questions',
};

export function getPackageForTable(tableName: string): DbPackage {
  const pkg = TABLE_PACKAGE_MAP[tableName];
  if (!pkg) {
    throw new Error(`[DB] Unknown table name '${tableName}', cannot resolve package`);
  }
  return pkg;
}
