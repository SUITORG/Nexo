from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Literal


@dataclass
class InboxItem:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    ts: float = field(default_factory=time.time)
    type: Literal["run", "cancel", "ping"] = "run"
    payload: str = ""
    meta: dict = field(default_factory=lambda: {"chat_id": 0, "message_id": 0})

    def to_jsonl(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False, default=str) + "\n"

    @classmethod
    def from_jsonl(cls, line: str) -> InboxItem | None:
        line = line.strip()
        if not line:
            return None
        try:
            d = json.loads(line)
            return cls(
                id=str(d.get("id", uuid.uuid4().hex[:12])),
                ts=float(d.get("ts", time.time())),
                type=str(d.get("type", "run")),
                payload=str(d.get("payload", "")),
                meta=dict(d.get("meta", {})),
            )
        except (json.JSONDecodeError, TypeError, ValueError):
            return None


STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_DONE = "done"
STATUS_ERROR = "error"
STATUS_CANCELLED = "cancelled"

StatusType = Literal["pending", "running", "done", "error", "cancelled"]


@dataclass
class OutboxItem:
    id: str = ""
    ts: float = field(default_factory=time.time)
    status: StatusType = STATUS_DONE
    result: str = ""
    error: str = ""
    meta: dict = field(default_factory=lambda: {"chat_id": 0, "message_id": 0})

    def to_jsonl(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False, default=str) + "\n"

    @classmethod
    def from_jsonl(cls, line: str) -> OutboxItem | None:
        line = line.strip()
        if not line:
            return None
        try:
            d = json.loads(line)
            return cls(
                id=str(d.get("id", "")),
                ts=float(d.get("ts", time.time())),
                status=str(d.get("status", STATUS_DONE)),
                result=str(d.get("result", "")),
                error=str(d.get("error", "")),
                meta=dict(d.get("meta", {})),
            )
        except (json.JSONDecodeError, TypeError, ValueError):
            return None
