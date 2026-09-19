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
  eager?: boolean;
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
 * 4. 防御兜底：若题库提供了图片但题干遗漏 [[IMG:n]] 锚点，尾部自动追加补全，杜绝丢图。
 */
export const QuestionContent: React.FC<QuestionContentProps> = ({
  content,
  images,
  role = 'stem',
  locale = 'zh',
  className = '',
  style,
  eager = false,
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

  // 计算已被正文锚点 [[IMG:n]] 消费的图片索引
  const anchoredIndices = useMemo(() => {
    const set = new Set<number>();
    for (const seg of segments) {
      if (seg.type === 'image' && seg.imageIndex !== undefined) {
        set.add(seg.imageIndex);
      }
    }
    return set;
  }, [segments]);

  // 提取未被正文锚点匹配的图片列表 (兜底保护)
  const unanchoredImages = useMemo(() => {
    return imageList
      .map((src, index) => ({ src, index }))
      .filter(({ index }) => !anchoredIndices.has(index));
  }, [imageList, anchoredIndices]);

  if (!content) {
    return null;
  }

  // 若无任何图片锚点，且题库也没有提供任何未匹配的图片，直接走 MathRenderer 提高渲染性能
  if (segments.length <= 1 && segments[0]?.type === 'text' && unanchoredImages.length === 0) {
    return (
      <div
        className={`question-content-plain db-content-body ${className}`.trim()}
        style={{
          lineHeight: 'var(--content-line-height-body, 1.6)',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          maxWidth: '100%',
          ...style,
        }}
      >
        <MathRenderer content={content} />
      </div>
    );
  }

  return (
    <div
      className={`question-content-mixed db-content-body ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        lineHeight: 'var(--content-line-height-body, 1.6)',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        maxWidth: '100%',
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
              eager={eager}
            />
          );
        }

        return null;
      })}

      {/* 渲染未被正文锚点匹配的图片 (兜底避免丢图) */}
      {unanchoredImages.map(({ src, index }) => (
        <QuestionImage
          key={`img-unanchored-${index}`}
          role={role}
          src={src}
          alt={locale === 'en' ? `Figure ${index + 1}` : `示意图 ${index + 1}`}
          eager={eager}
        />
      ))}
    </div>
  );
};

export default QuestionContent;
