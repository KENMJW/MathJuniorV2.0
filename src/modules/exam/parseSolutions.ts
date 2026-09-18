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
export function parseSolutions(raw: unknown): SolutionItem[] {
  if (raw == null) {
    return [];
  }

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

    // 提取 method（兼容 method_zh）
    const methodVal = obj.method ?? obj.method_zh ?? '';
    const method = typeof methodVal === 'string' ? methodVal.trim() : String(methodVal).trim();

    // 提取 text（兼容 steps 数组或字符串）
    let text = '';
    if (typeof obj.text === 'string') {
      text = obj.text;
    } else if (Array.isArray(obj.steps)) {
      text = obj.steps.map(s => String(s ?? '')).join('\n');
    } else if (typeof obj.steps === 'string') {
      text = obj.steps;
    } else if (obj.text != null) {
      text = String(obj.text);
    }

    // 只要 method 或 text 有其一不为空，即为合法解法
    if (method || text) {
      result.push({ method, text });
    }
  }

  return result;
}
