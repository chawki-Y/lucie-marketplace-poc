$ErrorActionPreference = "Stop"

$projectServer = Split-Path -Parent $PSScriptRoot
$pgData = Join-Path $projectServer ".pgdata"
$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$logFile = Join-Path $pgData "postgres.log"

if (!(Test-Path -LiteralPath $pgCtl)) {
  throw "PostgreSQL 18 was not found at $pgCtl"
}

if (!(Test-Path -LiteralPath $pgData)) {
  throw "Local Postgres data folder not found at $pgData"
}

& $pgCtl -D $pgData -o "-p 5433" -l $logFile start

