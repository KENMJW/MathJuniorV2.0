import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { StepMetricsHUD } from '../StepMetricsHUD';

describe('StepMetricsHUD (PLAN-MODEL-REPAIR-V2 轨道 1 验收)', () => {
  it('1. 勾股定理专用 HUD: 计算 a²+b² ≡ c² 且高亮展示恒等成立胶囊', () => {
    const html = renderToString(
      <StepMetricsHUD
        sandboxId="SB-KP057"
        stepIndex={0}
        guideText="调节直角边观察面积守恒"
        paramValues={{ leg_a: 4, leg_b: 3 }}
        invariants={[]}
        locale="zh-CN"
      />
    );

    expect(html).toContain('data-hud-type="pythagorean"');
    expect(html).toContain('a² + b² = 4² + 3² = 25');
    expect(html).toContain('c² = (5.00)² = 25');
    expect(html).toContain('恒等成立 a²+b²≡c² ✓');
  });

  it('2. 斜边中线专用 HUD: 计算 AB, CM, 比例 CM:AB = 0.50 且展示 CM = 1/2 AB ✓', () => {
    const html = renderToString(
      <StepMetricsHUD
        sandboxId="SB-KP056"
        stepIndex={0}
        guideText="探究斜边中线与斜边长度关系"
        paramValues={{ leg_a: 6, leg_b: 8, point_t: 0.5 }}
        invariants={[]}
        locale="zh-CN"
      />
    );

    // AB = hypot(6, 8) = 10.00, CM = 5.00, ratio = 0.50
    expect(html).toContain('data-hud-type="hypotenuse-median"');
    expect(html).toContain('AB = 10.00');
    expect(html).toContain('CM = 5.00');
    expect(html).toContain('比例 CM:AB = 0.50');
    expect(html).toContain('CM = 1/2 AB ✓');
  });

  it('3. 菱形面积专用 HUD: 展示 S = 1/2 d1 d2 面积守恒', () => {
    const html = renderToString(
      <StepMetricsHUD
        sandboxId="SB-KP065"
        stepIndex={0}
        guideText="探究对角线与菱形面积关系"
        paramValues={{ diag_h: 6, diag_v: 4 }}
        invariants={[]}
        locale="zh-CN"
      />
    );

    expect(html).toContain('data-hud-type="rhombus-area"');
    expect(html).toContain('d₁ = 6, d₂ = 4');
    expect(html).toContain('S = 1/2 × 6 × 4 = 12.00');
    expect(html).toContain('S = 1/2 d₁d₂ ✓');
  });

  it('4. 通用兜底 HUD: 提取前 1~2 项不变量置顶渲染，带有动态脉冲指示点', () => {
    const html = renderToString(
      <StepMetricsHUD
        sandboxId="SB-KP999"
        stepIndex={0}
        guideText="通用几何守恒"
        paramValues={{ scale: 1.5 }}
        invariants={[
          { id: 'inv1', text: '面积比恒等于相似比的平方', isConstant: true },
          { id: 'inv2', text: '对应角恒等', isConstant: true },
          { id: 'inv3', text: '第三项忽略', isConstant: false },
        ]}
        locale="zh-CN"
      />
    );

    expect(html).toContain('data-hud-type="fallback"');
    expect(html).toContain('面积比恒等于相似比的平方');
    expect(html).toContain('对应角恒等');
    expect(html).not.toContain('第三项忽略');
    expect(html).toContain('animate-ping');
  });

  it('5. 严格红线门禁：StepMetricsHUD 源码严禁包含 emoji、eval、innerHTML、foreignObject', () => {
    const filePath = path.resolve(__dirname, '../StepMetricsHUD.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查源码无 eval / innerHTML / foreignObject
    expect(content).not.toContain('eval(');
    expect(content).not.toContain('dangerouslySetInnerHTML');
    expect(content).not.toContain('foreignObject');

    // 检查源码无 emoji 字符
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    const matches = content.match(emojiRegex);
    expect(matches).toBeNull();
  });
});
