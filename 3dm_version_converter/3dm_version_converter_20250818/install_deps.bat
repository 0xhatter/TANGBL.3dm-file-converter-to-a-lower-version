@echo off
REM Install Python dependencies
python -m pip install --upgrade pip
python -m pip install -r "%~dp0requirements.txt"
