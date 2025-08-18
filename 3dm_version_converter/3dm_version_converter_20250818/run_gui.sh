#!/bin/bash
# Launch the 3DM Version Converter GUI (macOS/Linux)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec python3 "$DIR/gui.py" "$@"
