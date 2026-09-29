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
        "pc_graph_drawer": get_base64_img("public/screenshots/fe0015_02_line_selector_drawer.png"),
        "pc_swimlane": get_base64_img("public/screenshots/fe0015_03_line_g4_concept.png"),
        "pc_concept_master": get_base64_img("public/screenshots/fe0021_e2e_pc_1440x900_master_accordion.png"),
        "kp057_zhaoshuang": get_base64_img("public/screenshots/verify_kp057_zhaoshuang_step2.png"),
        "kp057_hud": get_base64_img("public/screenshots/verify_kp057_hud_step3.png"),
        "pc_leap_free": get_base64_img("public/screenshots/fe0022_e2e_pc_1440x900_leaplab_free.png"),
        "phone_leap_deduction": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_leaplab_deduction.png"),
        "phone_leap_xray": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_leaplab_step2_xray.png"),
        "pc_exam_workbench": get_base64_img("public/screenshots/fe0022_e2e_pc_1440x900_exam_workbench.png"),
        "phone_score_panel": get_base64_img("public/screenshots/fe0022_e2e_phone_390x844_score_panel.png"),
        "pad_stage1": get_base64_img("public/screenshots/fe0021_e2e_pad_820x1180_stage1.png"),
        "pad_drawer": get_base64_img("public/screenshots/fe0021_e2e_pad_820x1180_drawer_open.png"),
        "phone_concept_drawer": get_base64_img("public/screenshots/fe0023_e2e_phone_390x844_concept_drawer.png"),
        "phone_four_stages": get_base64_img("public/screenshots/fe0021_e2e_phone_390x844_four_stages.png"),
        "lm9a19_stage1": get_base64_img("public/screenshots/verify_lm9a19_stage1.png"),
        "lm9a19_stage2": get_base64_img("public/screenshots/verify_lm9a19_stage2.png"),
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
      padding: 20mm 10mm 15mm 10mm;
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
      margin: 20px 0 10px 0;
      letter-spacing: -0.5px;
    }}

    .cover-subtitle {{
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      margin-bottom: 25px;
      line-height: 1.4;
    }}

    .cover-tag-row {{
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 25px;
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
      max-height: 110mm;
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
      padding-top: 15px;
    }}

    /* 章节与标题控制 */
    h1 {{
      font-size: 16pt;
      font-weight: 800;
      color: #0369a1;
      border-left: 5px solid #0284c7;
      padding-left: 10px;
      margin: 24px 0 12px 0;
      page-break-after: avoid;
      letter-spacing: -0.2px;
    }}

    .chapter-break {{
      page-break-before: always;
    }}

    h2 {{
      font-size: 12.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 16px 0 8px 0;
      page-break-after: avoid;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    h3 {{
      font-size: 10.5pt;
      font-weight: 600;
      color: #334155;
      margin: 12px 0 6px 0;
      page-break-after: avoid;
    }}

    p {{
      margin: 0 0 8px 0;
      color: #334155;
      text-align: justify;
    }}

    /* 优雅卡片与重点提示 */
    .callout {{
      border-radius: 8px;
      padding: 10px 14px;
      margin: 10px 0;
      font-size: 9.5pt;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      gap: 4px;
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

    .callout-title {{
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }}

    /* 示例卡片 */
    .example-box {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin: 12px 0;
      break-inside: avoid;
    }}

    .example-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }}

    .example-title {{
      font-size: 10pt;
      font-weight: 700;
      color: #0284c7;
    }}

    .example-step {{
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 9.5pt;
    }}

    .step-pill {{
      background: #0284c7;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 9999px;
      flex-shrink: 0;
      margin-top: 1px;
    }}

    /* 截图排版容器 */
    .screenshot-figure {{
      margin: 10px 0;
      text-align: center;
      break-inside: avoid;
    }}

    .screenshot-img {{
      width: 100%;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      display: block;
      margin: 0 auto;
    }}

    .screenshot-caption {{
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 6px;
      font-weight: 500;
    }}

    .grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 10px 0;
      break-inside: avoid;
    }}

    .grid-3 {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
      break-inside: avoid;
    }}

    /* 表格 */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
      break-inside: avoid;
    }}

    th, td {{
      padding: 6px 10px;
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
      padding: 2px 6px;
      background: #020617;
      color: #38bdf8;
      font-family: monospace;
      border-radius: 4px;
      font-size: 8.5pt;
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
        <span class="cover-tag">平板端 (iPad / 平板横竖屏)</span>
        <span class="cover-tag">手机端 (iPhone / 安卓)</span>
        <span class="cover-tag">离线离网可用</span>
      </div>
    </div>

    <div>
      <img src="{imgs['pc_pillars']}" class="cover-hero-img" alt="全科核心素养提分系统V2.0界面全景" />
    </div>

    <div class="cover-meta">
      <div><strong>适用年级</strong>：初一至初三全学段（7上 · 7下 · 8上 · 8下 · 9上 · 9下）</div>
      <div><strong>核心能力</strong>：107 个考点四段论精讲 · 46 个概念动力沙盒 · 37 个中考 4D 压轴变异模型 · 智能自适应测评</div>
      <div style="margin-top: 6px; font-size: 8pt; color: #94a3b8;">版本号：v2.0.4-beta · 系统标准：Slate 950 暗色几何交互 · 零持久化隐私保护</div>
    </div>
  </div>

  <!-- ==================== 第一章：系统简介与三端体验 ==================== -->
  <div class="chapter-break">
    <h1>第一章：系统设计初衷与三端体验指南</h1>
    
    <p>传统的初中理科刷题常陷入“公式背得熟，题目一变就不会”的死胡同。<strong>全科核心素养提分系统 V2.0</strong> 专为打破死记硬背而设计，将抽象的初中数学知识转化为**“看得见、摸得着、能变形”**的动态数学沙盒。</p>

    <h2>1.1 手机、平板、电脑三端使用差异速查</h2>
    <p>本系统支持在任意手机浏览器、iPad/平板电脑或桌面电脑无缝使用，系统会自动感知您的屏幕形态并切换最佳界面：</p>

    <table>
      <thead>
        <tr>
          <th style="width: 18%;">设备形态</th>
          <th style="width: 28%;">最佳使用姿势</th>
          <th style="width: 27%;">界面交互特色</th>
          <th style="width: 27%;">学生/家长操作建议</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>电脑端<br>(PC / Mac)</strong></td>
          <td>横屏宽屏浏览，鼠标+键盘精准微调</td>
          <td>左侧名师卡片 + 右侧深色几何视口并排展示，支持键盘上下微调参数滑块</td>
          <td>适合深度自学推演、完整模拟考试与真题大卷作答</td>
        </tr>
        <tr>
          <td><strong>平板端<br>(iPad / 平板)</strong></td>
          <td>横屏（推荐）或竖屏放置于支架上</td>
          <td>支持手势双击视口复位、指尖拖拽几何动点，浮动抽屉按需滑出</td>
          <td>极其推荐学生进行日常课后巩固与错题探究，兼具便携与大视野</td>
        </tr>
        <tr>
          <td><strong>手机端<br>(iPhone / 安卓)</strong></td>
          <td>竖屏单手握持或双手横屏</td>
          <td>顶部胶囊快速切换、底部名师抽屉上滑展开、实时测度条智能贴底</td>
          <td>适合碎片时间（通勤、课间）进行“概念四段论”速读与极速自测闯关</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-device">
      <div class="callout-title">三端操作小窍门：视口防迷失</div>
      <div>在拖动几何图形或极值放大时，如果动点跑出视口：电脑端<strong>双击画布空白处</strong>即可瞬间居中复位；手机/平板端轻触画布右上角的<strong>“标尺/复位”</strong>小图标即可恢复最优视野。</div>
    </div>

    <h2>1.2 顶栏全局控制台：学期与双语随心切换</h2>
    <p>无论处于哪个模块，屏幕顶栏都常驻着核心控制条：</p>
    <ul>
      <li><strong>学期定位（7上 ~ 9下）</strong>：点击顶部学期胶囊（如 [8下]），系统自动过滤出初二下学期的一元二次方程、勾股定理、平行四边形等专属考点。</li>
      <li><strong>中英双语切换（中/EN）</strong>：一键实现所有考点名称、名师题眼、沙盒滑块、几何定理的中英对照，满足双语学校与国际素养拓展需求。</li>
      <li><strong>零持久化隐私保护</strong>：本系统不在云端残留您的草稿与作答，页面刷新后立即安全恢复标准初始状态，孩子每次都能从清晰初态开始探究。</li>
    </ul>

    <div class="screenshot-figure">
      <img src="{imgs['pc_pillars']}" class="screenshot-img" alt="顶栏控制台与四大模块全景" />
      <div class="screenshot-caption">图 1-1：电脑端顶栏控制台（包含初一到初三学期选择、中英切换、四大模块分段控制器）</div>
    </div>
  </div>

  <!-- ==================== 第二章：知识谱系导航 ==================== -->
  <div class="chapter-break">
    <h1>第二章：经纬纵横 · 知识谱系图导航</h1>
    
    <p>很多学生初三复习时“只见树木，不见森林”。知识谱系图将初中 107 个核心考点串联为 12 条如地铁般交织的“逻辑谱系生长树”，清晰揭示每个知识点的前因后果。</p>

    <h2>2.1 地铁图与六学期竖向泳道怎么看？</h2>
    <p>系统提供<strong>“12 谱系选择抽屉”</strong>与<strong>“六学期竖向泳道图（LineSwimlane）”</strong>，直观呈现一条知识链条如何在初一、初二、初三跨学期进阶：</p>

    <div class="screenshot-figure">
      <img src="{imgs['pc_swimlane']}" class="screenshot-img" alt="G4 谱系六学期竖向泳道图" />
      <div class="screenshot-caption">图 2-1：圆的几何度量谱系（从 7年级线段角 $\to$ 8年级勾股相似 $\to$ 9年级切线垂径阿氏圆）竖向演变</div>
    </div>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">功能实操范例：初二学生查漏补缺“几何全等与相似”链条</span>
      </div>
      <div class="example-step">
        <span class="step-pill">1</span>
        <div>点击顶栏导航第二项 <strong>“经纬纵横 · 思维图谱”</strong>。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">2</span>
        <div>点击 <strong>“选择谱系脉络”</strong> 抽屉按钮，在弹出的 12 条谱系中选择 <strong>“G2：三角形与几何全等”</strong> 或 <strong>“G4：圆与位置关系”</strong>。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">3</span>
        <div>右侧立即呈现 6 段式学期泳道卡片。孩子一眼就能看出：要学好 9年级中考压轴的“圆切线与隐圆轨迹”，底子其实是 8上学期的“等腰三角形与垂直平分线”。</div>
      </div>
    </div>

    <div class="callout callout-parent">
      <div class="callout-title">家长陪读引导法：帮孩子找回“断链的螺丝钉”</div>
      <div>当孩子抱怨几何压轴题不会做时，请不要责怪孩子粗心，打开此泳道图，引导孩子回溯：“这道题用到了切线，但它前一步证明其实是角平分线全等，我们看看初二上的这个前驱考点你掌握了吗？”</div>
    </div>
  </div>

  <!-- ==================== 第三章：考点精讲与概念动力沙盒 ==================== -->
  <div class="chapter-break">
    <h1>第三章：探本溯源 · 考点精讲与具象沙盒</h1>
    
    <p>这是系统的第一核心攻坚武器。每个考点均配备**“四段论精讲卡片”**与**“实时交互的深色动力沙盒”**，让学生把抽象定理亲手做出来。</p>

    <h2>3.1 考点四段论学习法</h2>
    <p>每个知识点不再是干瘪的一句话，而是分为层次清晰的四步：</p>
    <ul>
      <li><strong>① 原初故事</strong>：古人为什么发现这个定理？生活场景起源是什么？</li>
      <li><strong>② 直觉本质</strong>：不用数学符号，用大白话和生活直觉讲透内核；</li>
      <li><strong>③ 形式定义</strong>：中考教科书规范数学符号与公式推导；</li>
      <li><strong>④ 内在变异</strong>：中考出题人最喜欢从什么角度进行图形变形。</li>
    </ul>

    <div class="screenshot-figure">
      <img src="{imgs['pc_concept_master']}" class="screenshot-img" alt="电脑端概念精讲与动力沙盒折叠卡片" />
      <div class="screenshot-caption">图 3-1：电脑端左侧四段论折叠卡片与右侧动态几何沙盒一体化联动</div>
    </div>

    <h2>3.2 具象沙盒实操：动点拖拽、探究三步曲与实时 HUD</h2>
    <p>沙盒右侧配有<strong>探究三步指引</strong>与<strong>核心测度实时 HUD 指示牌</strong>：</p>
    <ul>
      <li><strong>动点拖拽</strong>：黄色/橙色圆点均为动点，学生可用手指或鼠标直接在黑底画布上拖动；</li>
      <li><strong>滑块微调</strong>：可自由调节边长、斜率、角度等参数；</li>
      <li><strong>实时 HUD 守恒验证</strong>：数值毫秒级实时计算，等式成立时高亮呈现 <span class="hud-badge"><span class="hud-success">[恒等守恒成立 ✓]</span></span>。</li>
    </ul>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">功能实操范例：初二学生探究“勾股定理赵爽弦图与三方外挂 (SB-KP057)”</span>
      </div>
      <div class="example-step">
        <span class="step-pill">1</span>
        <div>在考点列表中选择 <strong>“KP-057：勾股定理”</strong>，右侧自动加载 Slate 950 深色深邃画布。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">2</span>
        <div><strong>步骤 1：两直角边独立变形</strong>。拖拽直角边滑块 $a=3, b=4$，右侧实时 HUD 瞬间显示：<br>
        <span class="hud-badge">两直角边平方和 a² + b² = 25.00</span> ≡ <span class="hud-badge">斜边平方 c² = 25.00</span>。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">3</span>
        <div><strong>步骤 2：切换赵爽弦图模式</strong>。将展示模式滑块切至 <code>view_mode = 2</code>，画布立即呈现 4 个全等半透明天蓝直角三角形围绕中心琥珀色小正方形的中国古代赵爽弦图，学生直观看到：大正方形面积 $c^2$ 恰好等于 4 个三角形面积之和加上小正方形面积 $(b-a)^2$！</div>
      </div>
      <div class="example-step">
        <span class="step-pill">4</span>
        <div><strong>达成目标</strong>：当满足条件时，步骤卡片瞬间由灰转绿，打上对勾并提示达成！</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['kp057_zhaoshuang']}" class="screenshot-img" alt="赵爽弦图模式实操" />
        <div class="screenshot-caption">图 3-2：赵爽弦图模式实操截图（四直角三角形围成弦图）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['kp057_hud']}" class="screenshot-img" alt="实时 HUD 勾股守恒" />
        <div class="screenshot-caption">图 3-3：实时 Live HUD 显示两直角边平方和严格等于斜边平方</div>
      </div>
    </div>
  </div>

  <!-- ==================== 第四章：4D 跃迁变异实验室 ==================== -->
  <div class="chapter-break">
    <h1>第四章：见微知著 · 4D 跃迁变异实验室</h1>
    
    <p>中考最后两道几何压轴题，往往由出题人对基本模型进行<strong>“旋转、倾斜、加壳伪装”</strong>组合而成。<strong>4D 跃迁实验室</strong>收录了中考全部 37 个王牌思维跃迁模型，提供**“名师分步推演”**与**“4D 变异自由探索”**双模式。</p>

    <h2>4.1 模式一：名师分步推演（Step Deduction）</h2>
    <p>点击推演卡片顶部的 [ ① | ② | ③ | ④ ] 胶囊，名师将带您经历一道中考压轴题的诞生过程：</p>
    <ul>
      <li><strong>① 原初骨架</strong>：剥离所有干扰线，呈现最干净、最简单的纯净模型；</li>
      <li><strong>② 动态变异</strong>：图形旋转、点开始运动，角度或长度发生临界变化；</li>
      <li><strong>③ 出题人伪装</strong>：加壳干扰线、阴影迷彩上线，还原出考卷上令人生畏的压轴题原貌；</li>
      <li><strong>④ [透视] 照妖镜开启</strong>：开启 X-Ray 透视照妖镜，所有干扰虚线瞬间变淡，核心全等/相似骨架高亮投射，并附带<strong>【中考题眼名师秘笈】</strong>！</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['phone_leap_deduction']}" class="screenshot-img" alt="手机端名师分步推演卡片与题眼" />
        <div class="screenshot-caption">图 4-1：名师推演步骤卡片（阶段标靶、微调滑块与中考题眼）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['phone_leap_xray']}" class="screenshot-img" alt="照妖镜 X-Ray 透视开启" />
        <div class="screenshot-caption">图 4-2：开启 [透视] 破案模式，干扰线隐形，骨架发光呈现</div>
      </div>
    </div>

    <h2>4.2 模式二：4D 变异自由探索（Free Explore）</h2>
    <p>完成分步推演后，点击绿色胶囊 <strong>[完成推演 · 进入自由探索]</strong>，解锁四大变异维度微调面板：</p>
    <ul>
      <li><strong>① 载体变异 (Carrier)</strong>：在等边三角形、等腰直角三角形、正方形或坐标系间一键变异；</li>
      <li><strong>② 参数变异 (Parameter)</strong>：通过下方滑块自由调节旋转角 $\alpha$、动点比例 $t$、线段长宽等；</li>
      <li><strong>③ 姿态变异 (Posture)</strong>：一键实现图形的 $90^\circ$ 正交旋转、轴对称翻折或倾斜投影；</li>
      <li><strong>④ 干扰加壳与透视 (Camouflage & X-Ray)</strong>：点击“照妖镜透视”，亲身体验出题人添加的多条辅助干扰线如何被一眼看穿。</li>
    </ul>

    <div class="screenshot-figure">
      <img src="{imgs['pc_leap_free']}" class="screenshot-img" alt="电脑端 4D 变异自由探索全景" />
      <div class="screenshot-caption">图 4-3：电脑端 4D 变异自由探索（右上角载体/姿态切换，右下角全量不变量与角度实测遥测）</div>
    </div>

    <div class="example-box">
      <div class="example-header">
        <span class="example-title">功能实操范例：初三攻坚中考几何王牌“手拉手旋转全等模型 (LM-9A-19)”</span>
      </div>
      <div class="example-step">
        <span class="step-pill">1</span>
        <div>在 4D 实验室模型抽屉中选取 <strong>“LM-9A-19：手拉手模型”</strong>。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">2</span>
        <div><strong>步骤 1：观察等边三角形共顶旋转</strong>。旋转角 $\theta=60^\circ$，遥测实时提示 $\triangle OAC \cong \triangle OBD$，线段 $AC = BD = 6.93\text{{ cm}}$ 严格相等。</div>
      </div>
      <div class="example-step">
        <span class="step-pill">3</span>
        <div><strong>步骤 2：姿态变异至 $90^\circ$ 正交</strong>。点击步骤 2，载体变异为等腰直角三角形，旋转角切至 $90^\circ$，两条旋转线段夹角恒等于旋转角 $90^\circ$，形成垂直关系！</div>
      </div>
      <div class="example-step">
        <span class="step-pill">4</span>
        <div><strong>步骤 4：照妖镜开启</strong>。原本纵横交错的外围加壳线变成浅灰半透明，核心共顶三角形高亮发光，底部结论明确指出：“结论：$\triangle OAC \cong \triangle OBD$ 旋转恒全等且两线夹角恒等于旋转角 $\alpha$”。考场大题轻松秒破！</div>
      </div>
    </div>
  </div>

  <!-- ==================== 第五章：自适应测评与真题演练 ==================== -->
  <div class="chapter-break">
    <h1>第五章：百炼成钢 · 自适应测评与评卷</h1>
    
    <p>学完概念和模型后，系统提供真题检验闭环。题库内置近 3000 道全国中考真题与名校模拟题，支持智能难度波纹推荐。</p>

    <h2>5.1 试卷工作台作答规范</h2>
    <p>点击第四项导航 <strong>“百炼成钢 · 实战测评”</strong>，系统根据当前选择的学期自动生成针对性试卷：</p>
    <ul>
      <li>选择题点击对应选项胶囊即时选中；填空题与解答题支持直接输入或手写步骤；</li>
      <li>右上角配有时钟计时器，培养孩子的考场时间分配意识；</li>
      <li>作答完毕后点击绿色 <strong>[提交试卷]</strong> 按钮，系统毫秒级完成判分并生成深度分析报告。</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['pc_exam_workbench']}" class="screenshot-img" alt="电脑端试卷工作台" />
        <div class="screenshot-caption">图 5-1：电脑端试卷工作台（题目清晰排版，选项卡片高亮响应）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['phone_score_panel']}" class="screenshot-img" alt="手机端测评报告" />
        <div class="screenshot-caption">图 5-2：手机端提交后即时判分报告（得分率、中考丢分点规避）</div>
      </div>
    </div>

    <h2>5.2 独家特色：评分细则核对表（Rubric Checklist）与多解法对比</h2>
    <p>这不仅仅是一个对错判定器，更是中考阅卷标准的“微缩考场”：</p>
    <ul>
      <li><strong>中考评分细则 Checklist</strong>：针对大题，系统逐步骤列出“写出此结论得 2 分”、“未写辅助线作法扣 1 分”的得分点，纠正孩子“会做却拿不到满分”的书写漏洞；</li>
      <li><strong>一题多解对比</strong>：常规几何法、代数坐标解析法、辅助圆构造法多轨并列呈现，拓展思维广度。</li>
    </ul>

    <div class="callout callout-student">
      <div class="callout-title">学生提分金句：像中考阅卷老师一样审视自己的步骤</div>
      <div>做完压轴大题后，对照系统提供的 <code>Rubric Checklist</code>，逐行核对自己的答题纸。少写了“连接 OD”还是漏了“两直线平行同位角相等”的依据？平时扣死细节，考场才能稳拿满分。</div>
    </div>
  </div>

  <!-- ==================== 第六章：移动端（iPad / 手机）专项操作指南 ==================== -->
  <div class="chapter-break">
    <h1>第六章：移动端（iPad 平板 / 手机）专项操作指引</h1>
    
    <p>针对移动触控屏幕的物理特性，系统深度适配了 iOS/Android 液态玻璃与抽屉交互规范。</p>

    <h2>6.1 iPad / 平板端：横屏学习的黄金配置</h2>
    <p>平板是使用本系统体验极佳的形态（兼具大视野与触控交互）：</p>
    <ul>
      <li><strong>推荐使用方向：横屏（Landscape）</strong>。系统会自动呈现类电脑端的分栏布局，左侧为可滑动收折的考点抽屉列表，右侧为大尺寸黑底几何画布；</li>
      <li><strong>触控手势操作</strong>：
        <ul>
          <li><strong>单指平滑拖拽</strong>：直接按住黄色动点自由拉伸，比鼠标拖拽更直观；</li>
          <li><strong>双指捏合（Pinch）</strong>：在画布空白区域双指捏合可局部放大几何图形观察细节；</li>
          <li><strong>轻触视口复位</strong>：点击画布角落的圆形小标尺，瞬间回到预设黄金视口。</li>
        </ul>
      </li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['pad_stage1']}" class="screenshot-img" alt="iPad 平板端横屏实操" />
        <div class="screenshot-caption">图 6-1：iPad 横屏大视野实操（左侧分步引导卡片，右侧触控几何画布）</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['pad_drawer']}" class="screenshot-img" alt="iPad 考点抽屉面板" />
        <div class="screenshot-caption">图 6-2：轻触顶部胶囊滑出考点抽屉，无缝跨学期点选</div>
      </div>
    </div>

    <h2>6.2 手机端：碎片时间的高效单手交互</h2>
    <p>手机屏幕较小，系统采用了<strong>“纵向空间高效折叠技术”</strong>：</p>
    <ul>
      <li><strong>浮动抽屉一键呼出</strong>：轻触顶部的考点名称胶囊，从屏幕下方滑出半屏分类抽屉；</li>
      <li><strong>吸底测度条</strong>：核心测度 Live HUD 会自动以极简胶囊形式贴附在屏幕下方，不遮挡中央几何图形；</li>
      <li><strong>横竖屏自适应</strong>：遇到复杂的大型 4D 跃迁模型（如胡不归、阿氏圆），手机横屏后画布将自动展开为全屏影院模式！</li>
    </ul>

    <div class="grid-2">
      <div class="screenshot-figure">
        <img src="{imgs['phone_four_stages']}" class="screenshot-img" alt="手机端四段论卡片" />
        <div class="screenshot-caption">图 6-3：手机竖屏四段论精讲卡片纵向流畅滑动</div>
      </div>
      <div class="screenshot-figure">
        <img src="{imgs['phone_concept_drawer']}" class="screenshot-img" alt="手机端抽屉面板" />
        <div class="screenshot-caption">图 6-4：底部抽屉式考点选择器，支持实时关键字检索</div>
      </div>
    </div>
  </div>

  <!-- ==================== 第七章：家长辅导指南与常见答疑 ==================== -->
  <div class="chapter-break">
    <h1>第七章：家长辅导指南与常见操作答疑 (FAQ)</h1>

    <h2>7.1 家长陪伴锦囊：如何用系统启发孩子而不是代替思考</h2>
    <div class="callout callout-parent">
      <div class="callout-title">家长四步提问法（无需深懂初中数理也能高效辅导）</div>
      <div>
        <strong>第一步（找规律）</strong>：“宝贝，你拖动一下屏幕上这个黄色圆点，看看下面那组数字里，哪两个数字是一直没变的？”（引导发现不变量）<br>
        <strong>第二步（猜本质）</strong>：“为什么图形转了角度，这两个三角形的面积还是完全一样呢？你看它们底边和高有什么联系？”（引导数学证明）<br>
        <strong>第三步（识破伪装）</strong>：“打开那个 [透视] 照妖镜看看，出题人加的那三条虚线，是不是故意把简单的手拉手模型藏起来了？”（引导考场破案意识）<br>
        <strong>第四步（独立过关）</strong>：“把那个探究小关卡做出来，等它变成绿色的 [守恒成立 ✓]，今晚的几何难关就算彻底攻克啦！”（即时正向激励）
      </div>
    </div>

    <h2>7.2 常见操作答疑 (FAQ)</h2>

    <p><strong>Q1：为什么每次刷新网页后，做过的题目或者调节的滑块会恢复默认值？</strong><br>
    <strong>A</strong>：这是系统严密遵循的<strong>“零持久化数据安全与会话重置标准”</strong>。为了保护孩子的作答隐私，且避免学生在已经变形混乱的几何图形上越陷越深，系统设计为“刷新即回归标准黄金初态”。想要重新探究只需刷新即可恢复全新模型。</p>

    <p><strong>Q2：图形拖动得太大或者缩得太小找不到了怎么办？</strong><br>
    <strong>A</strong>：电脑端在画布任意空白区域<strong>快速双击鼠标左键</strong>；平板或手机端轻触画布角落的<strong>复位标尺图标</strong>，画布会毫秒级重新计算包围盒并自动居中填满屏幕。</p>

    <p><strong>Q3：家里网络不好或者外出旅行没网时能用吗？</strong><br>
    <strong>A</strong>：<strong>完全可以！</strong> 本系统基于离线 PWA 与浏览器本地 SQLite WASM 技术构建。首次加载完成后，系统已将全部 107 个考点、46 个概念沙盒、37 个 4D 模型及题库数据安全缓存在浏览器本地，即使断开 Wi-Fi 拔掉网线，依然可以流畅拉拽滑块与演练习题。</p>

    <p><strong>Q4：英文模式有什么用？孩子需要看英文吗？</strong><br>
    <strong>A</strong>：顶部的 [EN] 按钮专为培养孩子双语学术思维打造。初中几何与函数许多术语（如 Invariant 不变量、Orthogonal 正交、Discriminant 判别式）在高中竞赛或国际理科课程中均通用。学有余力的孩子建议切换英文对照阅览，拓展学术视野。</p>

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
