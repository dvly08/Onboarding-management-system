"""SQLite persistence for onboarding records and manager-owned plans."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .seed_data import DEFAULT_TIMEZONE, DEMO_CONTRACTOR_EMAILS, DEMO_MANAGER_EMAIL, PHASES, TASKS


DEFAULT_PLAN_OWNER = "__default__"
DEFAULT_PLAN_NAME = "Global Support Default"
DEFAULT_PLAN_DEPARTMENT = "Global Support"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def humanize_email(email: str) -> str:
    local_part = email.split("@", 1)[0]
    tokens = [token for token in local_part.replace(".", " ").replace("_", " ").split() if token]
    if not tokens:
        return email
    return " ".join(token.capitalize() for token in tokens)


def loads_json_list(raw_value: Any) -> List[Any]:
    if raw_value in (None, ""):
        return []
    try:
        parsed = json.loads(raw_value)
    except (TypeError, ValueError):
        return []
    return parsed if isinstance(parsed, list) else []


class OnboardingRepository:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    contractor_email TEXT NOT NULL UNIQUE,
                    contractor_name TEXT NOT NULL DEFAULT '',
                    manager_email TEXT NOT NULL DEFAULT '',
                    manager_name TEXT NOT NULL DEFAULT '',
                    start_date TEXT NOT NULL DEFAULT '',
                    timezone TEXT NOT NULL DEFAULT 'America/New_York',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS task_progress (
                    record_id INTEGER NOT NULL,
                    task_id TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0,
                    note TEXT NOT NULL DEFAULT '',
                    completed_at TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL,
                    updated_by_role TEXT NOT NULL DEFAULT '',
                    PRIMARY KEY (record_id, task_id),
                    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS access_progress (
                    record_id INTEGER NOT NULL,
                    access_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'not_requested',
                    note TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (record_id, access_id),
                    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS plan_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    owner_manager_email TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL DEFAULT '',
                    department TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS plan_phases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_id INTEGER NOT NULL,
                    phase_key TEXT NOT NULL,
                    label TEXT NOT NULL DEFAULT '',
                    window_label TEXT NOT NULL DEFAULT '',
                    summary TEXT NOT NULL DEFAULT '',
                    position INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(template_id, phase_key),
                    FOREIGN KEY (template_id) REFERENCES plan_templates(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS plan_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_id INTEGER NOT NULL,
                    task_key TEXT NOT NULL,
                    phase_key TEXT NOT NULL,
                    owner_role TEXT NOT NULL DEFAULT 'contractor',
                    group_label TEXT NOT NULL DEFAULT '',
                    title TEXT NOT NULL DEFAULT '',
                    description TEXT NOT NULL DEFAULT '',
                    due_label TEXT NOT NULL DEFAULT '',
                    dependency_task_keys TEXT NOT NULL DEFAULT '[]',
                    source TEXT NOT NULL DEFAULT '',
                    position INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(template_id, task_key),
                    FOREIGN KEY (template_id) REFERENCES plan_templates(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS one_on_one_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    owner_manager_email TEXT NOT NULL,
                    name TEXT NOT NULL DEFAULT '',
                    cadence_days INTEGER NOT NULL DEFAULT 7,
                    agenda_reset_mode TEXT NOT NULL DEFAULT 'template',
                    manager_notes_json TEXT NOT NULL DEFAULT '[]',
                    contractor_talking_points_json TEXT NOT NULL DEFAULT '[]',
                    manager_metrics_json TEXT NOT NULL DEFAULT '[]',
                    action_items_json TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS one_on_one_series (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id INTEGER NOT NULL UNIQUE,
                    title TEXT NOT NULL DEFAULT '',
                    cadence_days INTEGER NOT NULL DEFAULT 7,
                    agenda_reset_mode TEXT NOT NULL DEFAULT 'template',
                    template_id INTEGER DEFAULT NULL,
                    next_meeting_date TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
                    FOREIGN KEY (template_id) REFERENCES one_on_one_templates(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS one_on_one_meetings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    series_id INTEGER NOT NULL,
                    sequence_number INTEGER NOT NULL DEFAULT 1,
                    scheduled_for TEXT NOT NULL,
                    title TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'scheduled',
                    template_id INTEGER DEFAULT NULL,
                    template_name TEXT NOT NULL DEFAULT '',
                    manager_notes_json TEXT NOT NULL DEFAULT '[]',
                    contractor_talking_points_json TEXT NOT NULL DEFAULT '[]',
                    manager_metrics_json TEXT NOT NULL DEFAULT '[]',
                    action_items_json TEXT NOT NULL DEFAULT '[]',
                    from_previous_meeting_json TEXT NOT NULL DEFAULT '[]',
                    wins_json TEXT NOT NULL DEFAULT '[]',
                    wins_summary TEXT NOT NULL DEFAULT '',
                    goals_summary TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    completed_at TEXT NOT NULL DEFAULT '',
                    UNIQUE(series_id, sequence_number),
                    UNIQUE(series_id, scheduled_for),
                    FOREIGN KEY (series_id) REFERENCES one_on_one_series(id) ON DELETE CASCADE,
                    FOREIGN KEY (template_id) REFERENCES one_on_one_templates(id) ON DELETE SET NULL
                );
                """
            )
            connection.commit()
        with self._connect() as conn:
            for col in ("wins_summary", "goals_summary"):
                try:
                    conn.execute(
                        f"ALTER TABLE one_on_one_meetings ADD COLUMN {col} TEXT NOT NULL DEFAULT ''"
                    )
                    conn.commit()
                except Exception:
                    pass
            for table_name, column_name in (
                ("one_on_one_meetings", "wins_json"),
                ("one_on_one_templates", "action_items_json"),
            ):
                try:
                    conn.execute(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} TEXT NOT NULL DEFAULT '[]'"
                    )
                    conn.commit()
                except Exception:
                    pass
        self._seed_default_plan()

    def _seed_default_plan(self) -> None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT id FROM plan_templates WHERE owner_manager_email = ?",
                (DEFAULT_PLAN_OWNER,),
            ).fetchone()
            if row is not None:
                return

            now = utc_now()
            cursor = connection.execute(
                """
                INSERT INTO plan_templates (
                    owner_manager_email,
                    name,
                    department,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    DEFAULT_PLAN_OWNER,
                    DEFAULT_PLAN_NAME,
                    DEFAULT_PLAN_DEPARTMENT,
                    now,
                    now,
                ),
            )
            self._write_plan_structure(
                connection,
                int(cursor.lastrowid),
                phases=PHASES,
                tasks=TASKS,
            )
            connection.commit()

    def _write_plan_structure(
        self,
        connection: sqlite3.Connection,
        template_id: int,
        *,
        phases: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
    ) -> None:
        connection.execute("DELETE FROM plan_tasks WHERE template_id = ?", (template_id,))
        connection.execute("DELETE FROM plan_phases WHERE template_id = ?", (template_id,))

        phase_ids = set()
        for position, phase in enumerate(phases):
            phase_id = str(phase.get("id", "")).strip()
            if not phase_id:
                raise ValueError("Each plan phase must include an id.")
            phase_ids.add(phase_id)
            connection.execute(
                """
                INSERT INTO plan_phases (
                    template_id,
                    phase_key,
                    label,
                    window_label,
                    summary,
                    position
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    template_id,
                    phase_id,
                    str(phase.get("label", "")).strip(),
                    str(phase.get("window", "")).strip(),
                    str(phase.get("summary", "")).strip(),
                    position,
                ),
            )

        for position, task in enumerate(tasks):
            phase_id = str(task.get("phase_id", "")).strip()
            if phase_id not in phase_ids:
                raise ValueError(f"Unknown phase for task: {phase_id}")
            raw_group = task.get("group", "")
            if isinstance(raw_group, list):
                group_labels = [str(x).strip() for x in raw_group if str(x).strip()]
            else:
                s = str(raw_group).strip()
                group_labels = [s] if s else []
            connection.execute(
                """
                INSERT INTO plan_tasks (
                    template_id,
                    task_key,
                    phase_key,
                    owner_role,
                    group_label,
                    title,
                    description,
                    due_label,
                    dependency_task_keys,
                    source,
                    position
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    template_id,
                    str(task.get("id", "")).strip(),
                    phase_id,
                    str(task.get("owner_role", "contractor")).strip(),
                    json.dumps(group_labels),
                    str(task.get("title", "")).strip(),
                    str(task.get("description", "")).strip(),
                    str(task.get("due_label", "")).strip(),
                    json.dumps(task.get("dependency_ids", [])),
                    str(task.get("source", "custom plan")).strip() or "custom plan",
                    position,
                ),
            )

    def _get_plan_row_by_owner_email(self, owner_manager_email: str) -> sqlite3.Row:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM plan_templates WHERE owner_manager_email = ?",
                (owner_manager_email.strip().lower(),),
            ).fetchone()
        if row is None:
            raise KeyError(f"No plan found for {owner_manager_email}")
        return row

    def _hydrate_plan(self, row: sqlite3.Row) -> Dict[str, Any]:
        template_id = int(row["id"])
        with self._connect() as connection:
            phase_rows = connection.execute(
                """
                SELECT phase_key, label, window_label, summary, position
                FROM plan_phases
                WHERE template_id = ?
                ORDER BY position, id
                """,
                (template_id,),
            ).fetchall()
            task_rows = connection.execute(
                """
                SELECT
                    task_key,
                    phase_key,
                    owner_role,
                    group_label,
                    title,
                    description,
                    due_label,
                    dependency_task_keys,
                    source,
                    position
                FROM plan_tasks
                WHERE template_id = ?
                ORDER BY position, id
                """,
                (template_id,),
            ).fetchall()

        def _parse_group_label(raw: str) -> List[str]:
            if not raw:
                return []
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
                return [str(parsed).strip()] if str(parsed).strip() else []
            except (TypeError, ValueError):
                return [str(raw).strip()] if str(raw).strip() else []

        tasks = [
            {
                "id": task_row["task_key"],
                "phase_id": task_row["phase_key"],
                "owner_role": task_row["owner_role"],
                "group": _parse_group_label(task_row["group_label"]),
                "title": task_row["title"],
                "description": task_row["description"],
                "due_label": task_row["due_label"],
                "dependency_ids": json.loads(task_row["dependency_task_keys"] or "[]"),
                "source": task_row["source"] or "custom plan",
                "position": int(task_row["position"]),
            }
            for task_row in task_rows
        ]
        tasks_by_phase: Dict[str, List[Dict[str, Any]]] = {}
        for task in tasks:
            tasks_by_phase.setdefault(task["phase_id"], []).append(task)

        phases = [
            {
                "id": phase_row["phase_key"],
                "label": phase_row["label"],
                "window": phase_row["window_label"],
                "summary": phase_row["summary"],
                "position": int(phase_row["position"]),
                "tasks": tasks_by_phase.get(phase_row["phase_key"], []),
            }
            for phase_row in phase_rows
        ]

        return {
            "id": template_id,
            "ownerManagerEmail": row["owner_manager_email"],
            "name": row["name"],
            "department": row["department"],
            "phases": phases,
            "tasks": tasks,
        }

    @staticmethod
    def _hydrate_one_on_one_template(row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": int(row["id"]),
            "ownerManagerEmail": row["owner_manager_email"],
            "name": row["name"],
            "cadenceDays": int(row["cadence_days"]),
            "agendaResetMode": row["agenda_reset_mode"],
            "managerNotes": loads_json_list(row["manager_notes_json"]),
            "contractorTalkingPoints": loads_json_list(row["contractor_talking_points_json"]),
            "managerMetrics": loads_json_list(row["manager_metrics_json"]),
            "actionItems": loads_json_list(row["action_items_json"]) if "action_items_json" in row.keys() else [],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    @staticmethod
    def _hydrate_one_on_one_meeting(row: sqlite3.Row) -> Dict[str, Any]:
        wins = loads_json_list(row["wins_json"]) if "wins_json" in row.keys() else []
        if not wins:
            # Preserve older meetings that only stored a single freeform wins summary.
            legacy_wins = (row["wins_summary"] if "wins_summary" in row.keys() else "") or ""
            if legacy_wins.strip():
                wins = [{"id": f"win_legacy_{int(row['id'])}", "text": legacy_wins.strip()}]
        return {
            "id": int(row["id"]),
            "seriesId": int(row["series_id"]),
            "sequenceNumber": int(row["sequence_number"]),
            "scheduledFor": row["scheduled_for"],
            "title": row["title"],
            "status": row["status"],
            "templateId": int(row["template_id"]) if row["template_id"] is not None else None,
            "templateName": row["template_name"],
            "managerNotes": loads_json_list(row["manager_notes_json"]),
            "contractorTalkingPoints": loads_json_list(row["contractor_talking_points_json"]),
            "managerMetrics": loads_json_list(row["manager_metrics_json"]),
            "actionItems": loads_json_list(row["action_items_json"]),
            "fromPreviousMeeting": loads_json_list(row["from_previous_meeting_json"]),
            "wins": wins,
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "completedAt": row["completed_at"],
        }

    def _touch_record(self, connection: sqlite3.Connection, record_id: int, now: str) -> None:
        connection.execute("UPDATE records SET updated_at = ? WHERE id = ?", (now, record_id))

    def _next_one_on_one_sequence(self, connection: sqlite3.Connection, series_id: int) -> int:
        row = connection.execute(
            "SELECT COALESCE(MAX(sequence_number), 0) AS max_sequence FROM one_on_one_meetings WHERE series_id = ?",
            (series_id,),
        ).fetchone()
        return int(row["max_sequence"]) + 1 if row is not None else 1

    def _insert_one_on_one_meeting(
        self,
        connection: sqlite3.Connection,
        *,
        series_id: int,
        scheduled_for: str,
        title: str,
        template_id: Optional[int],
        template_name: str,
        manager_notes: List[Dict[str, Any]],
        contractor_talking_points: List[Dict[str, Any]],
        manager_metrics: List[Dict[str, Any]],
        action_items: List[Dict[str, Any]],
        from_previous_meeting: List[Dict[str, Any]],
        wins: Optional[List[Dict[str, Any]]] = None,
    ) -> int:
        now = utc_now()
        # Meeting content is stored as JSON blobs so individual items can be edited in place.
        cursor = connection.execute(
            """
            INSERT INTO one_on_one_meetings (
                series_id,
                sequence_number,
                scheduled_for,
                title,
                status,
                template_id,
                template_name,
                manager_notes_json,
                contractor_talking_points_json,
                manager_metrics_json,
                action_items_json,
                from_previous_meeting_json,
                wins_json,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                series_id,
                self._next_one_on_one_sequence(connection, series_id),
                scheduled_for,
                title.strip(),
                template_id,
                template_name.strip(),
                json.dumps(manager_notes),
                json.dumps(contractor_talking_points),
                json.dumps(manager_metrics),
                json.dumps(action_items),
                json.dumps(from_previous_meeting),
                json.dumps(wins or []),
                now,
                now,
            ),
        )
        return int(cursor.lastrowid)

    @staticmethod
    def _meeting_has_content(row: sqlite3.Row) -> bool:
        # Reuse an existing scheduled slot only when the seeded fields are still empty.
        for column in (
            "manager_notes_json",
            "contractor_talking_points_json",
            "manager_metrics_json",
            "action_items_json",
            "from_previous_meeting_json",
            "wins_json",
        ):
            if column in row.keys() and loads_json_list(row[column]):
                return True
        return False

    def get_or_create_record(
        self,
        *,
        viewer_role: str,
        viewer_email: str,
        contractor_email: str,
        contractor_name: str = "",
        manager_email: str = "",
        manager_name: str = "",
        start_date: str = "",
        timezone_name: str = DEFAULT_TIMEZONE,
    ) -> Dict[str, Any]:
        normalized_contractor_email = contractor_email.strip().lower()
        normalized_viewer_email = viewer_email.strip().lower()
        normalized_manager_email = manager_email.strip().lower()
        now = utc_now()

        record_created = False
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM records WHERE contractor_email = ?",
                (normalized_contractor_email,),
            ).fetchone()

            if row is None:
                record_created = True
                if normalized_contractor_email in DEMO_CONTRACTOR_EMAILS:
                    resolved_manager_email = DEMO_MANAGER_EMAIL
                else:
                    resolved_manager_email = (
                        normalized_viewer_email if viewer_role == "manager" else normalized_manager_email
                    )
                resolved_manager_name = manager_name.strip() or (
                    humanize_email(resolved_manager_email) if resolved_manager_email else ""
                )
                resolved_contractor_name = contractor_name.strip() or humanize_email(
                    normalized_contractor_email
                )
                connection.execute(
                    """
                    INSERT INTO records (
                        contractor_email,
                        contractor_name,
                        manager_email,
                        manager_name,
                        start_date,
                        timezone,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        normalized_contractor_email,
                        resolved_contractor_name,
                        resolved_manager_email,
                        resolved_manager_name,
                        start_date.strip(),
                        timezone_name.strip() or DEFAULT_TIMEZONE,
                        now,
                        now,
                    ),
                )
            else:
                next_contractor_name = contractor_name.strip() or row["contractor_name"] or humanize_email(
                    normalized_contractor_email
                )
                next_manager_email = row["manager_email"]
                if viewer_role == "manager" and not next_manager_email:
                    next_manager_email = normalized_viewer_email
                elif normalized_manager_email and not next_manager_email:
                    next_manager_email = normalized_manager_email

                next_manager_name = manager_name.strip() or row["manager_name"]
                if not next_manager_name and next_manager_email:
                    next_manager_name = humanize_email(next_manager_email)

                next_start_date = start_date.strip() or row["start_date"]
                next_timezone = timezone_name.strip() or row["timezone"] or DEFAULT_TIMEZONE

                connection.execute(
                    """
                    UPDATE records
                    SET contractor_name = ?,
                        manager_email = ?,
                        manager_name = ?,
                        start_date = ?,
                        timezone = ?,
                        updated_at = ?
                    WHERE contractor_email = ?
                    """,
                    (
                        next_contractor_name,
                        next_manager_email,
                        next_manager_name,
                        next_start_date,
                        next_timezone,
                        now,
                        normalized_contractor_email,
                    ),
                )

            connection.commit()

        record = self.get_record_by_contractor_email(normalized_contractor_email)
        if record_created and len(DEMO_CONTRACTOR_EMAILS) >= 2 and normalized_contractor_email == DEMO_CONTRACTOR_EMAILS[1]:
            source_record = None
            try:
                source_record = self.get_record_by_contractor_email(DEMO_CONTRACTOR_EMAILS[0])
            except KeyError:
                pass
            if source_record is not None:
                self._clone_demo_record_data(int(source_record["id"]), int(record["id"]))
        return record

    def _clone_demo_record_data(self, from_record_id: int, to_record_id: int) -> None:
        """Copy task progress, access progress, and 1:1 series (with meetings) from one record to another."""
        with self._connect() as connection:
            for task_row in connection.execute(
                "SELECT task_id, completed, note, completed_at, updated_at, updated_by_role FROM task_progress WHERE record_id = ?",
                (from_record_id,),
            ).fetchall():
                connection.execute(
                    """
                    INSERT OR REPLACE INTO task_progress (record_id, task_id, completed, note, completed_at, updated_at, updated_by_role)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (to_record_id, task_row["task_id"], task_row["completed"], task_row["note"], task_row["completed_at"], task_row["updated_at"], task_row["updated_by_role"]),
                )
            for acc_row in connection.execute(
                "SELECT access_id, status, note, updated_at FROM access_progress WHERE record_id = ?",
                (from_record_id,),
            ).fetchall():
                connection.execute(
                    """
                    INSERT OR REPLACE INTO access_progress (record_id, access_id, status, note, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (to_record_id, acc_row["access_id"], acc_row["status"], acc_row["note"], acc_row["updated_at"]),
                )
            series_row = connection.execute(
                "SELECT id, title, cadence_days, agenda_reset_mode, template_id, next_meeting_date FROM one_on_one_series WHERE record_id = ?",
                (from_record_id,),
            ).fetchone()
            if series_row is not None:
                cursor = connection.execute(
                    """
                    INSERT INTO one_on_one_series (record_id, title, cadence_days, agenda_reset_mode, template_id, next_meeting_date, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (to_record_id, series_row["title"], series_row["cadence_days"], series_row["agenda_reset_mode"], series_row["template_id"], series_row["next_meeting_date"], utc_now(), utc_now()),
                )
                new_series_id = int(cursor.lastrowid)
                for meeting_row in connection.execute(
                    """
                    SELECT sequence_number, scheduled_for, title, status, template_id, template_name,
                           manager_notes_json, contractor_talking_points_json, manager_metrics_json,
                           action_items_json, from_previous_meeting_json, completed_at
                    FROM one_on_one_meetings WHERE series_id = ?
                    ORDER BY id
                    """,
                    (int(series_row["id"]),),
                ).fetchall():
                    connection.execute(
                        """
                        INSERT INTO one_on_one_meetings (
                            series_id, sequence_number, scheduled_for, title, status, template_id, template_name,
                            manager_notes_json, contractor_talking_points_json, manager_metrics_json,
                            action_items_json, from_previous_meeting_json, created_at, updated_at, completed_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            new_series_id,
                            meeting_row["sequence_number"],
                            meeting_row["scheduled_for"],
                            meeting_row["title"],
                            meeting_row["status"],
                            meeting_row["template_id"],
                            meeting_row["template_name"],
                            meeting_row["manager_notes_json"],
                            meeting_row["contractor_talking_points_json"],
                            meeting_row["manager_metrics_json"],
                            meeting_row["action_items_json"],
                            meeting_row["from_previous_meeting_json"],
                            utc_now(),
                            utc_now(),
                            meeting_row["completed_at"] or "",
                        ),
                    )
            connection.commit()

    def get_record_by_contractor_email(self, contractor_email: str) -> Dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM records WHERE contractor_email = ?",
                (contractor_email.strip().lower(),),
            ).fetchone()
        if row is None:
            raise KeyError(f"No record found for {contractor_email}")
        return dict(row)

    def get_record_by_id(self, record_id: int) -> Dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
        if row is None:
            raise KeyError(f"No record found for id={record_id}")
        return dict(row)

    def get_default_plan(self) -> Dict[str, Any]:
        return self._hydrate_plan(self._get_plan_row_by_owner_email(DEFAULT_PLAN_OWNER))

    def ensure_manager_plan(
        self,
        manager_email: str,
        *,
        name: str = "",
        department: str = "",
    ) -> Dict[str, Any]:
        normalized_manager_email = manager_email.strip().lower()
        if not normalized_manager_email:
            return self.get_default_plan()

        try:
            return self._hydrate_plan(self._get_plan_row_by_owner_email(normalized_manager_email))
        except KeyError:
            default_plan = self.get_default_plan()
            now = utc_now()
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    INSERT INTO plan_templates (
                        owner_manager_email,
                        name,
                        department,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        normalized_manager_email,
                        name.strip() or f"{humanize_email(normalized_manager_email)} onboarding plan",
                        department.strip(),
                        now,
                        now,
                    ),
                )
                self._write_plan_structure(
                    connection,
                    int(cursor.lastrowid),
                    phases=default_plan["phases"],
                    tasks=default_plan["tasks"],
                )
                connection.commit()
            return self._hydrate_plan(self._get_plan_row_by_owner_email(normalized_manager_email))

    def update_manager_plan(
        self,
        manager_email: str,
        *,
        name: str,
        department: str,
        phases: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        normalized_manager_email = manager_email.strip().lower()
        if not normalized_manager_email:
            raise KeyError("Manager email is required for a plan.")

        current_plan = self.ensure_manager_plan(normalized_manager_email)
        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE plan_templates
                SET name = ?, department = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    name.strip() or current_plan["name"],
                    department.strip(),
                    now,
                    int(current_plan["id"]),
                ),
            )
            self._write_plan_structure(
                connection,
                int(current_plan["id"]),
                phases=phases,
                tasks=tasks,
            )
            connection.commit()
        return self._hydrate_plan(self._get_plan_row_by_owner_email(normalized_manager_email))

    def list_records_for_manager(self, manager_email: str) -> List[Dict[str, Any]]:
        normalized_manager_email = (manager_email or "").strip().lower()
        if not normalized_manager_email:
            return []

        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM records
                WHERE LOWER(TRIM(manager_email)) = ?
                ORDER BY
                    CASE
                        WHEN TRIM(contractor_name) = '' THEN LOWER(contractor_email)
                        ELSE LOWER(contractor_name)
                    END,
                    LOWER(contractor_email)
                """,
                (normalized_manager_email,),
            ).fetchall()
        return [dict(row) for row in rows]

    def list_one_on_one_templates(self, manager_email: str) -> List[Dict[str, Any]]:
        normalized_manager_email = manager_email.strip().lower()
        if not normalized_manager_email:
            return []

        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT *
                FROM one_on_one_templates
                WHERE owner_manager_email = ?
                ORDER BY LOWER(name), id
                """,
                (normalized_manager_email,),
            ).fetchall()
        return [self._hydrate_one_on_one_template(row) for row in rows]

    def get_one_on_one_template(self, template_id: int) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM one_on_one_templates WHERE id = ?",
                (template_id,),
            ).fetchone()
        return self._hydrate_one_on_one_template(row) if row is not None else None

    def create_one_on_one_template(
        self,
        manager_email: str,
        *,
        name: str,
        cadence_days: int,
        agenda_reset_mode: str,
        manager_notes: List[Dict[str, Any]],
        contractor_talking_points: List[Dict[str, Any]],
        manager_metrics: List[Dict[str, Any]],
        action_items: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        normalized_manager_email = manager_email.strip().lower()
        now = utc_now()
        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO one_on_one_templates (
                    owner_manager_email,
                    name,
                    cadence_days,
                    agenda_reset_mode,
                    manager_notes_json,
                    contractor_talking_points_json,
                    manager_metrics_json,
                    action_items_json,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    normalized_manager_email,
                    name.strip(),
                    cadence_days,
                    agenda_reset_mode.strip(),
                    json.dumps(manager_notes),
                    json.dumps(contractor_talking_points),
                    json.dumps(manager_metrics),
                    json.dumps(action_items),
                    now,
                    now,
                ),
            )
            connection.commit()
        created = self.get_one_on_one_template(int(cursor.lastrowid))
        if created is None:
            raise KeyError("Unable to load 1:1 template after creation.")
        return created

    def update_one_on_one_template(
        self,
        template_id: int,
        *,
        name: str,
        cadence_days: int,
        agenda_reset_mode: str,
        manager_notes: List[Dict[str, Any]],
        contractor_talking_points: List[Dict[str, Any]],
        manager_metrics: List[Dict[str, Any]],
        action_items: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        now = utc_now()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT id FROM one_on_one_templates WHERE id = ?",
                (template_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"No 1:1 template found for id={template_id}")
            connection.execute(
                """
                UPDATE one_on_one_templates
                SET name = ?,
                    cadence_days = ?,
                    agenda_reset_mode = ?,
                    manager_notes_json = ?,
                    contractor_talking_points_json = ?,
                    manager_metrics_json = ?,
                    action_items_json = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    name.strip(),
                    cadence_days,
                    agenda_reset_mode.strip(),
                    json.dumps(manager_notes),
                    json.dumps(contractor_talking_points),
                    json.dumps(manager_metrics),
                    json.dumps(action_items),
                    now,
                    template_id,
                ),
            )
            connection.commit()
        updated = self.get_one_on_one_template(template_id)
        if updated is None:
            raise KeyError(f"Unable to load 1:1 template after update: {template_id}")
        return updated

    def delete_one_on_one_template(self, template_id: int) -> None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT id FROM one_on_one_templates WHERE id = ?",
                (template_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"No 1:1 template found for id={template_id}")
            connection.execute(
                "DELETE FROM one_on_one_templates WHERE id = ?",
                (template_id,),
            )
            connection.commit()

    def clear_one_on_one_template_references(self, template_id: int) -> None:
        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE one_on_one_series
                SET template_id = ?, updated_at = ?
                WHERE template_id = ?
                """,
                (None, now, template_id),
            )
            connection.commit()

    def get_one_on_one_series(self, record_id: int) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            series_row = connection.execute(
                """
                SELECT
                    series.*,
                    templates.name AS template_name
                FROM one_on_one_series AS series
                LEFT JOIN one_on_one_templates AS templates
                    ON templates.id = series.template_id
                WHERE series.record_id = ?
                """,
                (record_id,),
            ).fetchone()
            if series_row is None:
                return None

            meeting_rows = connection.execute(
                """
                SELECT *
                FROM one_on_one_meetings
                WHERE series_id = ?
                ORDER BY scheduled_for, id
                """,
                (int(series_row["id"]),),
            ).fetchall()

        return {
            "id": int(series_row["id"]),
            "recordId": int(series_row["record_id"]),
            "title": series_row["title"],
            "cadenceDays": int(series_row["cadence_days"]),
            "agendaResetMode": series_row["agenda_reset_mode"],
            "templateId": int(series_row["template_id"]) if series_row["template_id"] is not None else None,
            "templateName": series_row["template_name"] or "",
            "nextMeetingDate": series_row["next_meeting_date"],
            "createdAt": series_row["created_at"],
            "updatedAt": series_row["updated_at"],
            "meetings": [self._hydrate_one_on_one_meeting(row) for row in meeting_rows],
        }

    def get_one_on_one_meeting(self, meeting_id: int) -> Dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT
                    meetings.*,
                    series.record_id
                FROM one_on_one_meetings AS meetings
                INNER JOIN one_on_one_series AS series
                    ON series.id = meetings.series_id
                WHERE meetings.id = ?
                """,
                (meeting_id,),
            ).fetchone()
        if row is None:
            raise KeyError(f"No 1:1 meeting found for id={meeting_id}")
        hydrated = self._hydrate_one_on_one_meeting(row)
        hydrated["recordId"] = int(row["record_id"])
        return hydrated

    def save_one_on_one_series(
        self,
        record_id: int,
        *,
        title: str,
        cadence_days: int,
        agenda_reset_mode: str,
        template_id: Optional[int],
        template_name: str,
        first_meeting_date: str,
        manager_notes: List[Dict[str, Any]],
        contractor_talking_points: List[Dict[str, Any]],
        manager_metrics: List[Dict[str, Any]],
        action_items: Optional[List[Dict[str, Any]]] = None,
        from_previous_meeting: Optional[List[Dict[str, Any]]] = None,
        wins: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        now = utc_now()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM one_on_one_series WHERE record_id = ?",
                (record_id,),
            ).fetchone()
            if row is None:
                cursor = connection.execute(
                    """
                    INSERT INTO one_on_one_series (
                        record_id,
                        title,
                        cadence_days,
                        agenda_reset_mode,
                        template_id,
                        next_meeting_date,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        record_id,
                        title.strip(),
                        cadence_days,
                        agenda_reset_mode.strip(),
                        template_id,
                        first_meeting_date,
                        now,
                        now,
                    ),
                )
                series_id = int(cursor.lastrowid)
                self._insert_one_on_one_meeting(
                    connection,
                    series_id=series_id,
                    scheduled_for=first_meeting_date,
                    title=title,
                    template_id=template_id,
                    template_name=template_name,
                    manager_notes=manager_notes,
                    contractor_talking_points=contractor_talking_points,
                    manager_metrics=manager_metrics,
                    action_items=action_items or [],
                    from_previous_meeting=from_previous_meeting or [],
                    wins=wins or [],
                )
            else:
                series_id = int(row["id"])
                connection.execute(
                    """
                    UPDATE one_on_one_series
                    SET title = ?,
                        cadence_days = ?,
                        agenda_reset_mode = ?,
                        template_id = ?,
                        next_meeting_date = ?,
                        updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        title.strip(),
                        cadence_days,
                        agenda_reset_mode.strip(),
                        template_id,
                        first_meeting_date,
                        now,
                        series_id,
                    ),
                )

                scheduled_row = connection.execute(
                    """
                    SELECT *
                    FROM one_on_one_meetings
                    WHERE series_id = ? AND status = 'scheduled'
                    ORDER BY scheduled_for, id
                    LIMIT 1
                    """,
                    (series_id,),
                ).fetchone()

                if scheduled_row is None:
                    self._insert_one_on_one_meeting(
                        connection,
                        series_id=series_id,
                        scheduled_for=first_meeting_date,
                        title=title,
                        template_id=template_id,
                        template_name=template_name,
                        manager_notes=manager_notes,
                        contractor_talking_points=contractor_talking_points,
                        manager_metrics=manager_metrics,
                        action_items=[],
                        from_previous_meeting=[],
                        wins=[],
                    )
                else:
                    assignments = [
                        "scheduled_for = ?",
                        "title = ?",
                        "template_id = ?",
                        "template_name = ?",
                        "updated_at = ?",
                    ]
                    values: List[Any] = [
                        first_meeting_date,
                        title.strip(),
                        template_id,
                        template_name.strip(),
                        now,
                    ]
                    if not self._meeting_has_content(scheduled_row):
                        assignments.extend(
                            [
                                "manager_notes_json = ?",
                                "contractor_talking_points_json = ?",
                                "manager_metrics_json = ?",
                                "action_items_json = ?",
                                "from_previous_meeting_json = ?",
                                "wins_json = ?",
                            ]
                        )
                        values.extend(
                            [
                                json.dumps(manager_notes),
                                json.dumps(contractor_talking_points),
                                json.dumps(manager_metrics),
                                json.dumps([]),
                                json.dumps([]),
                                json.dumps(wins or []),
                            ]
                        )
                    values.append(int(scheduled_row["id"]))
                    connection.execute(
                        f"UPDATE one_on_one_meetings SET {', '.join(assignments)} WHERE id = ?",
                        values,
                    )

            self._touch_record(connection, record_id, now)
            connection.commit()
        series = self.get_one_on_one_series(record_id)
        if series is None:
            raise KeyError(f"No 1:1 series found for record id={record_id}")
        return series

    def update_one_on_one_series(
        self,
        series_id: int,
        *,
        title: str,
        cadence_days: int,
        agenda_reset_mode: str,
        template_id: Optional[int],
        next_meeting_date: str,
    ) -> None:
        now = utc_now()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT record_id FROM one_on_one_series WHERE id = ?",
                (series_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"No 1:1 series found for id={series_id}")
            connection.execute(
                """
                UPDATE one_on_one_series
                SET title = ?,
                    cadence_days = ?,
                    agenda_reset_mode = ?,
                    template_id = ?,
                    next_meeting_date = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    title.strip(),
                    cadence_days,
                    agenda_reset_mode.strip(),
                    template_id,
                    next_meeting_date,
                    now,
                    series_id,
                ),
            )
            self._touch_record(connection, int(row["record_id"]), now)
            connection.commit()

    def update_one_on_one_meeting(
        self,
        meeting_id: int,
        *,
        manager_notes: Optional[List[Dict[str, Any]]] = None,
        contractor_talking_points: Optional[List[Dict[str, Any]]] = None,
        manager_metrics: Optional[List[Dict[str, Any]]] = None,
        action_items: Optional[List[Dict[str, Any]]] = None,
        from_previous_meeting: Optional[List[Dict[str, Any]]] = None,
        wins: Optional[List[Dict[str, Any]]] = None,
        scheduled_for: Optional[str] = None,
        title: Optional[str] = None,
        template_id: Optional[int] = None,
        template_name: Optional[str] = None,
        status: Optional[str] = None,
        completed_at: Optional[str] = None,
    ) -> None:
        now = utc_now()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT series.record_id
                FROM one_on_one_meetings AS meetings
                INNER JOIN one_on_one_series AS series
                    ON series.id = meetings.series_id
                WHERE meetings.id = ?
                """,
                (meeting_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"No 1:1 meeting found for id={meeting_id}")

            assignments = ["updated_at = ?"]
            values: List[Any] = [now]

            json_updates = {
                "manager_notes_json": manager_notes,
                "contractor_talking_points_json": contractor_talking_points,
                "manager_metrics_json": manager_metrics,
                "action_items_json": action_items,
                "from_previous_meeting_json": from_previous_meeting,
                "wins_json": wins,
            }
            for column, value in json_updates.items():
                if value is None:
                    continue
                assignments.append(f"{column} = ?")
                values.append(json.dumps(value))

            scalar_updates = {
                "scheduled_for": scheduled_for,
                "title": title.strip() if isinstance(title, str) else title,
                "template_id": template_id,
                "template_name": template_name.strip() if isinstance(template_name, str) else template_name,
                "status": status,
                "completed_at": completed_at,
            }
            for column, value in scalar_updates.items():
                if value is None:
                    continue
                assignments.append(f"{column} = ?")
                values.append(value)

            values.append(meeting_id)
            connection.execute(
                f"UPDATE one_on_one_meetings SET {', '.join(assignments)} WHERE id = ?",
                values,
            )
            self._touch_record(connection, int(row["record_id"]), now)
            connection.commit()

    def create_one_on_one_meeting(
        self,
        series_id: int,
        *,
        scheduled_for: str,
        title: str,
        template_id: Optional[int],
        template_name: str,
        manager_notes: List[Dict[str, Any]],
        contractor_talking_points: List[Dict[str, Any]],
        manager_metrics: List[Dict[str, Any]],
        action_items: List[Dict[str, Any]],
        from_previous_meeting: List[Dict[str, Any]],
        wins: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        now = utc_now()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT record_id FROM one_on_one_series WHERE id = ?",
                (series_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"No 1:1 series found for id={series_id}")
            meeting_id = self._insert_one_on_one_meeting(
                connection,
                series_id=series_id,
                scheduled_for=scheduled_for,
                title=title,
                template_id=template_id,
                template_name=template_name,
                manager_notes=manager_notes,
                contractor_talking_points=contractor_talking_points,
                manager_metrics=manager_metrics,
                action_items=action_items,
                from_previous_meeting=from_previous_meeting,
                wins=wins or [],
            )
            self._touch_record(connection, int(row["record_id"]), now)
            connection.commit()
        return self.get_one_on_one_meeting(meeting_id)

    def update_profile(self, record_id: int, *, updates: Dict[str, str]) -> Dict[str, Any]:
        allowed = {
            "contractor_name",
            "manager_email",
            "manager_name",
            "start_date",
            "timezone",
        }
        filtered = {key: value.strip() for key, value in updates.items() if key in allowed}
        if not filtered:
            return self.get_record_by_id(record_id)

        filtered["updated_at"] = utc_now()
        assignments = ", ".join(f"{field} = ?" for field in filtered)
        values = list(filtered.values()) + [record_id]

        with self._connect() as connection:
            connection.execute(f"UPDATE records SET {assignments} WHERE id = ?", values)
            connection.commit()

        return self.get_record_by_id(record_id)

    def update_task(
        self,
        record_id: int,
        *,
        task_id: str,
        completed: bool,
        note: str = "",
        updated_by_role: str = "",
    ) -> None:
        now = utc_now()
        completed_at = now if completed else ""
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO task_progress (
                    record_id, task_id, completed, note, completed_at, updated_at, updated_by_role
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(record_id, task_id) DO UPDATE SET
                    completed = excluded.completed,
                    note = excluded.note,
                    completed_at = excluded.completed_at,
                    updated_at = excluded.updated_at,
                    updated_by_role = excluded.updated_by_role
                """,
                (
                    record_id,
                    task_id,
                    1 if completed else 0,
                    note.strip(),
                    completed_at,
                    now,
                    updated_by_role.strip(),
                ),
            )
            connection.execute(
                "UPDATE records SET updated_at = ? WHERE id = ?",
                (now, record_id),
            )
            connection.commit()

    def update_access(self, record_id: int, *, access_id: str, status: str, note: str = "") -> None:
        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO access_progress (record_id, access_id, status, note, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(record_id, access_id) DO UPDATE SET
                    status = excluded.status,
                    note = excluded.note,
                    updated_at = excluded.updated_at
                """,
                (record_id, access_id, status, note.strip(), now),
            )
            connection.execute(
                "UPDATE records SET updated_at = ? WHERE id = ?",
                (now, record_id),
            )
            connection.commit()

    def get_task_state_map(self, record_id: int) -> Dict[str, Dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT task_id, completed, note, completed_at, updated_at, updated_by_role
                FROM task_progress
                WHERE record_id = ?
                """,
                (record_id,),
            ).fetchall()
        return {
            row["task_id"]: {
                "completed": bool(row["completed"]),
                "note": row["note"],
                "completed_at": row["completed_at"],
                "updated_at": row["updated_at"],
                "updated_by_role": row["updated_by_role"],
            }
            for row in rows
        }

    def get_access_state_map(self, record_id: int) -> Dict[str, Dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT access_id, status, note, updated_at
                FROM access_progress
                WHERE record_id = ?
                """,
                (record_id,),
            ).fetchall()
        return {
            row["access_id"]: {
                "status": row["status"],
                "note": row["note"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        }

    def reset(self) -> None:
        """Testing helper."""
        with self._connect() as connection:
            connection.executescript(
                """
                DELETE FROM one_on_one_meetings;
                DELETE FROM one_on_one_series;
                DELETE FROM one_on_one_templates;
                DELETE FROM access_progress;
                DELETE FROM task_progress;
                DELETE FROM records;
                """
            )
            connection.commit()
