# 3DM File Version Converter

A command-line utility to convert Rhino 3DM files between different Rhino versions (Rhino 2 through 8).

## Features

- Convert 3DM files to different Rhino versions (2, 3, 4, 5, 6, 7, 8)
- Process multiple files and directories
- Recursive directory processing
- Progress tracking
- Error reporting

## Installation

1. Ensure you have Python 3.7 or higher installed
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Basic Usage

```bash
python converter.py input.3dm --output output_folder --version 7
```

### Convert Multiple Files

```bash
python converter.py file1.3dm file2.3dm --output output_folder --version 6
```

### Convert All Files in a Directory

```bash
python converter.py input_folder --output output_folder --version 5
```

### Recursively Convert Files in Directory

```bash
python converter.py input_folder --output output_folder --version 4 --recursive
```

### Available Options

- `-o, --output`: Output directory (default: 'output')
- `-v, --version`: Target Rhino version (2-8, default: 7)
- `-r, --recursive`: Process directories recursively
- `--overwrite`: Overwrite existing files

## Notes

- The converter creates the output directory if it doesn't exist
- If the output directory contains files with the same names, they will be overwritten
- Only files with the .3dm extension are processed
- For best results, use the latest version of Rhino to open and save files before conversion

## License

MIT
