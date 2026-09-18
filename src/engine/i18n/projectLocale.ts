import { Locale } from '../../store/sessionStore';

/**
 * 双语字段投影函数 (任务 14.2, 属性 P14 / Property 14)
 *
 * 针对包含 _zh / _en 字段的数据对象，根据当前 locale 投影为不带语言后缀的统一对象。
 * 例如：{ name_zh: '勾股', name_en: 'Pythagoras', grade: 8 }
 * 在 'zh-CN' 下投影出 { name: '勾股', grade: 8, ... }
 * 在 'en' 下投影出 { name: 'Pythagoras', grade: 8, ... }
 */
export function projectLocale<T extends Record<string, any>>(
  item: T,
  locale: Locale = 'zh-CN'
): Record<string, any> {
  if (!item || typeof item !== 'object') {
    return {};
  }

  const result: Record<string, any> = {};
  const isEn = locale === 'en';
  const targetSuffix = isEn ? '_en' : '_zh';
  const fallbackSuffix = isEn ? '_zh' : '_en';

  // 1. 复制无后缀字段
  for (const [key, value] of Object.entries(item)) {
    if (!key.endsWith('_zh') && !key.endsWith('_en')) {
      result[key] = value;
    }
  }

  // 2. 投影双语字段：目标语言优先，若目标语言为空则回退到备用语言
  for (const [key, value] of Object.entries(item)) {
    if (key.endsWith(targetSuffix)) {
      const baseKey = key.slice(0, -targetSuffix.length);
      result[baseKey] = value;
    } else if (key.endsWith(fallbackSuffix)) {
      const baseKey = key.slice(0, -fallbackSuffix.length);
      if (result[baseKey] === undefined) {
        result[baseKey] = value;
      }
    }
  }

  return result;
}

/**
 * 快速安全获取指定字段的双语值
 */
export function getLocalizedField<T extends Record<string, any>>(
  item: T | null | undefined,
  fieldPrefix: string,
  locale: Locale = 'zh-CN'
): string {
  if (!item) return '';
  const targetKey = locale === 'en' ? `${fieldPrefix}_en` : `${fieldPrefix}_zh`;
  if (item[targetKey] !== undefined && item[targetKey] !== null) {
    return String(item[targetKey]);
  }
  const fallbackKey = locale === 'en' ? `${fieldPrefix}_zh` : `${fieldPrefix}_en`;
  if (item[fallbackKey] !== undefined && item[fallbackKey] !== null) {
    return String(item[fallbackKey]);
  }
  if (item[fieldPrefix] !== undefined && item[fieldPrefix] !== null) {
    return String(item[fieldPrefix]);
  }
  return '';
}
