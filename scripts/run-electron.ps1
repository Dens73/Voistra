$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$node = (Get-Command node -ErrorAction Stop).Source
$electron = Join-Path $root 'node_modules\electron\cli.js'
$log = Join-Path $root 'electron-run.log'
$err = Join-Path $root 'electron-run.err.log'

$env:VITE_DEV_SERVER_URL = 'http://127.0.0.1:5173'
Set-Location (Join-Path $root 'apps\desktop')
& $node $electron 'dist-electron\main.js' *> $log 2> $err
