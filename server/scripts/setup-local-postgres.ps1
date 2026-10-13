$ErrorActionPreference = "Stop"

$serverRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $serverRoot
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$initDb = Join-Path $pgBin "initdb.exe"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
$createdb = Join-Path $pgBin "createdb.exe"
$psql = Join-Path $pgBin "psql.exe"
$pgData = Join-Path $serverRoot ".pgdata"
$logDir = Join-Path $pgData "logs"
$dbName = "lucie_marketplace_poc"
$dbUrl = "postgres://postgres@localhost:5433/$dbName"
$envPath = Join-Path $serverRoot ".env"
$schemaPath = Join-Path $serverRoot "db\lucie_usage_logs.sql"
$seedPath = Join-Path $serverRoot "db\seed_usage_logs.sql"

function Test-DatabaseServerReady {
  try {
    & $psql -h localhost -p 5433 -U postgres -d postgres -tAc "SELECT 1;" 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

foreach ($tool in @($initDb, $pgCtl, $createdb, $psql)) {
  if (!(Test-Path -LiteralPath $tool)) {
    throw "PostgreSQL tool not found: $tool"
  }
}

if (!(Test-Path -LiteralPath $pgData)) {
  Write-Host "Initializing local Postgres data folder..."
  & $initDb -D $pgData -U postgres -A trust --encoding=UTF8 --locale=C
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if (Test-DatabaseServerReady) {
  Write-Host "Local Postgres is already running on port 5433."
} else {
  Write-Host "Starting local Postgres on port 5433..."
  $logFile = Join-Path $logDir ("postgres-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
  & $pgCtl -D $pgData -o "-p 5433" -l $logFile -w start
}

$exists = & $psql -h localhost -p 5433 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
if ($exists.Trim() -ne "1") {
  Write-Host "Creating database $dbName..."
  & $createdb -h localhost -p 5433 -U postgres $dbName
}

Write-Host "Applying schema..."
& $psql -h localhost -p 5433 -U postgres -d $dbName -f $schemaPath

Write-Host "Seeding test usage logs..."
& $psql -h localhost -p 5433 -U postgres -d $dbName -f $seedPath

if (!(Test-Path -LiteralPath $envPath)) {
  Copy-Item -LiteralPath (Join-Path $serverRoot ".env.example") -Destination $envPath
}

$envContent = Get-Content -LiteralPath $envPath -Raw
if ($envContent -match "(?m)^DATABASE_URL=") {
  $envContent = $envContent -replace "(?m)^DATABASE_URL=.*$", "DATABASE_URL=$dbUrl"
} else {
  if (!$envContent.EndsWith("`n")) {
    $envContent += "`n"
  }
  $envContent += "DATABASE_URL=$dbUrl`n"
}
Set-Content -LiteralPath $envPath -Value $envContent

Write-Host ""
Write-Host "Local database is ready."
Write-Host "DATABASE_URL=$dbUrl"
Write-Host "Project root: $projectRoot"

