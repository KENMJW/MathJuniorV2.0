import zhCN from "../../locales/zh-CN.json";
import enUS from "../../locales/en.json";
import { Locale } from "../../store/sessionStore";

export type { Locale } from "../../store/sessionStore";

export const LOCALES: Record<Locale, Record<string, string>> = {
  "zh-CN": zhCN,
  "en": enUS,
};

let currentLocale: Locale = "zh-CN";

/**
 * 查字典翻译键值 (任务 14.1, §10.5)
 */
export function t(key: string, locale: Locale = currentLocale, fallback?: string): string {
  const dict = LOCALES[locale] || LOCALES["zh-CN"];
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  // 回退到默认中文字典
  if (LOCALES["zh-CN"] && LOCALES["zh-CN"][key] !== undefined) {
    return LOCALES["zh-CN"][key];
  }
  return fallback ?? key;
}

/**
 * 获取当前全局语言
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * 遍历并更新 DOM 树上所有 [data-i18n] 与 [data-i18n-placeholder] 元素文案
 */
export function applyI18nDom(root?: any, locale: Locale = currentLocale): void {
  const container = root || (typeof document !== "undefined" ? document : null);
  if (!container || typeof container.querySelectorAll !== "function") return;

  // 1. 处理普通内容绑定
  const elements = container.querySelectorAll("[data-i18n]");
  elements.forEach((el: any) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key, locale);
    }
  });

  // 2. 处理 placeholder 绑定
  const inputs = container.querySelectorAll("[data-i18n-placeholder]");
  inputs.forEach((el: any) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.setAttribute("placeholder", t(key, locale));
    }
  });
}

/**
 * 设置全局语言并广播事件进行无刷新热切换 (任务 14.1, §10.5)
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof window !== "undefined") {
    // 广播事件
    window.dispatchEvent(
      new CustomEvent("i18n:locale-changed", {
        detail: { locale },
      })
    );
    // 即时更新当前页面 DOM
    if (typeof document !== "undefined") {
      applyI18nDom(document, locale);
    }
  }
}

/**
 * 监听全局语言热切换事件
 */
export function onLocaleChange(callback: (locale: Locale) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ locale: Locale }>;
    callback(customEvent.detail.locale);
  };
  window.addEventListener("i18n:locale-changed", handler);
  return () => {
    window.removeEventListener("i18n:locale-changed", handler);
  };
}
