@echo off
setlocal
chcp 65001 >nul
set "PROMPT=%~1"
if "%PROMPT%"=="" set /p "PROMPT=Pregunta para Hugging Face: "
if "%PROMPT%"=="" (echo No se escribio nada. & goto :eof)
if "%HF_TOKEN%"=="" (echo [X] HF_TOKEN no esta seteado en el entorno. & goto :eof)

echo.
echo Preguntando a Hugging Face...
echo.
powershell -NoProfile -Command "$body=@{model='meta-llama/Llama-3.1-8B-Instruct';messages=@(@{role='user';content=$env:PROMPT})}|ConvertTo-Json -Depth 5; $r=Invoke-RestMethod -Uri 'https://router.huggingface.co/v1/chat/completions' -Method Post -Headers @{Authorization=('Bearer '+$env:HF_TOKEN)} -ContentType 'application/json' -Body $body; Write-Host $r.choices[0].message.content"
echo.
pause
endlocal
