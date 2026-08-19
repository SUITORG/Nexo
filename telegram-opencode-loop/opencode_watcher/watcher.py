from __future__ import annotations

import logging
import sys
import time
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import Config
from executor import run_opencode
from schemas import (
    InboxItem,
    OutboxItem,
    STATUS_DONE,
    STATUS_ERROR,
    STATUS_CANCELLED,
    STATUS_RUNNING,
)
from storage import (
    append_outbox,
    ensure_file,
    read_new_inbox,
)

logger = logging.getLogger("watcher")


def _build_outbox(
    inbox: InboxItem,
    status: str,
    result: str = "",
    error: str = "",
) -> OutboxItem:
    return OutboxItem(
        id=inbox.id,
        status=status,
        result=result,
        error=error,
        meta=inbox.meta,
    )


def poll_loop(config: Config) -> None:
    ensure_file(config.inbox_path)
    ensure_file(config.outbox_path)

    last_pos = 0
    running: OrderedDict[str, InboxItem] = OrderedDict()
    cancel_set: set[str] = set()

    logger.info("Watcher iniciado — vigilando %s", config.inbox_path)

    while True:
        try:
            items, last_pos = read_new_inbox(config.inbox_path, last_pos)
        except Exception as e:
            logger.error("Error leyendo inbox: %s", e)
            time.sleep(config.poll_sec)
            continue

        for item in items:
            if item.type == "run":
                if item.id not in running and item.id not in cancel_set:
                    running[item.id] = item
                    logger.info("Encolado: %s — %s", item.id, item.payload[:80])
            elif item.type == "cancel":
                if item.id in running:
                    victim = running.pop(item.id)
                    cancel_set.add(item.id)
                    out = _build_outbox(victim, STATUS_CANCELLED, error="Cancelado por usuario")
                    append_outbox(out, config.outbox_path)
                    logger.info("Cancelado: %s", item.id)
                else:
                    cancel_set.add(item.id)

        if running:
            item_id, inbox_item = next(iter(running.items()))
            del running[item_id]

            logger.info("Ejecutando: %s — %s", inbox_item.id, inbox_item.payload[:80])

            running_out = OutboxItem(
                id=inbox_item.id,
                status=STATUS_RUNNING,
                result="",
                meta=inbox_item.meta,
            )
            append_outbox(running_out, config.outbox_path)

            if inbox_item.id in cancel_set:
                cancel_set.discard(inbox_item.id)
                out = _build_outbox(inbox_item, STATUS_CANCELLED, error="Cancelado antes de ejecutar")
                append_outbox(out, config.outbox_path)
                logger.info("Saltado (cancelado): %s", inbox_item.id)
                continue

            try:
                result = run_opencode(inbox_item.payload, config)
                if result.startswith("ERROR:"):
                    out = _build_outbox(inbox_item, STATUS_ERROR, error=result)
                else:
                    out = _build_outbox(inbox_item, STATUS_DONE, result=result)
            except Exception as e:
                logger.exception("Error ejecutando comando: %s", e)
                out = _build_outbox(inbox_item, STATUS_ERROR, error=str(e))

            append_outbox(out, config.outbox_path)
            logger.info("Completado: %s — status=%s", inbox_item.id, out.status)
        else:
            time.sleep(config.poll_sec)


def main() -> None:
    cfg = Config()
    logging.basicConfig(
        level=getattr(logging, cfg.log_level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    poll_loop(cfg)


if __name__ == "__main__":
    main()
