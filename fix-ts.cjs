const fs = require('fs');

// 1. Fix SandboxRenderer.tsx
let sr = fs.readFileSync('src/modules/sandbox/SandboxRenderer.tsx', 'utf8');
sr = sr.replace("import { formatInvariantText, Point2D, InvariantSpec } from './invariants';", "import { formatInvariantText, Point2D } from './invariants';");
sr = sr.replace("const pointMap = {};", "const pointMap: Record<string, Point2D> = {};");
sr = sr.replace("(x) => getA() * x * x + getB() * x + getC()", "(x: number) => getA() * x * x + getB() * x + getC()");
sr = sr.replace("(x) => getK() / (x || 0.001)", "(x: number) => getK() / (x || 0.001)");
sr = sr.replace("(x) => getK() * x + getB()", "(x: number) => getK() * x + getB()");
fs.writeFileSync('src/modules/sandbox/SandboxRenderer.tsx', sr);

// 2. Fix LabWorkspace.tsx
let lw = fs.readFileSync('src/modules/sandbox/LabWorkspace.tsx', 'utf8');
lw = lw.replace("import { SandboxConfig, SandboxRenderer } from './SandboxRenderer';", "import { SandboxRenderer } from './SandboxRenderer';");
lw = lw.replace("import { Icon } from '../../components/common/Icon';\n", "");
lw = lw.replace("locale = 'zh-CN',", "_locale = 'zh-CN',");
fs.writeFileSync('src/modules/sandbox/LabWorkspace.tsx', lw);

// 3. Fix LeapLab.tsx
let ll = fs.readFileSync('src/modules/sandbox/LeapLab.tsx', 'utf8');
ll = ll.replace("import { XRayLayer } from './XRayLayer';\n", "");
ll = ll.replace("import { MathRenderer } from '../../components/math/MathRenderer';\n", "");
ll = ll.replace("  onBack,\n", "  _onBack,\n");
ll = ll.replace("  className,\n", "  _className,\n");
ll = ll.replace("  style,\n", "  _style,\n");
fs.writeFileSync('src/modules/sandbox/LeapLab.tsx', ll);

// 4. Fix MathJuniorHome.tsx
let mjh = fs.readFileSync('src/MathJuniorHome.tsx', 'utf8');
// Fix import
mjh = mjh.replace('import { LeapLab, mockLeapSandboxModels } from "./modules/sandbox";', 'import { mockLeapSandboxModels } from "./modules/sandbox";');
mjh = mjh.replace('import { SandboxRenderer } from "./modules/sandbox/SandboxRenderer";', 'import { LabWorkspace } from "./modules/sandbox/LabWorkspace";');
// Fix duplicate id property in line 188-191
mjh = mjh.replace(/id: String\(r\.sandbox_id\),\s*nameZh: kpMap\.get\(r\.point_id\) \|\| r\.sandbox_id,\s*id: String\(r\.sandbox_id\),/, 'id: String(r.sandbox_id),\n            nameZh: kpMap.get(r.point_id) || r.sandbox_id,');
// Remove unused state
mjh = mjh.replace('const [labSubView, setLabSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");\n', '');
mjh = mjh.replace('const [selectedSandboxId, setSelectedSandboxId] = useState<string>("SB-HAND-IN-HAND");\n', '');
mjh = mjh.replace('const [selectedLeapModelId, setSelectedLeapModelId] = useState<string>("LM-8A-01");\n', '');

fs.writeFileSync('src/MathJuniorHome.tsx', mjh);

console.log('TS fixes applied');
