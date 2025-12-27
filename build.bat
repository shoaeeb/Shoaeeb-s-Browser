@echo off
echo Building ShoaeebBrowser...
echo.

echo Installing dependencies...
call npm install

echo.
echo Building Windows executable...
call npm run build-win

echo.
echo Build complete!
echo.
echo Your executable is ready at:
echo   dist\ShoaeebBrowser Setup 1.0.0.exe
echo.
echo Portable version is at:
echo   dist\win-unpacked\ShoaeebBrowser.exe
echo.
pause