# Switch Environment
# Usage: .\switch-env.ps1 staging
#        .\switch-env.ps1 production

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$env
)

if ($env -eq "staging") {
    if (!(Test-Path .env.staging)) {
        Write-Host "Error: .env.staging tidak ditemukan!" -ForegroundColor Red
        exit 1
    }
    
    Copy-Item .env.staging .env.local -Force
    Write-Host "Switched to STAGING environment" -ForegroundColor Green
    
    $urlLine = Get-Content .env.local | Select-String "SUPABASE_URL"
    if ($urlLine) {
        $url = $urlLine.Line.Split("=")[1]
        Write-Host "URL: $url" -ForegroundColor Cyan
    }
}
elseif ($env -eq "production") {
    if (!(Test-Path .env.production)) {
        Write-Host "Error: .env.production tidak ditemukan!" -ForegroundColor Red
        exit 1
    }
    
    Copy-Item .env.production .env.local -Force
    Write-Host "Switched to PRODUCTION environment" -ForegroundColor Green
    
    $urlLine = Get-Content .env.local | Select-String "SUPABASE_URL"
    if ($urlLine) {
        $url = $urlLine.Line.Split("=")[1]
        Write-Host "URL: $url" -ForegroundColor Cyan
    }
}
