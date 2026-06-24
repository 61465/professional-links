# MobeFace Backend — Local + Tailscale Funnel Launcher
# Run: powershell -ExecutionPolicy Bypass -File D:\project\mobeface\start-backend.ps1
$ErrorActionPreference = 'Stop'

$root      = 'D:\project\mobeface'
$backend   = Join-Path $root 'backend'
$port      = 8011
$funnelPort= 8443
$origins   = 'https://61465.github.io'
$tailscale = 'C:\Program Files\Tailscale\tailscale.exe'

# 1) إيقاف أي uvicorn سابق على نفس البورت
Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

# 2) تشغيل uvicorn في الخلفية
Set-Location $backend
$env:ALLOWED_ORIGINS   = $origins
$env:CACHE_TTL_SECONDS = '900'
$proc = Start-Process -FilePath 'python' `
    -ArgumentList '-m','uvicorn','main:app','--host','127.0.0.1','--port',$port,'--log-level','info' `
    -WindowStyle Hidden -PassThru
Write-Host "uvicorn started (PID $($proc.Id)) on http://127.0.0.1:$port"

Start-Sleep -Seconds 3

# 3) التحقق من الـ health
try {
    $h = Invoke-RestMethod "http://127.0.0.1:$port/api/health" -TimeoutSec 5
    Write-Host "health OK:" ($h | ConvertTo-Json -Compress)
} catch {
    Write-Error "Backend not responding: $_"
    exit 1
}

# 4) إعادة ضبط Funnel
& $tailscale funnel --https=$funnelPort off 2>$null | Out-Null
& $tailscale funnel --bg --https=$funnelPort --set-path=/ "http://localhost:$port"

Write-Host "`n✅ Backend live at:" -ForegroundColor Green
Write-Host "   https://ame.tail19ddab.ts.net:$funnelPort" -ForegroundColor Cyan
Write-Host "   (test: https://ame.tail19ddab.ts.net:$funnelPort/api/health)"
