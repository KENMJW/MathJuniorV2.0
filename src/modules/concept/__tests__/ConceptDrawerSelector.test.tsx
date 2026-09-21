import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ConceptDrawerSelector } from '../ConceptDrawerSelector';
import { ALL_107_KNOWLEDGE_POINTS } from '../allPointsData';

describe('ConceptDrawerSelector (4级抽屉盒选择器)', () => {
  const mockCurrentPoint = ALL_107_KNOWLEDGE_POINTS.find((p) => p.point_id === 'KP-023')!;

  it('1. 正确渲染 4 级下钻导航层级标签', () => {
    const html = renderToString(
      <ConceptDrawerSelector
        isOpen={true}
        onClose={vi.fn()}
        knowledgePoints={ALL_107_KNOWLEDGE_POINTS}
        currentPoint={mockCurrentPoint}
        selectedGrade={9}
        selectedSemester={1}
        selectedDomain="数与代数"
        selectedSubcategory="方程组"
        onSelectGrade={vi.fn()}
        onSelectSemester={vi.fn()}
        onSelectDomain={vi.fn()}
        onSelectSubcategory={vi.fn()}
        onSelectPoint={vi.fn()}
        locale="zh-CN"
      />
    );

    // 结构与4级标识
    expect(html).toContain('concept-tree-sidebar');
    expect(html).toContain('第一级 · 年级');
    expect(html).toContain('第二级 · 学期');
    expect(html).toContain('第三级 · 领域');
    expect(html).toContain('第四级 · 大纲考点');

    // 默认选中项
    expect(html).toContain('九年级');
    expect(html).toContain('上学期 (1)');
    expect(html).toContain('数与代数');
    expect(html).toContain('KP-023');
    expect(html).toContain('配方法');
  });

  it('2. 包含顶部搜索输入框与大纲考点列表', () => {
    const html = renderToString(
      <ConceptDrawerSelector
        isOpen={true}
        onClose={vi.fn()}
        knowledgePoints={ALL_107_KNOWLEDGE_POINTS}
        currentPoint={mockCurrentPoint}
        selectedGrade={9}
        selectedSemester={1}
        selectedDomain="数与代数"
        selectedSubcategory="方程组"
        onSelectGrade={vi.fn()}
        onSelectSemester={vi.fn()}
        onSelectDomain={vi.fn()}
        onSelectSubcategory={vi.fn()}
        onSelectPoint={vi.fn()}
        locale="zh-CN"
      />
    );

    expect(html).toContain('concept-search-input');
    expect(html).toContain('concept-points-list');
  });

  it('3. 当抽屉关闭时，依然保留 DOM 容器以兼容测试', () => {
    const html = renderToString(
      <ConceptDrawerSelector
        isOpen={false}
        onClose={vi.fn()}
        knowledgePoints={ALL_107_KNOWLEDGE_POINTS}
        currentPoint={mockCurrentPoint}
        selectedGrade={9}
        selectedSemester={1}
        selectedDomain="数与代数"
        selectedSubcategory="方程组"
        onSelectGrade={vi.fn()}
        onSelectSemester={vi.fn()}
        onSelectDomain={vi.fn()}
        onSelectSubcategory={vi.fn()}
        onSelectPoint={vi.fn()}
        locale="zh-CN"
      />
    );

    expect(html).toContain('concept-tree-sidebar');
  });
});
