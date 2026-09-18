import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * 铁律 11 永久门禁测试：全局 UI 严禁任何 emoji (任务 21.4)
 *
 * 遍历 src 目录下的所有 ts 和 tsx 源码文件 (排除测试文件本身)
 * 采用 Unicode 扩展象形符号正则检测：/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u
 * 断言匹配数严格为 0。如有违规，清晰打印文件名、行号及违规行内容。
 */
describe("铁律 11 门禁：源码中绝对零 emoji", () => {
  function getSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "node_modules") {
          continue;
        }
        results.push(...getSourceFiles(fullPath));
      } else if (entry.isFile()) {
        if (
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
          !entry.name.includes(".test.") &&
          !entry.name.includes(".spec.")
        ) {
          results.push(fullPath);
        }
      }
    }

    return results;
  }

  it("断言 src/ 下所有 TypeScript/React 业务源码中零 emoji", () => {
    const srcDir = path.resolve(__dirname, "..");
    const sourceFiles = getSourceFiles(srcDir);
    expect(sourceFiles.length).toBeGreaterThan(15);

    const emojiRegex = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (emojiRegex.test(line)) {
          violations.push({
            file: path.relative(srcDir, file),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  [违规] ${v.file}:${v.line} -> "${v.text}"`)
        .join("\n");
      expect.fail(`检测到 ${violations.length} 处违规 emoji：\n${report}\n请使用 <Icon> 组件替换。`);
    }

    expect(violations).toHaveLength(0);
  });
});
