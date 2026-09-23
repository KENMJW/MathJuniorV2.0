import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LeapLab } from '../LeapLab';
import { LabWorkspace } from '../LabWorkspace';
import { allLeapSandboxModels } from '../mockLeapModels';

describe('Tier Buttons & Header Badges Tests', () => {
  const g3Models = allLeapSandboxModels.filter((m) => m.primary_line === 'G3');
  // LM-8B-14 (Tier 1) and LM-9A-20 (Tier 2)

  it('1. LeapLab: LM-9A-20 初始高亮 变式 (Tier 2)，原型未高亮', () => {
    const currentModel = g3Models.find((m) => m.model_id === 'LM-9A-20') || g3Models[1];

    const html = renderToString(
      <LeapLab
        model={currentModel}
        allModels={allLeapSandboxModels}
        hideDrawerTrigger={true}
      />
    );

    // 变式按钮应包含 active，原型按钮不包含 active
    expect(html).toMatch(/class="[^"]*nav-pill-btn active[^"]*"[^>]*>\s*变式/);
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn active[^"]*"[^>]*>\s*原型/);
    expect(html).toContain('LM-9A-20');
    expect(html).toContain('半角旋转翻折拼合模型');
  });

  it('2. LeapLab: LM-8B-14 初始高亮 原型 (Tier 1)，变式未高亮', () => {
    const currentModel = g3Models.find((m) => m.model_id === 'LM-8B-14') || g3Models[0];

    const html = renderToString(
      <LeapLab
        model={currentModel}
        allModels={allLeapSandboxModels}
        hideDrawerTrigger={true}
      />
    );

    expect(html).toMatch(/class="[^"]*nav-pill-btn active[^"]*"[^>]*>\s*原型/);
    expect(html).not.toMatch(/class="[^"]*nav-pill-btn active[^"]*"[^>]*>\s*变式/);
    expect(html).toContain('LM-8B-14');
    expect(html).toContain('十字架对角线垂直与中点四边形模型');
  });

  it('3. LabWorkspace: 概念具象化 与 视口阻尼锁定 渲染为真实按钮且带有 nav-pill-btn', () => {
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

    // 校验为 button 元素且带有对应 data-testid 和文案
    expect(html).toMatch(/<button[^>]*data-testid="badge-concept-concrete"[^>]*>[\s\S]*?概念具象化[\s\S]*?<\/button>/);
    expect(html).toMatch(/<button[^>]*data-testid="badge-viewport-locked"[^>]*>[\s\S]*?视口阻尼锁定[\s\S]*?<\/button>/);
    expect(html).toContain('nav-pill-btn');
  });
});
