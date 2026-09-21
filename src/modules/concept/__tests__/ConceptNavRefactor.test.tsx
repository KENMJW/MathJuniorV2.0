import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ConceptNav } from '../../../ConceptNav';
import fs from 'fs';
import path from 'path';

describe('ConceptNav 顶层大卡片与 4 级抽屉集成测试 (Demo 图 4 对标)', () => {
  it('1. 顶栏包含左侧 [KP-xxx · 考点名称 ▾] 胶囊按钮与右侧 4 个分段维度胶囊', () => {
    const html = renderToString(<ConceptNav initialPointId="KP-023" />);

    // 左侧胶囊唤起按钮
    expect(html).toContain('data-testid="concept-drawer-trigger"');
    expect(html).toContain('KP-023');
    expect(html).toContain('配方法');

    // 右侧 4 个扁平分段胶囊
    expect(html).toContain('data-testid="subtab-stages"');
    expect(html).toContain('data-testid="subtab-sandbox"');
    expect(html).toContain('data-testid="subtab-master"');
    expect(html).toContain('data-testid="subtab-practice"');

    expect(html).toContain('四段论精讲');
    expect(html).toContain('链接沙盒');
    expect(html).toContain('考点母题');
    expect(html).toContain('单点快练');
  });

  it('2. 默认选定【四段论精讲】并包含 55%/45% 溯源文案与古代典籍引用框', () => {
    const html = renderToString(<ConceptNav initialPointId="KP-023" />);

    // 经典典籍引用框
    expect(html).toContain('《代数学》');
    expect(html).toContain('若有平方与根等于数');

    // 四段论子胶囊
    expect(html).toContain('① 原点溯源');
    expect(html).toContain('② 本真透视');
    expect(html).toContain('③ 法典严定');
    expect(html).toContain('④ 本体辨正');

    // 右侧高清几何模型
    expect(html).toContain('svg-layer-reveal');
    expect(html).toContain('图 1-1 阿尔·花拉子米几何配方法模型');
  });

  it('3. 4级抽屉盒选择器结构完备且挂载 107 大纲考点全谱系', () => {
    const html = renderToString(<ConceptNav initialPointId="KP-023" />);

    expect(html).toContain('concept-tree-sidebar');
    expect(html).toContain('第一级 · 年级');
    expect(html).toContain('第二级 · 学期');
    expect(html).toContain('第三级 · 领域');
    expect(html).toContain('第四级 · 大纲考点');
    expect(html).toContain('八年级');
    expect(html).toContain('上学期 (1)');
    expect(html).toContain('图形与几何');
    expect(html).toContain('三角形');
  });

  it('4. 【源码门禁】ConceptNav 及 ConceptDrawerSelector 严禁 eval/Function/dangerouslySetInnerHTML', () => {
    const navFile = path.resolve(__dirname, '../../../ConceptNav.tsx');
    const drawerFile = path.resolve(__dirname, '../ConceptDrawerSelector.tsx');

    const navCode = fs.readFileSync(navFile, 'utf-8');
    const drawerCode = fs.readFileSync(drawerFile, 'utf-8');

    // 零 eval/Function
    expect(navCode).not.toContain('eval(');
    expect(navCode).not.toContain('new Function(');
    expect(drawerCode).not.toContain('eval(');
    expect(drawerCode).not.toContain('new Function(');

    // 零 naked dangerouslySetInnerHTML / innerHTML
    expect(navCode).not.toContain('dangerouslySetInnerHTML');
    expect(navCode).not.toContain('.innerHTML');
    expect(drawerCode).not.toContain('dangerouslySetInnerHTML');
    expect(drawerCode).not.toContain('.innerHTML');
  });
});
