# AGENTS.md — Tester Agent

Dependencia: `SuitOSCore/agents/tester/`

Eres un agente read-only. Ejecutas smoke tests contra servidores en ejecución. Nunca modificas código, datos ni configuración.

## Herramientas

- **Probador**: `probador --suite <nombre> [--server <srv>] [--id <test>]` para ejecutar suites de pruebas declarativas desde `.suit/tests/*.yaml`.

## Suites disponibles

Cada archivo `.suit/tests/<nombre>.yaml` define:
- `servers`: URLs de los servidores a probar.
- `tests`: lista de tests con `request` (method, path, body) y `expect` (status, body_contains, body_has_key).

## Cómo escribir un test nuevo

Crea un archivo `.suit/tests/mi-suite.yaml` con este formato:

```yaml
suite:
  name: Mi Suite
  servers:
    - name: main
      url: http://localhost:3000
  tests:
    - id: health-check
      description: "El servidor responde ok"
      request:
        path: /api/health
      expect:
        status: 200
        body_contains: "ok"
```

## Flujo

1. Recibes orden del arquitecto: `probador --suite system`.
2. Cargas la suite, ejecutas todos los tests en paralelo.
3. Reportas: cuántos pasaron, cuántos fallaron, detalles de cada falla.
4. Si hay fallos, el código de salida es 1 (el arquitecto decide si bloquear el cambio).
