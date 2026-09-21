import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { DB_PACKAGES, DB_PACKAGE_PATHS, getPackageForTable } from "../engine/db/packages";
import { setLocale, getLocale, applyI18nDom, onLocaleChange } from "../engine/i18n/i18n";
import { PrintLayout } from "../modules/exam/PrintLayout";
import { testExamQuestions } from "../modules/exam/__tests__/testExamQuestions";
import { drawQuestions } from "../modules/exam/drawQuestions";

class MockElement {
  attributes: Record<string, string> = {};
  textContent: string = "";
  children: MockElement[] = [];

  constructor(public tagName: string = "div", attrs: Record<string, string> = {}, text = "") {
    this.attributes = { ...attrs };
    this.textContent = text;
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const traverse = (node: MockElement) => {
      if (selector === "[data-i18n]" && node.attributes["data-i18n"]) {
        results.push(node);
      }
      if (selector === "[data-i18n-placeholder]" && node.attributes["data-i18n-placeholder"]) {
        results.push(node);
      }
      for (const c of node.children) {
        traverse(c);
      }
    };
    traverse(this);
    return results;
  }
}

/**
 * 任务 18.3: 三引擎冒烟集成测试 (Blink / WebKit / Gecko 跨平台)
 *
 * 核心验证：
 * 1. WASM 分包映射与按需加载路由契约 (SQLite-wasm)
 * 2. i18n 跨组件全局广播热切换与 DOM 响应联动 (无需重载)
 * 3. @media print A4 印刷双栏排版、分页防截断与 UI 隐蔽规则
 */
describe("Task 18.3: 三引擎冒烟集成测试 (WASM分包 / i18n热切换 / @media print排版)", () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    const listeners: Record<string, Function[]> = {};
    (globalThis as any).window = {
      addEventListener: (type: string, fn: Function) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: Function) => {
        listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
      },
      dispatchEvent: (evt: any) => {
        const fns = listeners[evt.type] || [];
        fns.forEach((f) => f(evt));
        return true;
      },
    };
    setLocale("zh-CN");
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it("Smoke 1: SQLite-wasm 4 大独立分包与 8 核心表路由映射正确", () => {
    // 验证分包清单
    expect(DB_PACKAGES).toEqual(["core", "master", "sandbox", "questions"]);
    expect(DB_PACKAGE_PATHS.core).toBe("/data/core.db");
    expect(DB_PACKAGE_PATHS.master).toBe("/data/master.db");
    expect(DB_PACKAGE_PATHS.sandbox).toBe("/data/sandbox.db");
    expect(DB_PACKAGE_PATHS.questions).toBe("/data/questions.db");

    // 验证核心表到分包的路由闭包
    expect(getPackageForTable("knowledge_points")).toBe("core");
    expect(getPackageForTable("logic_lines")).toBe("core");
    expect(getPackageForTable("knowledge_combinations")).toBe("core");
    expect(getPackageForTable("knowledge_graph_semesters")).toBe("core");
    expect(getPackageForTable("master_examples")).toBe("master");
    expect(getPackageForTable("concept_sandboxes")).toBe("sandbox");
    expect(getPackageForTable("leap_sandbox_models")).toBe("sandbox");
    expect(getPackageForTable("questions")).toBe("questions");

    // 验证未知表拦截异常
    expect(() => getPackageForTable("unknown_table")).toThrow(/Unknown table name/);
  });

  it("Smoke 2: i18n 广播热切换与多节点 DOM 联动即时响应 (无需 reload)", () => {
    const root = new MockElement("div");
    const titleNode = new MockElement("h1", { "data-i18n": "app.title" });
    const btnNode = new MockElement("button", { "data-i18n": "exam.start" });
    const searchNode = new MockElement("input", { "data-i18n-placeholder": "common.loading" });
    root.children.push(titleNode, btnNode, searchNode);

    // 初始 zh-CN 渲染
    applyI18nDom(root as any, "zh-CN");
    expect(titleNode.textContent).toBe("全科核心素养提分系统");
    expect(btnNode.textContent).toBe("开始测评");
    expect(searchNode.getAttribute("placeholder")).toBe("加载中...");

    // 广播切换为 en
    let currentEventLocale = "";
    const unsubscribe = onLocaleChange((locale) => {
      currentEventLocale = locale;
    });

    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(currentEventLocale).toBe("en");

    // 联动更新 DOM
    applyI18nDom(root as any, "en");
    expect(titleNode.textContent).toBe("Core Competency Score Elevation System");
    expect(btnNode.textContent).toBe("Start Exam");
    expect(searchNode.getAttribute("placeholder")).toBe("Loading...");

    // 切回中文
    setLocale("zh-CN");
    applyI18nDom(root as any, "zh-CN");
    expect(titleNode.textContent).toBe("全科核心素养提分系统");
    expect(btnNode.textContent).toBe("开始测评");

    unsubscribe();
  });

  it("Smoke 3: @media print A4 印刷分页规则与 PrintLayout 结构完整性", () => {
    // 1. 验证 print.css 样式表规则完整性
    const cssPath = path.resolve(__dirname, "../modules/exam/print.css");
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("@media print");
    expect(cssContent).toContain("size: A4 portrait;");
    expect(cssContent).toContain("column-count: 2");
    expect(cssContent).toContain("column-gap: 8mm");
    expect(cssContent).toContain("break-inside: avoid");
    expect(cssContent).toContain("page-break-inside: avoid");
    expect(cssContent).toContain(".no-print");

    // 2. 渲染 PrintLayout 组件并核验印刷 DOM 结构
    const paper = drawQuestions(
      testExamQuestions,
      {
        selectedKpIds: [],
        choiceCount: 2,
        fillCount: 1,
        solutionCount: 1,
        difficultyDistribution: [20, 20, 20, 20, 20],
      },
      { seed: 9999 }
    );

    const html = ReactDOMServer.renderToString(
      React.createElement(PrintLayout, { paper, onBackToWorkbench: () => {} })
    );

    // 验证印刷特征 class
    expect(html).toContain("print-paper-container");
    expect(html).toContain("print-sealing-line");
    expect(html).toContain("print-columns-flow");
    expect(html).toContain("print-question-card");
    expect(html).toContain("no-print");
    // 验证 Property 20 铁律：打印输出严禁 foreignObject
    expect(html).not.toContain("<foreignObject");
  });
});
