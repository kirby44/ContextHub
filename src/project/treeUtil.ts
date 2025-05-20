import * as fs from 'fs';
import * as path from 'path';

function tree(
  dirPath: string,
  depth: number,
  maxDepth: number,
  specifiedLimits: Record<string, number>,
  excludeDirs: string[],
  relativePath: string,
  prefix: string,
  lines: string[]
): void {
  if (depth >= maxDepth) return;

  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return;

  let contents: string[];
  try {
    contents = fs.readdirSync(dirPath).sort();
  } catch (e) {
    return;
  }

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i];
    const subPath = path.join(dirPath, item);
    if (fs.statSync(subPath).isDirectory() && excludeDirs.includes(item)) continue;

    const subRelativePath = relativePath ? path.join(relativePath, item) : item;
    const isLast = i === contents.length - 1;

    let subtreeMaxDepth = maxDepth;
    if (subRelativePath in specifiedLimits) {
      subtreeMaxDepth = specifiedLimits[subRelativePath];
    } else {
      for (const [specPath, limit] of Object.entries(specifiedLimits)) {
        if (subRelativePath.startsWith(specPath + path.sep)) {
          subtreeMaxDepth = limit;
          break;
        }
      }
    }

    const itemPrefix = prefix + (isLast ? '└── ' : '├── ');
    const subPrefix = prefix + (isLast ? '    ' : '│   ');

    lines.push(itemPrefix + item);

    if (fs.statSync(subPath).isDirectory() && depth + 1 < subtreeMaxDepth) {
      tree(subPath, depth + 1, subtreeMaxDepth, specifiedLimits, excludeDirs, subRelativePath, subPrefix, lines);
    }
  }
}

export function generateTree(
  directory: string,
  defaultDepth: number,
  specifiedLimits: Record<string, number>,
  excludeDirs: string[] = []
): string {
  const lines: string[] = [directory];
  tree(directory, 0, defaultDepth, specifiedLimits, excludeDirs, '', '', lines);
  return lines.join('\n');
}
