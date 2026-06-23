param(
  [string] $Token,
  [string] $BusinessSlug = "velora-barberia-demo"
)

$ErrorActionPreference = "Stop"
$ApiUrl = "http://127.0.0.1:3001/api/v1/businesses/$BusinessSlug/services"

function Format-JsonBody {
  param([string] $Body)

  if ([string]::IsNullOrWhiteSpace($Body)) {
    return ""
  }

  try {
    return ($Body | ConvertFrom-Json | ConvertTo-Json -Depth 20)
  } catch {
    return $Body
  }
}

function Get-ErrorBody {
  param($ErrorRecord)

  if ($ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.ErrorDetails.Message)) {
    return $ErrorRecord.ErrorDetails.Message
  }

  $response = $ErrorRecord.Exception.Response
  if ($null -eq $response) {
    return $ErrorRecord.Exception.Message
  }

  $stream = $response.GetResponseStream()
  if ($null -eq $stream) {
    return $ErrorRecord.Exception.Message
  }

  $reader = New-Object System.IO.StreamReader($stream)
  try {
    return $reader.ReadToEnd()
  } finally {
    $reader.Dispose()
  }
}

if ([string]::IsNullOrWhiteSpace($Token)) {
  $Token = Read-Host "Pega token Bearer"
}

try {
  $response = Invoke-WebRequest `
    -Method Get `
    -Uri $ApiUrl `
    -Headers @{ Authorization = "Bearer $Token" } `
    -UseBasicParsing

  Format-JsonBody -Body $response.Content
} catch {
  $statusCode = $null
  if ($_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
  }

  $body = Get-ErrorBody -ErrorRecord $_
  Write-Host "HTTP status: $statusCode"
  Write-Host "Body:"
  Format-JsonBody -Body $body
  exit 1
}
