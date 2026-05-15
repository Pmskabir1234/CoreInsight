"""SQLite-backed history storage."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional


class HistoryStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _conn(self) -> sqlite3.Connection:
        return sqlite3.connect(str(self.db_path))

    def _init_db(self) -> None:
        with self._conn() as con:
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS analyses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    machine_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
                """
            )
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    machine_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    role TEXT NOT NULL,
                    message TEXT NOT NULL
                )
                """
            )

    def save_analysis(self, machine_id: str, created_at: str, payload: Dict[str, Any]) -> None:
        with self._conn() as con:
            con.execute(
                "INSERT INTO analyses(machine_id, created_at, payload) VALUES(?,?,?)",
                (machine_id, created_at, json.dumps(payload)),
            )

    def list_history(self, machine_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT machine_id, created_at, payload FROM analyses"
        params: tuple = ()
        if machine_id:
            query += " WHERE machine_id=?"
            params = (machine_id,)
        query += " ORDER BY id DESC LIMIT ?"
        params = (*params, limit)
        with self._conn() as con:
            rows = con.execute(query, params).fetchall()
        out: List[Dict[str, Any]] = []
        for machine, created_at, payload in rows:
            item = json.loads(payload)
            item["machine_id"] = machine
            item["created_at"] = created_at
            out.append(item)
        return out

    def last_parameters(self, machine_id: str) -> Optional[Dict[str, float]]:
        with self._conn() as con:
            row = con.execute(
                "SELECT payload FROM analyses WHERE machine_id=? ORDER BY id DESC LIMIT 1",
                (machine_id,),
            ).fetchone()
        if not row:
            return None
        payload = json.loads(row[0])
        return payload.get("input_parameters")

    def save_chat(self, machine_id: str, created_at: str, role: str, message: str) -> None:
        with self._conn() as con:
            con.execute(
                "INSERT INTO chat_messages(machine_id, created_at, role, message) VALUES(?,?,?,?)",
                (machine_id, created_at, role, message),
            )

    def get_recent_chat(self, machine_id: str, limit: int = 8) -> List[Dict[str, str]]:
        with self._conn() as con:
            rows = con.execute(
                "SELECT role, message FROM chat_messages WHERE machine_id=? ORDER BY id DESC LIMIT ?",
                (machine_id, limit),
            ).fetchall()
        return [{"role": r, "message": m} for r, m in reversed(rows)]
