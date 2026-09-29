import os
import sys
import base64
import subprocess

def get_base64_img(rel_path):
    full_path = os.path.join(os.path.dirname(__file__), '..', rel_path)
    if not os.path.exists(full_path):
        print(f"[Warning] Image not found: {full_path}")
        return ""
    with open(full_path, 'rb') as f:
        data = f.read()
    ext = os.path.splitext(full_path)[1].lower().replace('.', '')
    mime = 'image/png' if ext == 'png' else 'image/jpeg'
    return f"data:{mime};base64,{base64.b64encode(data).decode('utf-8')}"

def build_manual():
    print("[1/3] Encoding real UI screenshots to Base64...")
    imgs = {
        "pc_pillars": get_base64_img("public/screenshots/fe0021_e2e_pc_1440x900_three_pillars.png"),
        "pc_concept_drawer": get_base64_img("public/screenshots/fe0021_e2e_pad_820x1180_drawer_open.png"),
        "pc_concept_master": get_base64_img("public/screenshots/fe0021_e2e_pc_1440x900_master_accordion.png"),
        "pc_concept_practice": get_base64_img("public/screenshots/fe0021_e2e_pc_1440x900_quick_practice_feedback.png"),
        "kp057_zhaoshuang": get_base64_img("public/screenshots/verify_kp057_zhaoshuang_step2.png"),
        "kp057_hud": get_base64_img("public/screenshots/verify_kp057_hud_step3.png"),
        "pc_graph_drawer": get_base64_img("public/screenshots/fe0015_02_line_selector_drawer.png"),
        "pc_graph_swimlane": get_base64_img("public/screenshots/fe0015_03_line_g4_concept.png"),
        "pc_graph_practice": get_base64_img("public/screenshots/fe0015_06_quick_practice_eval.png"),
        "pc_leap_free": get_base64_img("public/screenshots/fe0022_e2e_pc_1440x900_leaplab_free.png"),
        "phone_leap_deduction": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_leaplab_deduction.png"),
        "phone_leap_xray": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_leaplab_step2_xray.png"),
        "lm9a19_stage1": get_base64_img("public/screenshots/verify_lm9a19_stage1.png"),
        "lm9a19_stage2": get_base64_img("public/screenshots/verify_lm9a19_stage2.png"),
        "exam_workbench": get_base64_img("public/screenshots/fe0022_e2e_pc_1440x900_exam_workbench.png"),
        "online_exam": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_online_exam.png"),
        "score_panel": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_score_panel.png"),
        "pad_stage1": get_base64_img("public/screenshots/fe0021_e2e_pad_820x1180_stage1.png"),
        "phone_concept_drawer": get_base64_img("public/screenshots/fe0023_e2e_phone_390x844_concept_drawer.png"),
    }

    print("[2/3] Assembling high-fidelity HTML document with CSS print styles...")
    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>全科核心素养提分系统V2.0 操作使用说明书</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 14mm 15mm 16mm 15mm;
      @bottom-right {{
        content: counter(page);
        font-size: 9pt;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }}
      @bottom-left {{
        content: "全科核心素养提分系统V2.0 · 官方操作使用指南 (学生·家长·三端适配版)";
        font-size: 8.5pt;
        color: #94a3b8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
      color: #0f172a;
      line-height: 1.55;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }}

    /* 封面设计 */
    .cover-page {{
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 258mm;
      padding: 18mm 10mm 15mm 10mm;
      text-align: center;
      background: radial-gradient(circle at top right, #f0f9ff 0%, #ffffff 60%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }}

    .cover-badge {{
      display: inline-block;
      align-self: center;
      padding: 6px 16px;
      font-size: 10pt;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      border-radius: 9999px;
      letter-spacing: 1px;
    }}

    .cover-title {{
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin: 18px 0 10px 0;
      letter-spacing: -0.5px;
    }}

    .cover-subtitle {{
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      margin-bottom: 20px;
      line-height: 1.4;
    }}

    .cover-tag-row {{
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }}

    .cover-tag {{
      font-size: 9pt;
      padding: 4px 12px;
      border-radius: 6px;
      font-weight: 600;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
    }}

    .cover-hero-img {{
      width: 100%;
      max-height: 105mm;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #cbd5e1;
      margin: 0 auto;
    }}

    .cover-meta {{
      font-size: 9pt;
      color: #64748b;
      line-height: 1.6;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
    }}

    /* 章节与标题控制 */
    .part-banner {{
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin: 20px 0 12px 0;
      page-break-after: avoid;
    }}

    h1 {{
      font-size: 15pt;
      font-weight: 800;
      color: #0369a1;
      border-left: 5px solid #0284c7;
      padding-left: 10px;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
      letter-spacing: -0.2px;
    }}

    .chapter-break {{
      page-break-before: always;
    }}

    h2 {{
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 14px 0 6px 0;
      page-break-after: avoid;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    h3 {{
      font-size: 10pt;
      font-weight: 600;
      color: #334155;
      margin: 10px 0 4px 0;
      page-break-after: avoid;
    }}

    p {{
      margin: 0 0 7px 0;
      color: #334155;
      text-align: justify;
    }}

    ul, ol {{
      margin: 0 0 8px 0;
      padding-left: 20px;
      color: #334155;
    }}

    li {{
      margin-bottom: 4px;
    }}

    /* 提示卡片 */
    .callout {{
      border-radius: 8px;
      padding: 9px 12px;
      margin: 8px 0;
      font-size: 9pt;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }}

    .callout-parent {{
      background: #fefce8;
      border-left: 4px solid #eab308;
      color: #713f12;
    }}

    .callout-student {{
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      color: #14532d;
    }}

    .callout-device {{
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e3a8a;
    }}

    .callout-warning {{
      background: #fff1f2;
      border-left: 4px solid #f43f5e;
      color: #9f1239;
    }}

    .callout-title {{
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }}

    /* 模块用途导言卡片 */
    .module-purpose-card {{
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-left: 4px solid #0d9488;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 8px 0 12px 0;
      font-size: 9pt;
      color: #115e59;
      break-inside: avoid;
    }}

    /* 示例卡片 */
    .example-box {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin: 10px 0;
      break-inside: avoid;
    }}

    .example-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }}

    .example-title {{
      font-size: 9.5pt;
      font-weight: 700;
      color: #0284c7;
    }}

    .example-step {{
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin-bottom: 5px;
      font-size: 9pt;
    }}

    .step-pill {{
      background: #0284c7;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 9999px;
      flex-shrink: 0;
      margin-top: 1px;
    }}

    /* 截图排版容器 */
    .screenshot-figure {{
      margin: 8px 0;
      text-align: center;
      break-inside: avoid;
    }}

    .screenshot-img {{
      width: 100%;
      border-radius: 7px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      display: block;
      margin: 0 auto;
    }}

    .screenshot-caption {{
      font-size: 8pt;
      color: #64748b;
      margin-top: 4px;
      font-weight: 500;
    }}

    .grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 8px 0;
      break-inside: avoid;
    }}

    .grid-3 {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin: 8px 0;
      break-inside: avoid;
    }}

    /* 表格 */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 8.5pt;
      break-inside: avoid;
    }}

    th, td {{
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }}

    th {{
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }}

    tr:nth-child(even) {{
      background: #f8fafc;
    }}

    .hud-badge {{
      display: inline-block;
      padding: 1px 5px;
      background: #020617;
      color: #38bdf8;
      font-family: monospace;
      border-radius: 4px;
      font-size: 8pt;
      border: 1px solid #1e293b;
    }}

    .hud-success {{
      color: #34d399;
      font-weight: bold;
    }}
  </style>
</head>
<body>

  <!-- ==================== 封面 ==================== -->
  <div class="cover-page">
    <div>
      <span class="cover-badge">MathJunior V2.0 官方指南</span>
      <h1 class="cover-title">全科核心素养提分系统 V2.0</h1>
      <div class="cover-subtitle">操作使用说明书 · 学生实战与家长辅导手册</div>
      
      <div class="cover-tag-row">
        <span class="cover-tag">电脑端 (PC / Mac)</span>
        <span class="cover-tag">平板端 (iPad / 平板)</span>
        <span class="cover-tag">手机端 (仅支持竖屏)</span>
      </div>
    </div>

    <div>
      <img src="{imgs['pc_pillars']}" class="cover-hero-img" alt="全科核心素养提分系统V2.0界面全景" />
    </div>

    <div class="cover-meta">
      <div><strong>适用年级</strong>：初一至初三全学段（7上 · 7下 · 8上 · 8下 · 9上 · 9下）</div>
      <div><strong>核心能力</strong>：107 个考点四段论精讲 · 12 知识谱系生长树 · 46 概念具象动力沙盒 · 37 中考 4D 压轴变异模型 · 智能组卷与测评</div>
      <div style="margin-top: 5px; font-size: 8pt; color: #94a3b8;">版本号：v2.0.4-LTS · 标准 Slate 950 暗色几何交互 · 零持久化隐私保护</div>
    </div>
  </div>

  <!-- ==================== 第一篇：认识系统 ==================== -->
  <div class="chapter-break">
    <div class="part-banner">第一篇 · 认识系统</div>
    <h1>第 1 章 · 系统全景与进入方式</h1>
    
    <h2>1.1 系统是什么</h2>
    <p>传统的初中理科刷题常陷入“公式背得熟，题目一变就不会”的死胡同。<strong>全科核心素养提分系统 V2.0</strong> 专为打破死记硬背而设计，将抽象的初中数学知识转化为<strong>“看得见、摸得着、能变异、可验证”</strong>的动态数字化模型，涵盖了概念精讲、知识图谱、动态实验探究与智能全真测评四大维度。</p>

    <h2>1.2 电脑端进入</h2>
    <p>打开电脑上的现代浏览器（推荐 Google Chrome、Microsoft Edge 或 Safari 最新版），输入系统网址访问进入「全科核心素养提分系统」门户导航页，点击 <strong>“初中数学”</strong> 卡片，即可秒级进入数学学科主界面。</p>

    <h2>1.3 iPad / 平板进入</h2>
    <p>使用 iPad 或安卓平板上的浏览器访问同一系统网址，系统会自动识别平板设备，采用触控友好的液态玻璃排版，推荐横屏放置在支架上使用，获得最佳视野与指尖操作手感。</p>

    <h2>1.4 手机端进入（仅支持竖屏）</h2>
    <p>使用智能手机浏览器访问系统网址，系统自动匹配移动端竖屏布局，采用底部交互抽屉与吸底测度条。</p>

    <div class="callout callout-warning">
      <div class="callout-title">重要注意：手机端请严格保持竖屏使用</div>
      <div>本系统专门针对手机端进行了<strong>竖屏自适应优化</strong>（底部抽屉展开、触控吸底控制条），<strong>未针对手机横屏做专门适配</strong>。请务必保持手机竖屏握持使用，以防界面元素被压缩或遮挡。</div>
    </div>

    <h2>1.5 顶栏工具条使用说明</h2>
    <p>进入初中数学系统后，屏幕顶部常驻全局顶栏控制条，其结构自左向右依次为：</p>
    <ul>
      <li><strong><code>[← 返回全科门户]</code></strong>：点击随时返回全科总目录；</li>
      <li><strong>品牌标识</strong>：<code>全科核心素养提分系统 - 初中数学</code>；</li>
      <li><strong>四大模块导航分段切换栏</strong>：<code>探本溯源 · 概念精讲</code> / <code>经纬纵横 · 思维图谱</code> / <code>见微知著 · 实验探究</code> / <code>百炼成钢 · 实战测评</code>；</li>
      <li><strong>公告铃铛</strong>：查看系统升级与考点模型更新通知；</li>
      <li><strong>语言切换</strong>：<code>[简体中文 / English]</code>，一键实现所有考点名称、名师题眼、沙盒滑块、几何定理的中英对照。</li>
    </ul>

    <div class="callout callout-device">
      <div class="callout-title">操作要点：年级与学期在哪里选择？</div>
      <div>系统顶栏<strong>没有</strong>全局年级/学期下拉框。学生与家长若需选择特定年级或学期的考点，均在各个模块内部的<strong>专属抽屉选择器</strong>中直观进行点选，避免全局切换导致的页面重载。</div>
    </div>

    <h2>1.6 四大模块总览</h2>
    <div class="screenshot-figure">
      <img src="{imgs['pc_pillars']}" class="screenshot-img" alt="顶栏控制台与四大模块全景" />
      <div class="screenshot-caption">图 1-1：电脑端顶栏控制台与四大模块全景（展示顶栏导航、抽屉选择器与学习主舞台）</div>
    </div>
  </div>

  <!-- ==================== 第二篇：四大模块实操 ==================== -->
  <!-- 第 2 章：探本溯源 · 概念精讲 -->
  <div class="chapter-break">
    <div class="part-banner">第二篇 · 四大模块实操（按顶栏导航从左到右）</div>
    <h1>第 2 章 · 探本溯源 · 概念精讲（模块一）</h1>

    <div class="module-purpose-card">
      <strong>【模块用途说明】</strong>：模块一专为<strong>“透彻搞懂每一个基础考点”</strong>而设计。针对初中阶段全部 107 个核心中考考点，帮助学生从数学原理的本源故事出发，经历“直觉本质 → 形式定义 → 内在变异”四个认知阶段，配合动态几何沙盒、经典母题剖析和即时练习，让学生真正理解每一个概念的来龙去脉。
    </div>

    <h2>2.1 考点抽屉选择器</h2>
    <p>点击顶栏左下方的蓝色胶囊按钮（如 <code>[ 勾股定理 · 8年级 下学期 ▾ ]</code>），展开 4 级抽屉：</p>
    <ul>
      <li><strong>① 年级</strong>：7年级 / 8年级 / 9年级；</li>
      <li><strong>② 学期</strong>：全部 / 上学期 / 下学期；</li>
      <li><strong>③ 领域板块</strong>：数与代数 / 图形与几何 / 函数与分析 / 统计与概率；</li>
      <li><strong>④ 具体考点</strong>：从 107 个考点库中点选目标。支持顶部实时中英拼音搜索框。</li>
    </ul>

    <h2>2.2 四段论精讲</h2>
    <p>点击右侧分段胶囊的 <strong><code>四段论精讲</code></strong> Tab，卡片呈现四个认知递进阶梯：</p>
    <ul>
      <li><strong>① 原初故事</strong>：古代数学家在什么生活难题中发现了该定理？</li>
      <li><strong>② 直觉本质</strong>：用通俗大白话讲透几何与代数原理；</li>
      <li><strong>③ 形式定义</strong>：教科书标准法典表达与证明；</li>
      <li><strong>④ 内在变异</strong>：中考命题人常考的反例陷阱与易错边界。上方 SVG 模型同步分步点亮演化。</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['pc_concept_drawer']}" class="screenshot-img" alt="考点抽屉选择器" />
        <div class="screenshot-caption">图 2-1：考点抽屉选择器（年级/学期/单元四级下钻与搜索）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['pc_concept_master']}" class="screenshot-img" alt="考点母题四维剖析" />
        <div class="screenshot-caption">图 2-2：考点母题精讲（题干、审题突破口与规范解答）</div>
      </div>
    </div>

    <h2>2.3 链接沙盒：动点拖拽、探究三步曲与实时 HUD</h2>
    <p>点击分段胶囊的 <strong><code>链接沙盒</code></strong> Tab，进入暗色深底交互视口：</p>
    <ul>
      <li><strong>动点拖拽</strong>：黄色/橙色/天蓝圆点均为动点，手指或鼠标按住即可拉动；</li>
      <li><strong>探究三步曲</strong>：右侧仪表盘列出步骤 1/2/3 任务引导，按指引调节参数；</li>
      <li><strong>实时 HUD 守恒验证</strong>：满足定理守恒时打上绿色对勾 <span class="hud-badge"><span class="hud-success">恒等守恒成立 ✓</span></span>，达成探究目标。</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['kp057_zhaoshuang']}" class="screenshot-img" alt="勾股定理赵爽弦图" />
        <div class="screenshot-caption">图 2-3：勾股定理赵爽弦图动态面积割补探究</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['kp057_hud']}" class="screenshot-img" alt="勾股定理实时HUD" />
        <div class="screenshot-caption">图 2-4：实时 HUD 恒等式验证 a²+b²≡c²</div>
      </div>
    </div>

    <h2>2.4 考点母题：中考母题四维深度剖析</h2>
    <p>点击分段胶囊的 <strong><code>考点母题</code></strong> Tab，展示与当前考点直接绑定的经典中考真题，包含：<strong>题干（KaTeX 渲染）</strong>、<strong>审题突破口分析</strong>、<strong>规范解答推导步骤</strong>、<strong>名师避坑点拨</strong>。</p>

    <h2>2.5 单点快练：即时反馈与解析展开</h2>
    <p>点击分段胶囊的 <strong><code>单点快练</code></strong> Tab，系统抽取 3 道单选题，点击选项即刻获得绿/红正误反馈并展开详细解析。</p>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">实操范例：攻坚“勾股定理 (KP-057)”</span>
        <span style="font-size: 8.5pt; color: #64748b;">八年级下学期核心考点</span>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 1</span>
        <div>在考点抽屉中搜索 <code>KP-057</code>，点击“勾股定理”；在 <strong><code>四段论精讲</code></strong> 读完商高答周公故事。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 2</span>
        <div>切换至 <strong><code>链接沙盒</code></strong>，拖动直角边滑块 $a=3, b=4$；切换 <code>view_mode = 2</code> 展开赵爽弦图。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 3</span>
        <div>实时 HUD 瞬间验证 $a^2+b^2 = 9+16 = 25 \equiv c^2 = 25$，弹窗提示“发现成功！”；切换至 <strong><code>考点母题</code></strong> 学习规范答题，再在 <strong><code>单点快练</code></strong> 完成 3 题自测。</div>
      </div>
    </div>
  </div>

  <!-- 第 3 章：经纬纵横 · 思维图谱 -->
  <div class="chapter-break">
    <h1>第 3 章 · 经纬纵横 · 思维图谱（模块二）</h1>

    <div class="module-purpose-card">
      <strong>【模块用途说明】</strong>：模块二专为<strong>“建立跨学期的完整知识体系”</strong>而设计。初中数学 107 个考点按 <strong>12 条核心知识谱系</strong>（4 条代数、4 条几何、2 条函数、2 条统计）重新编织，呈现从七年级到九年级共 6 个学期的知识演进脉络，帮助学生梳理知识前驱与后继，彻底解决“学了后面忘了前面”的痛点。
    </div>

    <h2>3.1 谱系选择抽屉（12 条知识主线）</h2>
    <p>点击顶栏左侧的谱系胶囊按钮（如 <code>[ G4 · 圆的度量与位置关系 ▾ ]</code>），展开 12 谱系选择面板：</p>
    <ul>
      <li><strong>代数脉络 (A1~A4)</strong>：实数与数轴、整式分式与方程、一次不等式与不等式组、因式分解；</li>
      <li><strong>几何脉络 (G1~G4)</strong>：相交线平行线与角、三角形与全等、四边形与特殊平行四边形、圆的度量与位置关系；</li>
      <li><strong>函数脉络 (F1~F2)</strong>：一次函数与反比例函数、二次函数与最值综合；</li>
      <li><strong>统计与概率 (S1~S2)</strong>：数据的收集与离散分析、概率计算与随机事件。</li>
    </ul>

    <h2>3.2 概念精讲：竖向六学期知识泳道图</h2>
    <p>选择谱系后默认激活 <strong><code>概念精讲</code></strong> Tab，界面中央呈现竖向单谱系泳道（LineSwimlane），纵向划分为 6 段（7上 $\to$ 7下 $\to$ 8上 $\to$ 8下 $\to$ 9上 $\to$ 9下），清晰标注该谱系在各学期涵盖的知识点。</p>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['pc_graph_drawer']}" class="screenshot-img" alt="12 谱系选择抽屉" />
        <div class="screenshot-caption">图 3-1：12 谱系选择抽屉（按代数、几何、函数、统计分组）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['pc_graph_swimlane']}" class="screenshot-img" alt="竖向六学期泳道图" />
        <div class="screenshot-caption">图 3-2：概念精讲 · 竖向六学期知识泳道图（G4 圆的脉络树）</div>
      </div>
    </div>

    <h2>3.3 链接沙盒：谱系旗舰模型探究</h2>
    <p>点击分段胶囊的 <strong><code>链接沙盒</code></strong> Tab，系统自动载入与当前谱系强绑定的旗舰跃迁沙盒，进行动态几何探索。</p>

    <h2>3.4 谱系母题：跨学期压轴母题剖析</h2>
    <p>点击 <strong><code>谱系母题</code></strong> Tab，呈现该谱系跨学期综合中考压轴母题的四维深度解析。</p>

    <h2>3.5 专项测评：谱系全域能力过关</h2>
    <p>点击 <strong><code>专项测评</code></strong> Tab，跨学期抽调多道辨析题检验整条知识脉络的掌握深度。</p>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">实操范例：查漏补缺“G4 圆的度量与位置关系”脉络</span>
        <span style="font-size: 8.5pt; color: #64748b;">几何压轴大脉络</span>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 1</span>
        <div>点击 <strong>“经纬纵横 · 思维图谱”</strong>，在谱系抽屉中点选 <strong>“G4：圆的度量与位置关系”</strong>。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 2</span>
        <div>在 <strong><code>概念精讲</code></strong> 泳道图中回溯发现：九年级圆切线题常卡壳，根因是八年级上册“等腰三角形与轴对称”未打牢。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 3</span>
        <div>切换至 <strong><code>链接沙盒</code></strong> 验证切线长动态等长，在 <strong><code>专项测评</code></strong> 完成 3 题巩固。</div>
      </div>
    </div>
  </div>

  <!-- 第 4 章：见微知著 · 实验探究 -->
  <div class="chapter-break">
    <h1>第 4 章 · 见微知著 · 实验探究（模块三）</h1>

    <div class="module-purpose-card">
      <strong>【模块用途说明及与模块一、二关系】</strong>：模块三是全系统的<strong>深层动力学实验室</strong>，专为攻坚几何与函数动态题打造。它由两个实验室组成：<br>
      • <strong>实验室一：概念具象沙盒</strong>：<strong>直接对应模块一的基础考点模型</strong>，收录全库 46 个基础概念沙盒，支持全库集中切换与参数探究；<br>
      • <strong>实验室二：4D 跃迁模型</strong>：<strong>直接对应模块二的知识谱系综合压轴变异</strong>，精选 37 个中考旗舰几何压轴模型，通过载体、参数、姿态、干扰四个维度演化，彻底破解“几何题多加两条线就认不出来”的难题。
    </div>

    <h2>4.1 实验室一：概念具象沙盒（对应模块一基础考点模型）</h2>
    <p>点击顶部分段控件的 <strong><code>概念具象沙盒 (实验室一 · 46)</code></strong>，再点击右侧 <strong><code>[选择沙盒: SB-xxx ▾]</code></strong>，即可呼出 4 级抽屉（年级 $\to$ 学期 $\to$ 46 个考点沙盒列表 + 实时搜索条），实现全库基础几何/函数沙盒的无缝切换。</p>

    <h2>4.2 实验室二：4D 跃迁模型（对应模块二知识谱系综合变异）</h2>
    <p>点击顶部分段控件的 <strong><code>4D 跃迁模型 (实验室二 · 37)</code></strong>，点击右侧 <strong><code>[选择模型: LM-xxx ▾]</code></strong> 展开 2 级抽屉，在 37 个中考旗舰模型（手拉手、胡不归、阿氏圆、瓜豆原理等）中检索切换。</p>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['phone_leap_deduction']}" class="screenshot-img" alt="核心推演任务分步推演" />
        <div class="screenshot-caption">图 4-1：实验室二 · 核心推演任务（四阶段推演与引导）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['pc_leap_free']}" class="screenshot-img" alt="4D 自由把玩模式" />
        <div class="screenshot-caption">图 4-2：实验室二 · 4D 自由把玩（载体、参数、姿态、X-Ray）</div>
      </div>
    </div>

    <h2>4.3 核心推演任务：名师分步推演四阶段</h2>
    <p>进入实验室二后，右侧仪表盘呈现 <strong><code>核心推演任务</code></strong>，下方设 4 个步骤胶囊：</p>
    <ul>
      <li><strong>① 原型初生：锚定公理骨架</strong> — 画布展示最纯粹的原型三角形或函数线段；</li>
      <li><strong>② 变式演进：载体拓展与姿态旋转</strong> — 模型自动发生旋转或改变载体构型；</li>
      <li><strong>③ 测度不变量：动态观测数值守恒</strong> — 实时刷新线段等长、角度守恒遥测数据；</li>
      <li><strong>④ 中考破局：穿透干扰直击题眼</strong> — 模拟中考命题加壳，一键剥离外层伪装线。</li>
    </ul>

    <h2>4.4 自由把玩模式：4D 维度自由探索与 X-Ray 穿透</h2>
    <p>点击仪表盘右上角 <strong><code>直接自由把玩</code></strong> 按钮切换，画布下方展开 4D 控制面板：</p>
    <ul>
      <li><strong>① 载体变异 (Carrier)</strong>：切换等边三角形、等腰直角、正方形或坐标系网格；</li>
      <li><strong>② 参数变异 (Parameter)</strong>：滑块调节动点比例 $t$、边长；</li>
      <li><strong>③ 姿态变异 (Posture)</strong>：旋转角滑块实现 $0^\circ \sim 360^\circ$ 刚体旋转；</li>
      <li><strong>④ 干扰加壳 (Camouflage & X-Ray)</strong>：点亮干扰线，点击 <strong><code>X-Ray 题眼透视</code></strong> 瞬间虚化干扰线，高亮核心主线！</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['lm9a19_stage1']}" class="screenshot-img" alt="手拉手模型阶段 1" />
        <div class="screenshot-caption">图 4-3：LM-9A-19 手拉手原型骨架（等边三角形初态）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['phone_leap_xray']}" class="screenshot-img" alt="X-Ray 题眼透视" />
        <div class="screenshot-caption">图 4-4：X-Ray 题眼透视激活（虚化干扰线，直击全等）</div>
      </div>
    </div>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">实操范例：探索中考王牌“手拉手旋转全等模型 (LM-9A-19)”</span>
        <span style="font-size: 8.5pt; color: #64748b;">中考压轴王牌</span>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 1</span>
        <div>在实验室二选择 <strong><code>LM-9A-19 手拉手旋转全等</code></strong>，在“核心推演任务”按步骤 1 $\to$ 2 $\to$ 3 观察旋转全等对应。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 2</span>
        <div>点击 <strong><code>直接自由把玩</code></strong>，载体切换为“正方形”，旋转角滑块调至 $90^\circ$。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 3</span>
        <div>点亮“干扰加壳”，点击 <strong><code>X-Ray 题眼透视</code></strong>，亲眼见证干扰线虚化淡出，$AC \equiv BD$ 守恒不变！</div>
      </div>
    </div>
  </div>

  <!-- 第 5 章：百炼成钢 · 实战测评 -->
  <div class="chapter-break">
    <h1>第 5 章 · 百炼成钢 · 实战测评（模块四）</h1>

    <div class="module-purpose-card">
      <strong>【模块用途说明】</strong>：模块四是<strong>中考全真智能出题与限时评卷中心</strong>。学生或家长可自定义满分制、学期考点范围、题型题量与难度梯度，一键生成符合中考大纲的真题试卷。提供“A4 双栏打印”与“在线全真测评”双轨输出，交卷后支持官方评分细则 Checklist 自核打钩与四维素养雷达图。
    </div>

    <h2>5.1 试卷工作台四层架构配置</h2>
    <p>进入模块四后，工作台由上至下呈现四层配置：</p>
    <ul>
      <li><strong>第一层：满分制基准选择</strong> — <code>100分标准制</code>（60分钟）/ <code>120分中考制</code>（90分钟）/ <code>150分大考制</code>（120分钟）；</li>
      <li><strong>第二层：学期向后覆盖与考点勾选</strong> — 点选学期药丸胶囊（如 8下），系统<strong>自动向后覆盖</strong>该学期及之前全部考点，下方考点网格可精确勾选/取消；</li>
      <li><strong>第三层：题型、题量与分值配置</strong> — 设定选择题、填空题数量与分值，解答题按中考标准阶梯自动倒推，保证总分守恒；</li>
      <li><strong>第四层：试卷难度波浪联动权重</strong> — L1 基础 $\sim$ L5 压轴五级难度联动滑块，权重之和恒等于 100%。</li>
    </ul>

    <div class="screenshot-figure">
      <img src="{imgs['exam_workbench']}" class="screenshot-img" alt="试卷工作台四层架构" />
      <div class="screenshot-caption">图 5-1：试卷工作台四层架构（满分制、学期覆盖、题型题量、难度波浪联动）</div>
    </div>

    <h2>5.2 生成中考全真模拟试卷 (A4双栏排版)</h2>
    <p>点击底部 <strong><code>生成中考全真模拟试卷 (A4双栏排版)</code></strong>，瞬间转换至标准 A4 双栏试卷排版，可直接调用浏览器打印输出纸质试卷。</p>

    <h2>5.3 开启在线全真测评 (限时答题)</h2>
    <p>点击底部 <strong><code>开启在线全真测评 (限时答题)</code></strong> 进入考场：</p>
    <ul>
      <li><strong>左侧作答舞台</strong>：独立垂直滚动作答，支持点击唤起伴随式数学键盘 (MathKeyboard)；</li>
      <li><strong>右侧控制舱</strong>：倒计时跳动、动态答题卡（已答/未答/待复查计数，点击题号快速跳转）。</li>
    </ul>

    <h2>5.4 交卷复盘：评分细则 Checklist 自核与认知素养雷达图</h2>
    <p>交卷后自动激活判分与复盘面板：</p>
    <ul>
      <li><strong>客观题自动判分</strong>：选择/填空题实时展示正确答案与解析；</li>
      <li><strong>解答题中考评分细则核对表 (Rubric Checklist)</strong>：展开官方阅卷采分点（如辅助线 +1分、全等证明 +2分），学生逐项自核打钩；</li>
      <li><strong>四维认知素养雷达图</strong>：数学抽象、逻辑推理、直观想象、运算能力四维评估。</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['online_exam']}" class="screenshot-img" alt="在线全真测评考场" />
        <div class="screenshot-caption">图 5-2：在线全真测评考场（试卷作答与右侧控制舱）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['score_panel']}" class="screenshot-img" alt="交卷复盘与评分细则核对表" />
        <div class="screenshot-caption">图 5-3：交卷复盘（中考评分细则自核与素养雷达图）</div>
      </div>
    </div>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">实操范例：组一套“初二下学期 120 分制”中考模拟试卷</span>
        <span style="font-size: 8.5pt; color: #64748b;">期末与中考复习必备</span>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 1</span>
        <div>进入 <strong>“百炼成钢 · 实战测评”</strong>，第一层选择 <strong>“120分中考制”</strong>。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 2</span>
        <div>第二层点击 <strong>“8年级 下学期”</strong> 胶囊（系统自动覆盖 7上~8下全部知识点）；第三层选 10 选择 + 6 填空。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">步骤 3</span>
        <div>点击 <strong><code>开启在线全真测评 (限时答题)</code></strong> 模拟实战，交卷后对照评分细则 Checklist 自核打钩。</div>
      </div>
    </div>
  </div>

  <!-- ==================== 第三篇：多端操作速查 ==================== -->
  <div class="chapter-break">
    <div class="part-banner">第三篇 · 多端操作速查</div>
    <h1>第 6 章 · 电脑 / 平板 / 手机操作差异速查</h1>

    <h2>6.1 电脑端 (PC / Mac) 实操指南</h2>
    <ul>
      <li><strong>鼠标拖拽</strong>：按住左键拖动任意亮色动点，模型连续形变；</li>
      <li><strong>键盘微调</strong>：点击滑块后，支持利用键盘方向键 $\leftarrow / \to$ 实现步长 0.1 高精度微调；</li>
      <li><strong>双列排版</strong>：左侧名师精讲卡片与右侧深色几何视口并排展示，互不遮挡。</li>
    </ul>

    <h2>6.2 iPad / 平板端实操指南</h2>
    <ul>
      <li><strong>横屏推荐</strong>：建议将平板横向放置于桌面支架上，享受开阔视野；</li>
      <li><strong>触控手势</strong>：手指轻触动点直接滑动，顺滑触控调节所有滑块；</li>
      <li><strong>抽屉面板</strong>：轻触顶部胶囊按钮，侧边抽屉平滑滑出，点选考点后自动收起。</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['pad_stage1']}" class="screenshot-img" alt="iPad 平板端横屏" />
        <div class="screenshot-caption">图 6-1：iPad 平板端横屏布局（开阔视野与双指触控）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['phone_concept_drawer']}" class="screenshot-img" alt="手机端竖屏抽屉" />
        <div class="screenshot-caption">图 6-2：手机端竖屏底部抽屉式交互（仅支持竖屏）</div>
      </div>
    </div>

    <h2>6.3 手机端 (iPhone / 安卓) 实操指南（严格竖屏）</h2>
    <ul>
      <li><strong>严格保持竖屏</strong>：系统界面针对手机竖向流式排版优化，严禁使用横屏；</li>
      <li><strong>底部交互抽屉</strong>：考点与模型选择面板均以底部弹窗（Bottom Sheet）自下而上滑出，单手大拇指即可轻松点选；</li>
      <li><strong>吸底数据条</strong>：几何模型的遥测数据条自动贴在手机屏幕底部，滑动时始终常驻可见。</li>
    </ul>

    <h2>6.4 画布复位与防迷失技巧</h2>
    <div class="callout callout-device">
      <div class="callout-title">视口防迷失技巧</div>
      <div>在拖动几何图形或极值缩放时，若动点跑出视口：<br>
      • <strong>电脑端</strong>：在画布任意空白区域<strong>快速双击鼠标左键</strong>，画布毫秒级重新计算包围盒并自动居中填满；<br>
      • <strong>平板 / 手机端</strong>：轻触画布右上角的<strong>“复位”小图标</strong>，即可瞬间恢复黄金视野。</div>
    </div>

    <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 8.5pt; color: #94a3b8;">
      —— 全科核心素养提分系统 V2.0 研发组 编制 · 谨祝广大学子在中考中披荆斩棘，素养跃迁！ ——
    </div>
  </div>

</body>
</html>
"""

    html_path = os.path.join(os.path.dirname(__file__), '..', 'docs', '全科核心素养提分系统V2.0_操作使用说明书.html')
    os.makedirs(os.path.dirname(html_path), exist_ok=True)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"[HTML Written] -> {html_path} ({os.path.getsize(html_path) / 1024:.1f} KB)")

    pdf_path = os.path.join(os.path.dirname(__file__), '..', 'docs', '全科核心素养提分系统V2.0_操作使用说明书.pdf')
    print("[3/3] Generating executive print-ready PDF via Chrome headless...")
    
    cmd = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        f'--print-to-pdf={pdf_path}',
        html_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(pdf_path):
        print(f"[PDF SUCCESS] Generated successfully -> {pdf_path} ({os.path.getsize(pdf_path) / 1024:.1f} KB)")
        return pdf_path, html_path
    else:
        print("[PDF ERROR]:", res.stderr)
        return None, html_path

if __name__ == '__main__':
    build_manual()
