import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { UserManualModal } from '../UserManualModal';

describe('UserManualModal Component', () => {
  it('当 isOpen 为 false 时不渲染任何 DOM 内容', () => {
    const html = ReactDOMServer.renderToString(
      <UserManualModal isOpen={false} onClose={() => {}} />
    );
    expect(html).toBe('');
  });

  it('当 isOpen 为 true 时完整渲染模态窗顶栏、快捷出口与嵌入 iframe', () => {
    const html = ReactDOMServer.renderToString(
      <UserManualModal isOpen={true} onClose={() => {}} locale="zh-CN" />
    );

    // 遮罩层与容器
    expect(html).toContain('data-testid="user-manual-modal-overlay"');
    expect(html).toContain('data-testid="user-manual-modal-container"');
    expect(html).toContain('data-testid="user-manual-modal-header"');
    expect(html).toContain('data-testid="user-manual-modal-body"');

    // 标题文本
    expect(html).toContain('操作使用说明书');

    // 工具按键
    expect(html).toContain('data-testid="manual-open-new-tab-btn"');
    expect(html).toContain('href="/manual.html"');
    expect(html).toContain('target="_blank"');

    expect(html).toContain('data-testid="manual-download-pdf-btn"');
    expect(html).toContain('href="/manual.pdf"');

    // 内容区 iframe
    expect(html).toContain('src="/manual.html"');
    expect(html).toContain('title="操作使用说明书"');

    // 关闭按钮
    expect(html).toContain('data-testid="manual-modal-close-btn"');
  });

  it('支持英文模式下的标题与工具按键文案切换', () => {
    const html = ReactDOMServer.renderToString(
      <UserManualModal isOpen={true} onClose={() => {}} locale="en" />
    );

    expect(html).toContain('Operation User Manual');
    expect(html).toContain('title="Operation User Manual"');
    expect(html).toContain('New Tab');
  });
});
