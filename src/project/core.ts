import * as path from 'path';
import { generateTree } from './treeUtil';
import { selectFiles } from '../lib/fileSelectorUtil';
import { generateContent } from './contentGeneratorUtil';
import { getEffectiveConfig } from '../config/configUtil';

export async function generateContext(
  projectRoot: string,
  configDict: any
): Promise<[string, Array<[string, number]>, Array<[string, number]>]> {
  const treeSections = ['tree', 'tree-extra'];
  const contentSections = ['content', 'content-extra'];

  const contentLines: string[] = [];
  const treeSummaries: Array<[string, number]> = [];
  const allIncludedFiles: Array<[string, number]> = [];

  // Process tree sections
  for (const sectionName of treeSections) {
    if (sectionName in configDict) {
      const effectiveConfig = getEffectiveConfig(configDict, sectionName);
      if (effectiveConfig.enabled !== false) {
        const baseDirRel = effectiveConfig.base_dir || '';
        const actualBaseDir = baseDirRel.startsWith('/')
          ? baseDirRel
          : path.join(projectRoot, baseDirRel);
        const excludeDirs = effectiveConfig.exclude_dirs || [];
        const defaultDepth = effectiveConfig.default_depth || 1;
        const limits = effectiveConfig.limits || {};
        const treeStructure = generateTree(actualBaseDir, defaultDepth, limits, excludeDirs);
        const treeLineCount = treeStructure.split('\n').length;
        contentLines.push(`=== Directory Tree for ${actualBaseDir} ===`);
        contentLines.push(treeStructure);
        contentLines.push('');
        treeSummaries.push([actualBaseDir, treeLineCount]);
      }
    }
  }

  // Process content sections
  for (const sectionName of contentSections) {
    if (sectionName in configDict) {
      const effectiveConfig = getEffectiveConfig(configDict, sectionName);
      if (effectiveConfig.enabled !== false) {
        const filesToInclude = selectFiles(projectRoot, effectiveConfig);
        const displayLineNumbers = effectiveConfig.display_line_numbers ?? false;
        const [fileContentLines, includedFiles] = generateContent(filesToInclude, displayLineNumbers);
        contentLines.push(...fileContentLines);
        allIncludedFiles.push(...includedFiles);
      }
    }
  }

  const content = contentLines.join('\n');
  return [content, treeSummaries, allIncludedFiles];
}
