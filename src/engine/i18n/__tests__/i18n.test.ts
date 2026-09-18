import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { t, getLocale, setLocale, applyI18nDom, onLocaleChange } from "../i18n";

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

describe("i18n Engine (14.1, §10.5)", () => {
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

  it("translates known keys for zh-CN and en", () => {
    expect(t("app.title", "zh-CN")).toBe("全科核心素养提分系统");
    expect(t("app.title", "en")).toBe("Core Competency Score Elevation System");
    expect(t("stages.origin", "zh-CN")).toBe("原点溯源");
    expect(t("stages.origin", "en")).toBe("Origin Story");
  });

  it("falls back to fallback string or key when key is unknown", () => {
    expect(t("unknown.key", "zh-CN", "默认值")).toBe("默认值");
    expect(t("unknown.key", "en")).toBe("unknown.key");
  });

  it("updates DOM elements matching [data-i18n] via applyI18nDom", () => {
    const root = new MockElement("div");
    const h1 = new MockElement("h1", { "data-i18n": "app.title" }, "初始");
    const btn = new MockElement("button", { "data-i18n": "practice.submit" }, "初始");
    const input = new MockElement("input", { "data-i18n-placeholder": "common.loading" });
    root.children.push(h1, btn, input);

    applyI18nDom(root as any, "en");

    expect(h1.textContent).toBe("Core Competency Score Elevation System");
    expect(btn.textContent).toBe("Submit Solution");
    expect(input.getAttribute("placeholder")).toBe("Loading...");

    applyI18nDom(root as any, "zh-CN");
    expect(h1.textContent).toBe("全科核心素养提分系统");
    expect(btn.textContent).toBe("提交解答");
    expect(input.getAttribute("placeholder")).toBe("加载中...");
  });

  it("broadcasts i18n:locale-changed and triggers listeners upon setLocale", () => {
    const callback = vi.fn();
    const unsubscribe = onLocaleChange(callback);

    setLocale("en");

    expect(getLocale()).toBe("en");
    expect(callback).toHaveBeenCalledWith("en");

    unsubscribe();
    setLocale("zh-CN");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(getLocale()).toBe("zh-CN");
  });
});
