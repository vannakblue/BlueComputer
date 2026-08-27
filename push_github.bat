@echo off
title Blue Computer - 1-Click Push to GitHub
color 0A
cls

echo =====================================================================
echo                BLUE COMPUTER - PUSH CHANGES TO GITHUB
echo =====================================================================
echo.

set /p COMMIT_MSG="Enter commit message (Press Enter for 'Update BlueComputer'): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update BlueComputer

echo.
echo [1/3] Adding modified files (git add .)...
git add .

echo.
echo [2/3] Committing with message: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Pushing to GitHub (Render will auto-deploy live)...
git push origin main

echo.
echo =====================================================================
echo  [DONE] Successfully pushed to GitHub! Render will deploy live now.
echo =====================================================================
echo.
pause
