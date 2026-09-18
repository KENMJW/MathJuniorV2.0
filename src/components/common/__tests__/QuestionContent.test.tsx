import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { QuestionContent, parseImagePaths } from '../QuestionContent';
import { QuestionImage, resolveQuestionImageSrc } from '../QuestionImage';

describe('QuestionImage 单元与规范测试', () => {
  it('路径标准化：相对路径自动补全 / 前缀，绝对路径与网络路径保持不变', () => {
    expect(resolveQuestionImageSrc('assets/questions/Q-2026-SD-0006_fig1.webp')).toBe(
      '/assets/questions/Q-2026-SD-0006_fig1.webp'
    );
    expect(resolveQuestionImageSrc('/assets/questions/fig.webp')).toBe('/assets/questions/fig.webp');
    expect(resolveQuestionImageSrc('https://example.com/fig.webp')).toBe(
      'https://example.com/fig.webp'
    );
    expect(resolveQuestionImageSrc('')).toBe('');
  });

  it('初始服务端渲染包含骨架屏与图片结构 (防 CLS 跳动)', () => {
    const html = renderToString(<QuestionImage src="assets/questions/test.webp" role="stem" />);
    expect(html).toContain('data-testid="question-image-skeleton"');
    expect(html).toContain('加载中...');
    expect(html).toContain('src="/assets/questions/test.webp"');
  });

  it('支持 option 角色与 solution 角色渲染规范', () => {
    const optionHtml = renderToString(<QuestionImage src="assets/questions/opt.webp" role="option" alt="选项 A" />);
    expect(optionHtml).toContain('src="/assets/questions/opt.webp"');
    expect(optionHtml).toContain('alt="选项 A"');

    const solHtml = renderToString(<QuestionImage src="assets/questions/sol.webp" role="solution" alt="解析图" />);
    expect(solHtml).toContain('src="/assets/questions/sol.webp"');
    expect(solHtml).toContain('alt="解析图"');
  });
});

describe('QuestionContent 混合渲染器测试', () => {
  it('parseImagePaths 解析：支持数组、JSON 字符串与容错降级', () => {
    expect(parseImagePaths(['assets/questions/a.webp', 'assets/questions/b.webp'])).toEqual([
      'assets/questions/a.webp',
      'assets/questions/b.webp',
    ]);
    expect(
      parseImagePaths('["assets/questions/c.webp", "assets/questions/d.webp"]')
    ).toEqual(['assets/questions/c.webp', 'assets/questions/d.webp']);
    expect(parseImagePaths(null)).toEqual([]);
    expect(parseImagePaths('invalid json')).toEqual(['invalid json']);
  });

  it('纯文本与公式不含锚点时，直接渲染纯净内容', () => {
    const html = renderToString(<QuestionContent content="计算：$x^2 - 4 = 0$ 的根。" />);
    expect(html).toContain('计算：');
    expect(html).toContain('question-content-plain');
    expect(html).not.toContain('<img');
  });

  it('根据 [[IMG:n]] 正确切分文本与插槽，图片就地插在原位', () => {
    const stem = '如图，[[IMG:0]]直线 $a \\parallel b$，求 $\\angle 1$ 的度数。';
    const images = ['assets/questions/Q-2026-SD-0006_fig1.webp'];

    const html = renderToString(<QuestionContent content={stem} images={images} />);

    // 验证包含文本段
    expect(html).toContain('如图，');
    expect(html).toContain('直线');
    expect(html).toContain('求');

    // 验证图片元素被正确渲染且路径解析正确
    expect(html).toContain('src="/assets/questions/Q-2026-SD-0006_fig1.webp"');
  });

  it('多图锚点：按先后顺序就地渲染多个图片', () => {
    const stem = '图1 [[IMG:0]] 为初始状态，经过旋转得到图2 [[IMG:1]]，求面积。';
    const images = [
      'assets/questions/step1.webp',
      'assets/questions/step2.webp',
    ];

    const html = renderToString(<QuestionContent content={stem} images={images} />);

    expect(html).toContain('src="/assets/questions/step1.webp"');
    expect(html).toContain('src="/assets/questions/step2.webp"');
  });

  it('真实真题 Q-2026-SD-0006：题干图在"如图，"之后精确锚点插入', () => {
    const realStem = '如图，[[IMG:0]]直线 $a \\parallel b$，直线 $c$ 分别交 $a, b$ 于点 $A, B$．以点 $A$ 为圆心...';
    const realImages = '["assets/questions/Q-2026-SD-0006_fig1.webp"]';

    const html = renderToString(<QuestionContent content={realStem} images={realImages} />);
    expect(html).toContain('如图，');
    expect(html).toContain('src="/assets/questions/Q-2026-SD-0006_fig1.webp"');
    expect(html).toContain('直线');
  });

  it('真实真题 Q-2026-51619-0002：四个选项均为纯图片选项，解析与渲染完全符合规范', () => {
    const realOptionsJson = JSON.stringify({
      A: { zh: '', en: '', img: 'assets/questions/Q-2026-51619-0002_optA.webp' },
      B: { zh: '', en: '', img: 'assets/questions/Q-2026-51619-0002_optB.webp' },
      C: { zh: '', en: '', img: 'assets/questions/Q-2026-51619-0002_optC.webp' },
      D: { zh: '', en: '', img: 'assets/questions/Q-2026-51619-0002_optD.webp' },
    });

    const parsed = JSON.parse(realOptionsJson);
    const keys = ['A', 'B', 'C', 'D'];
    for (const k of keys) {
      const opt = parsed[k];
      expect(opt.img).toBeDefined();
      const html = renderToString(<QuestionImage role="option" src={opt.img} alt={`选项 ${k}`} />);
      expect(html).toContain(`src="/assets/questions/Q-2026-51619-0002_opt${k}.webp"`);
      expect(html).toContain(`alt="选项 ${k}"`);
    }
  });

  it('真实真题 Q-2026-51619-0005：解析图通过 QuestionContent 顺利渲染', () => {
    const realSolutionText = '本题考查了正方形的性质...作辅助线如图 [[IMG:1]]，由勾股定理可得...';
    const realImages = ['assets/questions/Q-2026-51619-0005_stem0.webp', 'assets/questions/Q-2026-51619-0005_sol1.webp'];

    const html = renderToString(
      <QuestionContent content={realSolutionText} images={realImages} role="solution" />
    );
    expect(html).toContain('本题考查了正方形的性质');
    expect(html).toContain('src="/assets/questions/Q-2026-51619-0005_sol1.webp"');
  });
});
