const fs = require('fs');
const file = 'src/modules/concept/SvgLayerReveal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const hideFormalLabels = activeStage === 2;",
  "const hideFormalLabels = activeStage === 2;"
);

const newStyle = `
        .concept-svg-container .layer-stage-1,
        .concept-svg-container .layer-stage-2,
        .concept-svg-container .layer-stage-3,
        .concept-svg-container .layer-stage-4,
        .concept-svg-container .formal-labels {
          transition: opacity 0.4s var(--spring-smooth, ease);
          opacity: 1;
        }
        .concept-svg-container.stage-1 .layer-stage-2,
        .concept-svg-container.stage-1 .layer-stage-3,
        .concept-svg-container.stage-1 .layer-stage-4,
        .concept-svg-container.stage-1 .formal-labels {
          opacity: 0 !important;
        }
        .concept-svg-container.stage-2 .layer-stage-3,
        .concept-svg-container.stage-2 .layer-stage-4,
        .concept-svg-container.stage-2 .formal-labels,
        .concept-svg-container.hide-formal-labels .formal-labels {
          opacity: 0 !important;
        }
        .concept-svg-container.stage-3 .layer-stage-4 {
          opacity: 0 !important;
        }
        .concept-svg-container svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
`;

content = content.replace(
  /\.concept-svg-container\.hide-formal-labels \.formal-labels \{[\s\S]*?overflow: visible;\n        \}/,
  newStyle.trim()
);

content = content.replace(
  /className=\{`concept-svg-container svg-layer-reveal \$\{className\} \$\{hideFormalLabels \? 'hide-formal-labels' : ''\}`\}/,
  "className={`concept-svg-container svg-layer-reveal stage-${activeStage} ${className} ${hideFormalLabels ? 'hide-formal-labels' : ''}`}"
);

fs.writeFileSync(file, content);
