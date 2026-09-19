const fs = require('fs');

// 1. Fix LeapLab.tsx
let ll = fs.readFileSync('src/modules/sandbox/LeapLab.tsx', 'utf8');
ll = ll.replace(
`export const LeapLab: React.FC<LeapLabProps> = ({
  model: propModel,
  modelId,
  allModels = mockLeapSandboxModels,
  _onBack,
  locale: propLocale,
  _className,
  _style,
}) => {`,
`export const LeapLab: React.FC<LeapLabProps> = ({
  model: propModel,
  modelId,
  allModels = mockLeapSandboxModels,
  locale: propLocale,
}) => {`
);
fs.writeFileSync('src/modules/sandbox/LeapLab.tsx', ll);

// 2. Fix LabWorkspace.tsx
let lw = fs.readFileSync('src/modules/sandbox/LabWorkspace.tsx', 'utf8');
lw = lw.replace(
`export interface LabWorkspaceProps {
  effectiveSandboxes: any[];
  effectiveLeapModels: any[];
  locale?: string;
  onBack?: () => void;
}`,
`export interface LabWorkspaceProps {
  effectiveSandboxes: any[];
  effectiveLeapModels: any[];
  locale?: string;
  onBack?: () => void;
  labSubView?: "concept_sandbox" | "leap_4d";
  onLabSubViewChange?: (view: "concept_sandbox" | "leap_4d") => void;
  selectedLeapModelId?: string;
  onSelectLeapModelId?: (id: string) => void;
}`
);

lw = lw.replace(
`export const LabWorkspace: React.FC<LabWorkspaceProps> = ({
  effectiveSandboxes,
  effectiveLeapModels,
  _locale = 'zh-CN',
}) => {
  const [labSubView, setLabSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");
  const [selectedSandboxId, setSelectedSandboxId] = useState<string>(effectiveSandboxes[0]?.id || "");
  const [selectedLeapModelId, setSelectedLeapModelId] = useState<string>(effectiveLeapModels[0]?.model_id || "");`,
`export const LabWorkspace: React.FC<LabWorkspaceProps> = ({
  effectiveSandboxes,
  effectiveLeapModels,
  locale = 'zh-CN',
  labSubView: controlledLabSubView,
  onLabSubViewChange,
  selectedLeapModelId: controlledLeapId,
  onSelectLeapModelId,
}) => {
  const [internalSubView, setInternalSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");
  const [selectedSandboxId, setSelectedSandboxId] = useState<string>(effectiveSandboxes[0]?.id || "");
  const [internalLeapId, setInternalLeapId] = useState<string>(effectiveLeapModels[0]?.model_id || "");

  const labSubView = controlledLabSubView ?? internalSubView;
  const setLabSubView = onLabSubViewChange ?? setInternalSubView;
  const selectedLeapModelId = controlledLeapId ?? internalLeapId;
  const setSelectedLeapModelId = onSelectLeapModelId ?? setInternalLeapId;`
);

// Pass locale down to LeapLab in renderSandboxMain
lw = lw.replace(
`return <LeapLab modelId={selectedLeapModelId} allModels={effectiveLeapModels} onBack={() => {}} />;`,
`return <LeapLab modelId={selectedLeapModelId} allModels={effectiveLeapModels} locale={locale} onBack={() => {}} />;`
);

fs.writeFileSync('src/modules/sandbox/LabWorkspace.tsx', lw);

// 3. Fix MathJuniorHome.tsx
let mjh = fs.readFileSync('src/MathJuniorHome.tsx', 'utf8');
if (!mjh.includes('const [labSubView, setLabSubView]')) {
  mjh = mjh.replace(
    'const [graphSubView, setGraphSubView] = useState<"map" | "loop">("map");',
    'const [graphSubView, setGraphSubView] = useState<"map" | "loop">("map");\n  const [labSubView, setLabSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");\n  const [selectedLeapModelId, setSelectedLeapModelId] = useState<string>("LM-8A-01");'
  );
}

// Pass props to LabWorkspace
mjh = mjh.replace(
`<LabWorkspace
            effectiveSandboxes={effectiveSandboxes}
            effectiveLeapModels={effectiveLeapModels}
            locale={locale}
          />`,
`<LabWorkspace
            effectiveSandboxes={effectiveSandboxes}
            effectiveLeapModels={effectiveLeapModels}
            locale={locale}
            labSubView={labSubView}
            onLabSubViewChange={setLabSubView}
            selectedLeapModelId={selectedLeapModelId}
            onSelectLeapModelId={setSelectedLeapModelId}
          />`
);

fs.writeFileSync('src/MathJuniorHome.tsx', mjh);
console.log('Fixes 2 applied');
