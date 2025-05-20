
# ContextHub

## Overview

**ContextHub** is a TypeScript-based tool designed to generate project context, including directory trees and file contents, and aggregate logs based on a TOML configuration file. It provides a command-line interface (CLI) to automate the process of collecting and summarizing project-related information, with features like clipboard integration and customizable output.

## Features

- **Directory Tree Generation**: Creates a visual representation of a project's directory structure with configurable depth and exclusion rules.
- **File Content Extraction**: Selectively includes file contents based on prefixes, suffixes, and directory rules, with optional line numbering.
- **Log Aggregation**: Collects and filters logs from specified directories, supporting criteria like time range, log level, and channel names.
- **Configuration-Driven**: Uses a TOML file (`cp_config.toml`) for flexible customization of tree, content, and log aggregation settings.
- **Clipboard Support**: Optionally copies generated context to the clipboard.
- **Summary Output**: Provides summaries of included files and directory trees when enabled.

## Installation

1. Clone the repository or download the source code.
2. Ensure Node.js (version 16 or higher) is installed.
3. Navigate to the project directory and install dependencies:

   ```bash
   npm install
   ```

4. Build the project:

   ```bash
   npm run build
   ```

## Usage

Run the ContextHub CLI using the `ctx` command. By default, it uses the current working directory as the project root, or you can specify a `PROJECT_ROOT` environment variable.

```bash
npx ctx
```

## Configuration

ContextHub is configured via a `ch_config.toml` file located in the `.context` directory of the project root. This TOML file supports multiple sections to customize directory tree generation, file content extraction, and log aggregation. Below are the available sections and their options, with explanations.

### Configuration Sections

#### `[general]`
Controls general output behavior.

| Option              | Type    | Description                                                                 |
|---------------------|---------|-----------------------------------------------------------------------------|
| `print_summary`     | Boolean | If `true`, prints summaries of directory trees and included files to console. Default: `false`. |
| `copy_to_clipboard` | Boolean | If `true`, copies generated context to the system clipboard. Default: `false`. |

#### `[shared]`
A flexible section for shared settings that can be merged into other sections. Accepts any key-value pairs, which override defaults in `tree`, `tree-extra`, `content`, or `content-extra` sections when referenced.

| Option | Type            | Description                                      |
|--------|-----------------|--------------------------------------------------|
| Custom | Any             | User-defined key-value pairs for shared settings. |

#### `[tree]` and `[tree-extra]`
Configures directory tree generation. Both sections share the same options, allowing multiple tree configurations.

| Option          | Type            | Description                                                                 |
|-----------------|-----------------|-----------------------------------------------------------------------------|
| `enabled`       | Boolean         | If `true`, enables tree generation. Default: `false`.                        |
| `base_dir`      | String          | Base directory for the tree (relative to project root or absolute). Default: `""`. |
| `exclude_dirs`  | Array of String | Directories to exclude from the tree. Default: `[]`.                         |
| `default_depth` | Number          | Default depth for directory traversal. Default: `1`.                         |
| `limits`        | Object          | Maps directory paths to specific depth limits, overriding `default_depth`. Default: `{}`. |

#### `[content]` and `[content-extra]`
Configures file content extraction. Both sections share the same options, allowing multiple content configurations.

| Option                | Type            | Description                                                                 |
|-----------------------|-----------------|-----------------------------------------------------------------------------|
| `enabled`             | Boolean         | If `true`, enables file content extraction. Default: `false`.                |
| `base_dir`            | String          | Base directory for file selection. Default: `""`.                            |
| `exclude_dirs`        | Array of String | Directories to exclude from file selection. Default: `[]`.                   |
| `exclude_prefixes`    | Array of String | File name prefixes to exclude. Default: `[]`.                                |
| `exclude_suffixes`    | Array of String | File name suffixes to exclude. Default: `[]`.                                |
| `recursive`           | Boolean         | If `true`, searches directories recursively. Default: `false`.               |
| `prefixes`            | Array of String | File name prefixes to include (`"*" ` for all). Default: `[]`.               |
| `suffixes`            | Array of String | File name suffixes to include (`"*" ` for all). Default: `[]`.               |
| `all_dirs`            | Array of String | Directories where all files are included (non-recursive). Default: `[]`.     |
| `all_dirs_recursive`  | Array of String | Directories where all files are included recursively. Default: `[]`.         |
| `display_line_numbers`| Boolean         | If `true`, includes line numbers in file content output. Default: `false`.   |

#### `[log_aggregator]`
Configures log aggregation from specified directories.

| Option            | Type            | Description                                                                 |
|-------------------|-----------------|-----------------------------------------------------------------------------|
| `enabled`         | Boolean         | If `true`, enables log aggregation. Default: `false`.                        |
| `log_dirs`        | Array of String | Directories to search for log files. Default: VSCode log directories.        |
| `output_file`     | String          | Path for aggregated log output. Default: `.context/channel_output.txt`.      |
| `time_range_hours`| Number          | Hours in the past to include logs (based on timestamp). Default: Unlimited.  |
| `max_lines`       | Number          | Maximum lines per log file (0 for no limit). Default: `0`.                   |
| `log_level`       | String          | Minimum log level to include (`"info"`, `"warning"`, `"error"`). Default: Any. |
| `channels`        | Array of String | Channel names for log files (case-insensitive, exact match). Default: `[]`.  |

### Example `ch_config.toml`

```toml
[general]
print_summary = true
copy_to_clipboard = true

[shared]
exclude_dirs = ["node_modules"]

[tree]
enabled = true
default_depth = 2

[content]
enabled = true
base_dir = "src"
exclude_dirs = ["dist"]
exclude_prefixes = ["package-lock"]
exclude_suffixes = [".js"]
recursive = true
prefixes = ["cli"]
suffixes = [".ts"]

[log_aggregator]
enabled = true
log_dirs = ["/home/kazukik-wsl/.vscode-server/data/logs", "/mnt/c/Users/kazuk/AppData/Roaming/Code/logs"]
output_file = ".context/logs.txt"
log_level = "info"
channels = ["LLDB", "Python Language Server"]
```

## Output

- **Context Output**: Generated context (directory trees and file contents) is saved to `.context/context.txt`.
- **Log Output**: Aggregated logs are saved to `.context/channel_output.txt`.
- **Summaries**: If `print_summary` is enabled, summaries of directory trees and included files are printed to the console.

## Project Structure

```
ContextHub
├── src/                     # Source code
│   ├── cli.ts               # CLI entry point
│   ├── config/              # Configuration loading and utilities
│   ├── lib/                 # Utility functions (file selection, context generation)
│   ├── logAggregator/       # Log aggregation logic
│   ├── project/             # Project context generation (tree, content)
│   └── index.ts             # Main exports and orchestration
├── dist/                    # Compiled JavaScript and type definitions
├── package.json             # Project metadata and dependencies
├── tsconfig.json            # TypeScript configuration
├── eslint.config.mjs        # ESLint configuration
```

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details (if applicable).

## Questions?
If you have any questions, feel free to ask your favorite LLM — I’m sure it knows everything about this project and can serve your needs even better than I can! 😊
And hey, if you’re satisfied, buy *me* a coffee — I’m pretty sure I can enjoy it more than your LLM ever could. ☕😉