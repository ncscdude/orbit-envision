<#
  ORBIT one-step deploy to Cloudflare: https://orbit.ncscdude.com

  Run in PowerShell:
    powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\deploy-orbit.ps1"

  What it does, in order:
    1. Checks Git and Node.js
    2. Gets or updates the code in C:\dev\orbit from the bundle in Downloads
    3. Installs packages
    4. Runs the 3 gates (lint, unit, acceptance)
    5. Logs you in to Cloudflare if needed
    6. Confirms the Access gate exists
    7. Builds and deploys
    8. Optionally pushes to GitHub, then opens the site
#>
param(
  [string]$Repo = 'C:\dev\orbit',
  [string]$Bundle = "$HOME\Downloads\orbit-cloudflare-host-v2.bundle",
  [switch]$SkipAcceptance
)

$ErrorActionPreference = 'Stop'
$Site = 'https://orbit.ncscdude.com'
$Branch = 'cloudflare-host'

function Step([string]$n, [string]$text) {
  Write-Host ''
  Write-Host "[$n] $text" -ForegroundColor Cyan
}
function Ok([string]$text) { Write-Host "    OK: $text" -ForegroundColor Green }
function Fail([string]$text) {
  Write-Host ''
  Write-Host "STOPPED: $text" -ForegroundColor Red
  exit 1
}
function Run([string]$label, [scriptblock]$cmd) {
  & $cmd
  if ($LASTEXITCODE -ne 0) { Fail "$label failed (exit code $LASTEXITCODE). Scroll up for the error." }
  Ok $label
}

# 1. Tools
Step '1/8' 'Checking Git and Node.js'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail 'Git is not installed. Install Git for Windows, then run this again.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail 'Node.js is not installed. Install Node.js 22 LTS, then run this again.' }
$nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) { Fail "Node.js $nodeMajor found. Version 20 or newer is needed (22 LTS recommended)." }
Ok "Git found, Node.js $(node --version)"

# 2. Code
Step '2/8' "Getting the code into $Repo"
if (-not (Test-Path $Repo)) {
  if (-not (Test-Path $Bundle)) { Fail "No repo at $Repo and no bundle at $Bundle." }
  Run 'Clone from bundle' { git clone $Bundle $Repo -b $Branch }
}
Set-Location $Repo
# Only tracked edits are set aside; untracked folders (for example .claude) stay where they are
if ((git status --porcelain --untracked-files=no).Length -gt 0) {
  Write-Host '    Local edits found. Saving them aside with git stash (nothing is lost).' -ForegroundColor Yellow
  Run 'Stash local edits' { git stash push -m 'saved before deploy-orbit.ps1' }
}
Run "Switch to $Branch" { git checkout $Branch }
if (Test-Path $Bundle) {
  Run 'Update from bundle' { git pull --ff-only $Bundle $Branch }
} else {
  Write-Host "    No bundle at $Bundle. Using the code already in $Repo." -ForegroundColor Yellow
}
$pattern = Select-String -Path 'wrangler.jsonc' -Pattern 'orbit\.ncscdude\.com' -Quiet
if (-not $pattern) { Fail 'wrangler.jsonc does not point to orbit.ncscdude.com.' }
Ok 'Hostname is orbit.ncscdude.com'

# 3. Packages
Step '3/8' 'Installing packages (first time takes a few minutes)'
Run 'npm ci' { npm ci --no-audit --no-fund }

# 4. Gates
Step '4/8' 'Running the 3 gates'
Run 'Gate 1: lint' { npx eslint . }
Run 'Gate 2: unit tests' { npx vitest run }
if ($SkipAcceptance) {
  Write-Host '    Gate 3 skipped by -SkipAcceptance.' -ForegroundColor Yellow
} else {
  Run 'Browser for acceptance tests' { npx playwright install chromium }
  Run 'Gate 3: acceptance tests' { npx playwright test }
}

# 5. Cloudflare login
Step '5/8' 'Checking Cloudflare login'
$ErrorActionPreference = 'Continue'
$who = (npx wrangler whoami 2>&1 | Out-String)
$ErrorActionPreference = 'Stop'
if ($who -match 'not authenticated') {
  Write-Host '    A browser will open. Log in to Cloudflare and click Allow.' -ForegroundColor Yellow
  Run 'Cloudflare login' { npx wrangler login }
} else {
  Ok 'Already logged in to Cloudflare'
}

# 6. Access gate
Step '6/8' 'Confirm the Cloudflare Access gate'
Write-Host '    In the Cloudflare dashboard: Zero Trust > Access > Applications > Add an application > Self-hosted'
Write-Host '      Hostname: orbit.ncscdude.com'
Write-Host '      Policy:   Allow, Include Emails (list each person)'
Write-Host '      Login:    One-time PIN'
Write-Host ''
Write-Host '    Type YES if the Access app exists.'
Write-Host '    Type NOW to deploy first and add Access right after (data is fictional).'
$answer = (Read-Host '    Your answer').Trim().ToUpper()
if ($answer -ne 'YES' -and $answer -ne 'NOW') { Fail 'Deploy cancelled. Set up Access, then run this again.' }

# 7. Deploy
Step '7/8' 'Building and deploying to Cloudflare'
Run 'Deploy' { npm run deploy }
if ($answer -eq 'NOW') {
  Write-Host '    Reminder: create the Access app for orbit.ncscdude.com now.' -ForegroundColor Yellow
}

# 8. GitHub and open
Step '8/8' 'GitHub push (optional) and open the site'
$ErrorActionPreference = 'Continue'
$origin = (git remote get-url origin 2>$null)
$ErrorActionPreference = 'Stop'
if ($origin) {
  $push = (Read-Host "    Push $Branch to $origin ? (y/n)").Trim().ToLower()
  if ($push -eq 'y') { Run 'Push to GitHub' { git push -u origin $Branch } }
} else {
  Write-Host '    No GitHub remote set. Skipping push.' -ForegroundColor Yellow
}
Start-Process $Site
Write-Host ''
Write-Host "Done. Open $Site in a private window. You should see the Cloudflare Access sign-in first." -ForegroundColor Green
