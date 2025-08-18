#!/bin/bash
# Create a clean distribution directory
DIST_DIR="3dm_version_converter_$(date +%Y%m%d)"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy necessary files
cp converter.py "$DIST_DIR/"
cp requirements.txt "$DIST_DIR/"
cp README.md "$DIST_DIR/"
cp convert.bat "$DIST_DIR/"
cp convert.sh "$DIST_DIR/"
cp gui.py "$DIST_DIR/"
cp run_gui.sh "$DIST_DIR/"
cp run_gui.bat "$DIST_DIR/"
cp run_gui.command "$DIST_DIR/"
cp install_deps.sh "$DIST_DIR/"
cp install_deps.bat "$DIST_DIR/"
chmod +x "$DIST_DIR/convert.sh"
chmod +x "$DIST_DIR/run_gui.sh"
chmod +x "$DIST_DIR/run_gui.command"
chmod +x "$DIST_DIR/install_deps.sh"

# Create a ZIP archive
zip -r "${DIST_DIR}.zip" "$DIST_DIR"

echo "Created distribution package: ${DIST_DIR}.zip"
