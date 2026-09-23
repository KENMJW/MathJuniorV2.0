import { describe, it, expect } from 'vitest';
import { getSafeStem, resolveSafeStem } from '../stemGuard';

describe('stemGuard (Property P-I18N-1)', () => {
  const pureZh = '在实际生活中，常用正数、负数表示具有相反意义的量。';
  const pureEn = 'Which of the following calculations is correct? ( )';
  const chinglish = '在实际生活中, 常用正数、负数表示具有相反意义的量．If 把向东走80米记作+80米, 那么向西走60米记作( )';

  it('returns stem_zh when isEn is false', () => {
    expect(resolveSafeStem(pureZh, pureEn, false)).toBe(pureZh);
    expect(getSafeStem({ stem_zh: pureZh, stem_en: pureEn }, false)).toBe(pureZh);
  });

  it('returns pureEn when isEn is true and stem_en has no Chinese', () => {
    expect(resolveSafeStem(pureZh, pureEn, true)).toBe(pureEn);
    expect(getSafeStem({ stem_zh: pureZh, stem_en: pureEn }, true)).toBe(pureEn);
  });

  it('safely falls back to stem_zh when stem_en contains Chinglish/Chinese', () => {
    expect(resolveSafeStem(pureZh, chinglish, true)).toBe(pureZh);
    expect(getSafeStem({ stem_zh: pureZh, stem_en: chinglish }, true)).toBe(pureZh);
  });

  it('safely falls back to stem_zh when stem_en is null or empty', () => {
    expect(resolveSafeStem(pureZh, null, true)).toBe(pureZh);
    expect(resolveSafeStem(pureZh, '', true)).toBe(pureZh);
    expect(resolveSafeStem(pureZh, '   ', true)).toBe(pureZh);
    expect(getSafeStem({ stem_zh: pureZh, stem_en: null }, true)).toBe(pureZh);
  });

  it('handles null/undefined question gracefully', () => {
    expect(getSafeStem(null, true)).toBe('');
    expect(getSafeStem(undefined, false)).toBe('');
  });
});
