// src/index.ts
import { loadConfig, Config } from './config/config';
import { selectFiles } from './lib/fileSelectorUtil';
import { LogAggregator } from './logAggregator/logAggregator';
import { LogAggregatorConfig } from './logAggregator/types';
import { generateContext } from './project/core';
import { ProjectConfig, loadProjectConfig, getGeneralConfig } from './config/configUtil';
import * as path from 'path';
import * as fs from 'fs-extra';
import clipboardy from 'clipboardy';

export {
  Config,
  loadConfig,
  selectFiles,
  LogAggregator,
  LogAggregatorConfig,
  ProjectConfig,
  loadProjectConfig,
  getGeneralConfig,
  generateContext,
  runProjectContext, 
  runLogAggregator, 
};

async function runLogAggregator(projectRoot: string) {
  try {
    const parsedConfig = await loadConfig(projectRoot, 'ch_config.toml');
    const logAggregatorRaw = parsedConfig.log_aggregator ?? {};
    if (typeof logAggregatorRaw !== 'object' || Array.isArray(logAggregatorRaw)) {
      throw new Error('[log_aggregator] section must be a table');
    }
    // Check if log_aggregator is enabled
    if (logAggregatorRaw.enabled !== true) {
      console.log('Log aggregator is disabled in configuration. Skipping.');
      return;
    }
    const logAggregatorConfig: Partial<LogAggregatorConfig> = {
      timeRangeHours: logAggregatorRaw.time_range_hours,
      maxLines: logAggregatorRaw.max_lines,
      logLevel: logAggregatorRaw.log_level,
      channels: logAggregatorRaw.channels,
    };
    const config: LogAggregatorConfig = {
      logDirectories: logAggregatorRaw.log_dirs && Array.isArray(logAggregatorRaw.log_dirs)
        ? logAggregatorRaw.log_dirs
        : [
            '/home/kazukik-wsl/.vscode-server/data/logs',
            '/mnt/c/Users/kazuk/AppData/Roaming/Code/logs',
          ],
      outputFile: path.join(projectRoot, '.context', 'channel_output.txt'),
      timeRangeHours: logAggregatorConfig.timeRangeHours,
      maxLines: logAggregatorConfig.maxLines,
      logLevel: logAggregatorConfig.logLevel,
      channels: logAggregatorConfig.channels,
    };
    const aggregator = new LogAggregator(config);
    await aggregator.aggregateLogs();
    console.log('Logs aggregated successfully to', config.outputFile);
  } catch (error) {
    console.error('Failed to aggregate logs:', error);
  }
}

async function runProjectContext(projectRoot: string) {
  try {
    const configDict = await loadProjectConfig(projectRoot);
    const [content, treeSummaries, allIncludedFiles] = await generateContext(projectRoot, configDict);
    const generalConfig = getGeneralConfig(configDict);
    const printSummary = generalConfig.print_summary ?? false;
    if (printSummary) {
      if (treeSummaries.length > 0) {
        console.log('=== Tree Summaries ===');
        for (const [baseDir, lineCount] of treeSummaries) {
          console.log(`${lineCount.toString().padStart(10)} : tree for ${baseDir}`);
        }
      }
      if (allIncludedFiles.length > 0) {
        console.log('=== Included Files Summary ===');
        console.log(' length    : path');
        let totalLines = 0;
        for (const [filePath, lineCount] of allIncludedFiles) {
          console.log(`${lineCount.toString().padStart(10)} : ${filePath}`);
          totalLines += lineCount;
        }
        if (totalLines > 10000) {
          console.log('~~~ Note: Line limit of 10,000 reached ~~~');
        }
        console.log(`\n${totalLines.toString().padStart(10)} : total lines`);
      }
    }
    if (content) {
      const historyDir = path.join(projectRoot, '.context');
      const contentFilePath = path.join(historyDir, 'context.txt');
      fs.mkdirSync(historyDir, { recursive: true });
      fs.writeFileSync(contentFilePath, content, 'utf8');
      console.log(`Saved to ${contentFilePath}`);
      const copyToClipboard = generalConfig.copy_to_clipboard ?? false;
      if (copyToClipboard) {
        await clipboardy.write(content);
        console.log('Contents copied to clipboard.');
      }
    } else {
      console.log('No content generated.');
    }
  } catch (e) {
    console.error('Error:', e instanceof Error ? e.message : String(e));
  }
}

export async function main(projectRoot: string = process.env.PROJECT_ROOT || process.cwd()) {
  try {
    const config = await loadProjectConfig(projectRoot);
    let ranSomething = false;

    // Check if project context should run (content or tree enabled)
    const contentEnabled = config.content?.enabled === true;
    const treeEnabled = config.tree?.enabled === true;
    if (contentEnabled || treeEnabled) {
      await runProjectContext(projectRoot);
      ranSomething = true;
    } else {
      console.log('Project context (content and tree) is disabled in configuration. Skipping.');
    }

    // Check if log aggregator should run
    if (config.log_aggregator?.enabled === true) {
      await runLogAggregator(projectRoot);
      ranSomething = true;
    } else {
      console.log('Log aggregator is disabled in configuration. Skipping.');
    }

    if (!ranSomething) {
      console.log('No tasks enabled in configuration. Please enable at least one of content, tree, or log_aggregator.');
    }
  } catch (error) {
    console.error('Error running tasks:', error);
    throw error; // Rethrow to allow CLI to handle exit code
  }
}

if (require.main === module) {
  main();
}
