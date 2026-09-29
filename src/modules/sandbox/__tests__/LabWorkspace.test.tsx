import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LabWorkspace } from '../LabWorkspace';
import { mockLeapSandboxModels } from '../morphControllers';

describe('LabWorkspace (Module 3) Unified Drawer & Sticky Scroll Tests', () => {
  const mockSandboxes = [
    {
      id: 'SB-KP001',
      nameZh: '平行线的性质与判定',
      nameEn: 'Parallel Lines',
      grade: 7,
      semester: 1,
      subcategory: '几何基础',
      config: {
        sandbox_id: 'SB-KP001',
        canvas_template: 'euclidean',
        viewbox_spec_json: '{"baseBox":[-10,10,10,-10]}',
        drag_points_json: '[]',
      },
    },
  ];

  it('1. 4D 跃迁模型视图：顶栏吸顶容器存在且全页面仅有 1 个抽屉盒选择按钮（删除左侧重复按钮）', () => {
    const html = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={mockLeapSandboxModels}
        labSubView="leap_4d"
        selectedLeapModelId="LM-8A-01"
      />
    );

    // 吸顶常驻容器存在
    expect(html).toContain('sandbox-sticky-header-container');

    // 抽屉触发按钮计数：全屏只能有 1 个 model-drawer-trigger-btn (顶栏右侧)，严禁出现左侧重复按钮
    const matches = html.match(/class="[^"]*model-drawer-trigger-btn[^"]*"/g) || [];
    expect(matches.length).toBe(1);

    // 顶栏右侧按钮文案包含“选择模型”与模型 ID
    expect(html).toContain('选择模型:');
    expect(html).toContain('LM-8A-01');

    // 下方 LeapLab 标题为标准干净文本 (sandbox-title-text)，非按钮
    expect(html).toContain('sandbox-title-text');
    expect(html).toContain('手拉手全等与勾股跃迁模型');
  });

  it('2. 概念具象沙盒视图：顶栏右侧为“选择沙盒”，无重复按钮', () => {
    const html = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={mockLeapSandboxModels}
        labSubView="concept_sandbox"
      />
    );

    expect(html).toContain('sandbox-sticky-header-container');
    const matches = html.match(/class="[^"]*model-drawer-trigger-btn[^"]*"/g) || [];
    expect(matches.length).toBe(1);
    expect(html).toContain('选择沙盒:');
    expect(html).toContain('平行线的性质与判定');
  });

  it('3. 4D 跃迁模型视图：缺省 selectedLeapModelId 时默认选中 LM-7A-01 (数轴与动点追及模型)', () => {
    const html = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={mockLeapSandboxModels}
        labSubView="leap_4d"
      />
    );

    // 默认展示 LM-7A-01
    expect(html).toContain('LM-7A-01');
    expect(html).toContain('数轴动点与绝对值几何距离模型');
  });

  it('4. 概念沙盒与 4D 模型视图：顶部无冗余分段胶囊，暗色卡片默认处于分步推演态 (核心探究/推演任务 + 直接自由把玩)', () => {
    const htmlConcept = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={mockLeapSandboxModels}
        labSubView="concept_sandbox"
        selectedSandboxId="SB-KP001"
      />
    );
    expect(htmlConcept).not.toContain('lab-mode-segmented-control');
    expect(htmlConcept).toContain('核心探究任务');
    expect(htmlConcept).toContain('直接自由把玩');

    const htmlLeap = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={mockLeapSandboxModels}
        labSubView="leap_4d"
        selectedLeapModelId="LM-8A-01"
      />
    );
    expect(htmlLeap).not.toContain('lab-mode-segmented-control');
    expect(htmlLeap).toContain('核心推演任务');
    expect(htmlLeap).toContain('直接自由把玩');
  });
});
