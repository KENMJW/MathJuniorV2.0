const fs = require('fs');
const file = 'src/modules/sandbox/SandboxRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace var(--...) with standard colors in drag_points
content = content.replace(/fillColor: ptDef.color || 'var\(--ios-blue\)'/, "fillColor: ptDef.color?.replace(/var\\(--ios-blue\\)/, '#0071e3') || '#0071e3'");
content = content.replace(/strokeColor: ptDef.strokeColor || 'white'/, "strokeColor: ptDef.strokeColor || '#ffffff'");
content = content.replace(/color: 'var\(--text-primary\)'/, "color: '#000000'");

// Update isAxis logic to include function templates
content = content.replace(/const isAxis = config.canvas_template === 'axis' || config.canvas_template === 'number_axis';/, "const isAxis = config.canvas_template === 'axis' || config.canvas_template.startsWith('number_axis_') || config.canvas_template.startsWith('function_');");

// Add template dispatching
const dispatchCode = `
    // 7. Template Dispatching (Draw Scenes)
    const tpl = config.canvas_template || '';
    if (tpl.startsWith('number_axis_')) {
      // Draw number axis and ticks
      if (!isAxis) {
        board.create('axis', [[0, 0], [1, 0]], { ticks: { drawZero: true } });
      }
    } else if (tpl.startsWith('geometry_')) {
      // For geometry templates, connect points if they exist
      const pointElements = Object.values(elements).filter(e => e.elType === 'point');
      if (pointElements.length === 3) {
        board.create('polygon', pointElements, { borders: { strokeColor: '#0071e3', strokeWidth: 2 }, fillColor: '#0071e3', fillOpacity: 0.1 });
      } else if (pointElements.length === 4) {
        board.create('polygon', pointElements, { borders: { strokeColor: '#0071e3', strokeWidth: 2 }, fillColor: '#0071e3', fillOpacity: 0.1 });
      } else if (pointElements.length === 2 && tpl.includes('circle')) {
        board.create('circle', pointElements, { strokeColor: '#0071e3', strokeWidth: 2 });
      } else if (pointElements.length === 2) {
        board.create('line', pointElements, { straightFirst: false, straightLast: false, strokeColor: '#0071e3', strokeWidth: 2 });
      }
    } else if (tpl.startsWith('function_')) {
      // Basic function curve logic based on slider or just a generic parabola/line
      // This is a minimal generic implementation as requested: "画坐标系+函数曲线+控制点"
      const sliderVal = elements['param_k'] ? () => elements['param_k'].Value() : () => 1;
      if (tpl.includes('quadratic')) {
        board.create('functiongraph', [(x) => sliderVal() * x * x, -10, 10], { strokeColor: '#0071e3', strokeWidth: 2 });
      } else if (tpl.includes('inverse')) {
        board.create('functiongraph', [(x) => sliderVal() / (x || 0.001), -10, 10], { strokeColor: '#0071e3', strokeWidth: 2 });
      } else {
        board.create('functiongraph', [(x) => sliderVal() * x, -10, 10], { strokeColor: '#0071e3', strokeWidth: 2 });
      }
    }
`;
content = content.replace(/\/\/ 6\. 逃生舱机制/, dispatchCode + '\n    // 6. 逃生舱机制');

fs.writeFileSync(file, content);
console.log('Fixed SandboxRenderer');
