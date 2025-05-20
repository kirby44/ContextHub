// packages/project-context/src/configUtil.ts
import { loadConfig, validateConfig, Config } from './config';
import * as path from 'path';

export interface ProjectConfig extends Config {
  general?: { print_summary?: boolean; copy_to_clipboard?: boolean };
  shared?: Record<string, any>;
  tree?: TreeConfig;
  'tree-extra'?: TreeConfig;
  content?: ContentConfig;
  'content-extra'?: ContentConfig;
  callstack?: any;
  log_aggregator?: any;
}

interface TreeConfig {
  enabled?: boolean;
  base_dir?: string;
  exclude_dirs?: string[];
  default_depth?: number;
  limits?: Record<string, number>;
}

interface ContentConfig {
  enabled?: boolean;
  base_dir?: string;
  exclude_dirs?: string[];
  exclude_prefixes?: string[];
  exclude_suffixes?: string[];
  recursive?: boolean;
  prefixes?: string[];
  suffixes?: string[];
  all_dirs?: string[];
  all_dirs_recursive?: string[];
  display_line_numbers?: boolean;
}

export async function loadProjectConfig(projectRoot: string): Promise<ProjectConfig> {
  const config = await loadConfig(projectRoot);
  validateConfig(config, [
    'general',
    'shared',
    'tree',
    'tree-extra',
    'content',
    'content-extra',
    'callstack',
    'log_aggregator',
  ]);
  return config as ProjectConfig;
}

export function getEffectiveConfig(config: ProjectConfig, sectionName: string): Record<string, any> {
  const sharedConfig = config.shared || {};
  const sectionConfig = (config[sectionName as keyof ProjectConfig] as Record<string, any>) || {};
  return { ...sharedConfig, ...sectionConfig };
}

export function getGeneralConfig(config: ProjectConfig): { print_summary?: boolean; copy_to_clipboard?: boolean } {
  return config.general ?? {};
}
