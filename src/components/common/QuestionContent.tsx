import React, { useMemo } from 'react';
import { MathRenderer } from '../math/MathRenderer';
import { QuestionImage } from './QuestionImage';

export interface QuestionContentProps {
  content?: string | null;
  images?: string[] | string | null;
  role?: 'stem' | 'solution';
  locale?: 'zh' | 'en';
  className?: string;
  style?: React.CSSProperties;
}

interface ContentSegment {
  type: 'text' | 'image';
  text?: string;
  imageIndex?: number;
}

/**
 * 安全解析题目的 image_paths_json
 */
export function parseImagePaths(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // 容错：单个路径字符串降级
      if (raw.trim().length > 0 && !raw.startsWith('{')) {
        return [raw.trim()];
      }
      return [];
    }
  }
  return [];
}

/**
 * QuestionContent: 题目文本 + LaTeX + 图片锚点混合渲染器
 * 
 * 核心设计约束：
 * 1. 严格使用正则 /\[\[IMG:(\d+)\]\]/g 切分 content。
 * 2. 纯文本片段交给 <MathRenderer>，锚点位置就地插入 <QuestionImage>。
 * 3. 严禁整段喂给 MathRenderer，防止锚点被 HTML 转义破坏。
 */
export const QuestionContent: React.FC<QuestionContentProps> = ({
  content,
  images,
  role = 'stem',
  locale = 'zh',
  className = '',
  style,
}) => {
  const imageList = useMemo(() => parseImagePaths(images), [images]);

  const segments = useMemo((): ContentSegment[] => {
    if (!content) return [];

    const imgRegex = /\[\[IMG:(\d+)\]\]/g;
    const result: ContentSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(content)) !== null) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore) {
        result.push({ type: 'text', text: textBefore });
      }

      const imgIdx = parseInt(match[1], 10);
      result.push({ type: 'image', imageIndex: imgIdx });

      lastIndex = imgRegex.lastIndex;
    }

    const textAfter = content.slice(lastIndex);
    if (textAfter) {
      result.push({ type: 'text', text: textAfter });
    }

    return result;
  }, [content]);

  if (!content) {
    return null;
  }

  // 若无任何图片锚点，直接走 MathRenderer 提高渲染性能
  if (segments.length <= 1 && segments[0]?.type === 'text') {
    return (
      <div className={`question-content-plain ${className}`} style={{ lineHeight: 1.6, ...style }}>
        <MathRenderer content={content} />
      </div>
    );
  }

  return (
    <div
      className={`question-content-mixed ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        lineHeight: 1.6,
        ...style,
      }}
    >
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return (
            <div key={`txt-${idx}`} style={{ display: 'inline' }}>
              <MathRenderer content={seg.text || ''} />
            </div>
          );
        }

        if (seg.type === 'image' && seg.imageIndex !== undefined) {
          const imageSrc = imageList[seg.imageIndex];
          if (!imageSrc) {
            return null;
          }

          const altText = locale === 'en' ? `Figure ${seg.imageIndex + 1}` : `示意图 ${seg.imageIndex + 1}`;
          return (
            <QuestionImage
              key={`img-anchor-${idx}-${seg.imageIndex}`}
              role={role}
              src={imageSrc}
              alt={altText}
            />
          );
        }

        return null;
      })}
    </div>
  );
};

export default QuestionContent;
