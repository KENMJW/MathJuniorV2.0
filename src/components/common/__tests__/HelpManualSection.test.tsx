import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { HelpManualSection } from '../HelpManualSection';
import { useSessionStore } from '../../../store/sessionStore';

describe('HelpManualSection Component', () => {
  it('正确渲染说明书卡片、嵌入式 iframe 与操作按钮', () => {
    useSessionStore.setState({ locale: 'zh-CN' });
    const html = ReactDOMServer.renderToString(<HelpManualSection />);

    expect(html).toContain('help-manual-section');
    expect(html).toContain('操作使用说明书 · 官方操作指南');
    expect(html).toContain('共 6 章');
    expect(html).toContain('manual.html');
    expect(html).toContain('manual.pdf');
    expect(html).toContain('独立全屏打开');
    expect(html).toContain('下载 PDF 说明书');
    expect(html).toContain('章节目录速查');
    expect(html).toContain('第1章 系统全景与进入');
    expect(html).toContain('第2章 探本溯源·概念精讲');
    expect(html).toContain('第3章 经纬纵横·思维图谱');
    expect(html).toContain('第4章 见微知著·实验探究');
    expect(html).toContain('第5章 百炼成钢·实战测评');
    expect(html).toContain('第6章 多端操作速查');
  });

  it('支持英文模式切换', () => {
    const html = ReactDOMServer.renderToString(<HelpManualSection locale="en" />);

    expect(html).toContain('Operation Manual &amp; Guide');
    expect(html).toContain('6 Chapters');
    expect(html).toContain('New Tab');
    expect(html).toContain('Download PDF');
    expect(html).toContain('Chapters Directory');
  });
});
