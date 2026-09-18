import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

export interface QuestionImageProps {
  src: string;
  role?: 'stem' | 'option' | 'solution';
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  disableLightbox?: boolean;
}

/**
 * 规范化图片绝对路径
 * 数据库存相对路径 'assets/questions/xxx.webp'，前端消费时添加 '/' 前缀
 * 适配 Cloudflare 根部署与静态资源访问
 */
export function resolveQuestionImageSrc(src: string): string {
  if (!src) return '';
  const trimmed = src.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export const QuestionImage: React.FC<QuestionImageProps> = ({
  src,
  role = 'stem',
  alt = '题目示意图',
  className = '',
  style,
  onClick,
  disableLightbox = false,
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const resolvedSrc = resolveQuestionImageSrc(src);

  // 监听 ESC 键关闭 Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const handleOpenLightbox = useCallback(
    (e: React.MouseEvent) => {
      if (onClick) {
        onClick(e);
      }
      if (!disableLightbox && status === 'loaded') {
        e.stopPropagation();
        setIsLightboxOpen(true);
      }
    },
    [onClick, disableLightbox, status]
  );

  const handleCloseLightbox = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLightboxOpen(false);
  }, []);

  // 角色专属样式映射
  const getContainerStyle = (): React.CSSProperties => {
    if (role === 'option') {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxHeight: '140px',
        minHeight: '80px',
        padding: '0.375rem',
        borderRadius: 'var(--radius-sm, 12px)',
        backgroundColor: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      };
    }

    if (role === 'solution') {
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '0.625rem auto',
        padding: '0.5rem',
        borderRadius: 'var(--radius-md, 18px)',
        backgroundColor: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      };
    }

    // stem (默认题干图)
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      margin: '0.875rem auto',
      padding: '0.625rem',
      borderRadius: 'var(--radius-md, 18px)',
      backgroundColor: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
      border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
      boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      ...style,
    };
  };

  const getImageStyle = (): React.CSSProperties => {
    if (role === 'option') {
      return {
        maxWidth: '100%',
        maxHeight: '128px',
        objectFit: 'contain',
        borderRadius: 'var(--radius-sm, 12px)',
        cursor: disableLightbox ? 'default' : 'zoom-in',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: status === 'loaded' ? 'block' : 'none',
      };
    }

    if (role === 'solution') {
      return {
        maxWidth: '100%',
        maxHeight: '300px',
        objectFit: 'contain',
        borderRadius: 'var(--radius-sm, 12px)',
        cursor: disableLightbox ? 'default' : 'zoom-in',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: status === 'loaded' ? 'block' : 'none',
      };
    }

    // stem
    return {
      maxWidth: '100%',
      maxHeight: '380px',
      objectFit: 'contain',
      borderRadius: 'var(--radius-sm, 12px)',
      cursor: disableLightbox ? 'default' : 'zoom-in',
      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      display: status === 'loaded' ? 'block' : 'none',
    };
  };

  // 骨架屏尺寸
  const skeletonHeight = role === 'option' ? '100px' : role === 'solution' ? '180px' : '220px';

  return (
    <>
      <div className={`question-image-wrapper ${className}`} style={getContainerStyle()}>
        {/* 加载状态骨架屏 (防 CLS) */}
        {status === 'loading' && (
          <div
            data-testid="question-image-skeleton"
            style={{
              width: '100%',
              height: skeletonHeight,
              borderRadius: 'var(--radius-sm, 12px)',
              backgroundColor: 'var(--border-subtle, #e2e8f0)',
              opacity: 0.65,
              animation: 'pulse 1.6s infinite ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--text-tertiary, #a1a1a6)',
            }}
          >
            <Icon name="file" size={24} />
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>加载中...</span>
          </div>
        )}

        {/* 错误降级占位框 */}
        {status === 'error' && (
          <div
            data-testid="question-image-error"
            style={{
              width: '100%',
              minHeight: '90px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              padding: '1rem',
              borderRadius: 'var(--radius-sm, 12px)',
              border: '1px dashed var(--border-subtle, #e2e8f0)',
              backgroundColor: 'var(--bg-canvas, #f8fafc)',
              color: 'var(--text-tertiary, #a1a1a6)',
            }}
          >
            <Icon name="alert" size={22} style={{ color: 'var(--ios-orange)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>示意图加载失败</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{resolvedSrc}</span>
          </div>
        )}

        {/* 真实图片本体 */}
        {resolvedSrc && (
          <img
            src={resolvedSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={getImageStyle()}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            onClick={handleOpenLightbox}
          />
        )}
      </div>

      {/* 内置轻量 Lightbox 放大模态框 */}
      {isLightboxOpen && (
        <div
          data-testid="question-image-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.86)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'zoom-out',
          }}
        >
          {/* 顶部操作条 */}
          <div
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              zIndex: 100000,
            }}
          >
            <button
              type="button"
              data-testid="lightbox-close-btn"
              onClick={handleCloseLightbox}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              aria-label="关闭预览"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* 大图容器 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default',
            }}
          >
            <img
              src={resolvedSrc}
              alt={alt}
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md, 18px)',
                boxShadow: 'var(--glass-shadow-deep, 0 20px 60px -10px rgba(0, 20, 60, 0.5))',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#ffffff',
              }}
            />
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.8125rem',
                color: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{alt}</span>
              <span style={{ opacity: 0.6 }}>· 按 ESC 或点击背景关闭</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionImage;
