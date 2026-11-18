# Instala tudo que o motor Desvendei precisa (roda uma vez)
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
foreach ($id in 'OpenJS.NodeJS.LTS','Gyan.FFmpeg','Python.Python.3.12','Google.Chrome') {
  Write-Host "Verificando $id..."
  winget install --id $id -e --silent --accept-source-agreements --accept-package-agreements | Out-Null
}
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
Write-Host 'Instalando bibliotecas...'
npm install --no-audit --no-fund
python -m pip install --upgrade numpy scipy soundfile
Write-Host ''
Write-Host 'Teste rapido:'
node -v; ffmpeg -version | Select-Object -First 1; python --version
Write-Host ''
Write-Host 'PRONTO. Agora de dois cliques em iniciar.bat'
Read-Host 'Enter para fechar'
