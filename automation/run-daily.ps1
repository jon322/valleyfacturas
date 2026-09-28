# Tarea programada diaria: revisa correo (Banahost) y Discord en busca de
# facturas nuevas, lee cada una de verdad y las sube a Holded como borrador.
# Registrada con Windows Task Scheduler (ver automation/README.md).
#
# El prompt se pasa por stdin (no como argumento) porque pasarlo como
# argumento a traves de claude.cmd (un shim .cmd) se trunca a la primera
# linea cuando lo lanza Task Scheduler sin consola real.

$ErrorActionPreference = "Stop"
Set-Location "C:\Desarrollos\valley"

$logFile = "logs\daily_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').log"

Get-Content -Raw "automation\daily-prompt.txt" |
  & "C:\Users\JonCid\AppData\Roaming\npm\claude.cmd" -p --dangerously-skip-permissions *> $logFile
