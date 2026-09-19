const fs = require('fs');
const file = 'src/MathJuniorHome.tsx';
let content = fs.readFileSync(file, 'utf8');

// Undo the broken replacement
content = content.replace(
  'cursor: "pointer",\n                        }}\n                        title={item.nameZh}\n        }}',
  'cursor: "pointer",\n        }}'
);

// Apply correctly to the sandbox button which has fontWeight: active ? 700 : 500, cursor: "pointer",
content = content.replace(
  'fontWeight: active ? 700 : 500,\n                          cursor: "pointer",\n                        }}\n                      >\n                        {item.nameZh}',
  'fontWeight: active ? 700 : 500,\n                          cursor: "pointer",\n                        }}\n                        title={item.nameZh}\n                      >\n                        {item.nameZh}'
);

fs.writeFileSync(file, content);
