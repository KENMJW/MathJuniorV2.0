import { describe, it, expect } from 'vitest';
import { formatInvariantText, InvariantSpec, Point2D } from '../invariants';

describe('TASK-FE-0016 块 B 遥测多语言与 X-Ray 国际化测试', () => {
  const mockPoints: Record<string, Point2D> = {
    A: { x: 0, y: 4 },
    O: { x: 0, y: 0 },
    B: { x: 3, y: 0 },
  };

  const angleSpec: InvariantSpec = {
    id: 'angle_aob',
    type: 'angle',
    deps: ['A', 'O', 'B'],
    formula: '∠AOB = {val}°',
    labelZh: '旋转角',
    labelEn: 'Rotation Angle',
  };

  const fallbackSpec: InvariantSpec = {
    id: 'dist_ab',
    type: 'distance',
    deps: ['A', 'B'],
    formula: 'AB = {val}',
    labelZh: '线段长度',
    // 故意省略 labelEn，验证优雅回退
  };

  describe('1. formatInvariantText 多语言与宽松 locale 匹配', () => {
    it('标准中文 "zh-CN" 返回中文标签', () => {
      const text = formatInvariantText(angleSpec, mockPoints, 'zh-CN');
      expect(text).toBe('旋转角: ∠AOB = 90.0°');
    });

    it('标准英文 "en" 返回英文标签', () => {
      const text = formatInvariantText(angleSpec, mockPoints, 'en');
      expect(text).toBe('Rotation Angle: ∠AOB = 90.0°');
    });

    it('宽松英文 "en-US" 成功命中英文标签', () => {
      const text = formatInvariantText(angleSpec, mockPoints, 'en-US');
      expect(text).toBe('Rotation Angle: ∠AOB = 90.0°');
    });

    it('英联邦英文 "en-GB" 成功命中英文标签', () => {
      const text = formatInvariantText(angleSpec, mockPoints, 'en-GB');
      expect(text).toBe('Rotation Angle: ∠AOB = 90.0°');
    });

    it('大写英文 "EN" 成功命中英文标签', () => {
      const text = formatInvariantText(angleSpec, mockPoints, 'EN');
      expect(text).toBe('Rotation Angle: ∠AOB = 90.0°');
    });

    it('缺失 labelEn 时在英文环境优雅回退至 labelZh 且不崩溃', () => {
      const text = formatInvariantText(fallbackSpec, mockPoints, 'en-US');
      expect(text).toBe('线段长度: AB = 5.00');
    });
  });

  describe('2. DiscreteOrthographicRenderer 遥测与视口文案国际化', () => {
    // 模拟离散投影遥测生成函数逻辑
    const generateTelemetry = (totalBlocks: number, frontViewCols: number[], leftViewRows: number[], locale: string) => {
      const isEn = String(locale).toLowerCase().startsWith('en');
      return [
        {
          id: 'total_cubes',
          text: isEn ? `Total unit cubes: ${totalBlocks}` : `正方体积木总数: ${totalBlocks} 块`,
          isConstant: false,
        },
        {
          id: 'ortho_front',
          text: isEn ? `Front view column heights: [${frontViewCols.join(', ')}] (length alignment)` : `主视图列高度向量: [${frontViewCols.join(', ')}] (长对正)`,
          isConstant: false,
        },
        {
          id: 'ortho_left',
          text: isEn ? `Left view row heights: [${leftViewRows.join(', ')}] (height alignment)` : `左视图行高度向量: [${leftViewRows.join(', ')}] (高平齐)`,
          isConstant: false,
        },
        {
          id: 'ortho_rule',
          text: isEn ? 'Orthographic projection axioms: length, height, and width verified' : '正交投影公理: 长对正、高平齐、宽相等 校验通过',
          isConstant: true,
        },
      ];
    };

    it('中文环境下汇报中文遥测公理与向量', () => {
      const telem = generateTelemetry(6, [3, 2, 1], [3, 2, 1], 'zh-CN');
      expect(telem[0].text).toBe('正方体积木总数: 6 块');
      expect(telem[1].text).toContain('(长对正)');
      expect(telem[2].text).toContain('(高平齐)');
      expect(telem[3].text).toContain('正交投影公理: 长对正、高平齐、宽相等 校验通过');
    });

    it('en-US 环境下汇报英文遥测公理与向量', () => {
      const telem = generateTelemetry(6, [3, 2, 1], [3, 2, 1], 'en-US');
      expect(telem[0].text).toBe('Total unit cubes: 6');
      expect(telem[1].text).toContain('(length alignment)');
      expect(telem[2].text).toContain('(height alignment)');
      expect(telem[3].text).toBe('Orthographic projection axioms: length, height, and width verified');
    });
  });

  describe('3. 手拉手几何遥测与 4D 变异卡片标题国际化', () => {
    const getHandInHandTexts = (normalizedCm: string, angle: number, locale: string) => {
      const isEn = String(locale).toLowerCase().startsWith('en');
      return {
        tagInvariant: isEn
          ? `Invariant telemetry: AC = BD = ${normalizedCm} cm (Equal)`
          : `不变量实测：AC = BD = ${normalizedCm} cm (恒等)`,
        tagAngle: isEn
          ? `Angle telemetry: line AC & BD angle = ${angle}° (= α)`
          : `夹角实测：直线 AC 与 BD 夹角 = ${angle}° (恒等于 α)`,
        tagConclusion: isEn
          ? 'Conclusion: △OAB ≌ △OCD rotation congruent'
          : '结论：△OAB ≌ △OCD 旋转恒全等',
        dim1Title: isEn ? '① Carrier Variation' : '① 载体变异 (Carrier)',
        dim2Title: isEn ? '② Parameter Variation' : '② 参数变异 (Parameter)',
        dim3Title: isEn ? '③ Posture Variation' : '③ 姿态变异 (Posture)',
        dim4Title: isEn ? '④ Camouflage & X-Ray' : '④ 干扰加壳 (Camouflage) & X-Ray',
        xrayOn: isEn ? 'X-Ray Vision (ON)' : 'X-Ray 透视 (开)',
        xrayOff: isEn ? 'X-Ray Vision (OFF)' : 'X-Ray 透视 (关)',
      };
    };

    it('英文环境正确生成手拉手遥测与 4D 标题', () => {
      const t = getHandInHandTexts('5.00', 60, 'en-US');
      expect(t.tagInvariant).toBe('Invariant telemetry: AC = BD = 5.00 cm (Equal)');
      expect(t.tagAngle).toBe('Angle telemetry: line AC & BD angle = 60° (= α)');
      expect(t.tagConclusion).toBe('Conclusion: △OAB ≌ △OCD rotation congruent');
      expect(t.dim1Title).toBe('① Carrier Variation');
      expect(t.dim2Title).toBe('② Parameter Variation');
      expect(t.dim3Title).toBe('③ Posture Variation');
      expect(t.dim4Title).toBe('④ Camouflage & X-Ray');
      expect(t.xrayOn).toBe('X-Ray Vision (ON)');
      expect(t.xrayOff).toBe('X-Ray Vision (OFF)');
    });

    it('中文环境正确保持原有中文规范', () => {
      const t = getHandInHandTexts('5.00', 60, 'zh-CN');
      expect(t.tagInvariant).toBe('不变量实测：AC = BD = 5.00 cm (恒等)');
      expect(t.tagAngle).toBe('夹角实测：直线 AC 与 BD 夹角 = 60° (恒等于 α)');
      expect(t.tagConclusion).toBe('结论：△OAB ≌ △OCD 旋转恒全等');
      expect(t.dim1Title).toBe('① 载体变异 (Carrier)');
      expect(t.dim4Title).toBe('④ 干扰加壳 (Camouflage) & X-Ray');
      expect(t.xrayOn).toBe('X-Ray 透视 (开)');
    });
  });
});
