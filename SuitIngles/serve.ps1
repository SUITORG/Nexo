# SuitIngles - servidor local sin dependencias (usa PowerShell, ya viene con Windows)
$port = 8080
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"

try {
    $listener.Prefixes.Add($prefix)
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "No se pudo abrir el puerto $port." -ForegroundColor Red
    Write-Host "Puede que ya tengas otro servidor corriendo en ese puerto."
    Write-Host "Cierra otras ventanas de serve.bat / serve.ps1 y vuelve a intentar."
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit
}

Write-Host "============================================"
Write-Host "  SuitIngles - Servidor local (PowerShell)"
Write-Host "============================================"
Write-Host ""
Write-Host "Carpeta: $root"
Write-Host ""
Write-Host "Abre esto en tu navegador:"
Write-Host "  $prefix" -ForegroundColor Yellow
Write-Host ""
Write-Host "No cierres esta ventana mientras uses el sitio."
Write-Host "Para apagar el servidor: presiona Ctrl+C, o cierra esta ventana."
Write-Host "============================================"
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".md"   = "text/plain; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }
    $request = $context.Request
    $response = $context.Response

    $localPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
    if ($localPath -eq "/") { $localPath = "/index.html" }
    $localPath = $localPath.TrimStart("/")
    $filePath = Join-Path $root $localPath

    Write-Host "$(Get-Date -Format 'HH:mm:ss')  $($request.HttpMethod)  /$localPath"

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $response.ContentType = $contentType
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $bytes.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - No encontrado: /$localPath")
        $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
    }
    $response.OutputStream.Close()
}

$listener.Stop()
