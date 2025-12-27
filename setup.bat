@echo off
echo Setting up ShoaeebBrowser...
echo.

echo Creating data files from templates...
if not exist "data\history.json" (
    copy "data\history.json.template" "data\history.json" >nul
    echo Created history.json
)

if not exist "data\bookmarks.json" (
    copy "data\bookmarks.json.template" "data\bookmarks.json" >nul
    echo Created bookmarks.json
)

if not exist "data\downloads.json" (
    copy "data\downloads.json.template" "data\downloads.json" >nul
    echo Created downloads.json
)

if not exist "data\blocked-sites.json" (
    copy "data\blocked-sites.json.template" "data\blocked-sites.json" >nul
    echo Created blocked-sites.json
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Setup complete! You can now run:
echo   npm start    - Run in development mode
echo   npm run build-win - Build executable
echo.
pause