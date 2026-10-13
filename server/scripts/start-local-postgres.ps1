$ErrorActionPreference = "Stop"

$projectServer = Split-Path -Parent $PSScriptRoot
$pgData = Join-Path $projectServer ".pgdata"
$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$logDir = Join-Path $pgData "logs"

if (!(Test-Path -LiteralPath $pgCtl)) {
  throw "PostgreSQL 18 was not found at $pgCtl"
}

if (!(Test-Path -LiteralPath $pgData)) {
  throw "Local Postgres data folder not found at $pgData"
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

& $psql -h localhost -p 5433 -U postgres -d postgres -tAc "SELECT 1;" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Local Postgres is already running on port 5433."
  exit 0
}

$logFile = Join-Path $logDir ("postgres-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
& $pgCtl -D $pgData -o "-p 5433" -l $logFile -w start


