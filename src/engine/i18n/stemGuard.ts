/**
 * 安全题干获取与防夹生防御守护 (Property P-I18N-1)
 *
 * 核心设计约束与不变量：
 * 1. 当 locale 为中文或非英文时，直接返回中文题干 stem_zh；
 * 2. 当 locale 为英文时，校验 stem_en 是否存在且有效；
 * 3. [铁律防线]: 若 stem_en 包含任意中文字符 (/[\u4e00-\u9fff]/)，说明该题尚未完成
 *    高质量全句重译（属于机械查表残留的 Chinglish），此时必须自动、优雅降级为 stem_zh，
 *    坚决杜绝向师生呈现中英夹杂的破碎语段；
 * 4. 纯纯英文题干（无中文字符）正常透传呈现。
 */

export interface QuestionStemLike {
  stem_zh: string;
  stem_en?: string | null;
}

/**
 * 根据语言环境安全解析题干文本
 *
 * @param stemZh 中文题干
 * @param stemEn 英文题干 (可能为空或包含夹生中文)
 * @param isEn 是否为英文模式
 * @returns 经过安全门禁的题干字符串
 */
export function resolveSafeStem(
  stemZh: string | null | undefined,
  stemEn: string | null | undefined,
  isEn: boolean
): string {
  const fallback = stemZh ?? '';
  if (!isEn) {
    return fallback;
  }
  const enTrimmed = (stemEn ?? '').trim();
  if (!enTrimmed) {
    return fallback;
  }
  // 检查是否包含中文字符
  if (/[\u4e00-\u9fff]/.test(enTrimmed)) {
    return fallback;
  }
  return enTrimmed;
}

/**
 * 结构化题目对象的安全题干提取
 *
 * @param question 题目对象（含 stem_zh 和可选 stem_en）
 * @param isEn 是否为英文模式
 */
export function getSafeStem(
  question: QuestionStemLike | null | undefined,
  isEn: boolean
): string {
  if (!question) return '';
  return resolveSafeStem(question.stem_zh, question.stem_en, isEn);
}
