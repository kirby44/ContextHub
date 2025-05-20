import * as fs from 'fs';
import * as path from 'path';

export function selectFiles(projectRoot: string, contentConfig: any): string[] {
  const filesToInclude: string[] = [];

  // Resolve base directory
  const baseDirRel = contentConfig.base_dir || '';
  const actualBaseDir = baseDirRel.startsWith('/')
    ? baseDirRel
    : path.join(projectRoot, baseDirRel);

  // Get configuration options
  const excludeDirs = contentConfig.exclude_dirs || [];
  const excludePrefixes = contentConfig.exclude_prefixes || [];
  const excludeSuffixes = contentConfig.exclude_suffixes || [];
  const recursive = contentConfig.recursive || false;
  const prefixes = contentConfig.prefixes || [];
  const suffixes = contentConfig.suffixes || [];
  const allDirs = contentConfig.all_dirs || [];
  const allDirsFull = allDirs.map((d: string) => path.join(actualBaseDir, d));
  const allDirsRecursive = contentConfig.all_dirs_recursive || [];
  const allDirsRecursiveFull = allDirsRecursive.map((d: string) => path.join(actualBaseDir, d));

  // Set up directory walker
  const walk = (dir: string, isRecursive: boolean): Array<[string, string[], string[]]> => {
    try {
      const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
      const dirs = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isDirectory());
      if (isRecursive) {
        const results: Array<[string, string[], string[]]> = [[dir, dirs, files]];
        for (const subDir of dirs) {
          if (!excludeDirs.includes(subDir)) {
            results.push(...walk(path.join(dir, subDir), true));
          }
        }
        return results;
      }
      return [[dir, dirs, files]];
    } catch (e) {
      return [];
    }
  };

  const walker = recursive || allDirsRecursive.length > 0 ? walk(actualBaseDir, true) : walk(actualBaseDir, false);

  // Collect files
  for (const [root, dirs, files] of walker) {
    const filteredDirs = dirs.filter((d) => !excludeDirs.includes(d));
    const isAllDir =
      allDirsFull.includes(root) ||
      allDirsRecursiveFull.some((dirPath: string) => root === dirPath || root.startsWith(dirPath + path.sep));

    for (const file of files) {
      if (
        isAllDir &&
        !excludePrefixes.some((prefix: string) => file.startsWith(prefix)) &&
        !excludeSuffixes.some((suffix: string) => file.endsWith(suffix))
      ) {
        filesToInclude.push(path.join(root, file));
      } else if (
        (prefixes.some((p: string) => p === '*' || file.startsWith(p.replace('*', ''))) ||
          suffixes.some((s: string) => s === '*' || file.endsWith(s.replace('*', '')))) &&
        !excludePrefixes.some((prefix: string) => file.startsWith(prefix)) &&
        !excludeSuffixes.some((suffix: string) => file.endsWith(suffix))
      ) {
        filesToInclude.push(path.join(root, file));
      }
    }
  }

  return filesToInclude;
}
