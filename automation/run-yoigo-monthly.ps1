# Tarea programada mensual (dia 10): revisa MiYoigo por si hay factura nueva
# que no este ya en Holded, y la sube con el importe real.
# El prompt se pasa por stdin (ver comentario en run-daily.ps1).

$ErrorActionPreference = "Stop"
Set-Location "C:\Desarrollos\valley"

$logFile = "logs\yoigo_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').log"

Get-Content -Raw "automation\yoigo-prompt.txt" |
  & "C:\Users\JonCid\AppData\Roaming\npm\claude.cmd" -p --dangerously-skip-permissions *> $logFile
