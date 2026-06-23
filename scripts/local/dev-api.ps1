$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:API_PREFIX = "/api/v1"
$env:AUTH_REQUIRED = "true"
$env:SUPABASE_PROJECT_URL = "https://oyyimzpswvhiktzbvdso.supabase.co"
$env:SUPABASE_JWT_AUDIENCE = "authenticated"

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  $databaseUrl = Read-Host "Pega DATABASE_URL de Supabase dev"
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "DATABASE_URL es requerido para levantar la API local."
  }
  $env:DATABASE_URL = $databaseUrl
}

Push-Location $RepoRoot
try {
  & corepack pnpm dev:api
} finally {
  Pop-Location
}
