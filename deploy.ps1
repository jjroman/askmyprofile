#!/usr/bin/env pwsh
# ============================================================
# deploy.ps1 - Deploy ai-profile-chat to Azure Static Web Apps
# Usage: .\deploy.ps1 -ApiKey "sk-ant-..." [-Provider anthropic]
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey,

    [string]$Provider        = "anthropic",
    [string]$Model           = "",
    [string]$AppName         = "your-profile-web",
    [string]$ResourceGroup   = "your-profile-rg",
    # eastus is NOT supported for Microsoft.Web/staticSites.
    # Valid regions: westus2, centralus, eastus2, westeurope, eastasia
    [string]$Location        = "eastus2"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Assert-Command([string]$cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "'$cmd' is not installed or not on PATH. Please install it and retry."
        exit 1
    }
}

# ── 0. Pre-flight checks ────────────────────────────────────
Write-Step "Checking prerequisites"
Assert-Command "az"
Assert-Command "npm"
Assert-Command "node"

# ── 1. Azure login check ────────────────────────────────────
Write-Step "Verifying Azure login"
$account = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Running 'az login'..." -ForegroundColor Yellow
    az login
}
Write-Host "Logged in: $(az account show --query 'user.name' -o tsv)" -ForegroundColor Green

# ── 2. Install API dependencies ─────────────────────────────
Write-Step "Installing API npm dependencies"
Push-Location "$PSScriptRoot\api"
npm install
Pop-Location

# ── 3. Install SWA CLI (global) ─────────────────────────────
Write-Step "Ensuring SWA CLI is installed globally"
if (-not (Get-Command "swa" -ErrorAction SilentlyContinue)) {
    npm install -g @azure/static-web-apps-cli
} else {
    Write-Host "SWA CLI already installed: $(swa --version)" -ForegroundColor Green
}

# ── 4. Create Resource Group ────────────────────────────────
Write-Step "Creating resource group '$ResourceGroup' in '$Location'"
az group create --name $ResourceGroup --location $Location | Out-Null
Write-Host "Resource group ready." -ForegroundColor Green

# ── 5. Create Static Web App resource (no Git source needed) 
Write-Step "Creating Static Web App '$AppName'"
az staticwebapp show --name $AppName --resource-group $ResourceGroup 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Static Web App '$AppName' already exists, skipping creation." -ForegroundColor Yellow
} else {
    az staticwebapp create --name $AppName --resource-group $ResourceGroup --location $Location
    Write-Host "Static Web App created." -ForegroundColor Green
}

# ── 6. Set AI provider settings ────────────────────────────
Write-Step "Setting AI provider app settings (AI_PROVIDER / AI_API_KEY)"
$aiSettings = "AI_PROVIDER=$Provider", "AI_API_KEY=$ApiKey"
if ($Model -ne "") { $aiSettings += "AI_MODEL=$Model" }
az staticwebapp appsettings set --name $AppName --resource-group $ResourceGroup --setting-names @aiSettings | Out-Null
Write-Host "AI provider settings configured (provider: $Provider)." -ForegroundColor Green

# ── 7. Set PROFILE_PROMPT from api/profile.md ───────────────
$profileFile = "$PSScriptRoot\api\profile.md"
if (Test-Path $profileFile) {
    Write-Step "Setting PROFILE_PROMPT from $profileFile"
    # Collapse all newlines into spaces
    $profilePrompt = (Get-Content $profileFile -Raw) -replace '(\r?\n)+', ' '

    # Use az rest + a temp body file to bypass Windows "command line too long" limit.
    # az staticwebapp appsettings set passes values on the CLI which overflows for large prompts.
    $subId = az account show --query id -o tsv

    # Gather existing settings so we don't overwrite them
    $existingRaw = az staticwebapp appsettings list --name $AppName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
    $settingsMap = @{}
    if ($existingRaw) { $existingRaw | ForEach-Object { $settingsMap[$_.name] = $_.value } }
    $settingsMap["PROFILE_PROMPT"] = $profilePrompt

    $body = @{ properties = $settingsMap } | ConvertTo-Json -Depth 3 -Compress
    $tempJson = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tempJson, $body, [System.Text.Encoding]::UTF8)

    az rest --method PUT `
        --uri "https://management.azure.com/subscriptions/$subId/resourceGroups/$ResourceGroup/providers/Microsoft.Web/staticSites/$AppName/config/appsettings?api-version=2022-03-01" `
        --body "@$tempJson" `
        --headers "Content-Type=application/json" | Out-Null

    Remove-Item $tempJson -ErrorAction SilentlyContinue

    if ($LASTEXITCODE -eq 0) {
        Write-Host "PROFILE_PROMPT configured." -ForegroundColor Green
    } else {
        Write-Host "WARNING: Failed to set PROFILE_PROMPT. Set it manually via the Azure Portal." -ForegroundColor Yellow
    }
} else {
    Write-Host "WARNING: $profileFile not found. Copy api/profile.example.md → api/profile.md and re-run, or set PROFILE_PROMPT manually in the Azure Portal." -ForegroundColor Yellow
}

# ── 8. Get deployment token ─────────────────────────────────
Write-Step "Retrieving deployment token"
$deployToken = az staticwebapp secrets list --name $AppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv
if (-not $deployToken) {
    Write-Error "Could not retrieve deployment token. Aborting."
    exit 1
}

# ── 9. Deploy local files via SWA CLI ───────────────────────
Write-Step "Deploying local files to Azure Static Web Apps"
# --env default targets the root production slot (not a named preview environment)
swa deploy "$PSScriptRoot\public" --api-location "$PSScriptRoot\api" --deployment-token $deployToken --env default

# ── 10. Print live URL ──────────────────────────────────────
Write-Step "Deployment complete!"
$url = az staticwebapp show --name $AppName --resource-group $ResourceGroup --query "defaultHostname" -o tsv
Write-Host "`nYour site is live at: https://$url" -ForegroundColor Green
