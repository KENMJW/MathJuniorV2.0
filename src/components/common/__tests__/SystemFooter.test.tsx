import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { SystemFooter, APP_VERSION } from '../SystemFooter';
import { useSessionStore } from '../../../store/sessionStore';

describe('SystemFooter Component', () => {
  it('正确渲染发布版本号与页面底部系统标识', () => {
    useSessionStore.setState({ locale: 'zh-CN' });
    const html = ReactDOMServer.renderToString(<SystemFooter />);

    expect(html).toContain('system-footer');
    expect(html).toContain('app-release-version');
    expect(html).toContain(APP_VERSION);
    expect(html).toContain('v2.0.3-beta');
    expect(html).toContain('全科核心素养提分系统');
    expect(html).toContain('发布版本');
  });

  it('支持英文模式下的文本切换', () => {
    const html = ReactDOMServer.renderToString(<SystemFooter locale="en" />);

    expect(html).toContain('Release');
    expect(html).toContain('Junior Math Workshop');
    expect(html).toContain(APP_VERSION);
  });
});
