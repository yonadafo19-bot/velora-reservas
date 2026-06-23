# Usar con dot-source para conservar el token:
# . .\scripts\local\login-owner.ps1

$ErrorActionPreference = "Stop"

$SupabaseProjectUrl = "https://oyyimzpswvhiktzbvdso.supabase.co"
$Email = "owner.dev@velora.test"

function ConvertFrom-SecureStringToPlainText {
  param(
    [Parameter(Mandatory = $true)]
    [Security.SecureString] $SecureString
  )

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

function Get-MaskedTokenPreview {
  param([string] $Token)

  if ([string]::IsNullOrWhiteSpace($Token)) {
    return ""
  }

  $prefixLength = [Math]::Min(8, $Token.Length)
  $suffixLength = [Math]::Min(6, [Math]::Max(0, $Token.Length - $prefixLength))
  $prefix = $Token.Substring(0, $prefixLength)
  $suffix = $Token.Substring($Token.Length - $suffixLength, $suffixLength)
  return "$prefix...$suffix"
}

$anonKey = $env:SUPABASE_ANON_KEY
if ([string]::IsNullOrWhiteSpace($anonKey)) {
  $anonKey = Read-Host "Pega SUPABASE_ANON_KEY"
  if ([string]::IsNullOrWhiteSpace($anonKey)) {
    throw "SUPABASE_ANON_KEY es requerida para solicitar el token."
  }
}

$securePassword = Read-Host "Password de $Email" -AsSecureString
$password = ConvertFrom-SecureStringToPlainText -SecureString $securePassword

try {
  $body = @{
    email = $Email
    password = $password
  } | ConvertTo-Json -Compress

  $response = Invoke-RestMethod `
    -Method Post `
    -Uri "$SupabaseProjectUrl/auth/v1/token?grant_type=password" `
    -Headers @{
      apikey = $anonKey
      Authorization = "Bearer $anonKey"
    } `
    -ContentType "application/json" `
    -Body $body

  $OwnerToken = $response.access_token
  if ([string]::IsNullOrWhiteSpace($OwnerToken)) {
    throw "Supabase no devolvio access_token."
  }

  Write-Host "Token owner obtenido y guardado en `$OwnerToken para esta sesion."
  Write-Host "Preview: $(Get-MaskedTokenPreview -Token $OwnerToken)"
} finally {
  $password = $null
  $securePassword = $null
}

