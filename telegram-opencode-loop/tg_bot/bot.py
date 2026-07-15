from __future__ import annotations

import asyncio
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import Config
from schemas import (
    InboxItem,
    OutboxItem,
    STATUS_DONE,
    STATUS_ERROR,
    STATUS_CANCELLED,
    STATUS_RUNNING,
    STATUS_PENDING,
)
from storage import (
    append_inbox,
    append_outbox,
    ensure_file,
    read_new_outbox,
    search_outbox_by_id,
)

logger = logging.getLogger("bot")


PROCESSED_IDS: set[str] = set()
_last_outbox_pos = 0


async def send_long_text(bot, chat_id: int, text: str, message_id: int | None = None) -> int:
    MAX_LEN = 4000
    if len(text) <= MAX_LEN:
        if message_id:
            msg = await bot.edit_message_text(chat_id=chat_id, message_id=message_id, text=text)
        else:
            msg = await bot.send_message(chat_id=chat_id, text=text)
        return msg.message_id
    chunks = []
    for i in range(0, len(text), MAX_LEN):
        chunks.append(text[i : i + MAX_LEN])
    for j, chunk in enumerate(chunks):
        if j == 0 and message_id:
            msg = await bot.edit_message_text(chat_id=chat_id, message_id=message_id, text=chunk + "\n\n(1/{})".format(len(chunks)))
        else:
            msg = await bot.send_message(chat_id=chat_id, text=chunk + "\n\n({}/{})".format(j + 1, len(chunks)))
    return msg.message_id


async def start(update, context):
    await update.message.reply_text(
        "🤖 Bot conectado a opencode\n\n"
        "Comandos:\n"
        "/run <instrucción> — ejecutar en opencode\n"
        "/status <id> — ver estado de una tarea\n"
        "/cancel <id> — cancelar tarea pendiente\n"
        "/queue — ver tareas en cola\n"
        "/ping — verificar conexión"
    )


async def run_cmd(update, context):
    payload = " ".join(context.args)
    if not payload:
        await update.message.reply_text("Uso: /run <instrucción>")
        return
    chat_id = update.effective_chat.id
    msg = await update.message.reply_text("⏳ Encolando...")
    item = InboxItem(
        payload=payload,
        meta={"chat_id": chat_id, "message_id": msg.message_id},
    )
    try:
        append_inbox(item, context.bot_data["cfg"].inbox_path)
    except Exception as e:
        await msg.edit_text(f"❌ Error al encolar: {e}")
        return
    await msg.edit_text(f"✅ Encolado\nID: `{item.id}`\nPayload: {payload[:200]}", parse_mode="Markdown")


async def status_cmd(update, context):
    if not context.args:
        await update.message.reply_text("Uso: /status <id>")
        return
    target_id = context.args[0]
    cfg: Config = context.bot_data["cfg"]
    item = search_outbox_by_id(cfg.outbox_path, target_id)
    if item is None:
        await update.message.reply_text(f"❌ ID no encontrado: {target_id}")
        return
    status_emoji = {
        STATUS_PENDING: "⏳",
        STATUS_RUNNING: "🔄",
        STATUS_DONE: "✅",
        STATUS_ERROR: "❌",
        STATUS_CANCELLED: "🚫",
    }.get(item.status, "❓")
    text = f"{status_emoji} `{item.id}` — **{item.status}**\n\n"
    if item.result:
        text += item.result[:3000]
    if item.error:
        text += f"\n\nError: {item.error[:1000]}"
    await send_long_text(context.bot, update.effective_chat.id, text)


async def cancel_cmd(update, context):
    if not context.args:
        await update.message.reply_text("Uso: /cancel <id>")
        return
    target_id = context.args[0]
    chat_id = update.effective_chat.id
    item = InboxItem(
        id=target_id,
        type="cancel",
        payload="",
        meta={"chat_id": chat_id, "message_id": 0},
    )
    append_inbox(item, context.bot_data["cfg"].inbox_path)
    await update.message.reply_text(f"🚫 Solicitud de cancelación enviada para `{target_id}`", parse_mode="Markdown")


async def queue_cmd(update, context):
    from storage import read_new_inbox
    cfg: Config = context.bot_data["cfg"]
    items, _ = read_new_inbox(cfg.inbox_path, 0)
    pending = [it for it in items if it.type == "run" and search_outbox_by_id(cfg.outbox_path, it.id) is None]
    if not pending:
        await update.message.reply_text("📭 Cola vacía")
        return
    text = f"📋 Cola ({len(pending)} pendientes):\n\n"
    for p in pending[-10:]:
        text += f"• `{p.id}` — {p.payload[:80]}\n"
    await update.message.reply_text(text, parse_mode="Markdown")


async def ping_cmd(update, context):
    await update.message.reply_text("🏓 Pong — watcher activo")


async def poll_outbox(context):
    cfg: Config = context.bot_data["cfg"]
    global _last_outbox_pos
    try:
        items, _last_outbox_pos = read_new_outbox(cfg.outbox_path, _last_outbox_pos)
    except Exception as e:
        logger.error("Error polling outbox: %s", e)
        return

    for item in items:
        if item.id in PROCESSED_IDS:
            continue
        PROCESSED_IDS.add(item.id)
        chat_id = item.meta.get("chat_id", 0)
        message_id = item.meta.get("message_id", 0)
        if not chat_id:
            continue
        status_emoji = {
            STATUS_PENDING: "⏳",
            STATUS_RUNNING: "🔄",
            STATUS_DONE: "✅",
            STATUS_ERROR: "❌",
            STATUS_CANCELLED: "🚫",
        }.get(item.status, "❓")
        header = f"{status_emoji} `{item.id}` — **{item.status}**\n\n"
        try:
            if item.status == STATUS_RUNNING:
                if message_id:
                    try:
                        await context.bot.edit_message_text(
                            chat_id=chat_id, message_id=message_id,
                            text=header + "Ejecutando...", parse_mode="Markdown",
                        )
                    except Exception:
                        pass
            elif item.status == STATUS_DONE:
                body = item.result[:3500] if item.result else "(sin salida)"
                if message_id:
                    try:
                        await context.bot.edit_message_text(
                            chat_id=chat_id, message_id=message_id,
                            text=header + body, parse_mode="Markdown",
                        )
                    except Exception:
                        await context.bot.send_message(chat_id=chat_id, text=header + body, parse_mode="Markdown")
                else:
                    await context.bot.send_message(chat_id=chat_id, text=header + body, parse_mode="Markdown")
            elif item.status in (STATUS_ERROR, STATUS_CANCELLED):
                body = item.error[:3500] if item.error else "(sin detalle)"
                if message_id:
                    try:
                        await context.bot.edit_message_text(
                            chat_id=chat_id, message_id=message_id,
                            text=header + body, parse_mode="Markdown",
                        )
                    except Exception:
                        await context.bot.send_message(chat_id=chat_id, text=header + body, parse_mode="Markdown")
                else:
                    await context.bot.send_message(chat_id=chat_id, text=header + body, parse_mode="Markdown")
        except Exception as e:
            logger.warning("Error enviando resultado a chat %s: %s", chat_id, e)


def main_async() -> None:
    cfg = Config()
    if not cfg.telegram_bot_token:
        logger.error("TELEGRAM_BOT_TOKEN no está configurado")
        print("ERROR: Define TELEGRAM_BOT_TOKEN en .env o variables de entorno")
        sys.exit(1)

    from telegram import Update
    from telegram.ext import Application, CommandHandler, ContextTypes

    ensure_file(cfg.inbox_path)
    ensure_file(cfg.outbox_path)

    app = Application.builder().token(cfg.telegram_bot_token).build()
    app.bot_data["cfg"] = cfg

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("run", run_cmd))
    app.add_handler(CommandHandler("status", status_cmd))
    app.add_handler(CommandHandler("cancel", cancel_cmd))
    app.add_handler(CommandHandler("queue", queue_cmd))
    app.add_handler(CommandHandler("ping", ping_cmd))

    jq = app.job_queue
    if jq:
        jq.run_repeating(poll_outbox, interval=cfg.bot_poll_sec, first=1.0)

    logger.info("Bot iniciado — polling cada %.1fs", cfg.bot_poll_sec)
    print("Bot de Telegram iniciado. Presiona Ctrl+C para detener.")
    app.run_polling(allowed_updates=["messages"])


def main() -> None:
    cfg = Config()
    logging.basicConfig(
        level=getattr(logging, cfg.log_level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    main_async()


if __name__ == "__main__":
    main()
