import React, { useEffect } from 'react';
import { BookOpen, ExternalLink, Download, X } from 'lucide-react';
import { useDeviceResponsive } from '../../hooks/useDeviceResponsive';
import { Locale } from '../../store/sessionStore';

export interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: Locale;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  locale = 'zh-CN',
}) => {
  const { isMobile, isTablet } = useDeviceResponsive();
  const isEn = String(locale).toLowerCase().startsWith('en');

  // ESC 键监听
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 打开时锁定 body 滚动
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="user-manual-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 950,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
        animation: 'fadeIn 0.2s ease-out',
        boxSizing: 'border-box',
      }}
    >
      <div
        data-testid="user-manual-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : isTablet ? '92vw' : '960px',
          maxWidth: '100%',
          height: isMobile ? '90vh' : isTablet ? '88vh' : '86vh',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '24px 24px 0 0' : isTablet ? '20px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 手机端顶部滑动药丸装饰 */}
        {isMobile && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '0.625rem',
              paddingBottom: '0.25rem',
              backgroundColor: '#f8fafc',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
          </div>
        )}

        {/* 模态窗顶栏 */}
        <div
          data-testid="user-manual-modal-header"
          style={{
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          {/* 标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ios-blue, #007aff)',
                flexShrink: 0,
              }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  fontWeight: 800,
                  color: '#1c1c1e',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isEn ? 'Operation User Manual' : '操作使用说明书'}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: '#8e8e93',
                  display: isMobile ? 'none' : 'block',
                }}
              >
                {isEn
                  ? 'Core Competency Literacy System V2.0 · Comprehensive Guide'
                  : '全科核心素养提分系统 V2.0 · 初中数学全功能导览'}
              </div>
            </div>
          </div>

          {/* 右侧工具操作区 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* 新标签页打开 */}
            <a
              href="/manual.html"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="manual-open-new-tab-btn"
              title={isEn ? 'Open in new tab' : '在新标签页打开'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#636366',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <ExternalLink className="w-3 h-3 text-text-tertiary" />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>
                {isEn ? 'New Tab' : '新窗口'}
              </span>
            </a>

            {/* 下载 PDF */}
            <a
              href="/manual.pdf"
              download="全科核心素养提分系统V2.0_操作使用说明书.pdf"
              data-testid="manual-download-pdf-btn"
              title={isEn ? 'Download 16-page PDF manual' : '下载 16 页排版说明书 PDF'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#636366',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Download className="w-3 h-3 text-text-tertiary" />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>
                {isEn ? 'PDF' : '下载 PDF'}
              </span>
            </a>

            {/* 关闭按钮 */}
            <button
              type="button"
              data-testid="manual-modal-close-btn"
              onClick={onClose}
              title={isEn ? 'Close (Esc)' : '关闭 (Esc)'}
              style={{
                width: isMobile ? '36px' : '30px',
                height: isMobile ? '36px' : '30px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1c1c1e',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容容器 (iframe) */}
        <div
          data-testid="user-manual-modal-body"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          <iframe
            src="/manual.html"
            title={isEn ? 'Operation User Manual' : '操作使用说明书'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;
