#!/bin/bash
# Install Python dependencies
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
python3 -m pip install --upgrade pip
python3 -m pip install -r "$DIR/requirements.txt"
