import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LeapLab } from '../LeapLab';
import { LabWorkspace } from '../LabWorkspace';
import { allLeapSandboxModels } from '../mockLeapModels';
import { canInvertParam } from '../SandboxRenderer';

describe('Tier Buttons & Header Badges Tests', () => {
  const g3Models = allLeapSandboxModels.filter((m) => m.primary_line === 'G3');
  // LM-8B-14 (Tier 1) and LM-9A-20 (Tier 2)

  it('1. LeapLab: 统一渲染分步推演与自由探索模式切换，彻底删除原型/变式/综合冗余按钮', () => {
    const currentModel = g3Models.find((m) => m.model_id === 'LM-9A-20') || g3Models[1];

    const html = renderToString(
      <LeapLab
        model={currentModel}
        allModels={allLeapSandboxModels}
        hideDrawerTrigger={true}
      />
    );

    // 必须包含分步推演与自由探索
    expect(html).toContain('分步推演');
    expect(html).toContain('自由探索');
    expect(html).toContain('lab-mode-segmented-control');

    // 严格禁止再出现原型/变式/综合冗余按钮
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn[^"]*"[^>]*>\s*原型/);
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn[^"]*"[^>]*>\s*变式/);
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn[^"]*"[^>]*>\s*综合/);
    expect(html).toContain('LM-9A-20');
  });

  it('2. LeapLab: 默认高亮分步推演 (labMode=step_deduction)', () => {
    const currentModel = g3Models.find((m) => m.model_id === 'LM-8B-14') || g3Models[0];

    const html = renderToString(
      <LeapLab
        model={currentModel}
        allModels={allLeapSandboxModels}
        hideDrawerTrigger={true}
      />
    );

    expect(html).toMatch(/class="[^"]*seg-item active[^"]*"[^>]*>[\s\S]*?分步推演/);
    expect(html).toContain('LM-8B-14');
  });

  it('3. LabWorkspace: 顶部副标题栏彻底纯化，只保留 [分步推演] 与 [自由探索] 双模切换，严禁概念具象化或视口阻尼锁定等冗余按钮', () => {
    const mockSandboxes = [
      {
        id: 'SB-KP001',
        nameZh: '平行线的性质与判定',
        grade: 7,
        semester: 1,
        config: {
          sandbox_id: 'SB-KP001',
          canvas_template: 'euclidean',
          viewbox_spec_json: '{"baseBox":[-10,10,10,-10]}',
          drag_points_json: '[]',
        },
      },
    ];

    const html = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={allLeapSandboxModels}
        labSubView="concept_sandbox"
      />
    );

    // 严禁在标题栏中出现概念具象化与视口阻尼锁定冗余按钮
    expect(html).not.toContain('badge-concept-concrete');
    expect(html).not.toContain('badge-viewport-locked');
    expect(html).not.toContain('概念具象化');
    expect(html).not.toContain('视口阻尼锁定');

    // 严禁存在 tier-pill-group
    expect(html).not.toContain('tier-pill-group');

    // 保持纯净的双模切换
    expect(html).toContain('lab-mode-segmented-control');
    expect(html).toContain('分步推演');
    expect(html).toContain('自由探索');
  });

  it('4. SB-KP001 number_axis_rational_template Point P is dynamic and can invert p_num', () => {
    const ptP = { id: 'P', name: 'P(p/q)' };
    const ptO = { id: 'O', name: 'O', isFixed: true };
    const ptU = { id: 'U', name: '1', isFixed: true };

    expect(canInvertParam('number_axis_rational_template', ptP, false)).toBe(true);
    expect(canInvertParam('number_axis_rational_template', ptO, false)).toBe(false);
    expect(canInvertParam('number_axis_rational_template', ptU, false)).toBe(false);
  });

  it('5. LabWorkspace: 概念沙盒严格对齐实验室二，渲染分步推演与自由探索双模切换，且严禁原型/变式/综合按钮', () => {
    const mockSandboxes = [
      {
        id: 'SB-KP001',
        nameZh: '平行线的性质与判定',
        grade: 7,
        semester: 1,
        config: {
          sandbox_id: 'SB-KP001',
          canvas_template: 'euclidean',
          viewbox_spec_json: '{"baseBox":[-10,10,10,-10]}',
          drag_points_json: '[]',
          inquiry_steps_json: JSON.stringify([
            { step: 1, titleZh: '步骤一：基准平行线观察', guideTextZh: '观察两条平行线' },
            { step: 2, titleZh: '步骤二：截线与同位角', guideTextZh: '拖拽截线' },
          ]),
        },
      },
    ];

    const html = renderToString(
      <LabWorkspace
        effectiveSandboxes={mockSandboxes}
        effectiveLeapModels={allLeapSandboxModels}
        labSubView="concept_sandbox"
      />
    );

    // 实验室一概念沙盒必须包含双模切换
    expect(html).toContain('lab-mode-segmented-control');
    expect(html).toContain('分步推演');
    expect(html).toContain('自由探索');

    // 默认高亮分步推演并渲染步骤阶梯
    expect(html).toMatch(/class="[^"]*seg-item active[^"]*"[^>]*>[\s\S]*?分步推演/);
    expect(html).toContain('concept-step-deduction-view');
    expect(html).toContain('步骤一：基准平行线观察');

    // 严格杜绝原型/变式/综合
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn[^"]*"[^>]*>\s*原型/);
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn[^"]*"[^>]*>\s*变式/);
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn[^"]*"[^>]*>\s*综合/);
  });
});

