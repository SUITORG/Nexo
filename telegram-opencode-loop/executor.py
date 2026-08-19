from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from config import Config


_ANSI_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")


def strip_ansi(text: str) -> str:
    return _ANSI_RE.sub("", text)


def run_opencode(payload: str, config: Config, cwd: Path | None = None) -> str:
    cmd = [config.opencode_cmd, "run", "-m", config.opencode_model, "--auto", payload]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=config.opencode_timeout_sec,
            cwd=cwd or config.inbox_path.parent,
            env={**dict(open(".env").read().strip().split("\n")[0].split("=", 1))} if False else None,
        )
    except FileNotFoundError:
        return f"ERROR: comando '{config.opencode_cmd}' no encontrado en PATH"
    except subprocess.TimeoutExpired:
        return f"ERROR: tiempo de espera agotado ({config.opencode_timeout_sec}s)"
    except Exception as e:
        return f"ERROR: {e}"

    output_parts = []
    if proc.stdout:
        output_parts.append(strip_ansi(proc.stdout.strip()))
    if proc.stderr:
        stderr_clean = strip_ansi(proc.stderr.strip())
        if stderr_clean:
            output_parts.append(f"[stderr]\n{stderr_clean}")

    result = "\n".join(output_parts) if output_parts else ""
    if proc.returncode != 0 and not result:
        result = f"ERROR: exit code {proc.returncode}"

    return result
