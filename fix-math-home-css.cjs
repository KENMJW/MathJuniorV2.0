const fs = require('fs');
const file = 'src/MathJuniorHome.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'fontSize: "0.78rem",',
  'fontSize: "0.78rem",\n                          maxWidth: "150px",\n                          overflow: "hidden",\n                          textOverflow: "ellipsis",\n                          whiteSpace: "nowrap",'
);
content = content.replace(
  '{item.nameZh.split(" ")[0]}',
  '{item.nameZh}'
);
content = content.replace(
  'cursor: "pointer",',
  'cursor: "pointer",\n                        }}\n                        title={item.nameZh}'
);

fs.writeFileSync(file, content);
