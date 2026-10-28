@echo off
setlocal
cd /d "%~dp0"
rem Desktop shortcuts may not inherit the Codex terminal's runtime PATH.
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;%PATH%"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not available in this terminal. See README.md for the verified runtime.
  pause
  exit /b 1
)
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm is not available in this terminal. See README.md for setup.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Install the project dependencies with pnpm install --frozen-lockfile first.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
set "BIND_ADDRESS=127.0.0.1"
echo VELNEST controller: http://localhost:5173
echo OBS Browser Source: http://localhost:5173/?view=overlay
echo Keep this window open while using the project. Press Ctrl+C to stop.
call pnpm dev
pause
