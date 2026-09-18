import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SourceTag } from '../SourceTag';

describe('SourceTag (Task 23 & 契约 §5 & 铁律 12 溢出防御)', () => {
  it('1. 正常真题：组合渲染 "年份·地区"，并在 title 中保留完整出处', () => {
    const html = renderToString(
      <SourceTag
        exam_year={2026}
        region="山东"
        source="2026年山东省中考数学真题"
      />
    );

    expect(html).toContain('data-testid="source-tag"');
    expect(html).toContain('2026·山东');
    expect(html).toContain('title="2026年山东省中考数学真题"');
  });

  it('2. 真实超长地区（34字符）：严格应用 max-width: 160px、ellipsis、nowrap 溢出防御', () => {
    const ultraLongRegion = '浙江省J12共同体联盟学校2024-2025学年八年级下学期4月期中';
    const html = renderToString(
      <SourceTag
        exam_year={2026}
        region={ultraLongRegion}
        source="八年级（下）月考数学试卷（5月份）（拔尖卷）"
      />
    );

    expect(html).toContain('data-testid="source-tag"');
    expect(html).toContain(`2026·${ultraLongRegion}`);
    // 验证溢出防御样式硬约束
    expect(html).toContain('max-width:160px');
    expect(html).toContain('text-overflow:ellipsis');
    expect(html).toContain('white-space:nowrap');
    expect(html).toContain('overflow:hidden');
    // title 包含完整 source 全文
    expect(html).toContain('title="八年级（下）月考数学试卷（5月份）（拔尖卷）"');
  });

  it('3. 微专题隐藏规则：region 为空时（即便包含 exam_year 与微专题学案 source），整个标签优雅隐藏不占位', () => {
    // 仿真 510 道微专题题目之一 (如 Q-2025-MZ43-0001)
    const htmlNullRegion = renderToString(
      <SourceTag
        exam_year={2025}
        region={null}
        source="2025年中考数学总复习43 微专题  圆的综合题  学案（含答案）"
      />
    );
    expect(htmlNullRegion).toBe('');

    const htmlEmptyRegion = renderToString(
      <SourceTag
        exam_year={2025}
        region=""
        source="2025年中考数学总复习43 微专题"
      />
    );
    expect(htmlEmptyRegion).toBe('');

    const htmlWhitespaceRegion = renderToString(
      <SourceTag
        exam_year={2025}
        region="   "
        source="2025年中考数学总复习43 微专题"
      />
    );
    expect(htmlWhitespaceRegion).toBe('');
  });

  it('4. 全空兜底：无任何来源数据时返回 null', () => {
    const html = renderToString(<SourceTag />);
    expect(html).toBe('');
  });

  it('5. 仅有地区而少年份：直接渲染地区简写', () => {
    const html = renderToString(<SourceTag region="成都中考" />);
    expect(html).toContain('成都中考');
    expect(html).not.toContain('·');
  });

  it('6. 仅有 source 兜底（PointMasterExample 考点母题精讲场景）：渲染完整 source 并应用防溢出截断', () => {
    const html = renderToString(
      <SourceTag source="经典中考题型仿编 · 实数核心例题" />
    );

    expect(html).toContain('data-testid="source-tag"');
    expect(html).toContain('经典中考题型仿编 · 实数核心例题');
    expect(html).toContain('max-width:160px');
    expect(html).toContain('text-overflow:ellipsis');
    expect(html).toContain('title="经典中考题型仿编 · 实数核心例题"');
  });

  it('7. 支持自定义 maxWidth 覆盖', () => {
    const html = renderToString(
      <SourceTag
        exam_year={2024}
        region="东莞三模"
        maxWidth={220}
      />
    );

    expect(html).toContain('2024·东莞三模');
    expect(html).toContain('max-width:220px');
  });

  it('8. 铁律 11 零 emoji 校验：渲染结果不含任何 emoji 字符', () => {
    const html = renderToString(
      <SourceTag
        exam_year={2026}
        region="北京"
        source="2026年北京市中考数学真题"
      />
    );

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });
});
