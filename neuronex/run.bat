@echo off
REM NeuroNex local preview helper
cd /d "%~dp0"
echo Starting NeuroNex local server at http://localhost:8000
start "" "http://localhost:8000"
python -m http.server 8000 2>nul || python3 -m http.server 8000 2>nul
if errorlevel 1 (
  echo.
  echo Python is not available or failed to start.
  echo Install Python 3, then run this file again, or open index.html in a browser that supports local modules.
  pause
)
