/**
 * 填空题多空智能识别与槽位解析工具 (blankParser)
 *
 * 核心设计：
 * 1. 结构化解耦：返回 string[] 槽位数组，绝不在内部使用中文分号拼凑字符串；
 * 2. 智能识别：综合题干下划线 (_{2,})、小题号 ( (1)...(2)... / ①...②... ) 与标准答案分项；
 * 3. 多语言适配：支持中英文分号 (； / ;) 与英文连接词拆分，全角半角无感自适应。
 */

export interface BlankSlotInfo {
  index: number; // 0-based
  labelZh: string; // "第 (1) 空"
  labelEn: string; // "Blank (1)"
  placeholderZh: string;
  placeholderEn: string;
}

/**
 * 将标准答案按中英文常见分隔符拆分为槽位数组
 */
export function parseStandardAnswerSlots(rawAnswer?: string | null): string[] {
  if (!rawAnswer || !rawAnswer.trim()) {
    return [''];
  }

  const s = rawAnswer.trim();

  // 1. 若包含显式小题序号：（1）...（2）... 或 (1)...(2)... 或 ①...②...
  const numberedPattern = /(?:^|\s*)(?:[(（][1-9][)）]|①|②|③|④|⑤|⑥)\s*/;
  if (numberedPattern.test(s)) {
    const parts = s
      .split(/(?=(?:[(（][1-9][)）]|①|②|③|④|⑤|⑥))/)
      .map((p) => p.replace(/^(?:[(（][1-9][)）]|①|②|③|④|⑤|⑥)\s*/, '').replace(/[；;,，\s]+$/, '').trim())
      .filter((p) => p.length > 0);
    if (parts.length >= 2) {
      return parts;
    }
  }

  // 2. 按中英文分号拆分 (； 或 ;)
  if (s.includes('；') || s.includes(';')) {
    const parts = s
      .split(/[；;]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length >= 2) {
      return parts;
    }
  }

  // 3. 兜底作为单空
  return [s];
}

/**
 * 智能探测题目包含的填空数量 (Blank Count)
 */
export function detectBlankCount(question: {
  stem_zh?: string | null;
  stem_en?: string | null;
  answer_standard?: string | null;
  locale?: string;
}): number {
  const isEn = String(question.locale || '').toLowerCase().startsWith('en');
  const primaryStem = isEn && question.stem_en ? question.stem_en : (question.stem_zh || '');

  // 1. 题干下划线匹配 (连续 2 个以上的下划线)
  const underlineMatches = primaryStem.match(/_{2,}/g);
  const underlineCount = underlineMatches ? underlineMatches.length : 0;

  // 2. 检查答案被解析成的槽位数量
  const answerSlots = parseStandardAnswerSlots(question.answer_standard);

  // 如果题干有多个下划线，且答案能拆出多个槽位，直接以两者合理值为准
  if (underlineCount >= 2 && answerSlots.length >= 2) {
    return Math.max(underlineCount, answerSlots.length);
  }

  // 如果题干明确有 2 个以上下划线
  if (underlineCount >= 2) {
    return underlineCount;
  }

  // 如果标准答案明确拆出了 2 个以上子项 (如 "15；9" 或 "(1) 4; (2) 6")
  if (answerSlots.length >= 2) {
    return answerSlots.length;
  }

  // 默认单空
  return 1;
}

/**
 * 生成各槽位的多语言 UI 描述元数据
 */
export function getBlankSlotsMeta(count: number, _isEn: boolean = false): BlankSlotInfo[] {
  const safeCount = Math.max(1, count);
  const slots: BlankSlotInfo[] = [];

  for (let i = 0; i < safeCount; i++) {
    const num = i + 1;
    slots.push({
      index: i,
      labelZh: safeCount > 1 ? `第 (${num}) 空` : '填空作答',
      labelEn: safeCount > 1 ? `Blank (${num})` : 'Fill-in Answer',
      placeholderZh: safeCount > 1 ? `在此键入第 (${num}) 空作答...` : '在此键入最终作答结果...',
      placeholderEn: safeCount > 1 ? `Type answer for Blank (${num})...` : 'Type your answer...',
    });
  }

  return slots;
}

/**
 * 序列化学生的多个填空槽位为字符串存储 (单空保持原字符串，多空使用 JSON 安全存储)
 */
export function serializeStudentSlots(slots: string[]): string {
  if (!slots || slots.length === 0) return '';
  if (slots.length === 1) return slots[0];
  // 多空时使用 JSON 字符串保存，完全杜绝中文分号或逗号标点冲突
  return JSON.stringify(slots);
}

/**
 * 将存储字符串反序列化为指定长度的槽位数组
 */
export function deserializeStudentSlots(raw: string | undefined | null, count: number): string[] {
  const safeCount = Math.max(1, count);
  if (!raw || !raw.trim()) {
    return Array(safeCount).fill('');
  }

  // 1. 优先尝试 JSON 数组解析
  if (raw.trim().startsWith('[') && raw.trim().endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const result = Array(safeCount).fill('');
        for (let i = 0; i < safeCount; i++) {
          result[i] = typeof parsed[i] === 'string' ? parsed[i] : (parsed[i] != null ? String(parsed[i]) : '');
        }
        return result;
      }
    } catch {
      // 容错降级
    }
  }

  // 2. 单空题直接返回原值
  if (safeCount === 1) {
    return [raw];
  }

  // 3. 多空题兼容旧分号分割数据
  if (raw.includes('；') || raw.includes(';')) {
    const parts = raw.split(/[；;]/).map((p) => p.trim());
    const result = Array(safeCount).fill('');
    for (let i = 0; i < safeCount; i++) {
      result[i] = parts[i] || '';
    }
    return result;
  }

  const result = Array(safeCount).fill('');
  result[0] = raw;
  return result;
}
