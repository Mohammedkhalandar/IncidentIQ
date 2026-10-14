$ErrorActionPreference = 'Stop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host 'Docker Desktop is required. Install/start Docker Desktop, then run this script again.' -ForegroundColor Yellow
  exit 1
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Docker is installed but the Docker engine is not running. Start Docker Desktop first.' -ForegroundColor Yellow
  exit 1
}
Set-Location $PSScriptRoot
docker compose up --build
