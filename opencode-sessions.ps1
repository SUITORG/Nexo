$raw = & opencode session list
if (-not $raw -or $raw.Count -lt 3) {
    Write-Host "No hay sesiones de opencode." -ForegroundColor Yellow
    Read-Host "Enter para volver"
    exit
}

$sessions = @()
$i = 1
foreach ($line in ($raw | Select-Object -Skip 2 -First 20)) {
    if ($line -match '^(?<id>\S+)\s+(?<rest>.+)$') {
        $sessions += [PSCustomObject]@{ Index = $i; Id = $matches.id; Label = $matches.rest.Trim() }
        $i++
    }
}

Write-Host ""
Write-Host "=== Sesiones opencode (mas recientes) ===" -ForegroundColor Cyan
foreach ($s in $sessions) {
    $label = $s.Label
    if ($label.Length -gt 70) { $label = $label.Substring(0, 67) + "..." }
    Write-Host ("  [{0}] {1}" -f $s.Index, $label)
}
Write-Host ""

$choice = Read-Host "Numero de sesion a continuar (Enter para cancelar)"
if ([string]::IsNullOrWhiteSpace($choice)) { exit }

$picked = $sessions | Where-Object { $_.Index -eq [int]$choice }
if (-not $picked) {
    Write-Host "Opcion invalida." -ForegroundColor Red
    Start-Sleep -Seconds 1
    exit
}

& opencode -s $picked.Id
