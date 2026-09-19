const fs = require('fs');
const file = 'src/MathJuniorHome.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import LabWorkspace
if (!content.includes('LabWorkspace')) {
  content = content.replace(
    "import { SandboxRenderer } from './modules/sandbox/SandboxRenderer';",
    "import { SandboxRenderer } from './modules/sandbox/SandboxRenderer';\nimport { LabWorkspace } from './modules/sandbox/LabWorkspace';"
  );
}

// Replace case "lab" block
const caseLabRegex = /case "lab":[\s\S]*?case "exam":/;
content = content.replace(caseLabRegex, `case "lab":
        return (
          <LabWorkspace
            effectiveSandboxes={effectiveSandboxes}
            effectiveLeapModels={effectiveLeapModels}
            locale={locale}
          />
        );

      case "exam":`);

fs.writeFileSync(file, content);
