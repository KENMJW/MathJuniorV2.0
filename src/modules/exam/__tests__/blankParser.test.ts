import { describe, it, expect } from 'vitest';
import {
  parseStandardAnswerSlots,
  detectBlankCount,
  getBlankSlotsMeta,
} from '../blankParser';

describe('blankParser (填空题多空与槽位解析)', () => {
  it('1. 单空答案正常解析', () => {
    const slots = parseStandardAnswerSlots('$11ab$');
    expect(slots).toEqual(['$11ab$']);
    expect(slots.length).toBe(1);
  });

  it('2. 中文分号多空答案解析', () => {
    const slots = parseStandardAnswerSlots('$x = -3$；$x = -2$');
    expect(slots.length).toBe(2);
    expect(slots[0]).toBe('$x = -3$');
    expect(slots[1]).toBe('$x = -2$');
  });

  it('3. 英文分号多空答案解析', () => {
    const slots = parseStandardAnswerSlots('m = 80, n = 60; 36.7 TB');
    expect(slots.length).toBe(2);
    expect(slots[0]).toBe('m = 80, n = 60');
    expect(slots[1]).toBe('36.7 TB');
  });

  it('4. 小问编号（1）...（2）... 解析', () => {
    const slots = parseStandardAnswerSlots('（1）90°；（2）45°');
    expect(slots.length).toBe(2);
    expect(slots[0]).toBe('90°');
    expect(slots[1]).toBe('45°');
  });

  it('5. detectBlankCount 正确识别单空与多空', () => {
    // 题干双横线
    const cnt1 = detectBlankCount({
      stem_zh: '第一空为 ______，第二空为 ______。',
      answer_standard: '1；2',
    });
    expect(cnt1).toBe(2);

    // 单空单横线
    const cnt2 = detectBlankCount({
      stem_zh: '计算：$5ab + 6ab = $ ______．',
      answer_standard: '$11ab$',
    });
    expect(cnt2).toBe(1);
  });

  it('6. getBlankSlotsMeta 中英双语元数据生成正确', () => {
    const metaZh = getBlankSlotsMeta(2, false);
    expect(metaZh[0].labelZh).toBe('第 (1) 空');
    expect(metaZh[1].labelZh).toBe('第 (2) 空');

    const metaEn = getBlankSlotsMeta(2, true);
    expect(metaEn[0].labelEn).toBe('Blank (1)');
    expect(metaEn[1].labelEn).toBe('Blank (2)');
  });
});
