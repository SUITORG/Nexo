@ECHO OFF
REM Levanta el servidor OmniRoute (proveedor de modelos IA local para SuitAI)
REM Puerto por defecto: 20128 (ver opencode.json y SuitAI/services/modelScanner.js)
ECHO Iniciando OmniRoute...
omniroute serve
