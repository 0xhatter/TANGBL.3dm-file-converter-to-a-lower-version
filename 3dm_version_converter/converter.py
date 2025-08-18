#!/usr/bin/env python3
"""
3DM File Version Converter
A utility to convert Rhino 3DM files between different versions.
"""
import os
import sys
import click
from pathlib import Path
from tqdm import tqdm
import rhino3dm

# Supported Rhino versions and their corresponding file versions
RHINO_VERSIONS = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8
}

def get_version_number(version_str):
    """Convert version string to corresponding file version number."""
    version_str = str(version_str).lower().replace('rhino', '').strip()
    return RHINO_VERSIONS.get(version_str, RHINO_VERSIONS['7'])  # Default to Rhino 7 if version not found

def convert_file(input_path, output_path, target_version, overwrite=False):
    """Convert a single 3DM file to the target version."""
    try:
        # Respect overwrite flag
        if output_path.exists() and not overwrite:
            return False, f"Output exists and --overwrite not set: {output_path}"

        # Read the file
        model = rhino3dm.File3dm.Read(str(input_path))
        
        # Write to the target version
        model.Write(str(output_path), target_version)
        return True, ""
    except Exception as e:
        return False, str(e)

def process_files(input_paths, output_dir, target_version, recursive=False, overwrite=False):
    """Process multiple 3DM files."""
    input_paths = [Path(p) for p in input_paths]
    processed = 0
    errors = []
    
    # Expand directories if recursive is True
    all_inputs = []
    for path in input_paths:
        if path.is_dir():
            if recursive:
                all_inputs.extend(path.rglob('*.3dm'))
            else:
                all_inputs.extend(path.glob('*.3dm'))
        else:
            all_inputs.append(path)
    
    # Process each file
    for input_path in tqdm(all_inputs, desc="Converting files"):
        if input_path.suffix.lower() != '.3dm':
            errors.append(f"Skipping non-3DM file: {input_path}")
            continue
            
        # Create output path
        rel_path = input_path.relative_to(input_paths[0].parent) if len(input_paths) > 1 else input_path.name
        output_path = Path(output_dir) / rel_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert the file
        success, error = convert_file(input_path, output_path, target_version, overwrite=overwrite)
        if success:
            processed += 1
        else:
            errors.append(f"Error converting {input_path}: {error}")
    
    return processed, errors

@click.command()
@click.argument('input_paths', nargs=-1, type=click.Path(exists=True))
@click.option('--output', '-o', default='output', help='Output directory', type=click.Path())
@click.option('--version', '-v', default='7', 
              type=click.Choice(list(RHINO_VERSIONS.keys()), case_sensitive=False),
              help='Target Rhino version')
@click.option('--recursive', '-r', is_flag=True, help='Process directories recursively')
@click.option('--overwrite', is_flag=True, help='Overwrite existing files')
def main(input_paths, output, version, recursive, overwrite):
    """Convert Rhino 3DM files to a different version."""
    if not input_paths:
        click.echo("Error: No input files or directories specified.")
        sys.exit(1)
    
    # Convert version string to number
    target_version = get_version_number(version)
    
    # Create output directory
    output_path = Path(output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Process files
    click.echo(f"Converting files to Rhino {version} format (file version {target_version})...")
    processed, errors = process_files(input_paths, output_path, target_version, recursive, overwrite)
    
    # Print summary
    click.echo("\nConversion complete!")
    click.echo(f"Successfully processed: {processed} files")
    
    if errors:
        click.echo("\nErrors occurred during processing:")
        for error in errors:
            click.echo(f"  - {error}")

if __name__ == "__main__":
    main()
