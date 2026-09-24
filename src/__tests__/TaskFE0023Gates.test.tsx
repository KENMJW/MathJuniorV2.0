import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { CardDeck } from '../components/shell/CardDeck';
import { MathJuniorHome } from '../MathJuniorHome';
import { ConceptNav } from '../ConceptNav';
import { GraphNav } from '../modules/graph/GraphNav';
import { LabWorkspace } from '../modules/sandbox/LabWorkspace';
import { LeapLab } from '../modules/sandbox/LeapLab';
import { setDeviceOverride, clearDeviceOverride } from '../engine/device/deviceOverride';
import { useSessionStore } from '../store/sessionStore';
import { allLeapSandboxModels } from '../modules/sandbox/mockLeapModels';

describe('TASK-FE-0023 架构师量化验收门禁全量测试套件 (Mobile UX Refactor Gates)', () => {
  beforeEach(() => {
    clearDeviceOverride();
    useSessionStore.getState().resetAll();
  });

  afterEach(() => {
    clearDeviceOverride();
    useSessionStore.getState().resetAll();
  });

  // =========================================================================
  // 门禁 1: 顶端 80px 双轨书签船坞物理层级与尺寸规范
  // =========================================================================
  describe('门禁 1: 顶端 80px 双轨书签船坞物理层级规范', () => {
    it('1. CardDeck 容器正确包含 44px Header + 36px Subnav 双轨结构', () => {
      const html = renderToString(
        <CardDeck
          header={<div data-testid="test-header">Header</div>}
          subnav={<div data-testid="test-subnav">Subnav</div>}
          bottomSheet={<div data-testid="test-tabbar">TabBar</div>}
        >
          <div>Body Content</div>
        </CardDeck>
      );

      expect(html).toContain('card-deck-header');
      expect(html).toContain('h-[44px]');
      expect(html).toContain('card-deck-subnav');
      expect(html).toContain('h-[36px]');
      expect(html).toContain('card-deck-bottom-sheet');
      expect(html).toContain('min-h-[56px]');
    });

    it('2. 手机端模式下，MathJuniorHome 渲染 44px 交互式标题胶囊与 36px 吸顶书签轨', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(
        <MemoryRouter initialEntries={['/math-junior/concept']}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      // 验证 44px 顶栏交互式标题胶囊存在
      expect(html).toContain('data-testid="interactive-title-capsule"');
      expect(html).toContain('KP-001');

      // 验证 36px 固化吸顶二级书签轨存在
      expect(html).toContain('data-testid="math-junior-mobile-subnav"');
      expect(html).toContain('① 概念精讲');
      expect(html).toContain('② 链接沙盒');
      expect(html).toContain('③ 黄金母题');
      expect(html).toContain('④ 单点快练');
    });

    it('3. 思维图谱模块在手机端渲染 4 大主线二级书签', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(
        <MemoryRouter initialEntries={['/math-junior/graph']}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain('data-testid="interactive-title-capsule"');
      expect(html).toContain('A1');
      expect(html).toContain('data-testid="math-junior-mobile-subnav"');
      expect(html).toContain('① 谱系精讲');
      expect(html).toContain('② 闭环沙盒');
      expect(html).toContain('③ 压轴母题');
      expect(html).toContain('④ 综合快练');
    });

    it('4. 动力学沙盒模块在手机端渲染双模书签：分步推演与自由探索', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(
        <MemoryRouter initialEntries={['/math-junior/lab']}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain('data-testid="interactive-title-capsule"');
      expect(html).toContain('data-testid="math-junior-mobile-subnav"');
      expect(html).toContain('① 分步推演');
      expect(html).toContain('② 自由探索');
    });
  });

  // =========================================================================
  // 门禁 2: 页面内容区悬浮菜单与大卡片选择器清零 (DOM 计数 = 0)
  // =========================================================================
  describe('门禁 2: 页面内容区冗余悬浮菜单 DOM 计数严格清零', () => {
    it('1. ConceptNav 在手机端 DOM 中 redundant header 出现次数严格为 0', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(<ConceptNav />);

      // concept-nav-header 必须完全不渲染在 DOM 中
      expect(html).not.toContain('concept-nav-header');
      expect(html).not.toContain('concept-drawer-trigger-btn');
    });

    it('2. GraphNav 在手机端 DOM 中 redundant header 出现次数严格为 0', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(<GraphNav />);

      // graph-nav-header 必须完全不渲染在 DOM 中
      expect(html).not.toContain('graph-nav-header');
      expect(html).not.toContain('graph-line-selector-trigger-btn');
    });

    it('3. LabWorkspace 在手机端 DOM 中 redundant top-bar 出现次数严格为 0', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(
        <LabWorkspace
          effectiveSandboxes={[]}
          effectiveLeapModels={allLeapSandboxModels}
          labSubView="leap_4d"
        />
      );

      // sandbox-top-bar 与 model-drawer-trigger-btn 必须不在 DOM 中
      expect(html).not.toContain('sandbox-top-bar');
      expect(html).not.toContain('model-drawer-trigger-btn');
    });

    it('4. LeapLab 在手机端 DOM 中 sandbox-header-line 出现次数严格为 0', () => {
      setDeviceOverride('MOBILE');
      const testModel = allLeapSandboxModels[0];
      const html = renderToString(<LeapLab model={testModel} />);

      // 手机端沙盒内头部文字与分段按钮从 DOM 中彻底清零
      expect(html).not.toContain('sandbox-header-line');
    });
  });

  // =========================================================================
  // 门禁 3: 模块二思维图谱手机端垂直知识生长树重构验证
  // =========================================================================
  describe('门禁 3: 模块二思维图谱手机端垂直知识生长树重构验证', () => {
    it('1. 手机端渲染垂直知识生长树 (graph-growth-tree-mobile)，不渲染桌面水平泳道', () => {
      setDeviceOverride('MOBILE');
      const html = renderToString(<GraphNav />);

      // 垂直知识生长树存在
      expect(html).toContain('graph-growth-tree-mobile');
      expect(html).toContain('growth-timeline-step');

      // 包含 6 学期垂直节点
      expect(html).toContain('7上');
      expect(html).toContain('9下');

      // 包含旗舰跃迁模型直达大胶囊
      expect(html).toContain('mobile-jump-to-flagship-btn');
    });

    it('2. 桌面端仍正常保留水平泳道与完整视窗', () => {
      setDeviceOverride('DESKTOP');
      const html = renderToString(<GraphNav />);

      expect(html).toContain('graph-nav-header');
      expect(html).not.toContain('graph-growth-tree-mobile');
    });
  });

  // =========================================================================
  // 门禁 4: 源码绝对零 Emoji 违规检查
  // =========================================================================
  describe('门禁 4: 源码绝对零 Unicode Emoji 检查', () => {
    it('1. 本次重构的核心文件源码中绝对零 unicode emoji', () => {
      const files = [
        'src/MathJuniorHome.tsx',
        'src/ConceptNav.tsx',
        'src/modules/graph/GraphNav.tsx',
        'src/modules/sandbox/LabWorkspace.tsx',
        'src/modules/sandbox/LeapLab.tsx',
        'src/components/shell/CardDeck.tsx',
        'src/components/shell/MobileShell.tsx',
        'src/store/sessionStore.ts',
      ];

      const emojiRegex = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;

      files.forEach((f) => {
        const fullPath = path.resolve(process.cwd(), f);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const match = emojiRegex.exec(line);
          if (match) {
            expect(`File ${f}:${idx + 1} contains emoji: ${match[0]}`).toBe('No emoji allowed');
          }
        });
      });
    });
  });
});
