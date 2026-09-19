const fs = require('fs');
const file = 'src/modules/sandbox/SandboxRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

const dispatchCode = `
    // 7. 渲染场景模板 (基于 canvas_template 画几何/连线/图形)
    const tpl = config.canvas_template || '';
    const pointElements = Object.values(elements).filter(e => e.elType === 'point');
    if (tpl.startsWith('number_axis_')) {
      if (!isAxis) {
        board.create('axis', [[0, 0], [1, 0]], { ticks: { drawZero: true } });
      }
      // 数轴距离/连线
      if (pointElements.length >= 2) {
         board.create('segment', [pointElements[0], pointElements[1]], { strokeColor: '#0071e3', strokeWidth: 3 });
      }
    } else if (tpl.startsWith('geometry_')) {
      if (pointElements.length === 3) {
        board.create('polygon', pointElements, { borders: { strokeColor: '#0071e3', strokeWidth: 2 }, fillColor: '#0071e3', fillOpacity: 0.1 });
      } else if (pointElements.length === 4) {
        board.create('polygon', pointElements, { borders: { strokeColor: '#0071e3', strokeWidth: 2 }, fillColor: '#0071e3', fillOpacity: 0.1 });
      } else if (pointElements.length === 2 && tpl.includes('circle')) {
        board.create('circle', pointElements, { strokeColor: '#0071e3', strokeWidth: 2, fillColor: '#0071e3', fillOpacity: 0.05 });
      } else if (pointElements.length >= 2) {
        board.create('segment', [pointElements[0], pointElements[1]], { strokeColor: '#0071e3', strokeWidth: 2 });
      }
    } else if (tpl.startsWith('function_')) {
      const getK = () => elements['param_k'] ? elements['param_k'].Value() : 1;
      const getB = () => elements['param_b'] ? elements['param_b'].Value() : 0;
      const getA = () => elements['param_a'] ? elements['param_a'].Value() : 1;
      const getC = () => elements['param_c'] ? elements['param_c'].Value() : 0;
      
      if (tpl.includes('quadratic')) {
        board.create('functiongraph', [(x) => getA() * x * x + getB() * x + getC(), -15, 15], { strokeColor: '#0071e3', strokeWidth: 2 });
      } else if (tpl.includes('inverse')) {
        board.create('functiongraph', [(x) => getK() / (x || 0.001), -15, 15], { strokeColor: '#0071e3', strokeWidth: 2 });
      } else {
        board.create('functiongraph', [(x) => getK() * x + getB(), -15, 15], { strokeColor: '#0071e3', strokeWidth: 2 });
      }
    }
`;

content = content.replace('// 6. 逃生舱机制 (customBehaviorId)', dispatchCode + '\n    // 6. 逃生舱机制 (customBehaviorId)');
fs.writeFileSync(file, content);
