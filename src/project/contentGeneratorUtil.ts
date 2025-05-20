import * as fs from 'fs';
import * as path from 'path';

function includeFile(filePath: string, displayLineNumbers: boolean = false): [string[], number] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    if (lines.some((line) => line.trim())) {
      const contentLines = [`=== Contents of ${filePath} ===`];
      if (displayLineNumbers) {
        // Add line numbers to each non-empty line
        lines.forEach((line, index) => {
          contentLines.push(`${(index + 1).toString().padStart(4, ' ')}: ${line}`);
        });
      } else {
        contentLines.push(...lines);
      }
      contentLines.push('');
      return [contentLines, lines.length];
    }
    return [[], 0];
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(`Error reading ${filePath}: ${errorMessage}`);
    return [[], 0];
  }
}

export function generateContent(
  filesToInclude: string[],
  displayLineNumbers: boolean = false
): [string[], Array<[string, number]>] {
  const contentLines: string[] = [];
  const includedFiles: Array<[string, number]> = [];
  let totalLines = 0;
  const LINE_LIMIT = 10000;

  for (const filePath of filesToInclude) {
    const [fileLines, lineCount] = includeFile(filePath, displayLineNumbers);
    if (lineCount > 0) {
      contentLines.push(...fileLines);
      includedFiles.push([filePath, lineCount]);
      totalLines += lineCount;
      if (totalLines > LINE_LIMIT) {
        contentLines.push('=== Line limit of 10,000 reached, further files not included ===');
        break;
      }
    }
  }

  return [contentLines, includedFiles];
}
