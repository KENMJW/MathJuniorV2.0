import React, { useEffect, useState } from 'react';
import { APP_VERSION } from '../../config/version';

export type StageNumber = 1 | 2 | 3 | 4;

export interface SvgLayerRevealProps {
  activeStage: StageNumber;
  pointId?: string;
  className?: string;
  style?: React.CSSProperties;
  svgAssetPath?: string;
}

/**
 * 辅助函数：确保 SVG 元素拥有四阶段图层类名 (layer-stage-1 ~ layer-stage-4)
 * 若 SVG 已包含图层类名则直接返回；若无，则自动进行语义分类注入
 */
export function injectSvgStageLayers(svgRaw: string): string {
  if (!svgRaw) return svgRaw;
  // 防御性清洗：剔除可能存在的字面反斜杠转义 \"
  svgRaw = svgRaw.replace(/\\"/g, '"');
  if (svgRaw.includes('layer-stage-1') && svgRaw.includes('layer-stage-2')) {
    return svgRaw;
  }

  try {
    if (typeof DOMParser === 'undefined') {
      return svgRaw;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgRaw;

    const allRects = Array.from(svgEl.querySelectorAll('rect'));
    const allTexts = Array.from(svgEl.querySelectorAll('text'));

    // 标记固定背景与顶栏
    allRects.forEach((r) => {
      const w = r.getAttribute('width');
      const h = r.getAttribute('height');
      const y = parseFloat(r.getAttribute('y') || '0');
      if ((w === '400' && h === '300') || (y <= 20 && parseFloat(h || '0') <= 50)) {
        r.classList.add('layer-base-permanent');
      }
    });

    allTexts.forEach((t) => {
      const y = parseFloat(t.getAttribute('y') || '0');
      if (y <= 50) {
        t.classList.add('layer-base-permanent');
      }
    });

    // 收集所有内容几何元素
    const contentElements: Element[] = [];
    const walk = (node: Element) => {
      const tag = node.tagName.toLowerCase();
      if (tag === 'defs' || tag === 'marker') return;
      if (node.classList.contains('layer-base-permanent')) return;

      if (['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text'].includes(tag)) {
        contentElements.push(node);
      } else {
        Array.from(node.children).forEach(walk);
      }
    };
    Array.from(svgEl.children).forEach(walk);

    if (contentElements.length === 0) return svgRaw;

    let firstShapeDone = false;
    contentElements.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const fill = (el.getAttribute('fill') || '').toLowerCase();
      const stroke = (el.getAttribute('stroke') || '').toLowerCase();
      const dash = el.getAttribute('stroke-dasharray');
      const textContent = el.textContent || '';
      const isRedOrAmber =
        fill.includes('ff3b30') || stroke.includes('ff3b30') || fill.includes('red') || stroke.includes('red') ||
        dash || textContent.includes('P(') || textContent.includes('Vertex') || textContent.includes('!=') || textContent.includes('≠');

      if (!firstShapeDone && ['polygon', 'path', 'circle', 'line', 'rect'].includes(tag)) {
        el.classList.add('layer-stage-1');
        firstShapeDone = true;
        return;
      }

      if (isRedOrAmber) {
        el.classList.add('layer-stage-4');
      } else if (tag === 'text') {
        const y = parseFloat(el.getAttribute('y') || '0');
        if (y >= 240) {
          el.classList.add('layer-stage-4');
        } else {
          el.classList.add('layer-stage-3', 'formal-labels');
        }
      } else if (fill.includes('ff9500') || stroke.includes('ff9500') || fill.includes('34c759') || stroke.includes('34c759') || el.getAttribute('width') === '18') {
        el.classList.add('layer-stage-2');
      } else if (['rect', 'circle'].includes(tag) && !stroke.includes('0071e3')) {
        el.classList.add('layer-stage-2');
      } else {
        el.classList.add('layer-stage-1');
      }
    });

    return new XMLSerializer().serializeToString(svgEl);
  } catch {
    return svgRaw;
  }
}

const STAGE_THEMES: Record<StageNumber, { title: string; color: string; textColor: string; dotBg: string; dotShadow: string; desc: string }> = {
  1: { title: '① 原点溯源', color: '#0071e3', textColor: 'text-[#0071e3]', dotBg: 'bg-[#0071e3]', dotShadow: 'shadow-[0_0_6px_#0071e3]', desc: '原点模型基底' },
  2: { title: '② 本真透视', color: '#30b0c7', textColor: 'text-[#30b0c7]', dotBg: 'bg-[#30b0c7]', dotShadow: 'shadow-[0_0_6px_#30b0c7]', desc: '几何割补与结构透视' },
  3: { title: '③ 法典严定', color: '#af52de', textColor: 'text-[#af52de]', dotBg: 'bg-[#af52de]', dotShadow: 'shadow-[0_0_6px_#af52de]', desc: '精确定义与公式标签' },
  4: { title: '④ 本体辨正', color: '#ff9500', textColor: 'text-[#ff9500]', dotBg: 'bg-[#ff9500]', dotShadow: 'shadow-[0_0_6px_#ff9500]', desc: '临界题眼与极值反例' },
};

/**
 * 概念精讲 SVG 图层分步点亮组件 (路线 B)
 * 对应设计文档 §7.1 与 WebKit 避坑规范 (铁律 7 / Property 20)
 *
 * 规范红线：
 * 1. 严格禁止使用 <foreignObject>，文字符号一律矢量 <text> 或矢量路径
 * 2. 动效通过 CSS opacity / transition 呈现
 * 3. 第 2 段隐藏字母标签、第 3 段点亮 formal-labels (opacity 0 -> 1)
 */
export const SvgLayerReveal: React.FC<SvgLayerRevealProps> = ({
  activeStage,
  pointId = 'KP-023',
  className = '',
  style: _style = {},
  svgAssetPath,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!svgAssetPath) {
      setSvgContent(null);
      setError(false);
      return;
    }

    setSvgContent(null);
    setError(false);

    // 格式化路径，确保以 /assets 开头
    let path = svgAssetPath.trim();
    if (path.startsWith('public/')) {
      path = path.replace('public/', '/');
    }
    if (!path.startsWith('/') && !path.startsWith('http')) {
      path = '/' + path;
    }

    const separator = path.includes('?') ? '&' : '?';
    const finalUrl = `${path}${separator}v=${APP_VERSION}`;

    fetch(finalUrl, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const layered = injectSvgStageLayers(text);
        setSvgContent(layered);
        setError(false);
      })
      .catch((err) => {
        console.error('Failed to load SVG:', finalUrl, err);
        setError(true);
      });
  }, [svgAssetPath, pointId]);

  // 第 2 段时隐藏 .formal-labels（opacity: 0），其它阶段显示（opacity: 1）
  const hideFormalLabels = activeStage === 2;
  const currentTheme = STAGE_THEMES[activeStage];

  return (
    <div
      className={`concept-svg-container svg-layer-reveal stage-${activeStage} w-full max-w-[500px] aspect-square mx-auto bg-white/70 rounded-3xl border border-slate-200/80 shadow-xl p-6 box-border overflow-hidden relative ${className} ${hideFormalLabels ? 'hide-formal-labels' : ''}`}
    >
      <style>{`
        .concept-svg-container .layer-stage-1,
        .concept-svg-container .layer-stage-2,
        .concept-svg-container .layer-stage-3,
        .concept-svg-container .layer-stage-4,
        .concept-svg-container .formal-labels,
        .concept-svg-container [class*="layer-stage-1"],
        .concept-svg-container [class*="layer-stage-2"],
        .concept-svg-container [class*="layer-stage-3"],
        .concept-svg-container [class*="layer-stage-4"] {
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 1;
        }
        .concept-svg-container.stage-1 .layer-stage-2,
        .concept-svg-container.stage-1 .layer-stage-3,
        .concept-svg-container.stage-1 .layer-stage-4,
        .concept-svg-container.stage-1 .formal-labels,
        .concept-svg-container.stage-1 [class*="layer-stage-2"],
        .concept-svg-container.stage-1 [class*="layer-stage-3"],
        .concept-svg-container.stage-1 [class*="layer-stage-4"] {
          opacity: 0 !important;
          pointer-events: none;
        }
        .concept-svg-container.stage-2 .layer-stage-3,
        .concept-svg-container.stage-2 .layer-stage-4,
        .concept-svg-container.stage-2 .formal-labels,
        .concept-svg-container.stage-2 [class*="layer-stage-3"],
        .concept-svg-container.stage-2 [class*="layer-stage-4"],
        .concept-svg-container.hide-formal-labels .formal-labels {
          opacity: 0 !important;
          pointer-events: none;
        }
        .concept-svg-container.stage-3 .layer-stage-4,
        .concept-svg-container.stage-3 [class*="layer-stage-4"] {
          opacity: 0 !important;
          pointer-events: none;
        }
        .concept-svg-container.stage-4 .layer-stage-4,
        .concept-svg-container.stage-4 [class*="layer-stage-4"] {
          opacity: 1 !important;
          pointer-events: none;
        }
        .concept-svg-container svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
      `}</style>

      {/* 动态四图层微光状态指示胶囊 */}
      <div
        data-testid="svg-stage-indicator"
        className={`absolute top-3 right-4 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 shadow-sm border border-slate-200/60 text-[11px] font-semibold pointer-events-none select-none transition-all duration-250 ${currentTheme.textColor}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${currentTheme.dotBg} ${currentTheme.dotShadow}`}
        />
        <span>{currentTheme.title} · 图层 1~{activeStage}</span>
        <div className="inline-flex gap-0.5 ml-0.5">
          {([1, 2, 3, 4] as StageNumber[]).map((s) => (
            <span
              key={s}
              className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                s <= activeStage ? currentTheme.dotBg : 'bg-black/15'
              }`}
            />
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
          [ 图解缺失: {pointId} ]
        </div>
      ) : svgContent ? (
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
          加载图解中...
        </div>
      )}
    </div>
  );
};

export default SvgLayerReveal;
