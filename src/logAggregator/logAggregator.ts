// src/logAggregator.ts
import * as fs from 'fs-extra';
import * as path from 'path';
import { once } from 'events';
import moment from 'moment';
import { LogAggregatorConfig, LogEntry } from './types';

export class LogAggregator {
    private config: LogAggregatorConfig;

    constructor(config: LogAggregatorConfig) {
        this.config = config;
    }

    async aggregateLogs(): Promise<void> {
        try {
            const outputDir = path.dirname(this.config.outputFile);
            await fs.ensureDir(outputDir);

            const logEntries: LogEntry[] = [];
            for (const dir of this.config.logDirectories) {
                const entries = await this.collectLogsFromDir(dir);
                logEntries.push(...entries);
            }

            await this.writeToFile(logEntries);
        } catch (error) {
            console.error('Error aggregating logs:', error);
            throw error;
        }
    }

    private async collectLogsFromDir(dir: string): Promise<LogEntry[]> {
        const entries: LogEntry[] = [];
        try {
            const files = await this.walkDir(dir);
            for (const file of files) {
                if (this.isLogFile(file)) {
                    const content = await fs.readFile(file, 'utf-8');
                    const filteredContent = this.filterContent(content);
                    if (filteredContent) {
                        entries.push({ filePath: file, content: filteredContent });
                    }
                }
            }
        } catch (error) {
            console.warn(`Error reading directory ${dir}:`, error);
        }
        return entries;
    }

    private async walkDir(dir: string): Promise<string[]> {
        const files: string[] = [];
        const items = await fs.readdir(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                const subFiles = await this.walkDir(fullPath);
                files.push(...subFiles);
            } else {
                files.push(fullPath);
            }
        }
        return files;
    }

    /**
     * Determines if a file is a valid log file based on its extension and channel name.
     * 
     * The file must end with `.log`. If `config.channels` is defined and non-empty, 
     * the file's base name (without the `.log` extension and any leading number followed 
     * by a hyphen, e.g., `3-`) must exactly match one of the configured channel names 
     * (case-insensitive). Partial matches, prefixes, or extensions of the channel name 
     * are excluded. If no channels are specified, all `.log` files are accepted.
     * 
     * **Sample Cases:**
     * - Case 1: Channel "LLDB"
     *   - True: "LLDB.log", "3-LLDB.log"
     *   - False: "LLDB Language Server.log"
     * - Case 2: Channel "Python Language Server"
     *   - True: "Python Language Server.log", "2-Python Language Server.log"
     *   - False: "Python.log", "Toy Python Language Server.log"
     * 
     * @param file - The full path of the file to check.
     * @returns True if the file is a valid log file, false otherwise.
     */
    private isLogFile(file: string): boolean {
        if (!file.endsWith('.log')) {
            return false;
        }

        if (this.config.channels && this.config.channels.length > 0) {
            let baseName = path.basename(file, '.log');
            // Remove leading number and hyphen, e.g., "3-" from "3-LLDB"
            baseName = baseName.replace(/^\d+-/, '');
            const channelSet = new Set(this.config.channels.map(c => c.toLowerCase()));
            return channelSet.has(baseName.toLowerCase());
        }

        return true;
    }

    private filterContent(content: string): string {
        let lines = content.split('\n').filter((line) => {
            if (!line.trim()) return false;

            if (this.config.timeRangeHours) {
                const logDateMatch = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
                if (logDateMatch) {
                    const logDate = moment(logDateMatch[0], 'YYYY-MM-DD HH:mm:ss');
                    const earliestTime = moment().subtract(this.config.timeRangeHours, 'hours');
                    if (!logDate.isSameOrAfter(earliestTime)) {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            if (this.config.logLevel) {
                const validLevels = ['info', 'warning', 'error'];
                const levelIndex = validLevels.indexOf(this.config.logLevel.toLowerCase());
                if (levelIndex === -1) return false;

                const logLevelMatch = line.match(/\[(\w+)\]/);
                if (logLevelMatch) {
                    const logLevel = logLevelMatch[1].toLowerCase();
                    const logLevelIndex = validLevels.indexOf(logLevel);
                    if (logLevelIndex === -1 || logLevelIndex < levelIndex) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            return true;
        });

        if (this.config.maxLines && this.config.maxLines > 0) {
            lines = lines.slice(0, this.config.maxLines);
        }
        return lines.join('\n');
    }

    private async writeToFile(entries: LogEntry[]): Promise<void> {
        const stream = fs.createWriteStream(this.config.outputFile, { flags: 'w' });
        for (const entry of entries) {
            stream.write(`=== ${entry.filePath} ===\n`);
            stream.write(`${entry.content}\n`);
            stream.write(`\n`);
        }
        stream.end();
        await once(stream, 'finish');
    }
}
