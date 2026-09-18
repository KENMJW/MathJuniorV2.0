import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { projectLocale, getLocalizedField } from './projectLocale';

/**
 * Feature: math-junior-frontend, Property 14
 * 验证 i18n 双语字段投影一致性：
 * - zh-CN 返回 _zh 对应值
 * - en 返回 _en 对应值
 * - 共有非双语字段原样保留
 */
describe('Feature: math-junior-frontend, Property 14 (projectLocale)', () => {
  it('应在 zh-CN 时优先提取 _zh，在 en 时优先提取 _en (≥100 次迭代)', () => {
    fc.assert(
      fc.property(
        fc.record({
          prefix: fc.stringMatching(/^[a-z]{3,10}$/),
          zhVal: fc.string({ minLength: 1, maxLength: 30 }),
          enVal: fc.string({ minLength: 1, maxLength: 30 }),
          commonKey: fc.stringMatching(/^[a-z]{3,10}$/),
          commonVal: fc.integer({ min: 1, max: 100 }),
        }),
        ({ prefix, zhVal, enVal, commonKey, commonVal }) => {
          // 确保 commonKey 不会和 prefix 重名
          const safeCommonKey = `${commonKey}_common`;

          const rawObj = {
            [`${prefix}_zh`]: zhVal,
            [`${prefix}_en`]: enVal,
            [safeCommonKey]: commonVal,
          };

          // 1. 测试 zh-CN 投影
          const projectedZh = projectLocale(rawObj, 'zh-CN');
          expect(projectedZh[prefix]).toBe(zhVal);
          expect(projectedZh[safeCommonKey]).toBe(commonVal);
          expect(projectedZh[`${prefix}_zh`]).toBeUndefined();
          expect(projectedZh[`${prefix}_en`]).toBeUndefined();

          // 2. 测试 en 投影
          const projectedEn = projectLocale(rawObj, 'en');
          expect(projectedEn[prefix]).toBe(enVal);
          expect(projectedEn[safeCommonKey]).toBe(commonVal);
          expect(projectedEn[`${prefix}_zh`]).toBeUndefined();
          expect(projectedEn[`${prefix}_en`]).toBeUndefined();

          // 3. 测试 getLocalizedField
          expect(getLocalizedField(rawObj, prefix, 'zh-CN')).toBe(zhVal);
          expect(getLocalizedField(rawObj, prefix, 'en')).toBe(enVal);
        }
      ),
      { numRuns: 150 }
    );
  });

  it('当某语言缺失时应平滑回退，不抛出异常', () => {
    const onlyZh = { title_zh: '中文标题' };
    expect(projectLocale(onlyZh, 'en').title).toBe('中文标题');
    expect(getLocalizedField(onlyZh, 'title', 'en')).toBe('中文标题');

    const onlyEn = { title_en: 'English Title' };
    expect(projectLocale(onlyEn, 'zh-CN').title).toBe('English Title');
    expect(getLocalizedField(onlyEn, 'title', 'zh-CN')).toBe('English Title');
  });
});
