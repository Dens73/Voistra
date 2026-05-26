$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$node = 'C:\Users\root\AppData\Local\OpenAI\Codex\bin\node.exe'
$log = Join-Path $root 'renderer-run.log'
$err = Join-Path $root 'renderer-run.err.log'

Set-Location (Join-Path $root 'apps\desktop')
& $node '..\..\node_modules\vite\bin\vite.js' '--host' '127.0.0.1' *> $log 2> $err
