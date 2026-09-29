import React, { useState } from 'react';
import { BookOpen, ExternalLink, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

interface HelpManualSectionProps {
  className?: string;
  locale?: string;
}

export const HelpManualSection: React.FC<HelpManualSectionProps> = ({ className = '', locale: propLocale }) => {
  const storeLocale = useSessionStore((s) => s.locale);
  const locale = propLocale ?? storeLocale;
  const isEn = String(locale).toLowerCase().startsWith('en');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <section
      id="help-manual-section"
      data-testid="help-manual-section"
      className={`w-full mt-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* 头部控制条 */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 bg-slate-50/80 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 m-0 leading-tight">
                {isEn ? 'Operation Manual & Guide' : '操作使用说明书 · 官方操作指南'}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-700 border border-blue-200/50">
                {isEn ? '6 Chapters' : '共 6 章'}
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5 leading-tight">
              {isEn
                ? 'System overview, 4 modules walkthrough, exam prep, and multi-device tips'
                : '包含系统全景、四大模块实操、中考母题与沙盒演练、多端适配速查'}
            </p>
          </div>
        </div>

        {/* 快捷动作按钮组 */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a
            href="/manual.html"
            target="_blank"
            rel="noopener noreferrer"
            title={isEn ? 'Open manual in new tab' : '在新标签页中全屏查阅说明书'}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isEn ? 'New Tab' : '独立全屏打开'}</span>
          </a>

          <a
            href="/manual.pdf"
            download="全科核心素养提分系统V2.0_操作使用说明书.pdf"
            title={isEn ? 'Download 16-page printable PDF' : '下载 16 页高清双面排版打印 PDF'}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isEn ? 'Download PDF' : '下载 PDF 说明书'}</span>
          </a>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-200/60 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{isEn ? 'Collapse' : '收起'}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{isEn ? 'Expand' : '展开阅读'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 嵌入的 HTML 说明书主视窗 */}
      {isExpanded && (
        <div className="w-full bg-white flex flex-col">
          <iframe
            src="/manual.html"
            title={isEn ? 'Operation Manual' : '全科核心素养提分系统V2.0 操作使用说明书'}
            className="w-full h-[680px] sm:h-[820px] border-0 bg-white"
          />

          {/* 底部章节快速导航条 */}
          <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-200/70 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{isEn ? 'Chapters Directory:' : '章节目录速查：'}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                {isEn ? 'Ch1 Overview' : '第1章 系统全景与进入'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                {isEn ? 'Ch2 Concept Nav' : '第2章 探本溯源·概念精讲'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                {isEn ? 'Ch3 Knowledge Graph' : '第3章 经纬纵横·思维图谱'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                {isEn ? 'Ch4 Dynamic Lab' : '第4章 见微知著·实验探究'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                {isEn ? 'Ch5 Exam Center' : '第5章 百炼成钢·实战测评'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                {isEn ? 'Ch6 Multi-Device' : '第6章 多端操作速查'}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HelpManualSection;
