$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = Join-Path $Root "tools"
New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

$OutFile = Join-Path $ToolsDir "aihubshell"
$Url = "https://api.aihub.or.kr/api/aihubshell.do"

Write-Host "Downloading aihubshell..."
Invoke-WebRequest -Uri $Url -OutFile $OutFile

Write-Host "Done. Git Bash에서 실행: bash tools/aihubshell -help"
Write-Host "Optional: AIHUB_SHELL_PATH=$OutFile in .env.local"
