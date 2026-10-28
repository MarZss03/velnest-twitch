# Keep downloaded runtimes, fonts and render caches on D:.
$env:npm_config_cache = 'D:/.npm-cache'
$env:HYPERFRAMES_BROWSER_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:HYPERFRAMES_FONT_CACHE_DIR = 'D:/.cache/hyperframes/fonts'
$env:HYPERFRAMES_EXTRACT_CACHE_DIR = 'D:/.cache/hyperframes/extract'
$env:DO_NOT_TRACK = '1'
& npx --yes hyperframes@0.8.209 @args
exit $LASTEXITCODE
