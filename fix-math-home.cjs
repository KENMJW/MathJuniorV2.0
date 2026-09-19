const fs = require('fs');
const file = 'src/MathJuniorHome.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "dbClient.query<any>('sandbox', 'SELECT * FROM leap_sandbox_models ORDER BY model_id ASC'),",
  "dbClient.query<any>('sandbox', 'SELECT * FROM leap_sandbox_models ORDER BY model_id ASC'),\n          dbClient.query<any>('core', 'SELECT point_id, name_zh FROM knowledge_points'),"
);

content = content.replace(
  "const [sbRows, leapRows] = await Promise.all([",
  "const [sbRows, leapRows, kpRows] = await Promise.all(["
);

const mapCode = `
          const kpMap = new Map();
          if (kpRows) {
            kpRows.forEach(r => kpMap.set(r.point_id, r.name_zh));
          }
          const mappedSandboxes = sbRows.map((r: any) => ({
            id: String(r.sandbox_id),
            nameZh: kpMap.get(r.point_id) || r.sandbox_id,
            nameEn: String(r.sandbox_id),
`;

content = content.replace(
  "const mappedSandboxes = sbRows.map((r: any) => ({",
  mapCode
);

content = content.replace(
  "nameZh: `${r.sandbox_id} (${r.canvas_template || '几何'})`,",
  ""
);
content = content.replace(
  "nameEn: String(r.sandbox_id),",
  ""
);

content = content.replace(
  "nameZh: `${r.model_id} (模型)`,",
  "nameZh: r.model_name_zh || r.model_id,"
);


fs.writeFileSync(file, content);
