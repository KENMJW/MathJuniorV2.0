import { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '../../components/common/Icon';

interface Props {
  children: ReactNode;
  onBackToWorkbench?: () => void;
  locale?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ScorePanelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || '未知渲染异常',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ScorePanelErrorBoundary] Caught render crash:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      const isEn = String(this.props.locale).toLowerCase().startsWith('en');

      return (
        <div
          data-testid="score-panel-error-fallback"
          style={{
            maxWidth: '600px',
            margin: '4rem auto',
            padding: '2rem',
            borderRadius: 'var(--radius-lg, 16px)',
            backgroundColor: 'var(--glass-bg-card, rgba(255, 255, 255, 0.8))',
            border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            fontFamily: 'var(--font-family-system, -apple-system, sans-serif)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 149, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ios-amber, #ff9500)',
            }}
          >
            <Icon name="alert" size={28} />
          </div>

          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isEn ? 'Exam Review Temporarily Unavailable' : '成绩复盘大屏遇到波动'}
          </h2>

          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {isEn
              ? 'Your answers and exam submissions are safely preserved. Click below to retry rendering or return to Workbench.'
              : '您的本场作答数据与踩分记录已完好保存在会话中，未丢失任何成绩。您可以尝试重新加载或返回实战测评大厅。'}
          </p>

          {this.state.errorMessage && (
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'var(--text-tertiary)',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                maxWidth: '100%',
                overflowX: 'auto',
              }}
            >
              {this.state.errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              data-testid="error-retry-btn"
              onClick={this.handleRetry}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md, 12px)',
                backgroundColor: 'var(--ios-blue, #007aff)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {isEn ? 'Retry Loading' : '重新加载复盘'}
            </button>
            {this.props.onBackToWorkbench && (
              <button
                type="button"
                data-testid="error-back-btn"
                onClick={this.props.onBackToWorkbench}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius-md, 12px)',
                  backgroundColor: 'var(--glass-bg, rgba(0, 0, 0, 0.04))',
                  border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {isEn ? 'Back to Exam Center' : '返回实战测评'}
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
