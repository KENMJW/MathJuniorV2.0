const fs = require('fs');
const file = 'src/modules/sandbox/SandboxRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add onInvariantsChange to props
content = content.replace(
  'locale?: string;',
  'locale?: string;\n  onInvariantsChange?: (invariants: Array<{id: string, text: string, isConstant: boolean}>) => void;'
);

// Destructure it
content = content.replace(
  'export const SandboxRenderer: React.FC<SandboxRendererProps> = ({ config, className, style }) => {',
  'export const SandboxRenderer: React.FC<SandboxRendererProps> = ({ config, className, style, onInvariantsChange, locale }) => {'
);

// Remove invariant text drawing from JSXGraph and hook up onBoardUpdate
const invariantRegex = /\/\/ 5\. 渲染展示标签\/不变量[\s\S]*?\/\/ 7\. 渲染场景模板/;
if (invariantRegex.test(content)) {
  const replacement = `// 5. 不变量外置渲染
    let invariants: any[] = [];
    try {
      const parsed = JSON.parse(config.invariants_display_json || '[]');
      invariants = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {}

    const updateInvariants = () => {
      if (!onInvariantsChange || invariants.length === 0) return;
      const pointMap = {};
      Object.keys(elements).forEach(id => {
        const el = elements[id];
        if (el && typeof el.X === 'function') pointMap[id] = { x: el.X(), y: el.Y() };
      });
      const results = invariants.map((inv, idx) => {
        return {
          id: inv.id || \`inv-\${idx}\`,
          text: formatInvariantText(inv, pointMap, locale),
          isConstant: !!inv.isConstant
        };
      });
      onInvariantsChange(results);
    };

    board.on('update', updateInvariants);
    // Initial call
    setTimeout(updateInvariants, 100);

    // 7. 渲染场景模板`;
  content = content.replace(invariantRegex, replacement);
}

// Disable pan/zoom to lock viewport
content = content.replace(
  'pan: { enabled: true, needShift: false, needTwoFingers: true },',
  'pan: { enabled: false },'
);
content = content.replace(
  'zoom: { wheel: true, needShift: false },',
  'zoom: { wheel: false, pinch: false },'
);

fs.writeFileSync(file, content);
