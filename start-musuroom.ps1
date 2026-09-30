param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$localPort = if ($env:PORT) { [int]$env:PORT } else { 8766 }
$siteUrl = "http://127.0.0.1:$localPort/"
$alreadyRunning = $false
try { $health = Invoke-RestMethod -Uri ($siteUrl + 'healthz') -TimeoutSec 2; $alreadyRunning = $health.app -eq 'musuroom' } catch {}
if (-not $alreadyRunning) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
  if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Can cai Node.js 22 tro len de chay Musuroom.' }
  $nodeVersion = (& $nodePath --version).TrimStart('v').Split('.')[0]
  if ([int]$nodeVersion -lt 22) { throw 'Can Node.js 22 tro len.' }
  $serverProcess = Start-Process -FilePath $nodePath -ArgumentList 'server.mjs' -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectPath 'server.log') -RedirectStandardError (Join-Path $projectPath 'server-error.log') -PassThru
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 250
    if ($serverProcess.HasExited) { throw 'Khong khoi dong duoc. Xem server-error.log; cong co the dang duoc su dung.' }
    try { $health = Invoke-RestMethod -Uri ($siteUrl + 'healthz') -TimeoutSec 1; if ($health.app -eq 'musuroom') { $alreadyRunning = $true; break } } catch {}
  }
  if (-not $alreadyRunning) { throw 'May chu chua san sang. Xem server-error.log.' }
  Set-Content -LiteralPath (Join-Path $projectPath 'server.pid') -Value $serverProcess.Id
}
Write-Output "Musuroom dang chay: $siteUrl"
if (-not $NoBrowser) { Start-Process $siteUrl }
