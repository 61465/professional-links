# MobeFace Backend — Stop
$tailscale = 'C:\Program Files\Tailscale\tailscale.exe'
$port      = 8011
$funnelPort= 8443

& $tailscale funnel --https=$funnelPort off 2>$null
Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; "stopped PID $_" }
Write-Host "MobeFace backend stopped"
