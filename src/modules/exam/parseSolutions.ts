/**
 * 解法项结构
 */
export interface SolutionItem {
  method: string;
  text: string;
}

/**
 * 解析 solutions_json 为 SolutionItem 数组
 * 
 * 容错规则：
 * 1. 空/null/undefined -> 返回 []
 * 2. 非法 JSON -> 返回 []（不抛出异常）
 * 3. 兼容老结构 { method_zh, steps } -> 映射为 { method, text }
 * 4. 兼容单对象形式 -> 包装为数组
 */
export function parseSolutions(raw: unknown, locale: string = 'zh-CN'): SolutionItem[] {
  if (raw == null) {
    return [];
  }

  const isEn = String(locale).toLowerCase().startsWith('en');
  let data: unknown = raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    try {
      data = JSON.parse(trimmed);
    } catch {
      // 非法 JSON，安全返回空数组
      return [];
    }
  }

  if (data == null) {
    return [];
  }

  // 若为单个对象，包装为数组
  const list = Array.isArray(data) ? data : (typeof data === 'object' ? [data] : []);

  const result: SolutionItem[] = [];

  for (const item of list) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const obj = item as Record<string, unknown>;

    // 提取 method（英文优先选择 method_en，回退 method / method_zh / method_name）
    const methodVal = isEn
      ? (obj.method_en ?? obj.method ?? obj.method_zh ?? obj.method_name ?? '')
      : (obj.method_zh ?? obj.method ?? obj.method_name ?? obj.method_en ?? '');
    const method = typeof methodVal === 'string' ? methodVal.trim() : String(methodVal).trim();

    // 提取 text（英文优先选择 text_en / steps_en，回退 text / steps）
    let text = '';
    const preferredText = isEn
      ? (obj.text_en ?? obj.text ?? obj.text_zh)
      : (obj.text_zh ?? obj.text ?? obj.text_en);
    const preferredSteps = isEn
      ? (obj.steps_en ?? obj.steps ?? obj.steps_zh)
      : (obj.steps_zh ?? obj.steps ?? obj.steps_en);

    if (typeof preferredText === 'string') {
      text = preferredText;
    } else if (Array.isArray(preferredSteps)) {
      text = preferredSteps.map(s => String(s ?? '')).join('\n');
    } else if (typeof preferredSteps === 'string') {
      text = preferredSteps;
    } else if (preferredText != null) {
      text = String(preferredText);
    }

    // 只要 method 或 text 有其一不为空，即为合法解法
    if (method || text) {
      result.push({ method, text });
    }
  }

  return result;
}
