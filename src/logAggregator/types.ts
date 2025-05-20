// src/types.ts
export interface LogAggregatorConfig {
  logDirectories: string[];
  outputFile: string;
  timeRangeHours?: number; // Number of hours in the past to include logs
  maxLines?: number; // Maximum lines per log file (0 or undefined for no limit)
  logLevel?: string; // Lowest log level to include (e.g., "info", "warning", "error")
  channels?: string[]; // Channels to include (e.g., ["Python", "GitHub"])
}

export interface LogEntry {
  filePath: string;
  content: string;
}
