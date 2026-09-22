/**
 * 四段论教研级质量与 UI/UE 规范自动化质检脚本
 * 检验项：
 * 1. 铁律 11：源码与数据库绝对零 Emoji
 * 2. 铁律 3：KaTeX 公式配对闭合性 ($...$ 与 $$...$$)
 * 3. 教研级四段论微结构完整性
 * 4. SVG 4 级图层契约与 formal-labels 类名完整性
 */
const fs = require('fs');
const path = require('path');

const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

function runQualityCheck() {
  console.log('====================================================');
  console.log('🚀 开始执行：四段论教研级质量与 UI/UE 规范自动化质检');
  console.log('====================================================\n');

  let passed = true;
  const errors = [];

  // 1. 检查 allPointsData.ts 中的 KP-002
  const tsContent = fs.readFileSync(path.resolve(__dirname, '../src/modules/concept/allPointsData.ts'), 'utf-8');
  
  // 匹配 KP-002 对象
  const kp002Match = tsContent.match(/\{\s*"point_id":\s*"KP-002"[\s\S]*?\n\s*\}/);
  if (!kp002Match) {
    errors.push('❌ 无法在 allPointsData.ts 中定位 KP-002');
    passed = false;
  } else {
    const kp002Text = kp002Match[0];
    
    // 1.1 检查零 Emoji
    if (EMOJI_REGEX.test(kp002Text)) {
      errors.push('❌ KP-002 内容中违反铁律 11：检测到 Emoji 字符！');
      passed = false;
    } else {
      console.log('✔️ [铁律 11] KP-002 内容零 Emoji 校验通过');
    }

    // 1.2 检查 KaTeX 公式配对闭合
    const singleDollarCount = (kp002Text.match(/(?<!\\)\$/g) || []).length;
    if (singleDollarCount % 2 !== 0) {
      errors.push(`❌ KP-002 KaTeX 公式符号未配对闭合 (找到奇数个 $: ${singleDollarCount})`);
      passed = false;
    } else {
      console.log(`✔️ [铁律 3] KP-002 KaTeX 公式符号完美配对闭合 (成对数: ${singleDollarCount / 2})`);
    }

    // 1.3 检查四段论微结构
    const requiredSections = [
      '【看图找原型】',
      '【为什么需要它】',
      '【核心顿悟点】',
      '【拆解右图核心结构特征】',
      '【结构不变量口诀】',
      '【国家课程标准法定定义】',
      '【核心解题定理与公式链】',
      '【通式】',
      '【右图算式】',
      '【意义】',
      '【典型母题】',
      '[典型错解]',
      '[思维病灶剖析]',
      '[规范解法]'
    ];

    let structOk = true;
    for (const req of requiredSections) {
      if (!kp002Text.includes(req)) {
        errors.push(`❌ KP-002 缺少教研规范必要结构：${req}`);
        structOk = false;
      }
    }
    if (structOk) {
      console.log('✔️ [教研规范] KP-002 四阶段微结构完整对齐校验通过');
    } else {
      passed = false;
    }
  }

  // 2. 检查 SVG 4 级图层契约
  const svgPaths = [
    'public/assets/concepts/KP-002-zh.svg',
    'public/assets/concepts/KP-002-en.svg',
    'assets/concepts/KP-002-zh.svg',
    'assets/concepts/KP-002-en.svg'
  ];

  const requiredLayers = ['layer-stage-1', 'layer-stage-2', 'layer-stage-3', 'layer-stage-4', 'formal-labels'];

  for (const p of svgPaths) {
    const fullPath = path.resolve(__dirname, '..', p);
    if (!fs.existsSync(fullPath)) {
      errors.push(`❌ SVG 文件缺失: ${p}`);
      passed = false;
      continue;
    }
    const svgContent = fs.readFileSync(fullPath, 'utf-8');
    let layersOk = true;
    for (const layer of requiredLayers) {
      if (!svgContent.includes(layer)) {
        errors.push(`❌ SVG 文件 ${p} 缺失必要图层类名: ${layer}`);
        layersOk = false;
      }
    }
    if (layersOk) {
      console.log(`✔️ [SVG 契约] ${p} 包含全部 4 级图层与 formal-labels 标注`);
    } else {
      passed = false;
    }
  }

  // 3. 检查数据库文件数据同步
  const { execSync } = require('child_process');
  try {
    const dbZh = execSync('sqlite3 data/core.db "SELECT formal_definition_zh FROM knowledge_points WHERE point_id=\'KP-002\';"').toString();
    if (dbZh.includes('国家课程标准法定定义') && dbZh.includes('两点间距离定理')) {
      console.log('✔️ [数据库同步] data/core.db 中 KP-002 数据已同步且完整');
    } else {
      errors.push('❌ data/core.db 数据与 TS 未完全同步');
      passed = false;
    }

    const pubDbZh = execSync('sqlite3 public/data/core.db "SELECT formal_definition_zh FROM knowledge_points WHERE point_id=\'KP-002\';"').toString();
    if (pubDbZh.includes('国家课程标准法定定义') && pubDbZh.includes('两点间距离定理')) {
      console.log('✔️ [数据库同步] public/data/core.db 中 KP-002 数据已同步且完整');
    } else {
      errors.push('❌ public/data/core.db 数据与 TS 未完全同步');
      passed = false;
    }
  } catch (e) {
    errors.push(`❌ SQLite 查询异常: ${e.message}`);
    passed = false;
  }

  console.log('\n----------------------------------------------------');
  if (passed) {
    console.log('🎉 恭喜！所有四段论教研级质量标准与 UI/UE 规范 100% 验收通过！');
    console.log('----------------------------------------------------');
    process.exit(0);
  } else {
    console.error('❌ 质检未通过，发现以下问题：');
    errors.forEach(e => console.error('  ', e));
    console.log('----------------------------------------------------');
    process.exit(1);
  }
}

runQualityCheck();
