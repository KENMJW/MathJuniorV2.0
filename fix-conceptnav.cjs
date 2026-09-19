const fs = require('fs');
const file = 'src/ConceptNav.tsx';
let content = fs.readFileSync(file, 'utf8');

// Move currentPoint definition up
const currentPointMatch = content.match(/  const currentPoint = useMemo\(\(\) => \{[\s\S]*?\}, \[knowledgePoints, selectedPointId\]\);/);
if (currentPointMatch) {
  content = content.replace(currentPointMatch[0], '');
  content = content.replace(
    'const mainStageRef = React.useRef<HTMLElement>(null);',
    'const mainStageRef = React.useRef<HTMLElement>(null);\n\n' + currentPointMatch[0]
  );
}

// Add the initial data correction useEffect
const dataSyncEffect = `
  // 新增：真库数据就绪后校正初始筛选
  useEffect(() => {
    if (knowledgePoints.length > 0) {
      const pointExists = knowledgePoints.some(p => p.point_id === selectedPointId);
      if (!pointExists) {
        const first = knowledgePoints[0];
        setSelectedGrade(first.grade);
        setSelectedSemester(first.semester);
        setSelectedDomain(first.domain);
        setSelectedPointId(first.point_id);
      }
    }
  }, [knowledgePoints]);
`;

content = content.replace(
  '// 1. 提取所有可用年级',
  dataSyncEffect + '\n  // 1. 提取所有可用年级'
);

fs.writeFileSync(file, content);
