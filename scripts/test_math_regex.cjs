const text = '依据题意，利用第三象限点的坐标特征得到$\\left\\{ \\begin{matrix}\na - 2＜0 \\\\\n1 + a＜0\n\\end{matrix} \\right. $，然后解不等式组即可．';
const oldRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
const newRegex = /(\$\$[\s\S]*?\$\$|\$(?:[^\$\n]|\n(?!\s*\n))+?\$)/g;

console.log('Old match:', text.match(oldRegex));
console.log('New match:', text.match(newRegex));
