// packages/context-utils/src/config.ts
import * as fs from 'fs-extra';
import * as path from 'path';
import * as toml from '@iarna/toml';

export interface Config {
  [key: string]: any;
}

export async function loadConfig(projectRoot: string, configFile: string = 'ch_config.toml'): Promise<Config> {
  const configPath = path.join(projectRoot, '.context', configFile);
  const defaultConfigPath = path.resolve(__dirname, 'ch_config_default.toml');

  // Check if ch_config.toml exists, and if not, copy ch_config_default.toml
  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(defaultConfigPath)) {
      // Ensure .context directory exists
      const contextDir = path.join(projectRoot, '.context');
      fs.ensureDirSync(contextDir);

      // Copy ch_config_default.toml to .context/ch_config.toml
      fs.copyFileSync(defaultConfigPath, configPath);
      console.log(`Copied ${defaultConfigPath} to ${configPath}`);
    } else {
      throw new Error(`Neither ${configPath} nor ${defaultConfigPath} exists.`);
    }
  }

  // Load the configuration file
  const configContent = fs.readFileSync(configPath, 'utf8');
  return toml.parse(configContent) as Config;
}

export function validateConfig(config: Config, expectedSections: string[]): void {
  for (const section of Object.keys(config)) {
    if (!expectedSections.includes(section)) {
      throw new Error(`Unexpected section '${section}' in configuration.`);
    }
  }
}
