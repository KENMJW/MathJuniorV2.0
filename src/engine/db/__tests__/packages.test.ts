import { describe, it, expect } from 'vitest';
import { DB_PACKAGES, DB_PACKAGE_PATHS, getPackageForTable } from '../packages';

describe('DB Packages Contract', () => {
  it('should define all 4 split packages', () => {
    expect(DB_PACKAGES).toEqual(['core', 'master', 'sandbox', 'questions']);
  });

  it('should point each package to corresponding /data/*.db path', () => {
    expect(DB_PACKAGE_PATHS.core).toBe('/data/core.db');
    expect(DB_PACKAGE_PATHS.master).toBe('/data/master.db');
    expect(DB_PACKAGE_PATHS.sandbox).toBe('/data/sandbox.db');
    expect(DB_PACKAGE_PATHS.questions).toBe('/data/questions.db');
  });

  it('should route all 8 core tables to exact packages per design §2.3 and §4.2', () => {
    expect(getPackageForTable('knowledge_points')).toBe('core');
    expect(getPackageForTable('logic_lines')).toBe('core');
    expect(getPackageForTable('knowledge_combinations')).toBe('core');
    expect(getPackageForTable('knowledge_graph_semesters')).toBe('core');
    expect(getPackageForTable('master_examples')).toBe('master');
    expect(getPackageForTable('concept_sandboxes')).toBe('sandbox');
    expect(getPackageForTable('leap_sandbox_models')).toBe('sandbox');
    expect(getPackageForTable('questions')).toBe('questions');
  });

  it('should throw error for unknown table', () => {
    expect(() => getPackageForTable('unknown_table')).toThrowError(/Unknown table name/);
  });
});
