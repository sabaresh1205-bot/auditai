$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::FromArgb(24, 24, 27))

$brushWhite = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 250, 250))
$brushMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(161, 161, 170))
$brushDim = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(113, 113, 122))

$fontBrand = [System.Drawing.Font]::new("Segoe UI", 36.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$fontHead = [System.Drawing.Font]::new("Segoe UI", 48.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$fontSub = [System.Drawing.Font]::new("Segoe UI", 28.0, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$fontFoot = [System.Drawing.Font]::new("Segoe UI", 18.0, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$fontBadge = [System.Drawing.Font]::new("Segoe UI", 22.0, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)

$graphics.FillRectangle([System.Drawing.Brushes]::WhiteSmoke, 64, 64, 72, 72)
$graphics.DrawString("AI", $fontBadge, [System.Drawing.Brushes]::Black, 78, 78)
$graphics.DrawString("AuditAI", $fontBrand, $brushWhite, 160, 78)
$graphics.DrawString("Stop overpaying for AI tools", $fontHead, $brushWhite, 64, 240)
$graphics.DrawString("Deterministic AI spend audit reports", $fontSub, $brushMuted, 64, 330)
$graphics.DrawString("auditai · rule-based savings recommendations", $fontFoot, $brushDim, 64, 560)

$outDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\public"))
$out = Join-Path $outDir "og.png"
$bitmap.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Saved $out" (Get-Item $out).Length "bytes"
