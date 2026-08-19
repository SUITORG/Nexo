from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

from filelock import FileLock

from schemas import InboxItem, OutboxItem


def append_inbox(item: InboxItem, path: Path) -> None:
    lock = FileLock(str(path) + ".lock")
    with lock:
        with open(path, "a", encoding="utf-8") as f:
            f.write(item.to_jsonl())


def read_new_inbox(path: Path, last_pos: int = 0) -> tuple[list[InboxItem], int]:
    lock = FileLock(str(path) + ".lock")
    with lock:
        if not path.exists():
            return [], 0
        with open(path, "r", encoding="utf-8") as f:
            f.seek(last_pos)
            lines = f.readlines()
            new_pos = f.tell()
        items: list[InboxItem] = []
        for line in lines:
            item = InboxItem.from_jsonl(line)
            if item is not None:
                items.append(item)
        return items, new_pos


def append_outbox(item: OutboxItem, path: Path) -> None:
    lock = FileLock(str(path) + ".lock")
    with lock:
        with open(path, "a", encoding="utf-8") as f:
            f.write(item.to_jsonl())


def read_new_outbox(path: Path, last_pos: int = 0) -> tuple[list[OutboxItem], int]:
    lock = FileLock(str(path) + ".lock")
    with lock:
        if not path.exists():
            return [], 0
        with open(path, "r", encoding="utf-8") as f:
            f.seek(last_pos)
            lines = f.readlines()
            new_pos = f.tell()
        items: list[OutboxItem] = []
        for line in lines:
            item = OutboxItem.from_jsonl(line)
            if item is not None:
                items.append(item)
        return items, new_pos


def search_outbox_by_id(path: Path, target_id: str) -> OutboxItem | None:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            item = OutboxItem.from_jsonl(line)
            if item is not None and item.id == target_id:
                return item
    return None


def count_inbox_pending(path: Path, last_pos: int) -> int:
    items, _ = read_new_inbox(path, last_pos)
    return len([it for it in items if it.type == "run"])


def ensure_file(path: Path) -> None:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("", encoding="utf-8")
