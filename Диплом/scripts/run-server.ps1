$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$node = 'C:\Users\root\AppData\Local\OpenAI\Codex\bin\node.exe'
$log = Join-Path $root 'server-run.log'
$err = Join-Path $root 'server-run.err.log'

Set-Location (Join-Path $root 'apps\server')
& $node 'dist\main.js' *> $log 2> $err
