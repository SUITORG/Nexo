import os
import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).parent

_DOTENV_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")


def _load_dotenv(path: Path | None = None) -> None:
    dotenv = path or ROOT / ".env"
    if not dotenv.exists():
        return
    for line in dotenv.read_text("utf-8").splitlines():
        m = _DOTENV_RE.match(line.strip())
        if m:
            key, val = m.group(1), m.group(2)
            val = val.strip("\"'").strip()
            if key not in os.environ:
                os.environ[key] = val


_load_dotenv()


def _env_str(key: str, default: str) -> str:
    return os.environ.get(key, default)


def _env_path(key: str, default: str) -> Path:
    raw = os.environ.get(key, str(ROOT / default))
    p = Path(raw)
    return p if p.is_absolute() else ROOT / p


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.environ[key])
    except (KeyError, ValueError, TypeError):
        return default


def _env_float(key: str, default: float) -> float:
    try:
        return float(os.environ[key])
    except (KeyError, ValueError, TypeError):
        return default


@dataclass(frozen=True)
class Config:
    telegram_bot_token: str = field(default_factory=lambda: _env_str("TELEGRAM_BOT_TOKEN", ""))
    inbox_path: Path = field(default_factory=lambda: _env_path("INBOX_PATH", "inbox.jsonl"))
    outbox_path: Path = field(default_factory=lambda: _env_path("OUTBOX_PATH", "outbox.jsonl"))
    opencode_cmd: str = field(default_factory=lambda: _env_str("OPENCODE_CMD", "opencode.cmd"))
    opencode_model: str = field(default_factory=lambda: _env_str("OPENCODE_MODEL", "ollama/qwen2.5-coder:14b"))
    opencode_timeout_sec: int = field(default_factory=lambda: _env_int("OPENCODE_TIMEOUT_SEC", 120))
    poll_sec: float = field(default_factory=lambda: _env_float("POLL_SEC", 1.0))
    bot_poll_sec: float = field(default_factory=lambda: _env_float("BOT_POLL_SEC", 1.5))
    log_level: str = field(default_factory=lambda: _env_str("LOG_LEVEL", "INFO").upper())
