"""Business logic for the onboarding portal."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from .repository import OnboardingRepository, humanize_email, utc_now
from .seed_data import (
    ACCESS_BUNDLES,
    ACCESS_STATUSES,
    DEFAULT_TIMEZONE,
    DEMO_HINTS,
    METRIC_TARGETS,
    PHONE_METRICS,
    QUALITATIVE_EXPECTATIONS,
    RESOURCES,
)


ROLE_CHOICES = {"contractor", "manager"}
ACCESS_MAP = {bundle["id"]: bundle for bundle in ACCESS_BUNDLES}
ONE_ON_ONE_RESET_MODES = {"clear", "template"}


class ValidationError(ValueError):
    pass


class NotFoundError(KeyError):
    pass


class PermissionDeniedError(PermissionError):
    pass


class OnboardingService:
    def __init__(self, repository: OnboardingRepository):
        self.repository = repository

    def bootstrap_payload(self) -> Dict[str, Any]:
        return {
            "phases": self.repository.get_default_plan()["phases"],
            "demoHints": DEMO_HINTS,
            "accessStatuses": ACCESS_STATUSES,
            "defaultTimezone": DEFAULT_TIMEZONE,
        }

    def resolve_session(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        contractor_email = (
            self._normalized_email(payload.get("contractorEmail", ""))
            if payload.get("contractorEmail")
            else ""
        )
        if viewer_role == "contractor":
            contractor_email = contractor_email or viewer_email
            if contractor_email != viewer_email:
                raise ValidationError("Contractors can only open their own onboarding record.")
        elif viewer_role == "manager" and not contractor_email:
            records = self.repository.list_records_for_manager(viewer_email)
            if not records:
                raise ValidationError(
                    "You have no contractor records yet. Use the workspace to add a contractor."
                )
            contractor_email = str(records[0].get("contractor_email", "")).strip().lower()

        record = self.repository.get_or_create_record(
            viewer_role=viewer_role,
            viewer_email=viewer_email,
            contractor_email=contractor_email,
            contractor_name=str(payload.get("contractorName", "")),
            manager_email=str(payload.get("managerEmail", "")),
            manager_name=str(payload.get("managerName", "")),
            start_date=str(payload.get("startDate", "")),
            timezone_name=str(payload.get("timezone", DEFAULT_TIMEZONE)),
        )
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role=viewer_role)
        return self._build_snapshot(record=record, viewer_email=viewer_email, viewer_role=viewer_role)

    def get_snapshot(self, record_id: int, *, viewer_email: str, viewer_role: str) -> Dict[str, Any]:
        record = self._require_record(record_id)
        normalized_viewer_email = self._normalized_email(viewer_email)
        normalized_viewer_role = self._normalized_role(viewer_role)
        self._ensure_record_access(
            record,
            viewer_email=normalized_viewer_email,
            viewer_role=normalized_viewer_role,
        )
        return self._build_snapshot(
            record=record,
            viewer_email=normalized_viewer_email,
            viewer_role=normalized_viewer_role,
        )

    def update_profile(self, record_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        updates = {
            "contractor_name": str(payload.get("contractorName", "")),
            "start_date": str(payload.get("startDate", "")),
            "timezone": str(payload.get("timezone", DEFAULT_TIMEZONE)),
        }
        if viewer_role == "manager":
            updates["manager_email"] = str(payload.get("managerEmail", ""))
            updates["manager_name"] = str(payload.get("managerName", ""))

        record = self._require_record(record_id)
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role=viewer_role)
        record = self.repository.update_profile(record_id, updates=updates)
        return self._build_snapshot(record=record, viewer_email=viewer_email, viewer_role=viewer_role)

    def update_task(self, record_id: int, task_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        completed = bool(payload.get("completed", False))
        note = str(payload.get("note", ""))

        record = self._require_record(record_id)
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role=viewer_role)
        plan, _ = self._resolve_plan(record=record, viewer_email=viewer_email, viewer_role=viewer_role)
        task_map = {task["id"]: task for task in plan["tasks"]}
        task = task_map.get(task_id)
        if task is None:
            raise NotFoundError(f"Unknown task: {task_id}")
        if viewer_role == "contractor" and task["owner_role"] != "contractor":
            raise PermissionDeniedError("Contractors can only update contractor-owned tasks.")

        self.repository.update_task(
            record_id,
            task_id=task_id,
            completed=completed,
            note=note,
            updated_by_role=viewer_role,
        )
        return self.get_snapshot(record_id, viewer_email=viewer_email, viewer_role=viewer_role)

    def update_access(self, record_id: int, access_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        status = str(payload.get("status", "")).strip()
        note = str(payload.get("note", ""))

        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can update access bundles.")
        if access_id not in ACCESS_MAP:
            raise NotFoundError(f"Unknown access bundle: {access_id}")
        if status not in ACCESS_STATUSES:
            raise ValidationError(f"Unsupported access status: {status}")

        record = self._require_record(record_id)
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role=viewer_role)
        self.repository.update_access(record_id, access_id=access_id, status=status, note=note)
        return self.get_snapshot(record_id, viewer_email=viewer_email, viewer_role=viewer_role)

    def update_plan(self, record_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can update onboarding plans.")

        record = self._require_record(record_id)
        self._ensure_manager_can_manage_record(record, viewer_email=viewer_email)
        assigned_manager_email = str(record.get("manager_email", "")).strip().lower()
        if assigned_manager_email and assigned_manager_email != viewer_email:
            raise PermissionDeniedError("Only the assigned manager can edit this onboarding plan.")

        plan, _ = self._resolve_plan(record=record, viewer_email=viewer_email, viewer_role=viewer_role)
        sanitized = self._sanitize_plan_payload(payload, existing_plan=plan)
        self.repository.update_manager_plan(
            viewer_email,
            name=sanitized["name"],
            department=sanitized["department"],
            phases=sanitized["phases"],
            tasks=sanitized["tasks"],
        )
        refreshed_record = self._require_record(record_id)
        return self._build_snapshot(
            record=refreshed_record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )

    def configure_one_on_one_series(self, record_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can set up 1:1s.")

        record = self._require_record(record_id)
        self._ensure_manager_can_manage_record(record, viewer_email=viewer_email)

        template = self._resolve_one_on_one_template(payload.get("templateId"), viewer_email=viewer_email)
        title = str(payload.get("title", "")).strip() or f"{record.get('contractor_name') or humanize_email(record['contractor_email'])} 1:1"
        first_meeting_date = self._normalized_iso_date(
            payload.get("firstMeetingDate", payload.get("nextMeetingDate", "")),
            field_label="First meeting date",
        )
        cadence_days = self._normalized_positive_int(payload.get("cadenceDays", 7), field_label="Cadence days")
        agenda_reset_mode = self._normalized_one_on_one_reset_mode(
            payload.get("agendaResetMode", template["agendaResetMode"] if template else "template")
        )
        seeded = self._seed_one_on_one_meeting_payload(template, agenda_reset_mode=agenda_reset_mode)

        self.repository.save_one_on_one_series(
            record_id,
            title=title,
            cadence_days=cadence_days,
            agenda_reset_mode=agenda_reset_mode,
            template_id=template["id"] if template else None,
            template_name=template["name"] if template else "",
            first_meeting_date=first_meeting_date,
            manager_notes=seeded["managerNotes"],
            contractor_talking_points=seeded["contractorTalkingPoints"],
            manager_metrics=seeded["managerMetrics"],
            action_items=seeded.get("actionItems", []),
            from_previous_meeting=[],
            wins=[],
        )
        self._ensure_future_one_on_one_meetings(record_id, viewer_email=viewer_email)
        refreshed_record = self._require_record(record_id)
        return self._build_snapshot(
            record=refreshed_record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )

    def create_one_on_one_template(self, record_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can save 1:1 templates.")

        record = self._require_record(record_id)
        self._ensure_manager_can_manage_record(record, viewer_email=viewer_email)

        name = str(payload.get("name", "")).strip()
        if not name:
            raise ValidationError("Template name is required.")

        cadence_days = self._normalized_positive_int(payload.get("cadenceDays", 7), field_label="Cadence days")
        agenda_reset_mode = self._normalized_one_on_one_reset_mode(payload.get("agendaResetMode", "template"))
        manager_notes = self._sanitize_one_on_one_note_items(
            payload.get("managerNotes", []),
            field_label="Manager agenda items",
            prefix="template_note",
            allow_done=False,
        )
        contractor_talking_points = self._sanitize_one_on_one_note_items(
            payload.get("contractorTalkingPoints", []),
            field_label="Contractor talking points",
            prefix="template_point",
            allow_done=False,
        )
        manager_metrics = self._sanitize_one_on_one_metric_items(
            payload.get("managerMetrics", []),
            field_label="Manager metrics",
        )
        action_items = self._sanitize_one_on_one_note_items(
            payload.get("actionItems", []),
            field_label="Template action items",
            prefix="template_action",
            allow_done=False,
        )

        self.repository.create_one_on_one_template(
            viewer_email,
            name=name,
            cadence_days=cadence_days,
            agenda_reset_mode=agenda_reset_mode,
            manager_notes=manager_notes,
            contractor_talking_points=contractor_talking_points,
            manager_metrics=manager_metrics,
            action_items=action_items,
        )
        refreshed_record = self._require_record(record_id)
        return self._build_snapshot(
            record=refreshed_record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )

    def update_one_on_one_template(
        self,
        record_id: int,
        template_id: int,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can edit 1:1 templates.")

        record = self._require_record(record_id)
        self._ensure_manager_can_manage_record(record, viewer_email=viewer_email)
        template = self._resolve_one_on_one_template(template_id, viewer_email=viewer_email)
        if template is None:
            raise NotFoundError(f"Unknown 1:1 template: {template_id}")

        name = str(payload.get("name", "")).strip()
        if not name:
            raise ValidationError("Template name is required.")

        cadence_days = self._normalized_positive_int(payload.get("cadenceDays", 7), field_label="Cadence days")
        agenda_reset_mode = self._normalized_one_on_one_reset_mode(payload.get("agendaResetMode", "template"))
        manager_notes = self._sanitize_one_on_one_note_items(
            payload.get("managerNotes", []),
            field_label="Manager agenda items",
            prefix="template_note",
            allow_done=False,
        )
        contractor_talking_points = self._sanitize_one_on_one_note_items(
            payload.get("contractorTalkingPoints", []),
            field_label="Contractor talking points",
            prefix="template_point",
            allow_done=False,
        )
        manager_metrics = self._sanitize_one_on_one_metric_items(
            payload.get("managerMetrics", []),
            field_label="Manager metrics",
        )
        action_items = self._sanitize_one_on_one_note_items(
            payload.get("actionItems", []),
            field_label="Template action items",
            prefix="template_action",
            allow_done=False,
        )

        self.repository.update_one_on_one_template(
            int(template_id),
            name=name,
            cadence_days=cadence_days,
            agenda_reset_mode=agenda_reset_mode,
            manager_notes=manager_notes,
            contractor_talking_points=contractor_talking_points,
            manager_metrics=manager_metrics,
            action_items=action_items,
        )
        refreshed_record = self._require_record(record_id)
        return self._build_snapshot(
            record=refreshed_record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )

    def delete_one_on_one_template(
        self,
        record_id: int,
        template_id: int,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can remove 1:1 templates.")

        record = self._require_record(record_id)
        self._ensure_manager_can_manage_record(record, viewer_email=viewer_email)
        template = self._resolve_one_on_one_template(template_id, viewer_email=viewer_email)
        if template is None:
            raise NotFoundError(f"Unknown 1:1 template: {template_id}")

        self.repository.clear_one_on_one_template_references(int(template_id))
        self.repository.delete_one_on_one_template(int(template_id))
        refreshed_record = self._require_record(record_id)
        return self._build_snapshot(
            record=refreshed_record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )

    def mutate_one_on_one_meeting(
        self,
        record_id: int,
        meeting_id: int,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        viewer_role = self._normalized_role(payload.get("viewerRole", ""))
        viewer_email = self._normalized_email(payload.get("viewerEmail", ""))
        record = self._require_record(record_id)
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role=viewer_role)

        series = self.repository.get_one_on_one_series(record_id)
        if series is None:
            raise NotFoundError("Set up a 1:1 before editing meetings.")

        meeting = next((item for item in series["meetings"] if int(item["id"]) == meeting_id), None)
        if meeting is None:
            raise NotFoundError(f"Unknown 1:1 meeting: {meeting_id}")
        scheduled_meetings = [item for item in series["meetings"] if item["status"] == "scheduled"]
        current_scheduled_meeting = self._current_scheduled_one_on_one_meeting(series["meetings"])

        action = str(payload.get("action", "")).strip()
        if not action:
            raise ValidationError("Meeting action is required.")

        if action == "add-manager-note":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            manager_notes = [
                *meeting["managerNotes"],
                {
                    "id": self._generated_id("note"),
                    "text": self._required_non_empty_text(payload.get("text", ""), "Enter a note."),
                    "done": False,
                },
            ]
            self.repository.update_one_on_one_meeting(meeting_id, manager_notes=manager_notes)
        elif action == "add-manager-metric":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            manager_metrics = [
                *meeting["managerMetrics"],
                {
                    "id": self._generated_id("metric"),
                    "text": self._required_non_empty_text(payload.get("text", ""), "Enter a metric."),
                    "url": str(payload.get("url", "")).strip(),
                },
            ]
            self.repository.update_one_on_one_meeting(meeting_id, manager_metrics=manager_metrics)
        elif action == "add-contractor-point":
            self._require_contractor_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            contractor_talking_points = [
                *meeting["contractorTalkingPoints"],
                {
                    "id": self._generated_id("point"),
                    "text": self._required_non_empty_text(payload.get("text", ""), "Enter a talking point."),
                    "done": False,
                },
            ]
            self.repository.update_one_on_one_meeting(
                meeting_id,
                contractor_talking_points=contractor_talking_points,
            )
        elif action == "add-action-item":
            action_items = [
                *meeting["actionItems"],
                {
                    "id": self._generated_id("action"),
                    "text": self._required_non_empty_text(payload.get("text", ""), "Enter an action item."),
                    "done": False,
                },
            ]
            self.repository.update_one_on_one_meeting(meeting_id, action_items=action_items)
        elif action == "add-win":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            wins = [
                *meeting["wins"],
                {
                    "id": self._generated_id("win"),
                    "text": self._required_non_empty_text(payload.get("text", ""), "Enter a win."),
                },
            ]
            self.repository.update_one_on_one_meeting(meeting_id, wins=wins)
        elif action == "toggle-agenda-item":
            source = str(payload.get("source", "")).strip().lower()
            item_id = str(payload.get("itemId", "")).strip()
            done = bool(payload.get("done", False))
            if source == "manager":
                manager_notes = self._toggle_one_on_one_item(meeting["managerNotes"], item_id=item_id, done=done)
                self.repository.update_one_on_one_meeting(meeting_id, manager_notes=manager_notes)
            elif source == "contractor":
                contractor_talking_points = self._toggle_one_on_one_item(
                    meeting["contractorTalkingPoints"],
                    item_id=item_id,
                    done=done,
                )
                self.repository.update_one_on_one_meeting(
                    meeting_id,
                    contractor_talking_points=contractor_talking_points,
                )
            else:
                raise ValidationError("Agenda source must be manager or contractor.")
        elif action == "toggle-action-item":
            item_id = str(payload.get("itemId", "")).strip()
            done = bool(payload.get("done", False))
            action_items = self._toggle_one_on_one_item(meeting["actionItems"], item_id=item_id, done=done)
            self.repository.update_one_on_one_meeting(meeting_id, action_items=action_items)
        elif action == "remove-manager-note":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            manager_notes = self._remove_one_on_one_item(meeting["managerNotes"], item_id=str(payload.get("itemId", "")).strip())
            self.repository.update_one_on_one_meeting(meeting_id, manager_notes=manager_notes)
        elif action == "remove-manager-metric":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            manager_metrics = self._remove_one_on_one_item(meeting["managerMetrics"], item_id=str(payload.get("itemId", "")).strip())
            self.repository.update_one_on_one_meeting(meeting_id, manager_metrics=manager_metrics)
        elif action == "remove-contractor-point":
            self._require_contractor_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            contractor_talking_points = self._remove_one_on_one_item(
                meeting["contractorTalkingPoints"],
                item_id=str(payload.get("itemId", "")).strip(),
            )
            self.repository.update_one_on_one_meeting(
                meeting_id,
                contractor_talking_points=contractor_talking_points,
            )
        elif action == "remove-action-item":
            action_items = self._remove_one_on_one_item(meeting["actionItems"], item_id=str(payload.get("itemId", "")).strip())
            self.repository.update_one_on_one_meeting(meeting_id, action_items=action_items)
        elif action == "update-win":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            wins = self._update_one_on_one_item_text(
                meeting["wins"],
                item_id=str(payload.get("itemId", "")).strip(),
                text=self._required_non_empty_text(payload.get("text", ""), "Enter a win."),
            )
            self.repository.update_one_on_one_meeting(meeting_id, wins=wins)
        elif action == "remove-win":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            wins = self._remove_one_on_one_item(meeting["wins"], item_id=str(payload.get("itemId", "")).strip())
            self.repository.update_one_on_one_meeting(meeting_id, wins=wins)
        elif action == "promote-previous-item":
            item_id = str(payload.get("itemId", "")).strip()
            target_source = str(payload.get("targetSource", "")).strip().lower()
            if not item_id:
                raise ValidationError("Previous item id is required.")

            previous_lookup = {item["id"]: item for item in meeting["fromPreviousMeeting"]}
            selected_item = previous_lookup.get(item_id)
            if selected_item is None:
                raise NotFoundError(f"Unknown carry-over item: {item_id}")

            remaining_previous = [item for item in meeting["fromPreviousMeeting"] if item["id"] != item_id]
            if target_source == "manager":
                self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
                manager_notes = [
                    *meeting["managerNotes"],
                    {"id": self._generated_id("note"), "text": selected_item["text"], "done": False},
                ]
                self.repository.update_one_on_one_meeting(
                    meeting_id,
                    manager_notes=manager_notes,
                    from_previous_meeting=remaining_previous,
                )
            elif target_source == "contractor":
                self._require_contractor_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
                contractor_talking_points = [
                    *meeting["contractorTalkingPoints"],
                    {"id": self._generated_id("point"), "text": selected_item["text"], "done": False},
                ]
                self.repository.update_one_on_one_meeting(
                    meeting_id,
                    contractor_talking_points=contractor_talking_points,
                    from_previous_meeting=remaining_previous,
                )
            else:
                raise ValidationError("Target source must be manager or contractor.")
        elif action == "update-meeting-date":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            if meeting["status"] != "scheduled":
                raise ValidationError("Only scheduled 1:1s can be rescheduled.")
            scheduled_for = self._normalized_iso_date(
                payload.get("scheduledFor", payload.get("date", "")),
                field_label="Meeting date",
            )
            self.repository.update_one_on_one_meeting(
                meeting_id,
                scheduled_for=scheduled_for,
            )
            self._ensure_future_one_on_one_meetings(record_id, viewer_email=viewer_email)
        elif action == "cancel-meeting":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            if meeting["status"] != "scheduled":
                raise ValidationError("Only scheduled 1:1s can be canceled.")
            self.repository.update_one_on_one_meeting(
                meeting_id,
                status="canceled",
                completed_at="",
            )
            self._ensure_future_one_on_one_meetings(record_id, viewer_email=viewer_email)
        elif action == "complete-and-schedule-next":
            self._require_manager_for_one_on_one(record, viewer_email=viewer_email, viewer_role=viewer_role)
            if meeting["status"] != "scheduled":
                raise ValidationError("Only scheduled 1:1s can be completed.")
            if current_scheduled_meeting is None or int(current_scheduled_meeting["id"]) != int(meeting["id"]):
                raise ValidationError("Complete the current 1:1 before later meetings.")

            self.repository.update_one_on_one_meeting(
                meeting_id,
                status="completed",
                completed_at=utc_now(),
            )

            next_meeting = next(
                (
                    item
                    for item in series["meetings"]
                    if item["status"] == "scheduled"
                    and item["id"] != meeting["id"]
                    and item["scheduledFor"] > meeting["scheduledFor"]
                ),
                None,
            )
            carry_forward_items = self._collect_carry_forward_items(meeting)
            if next_meeting is None:
                template = self._resolve_one_on_one_template(series.get("templateId"), viewer_email=viewer_email)
                next_meeting_date = self._increment_iso_date(meeting["scheduledFor"], series["cadenceDays"])
                seeded = self._seed_one_on_one_meeting_payload(
                    template,
                    agenda_reset_mode=series["agendaResetMode"],
                )
                self.repository.create_one_on_one_meeting(
                    series["id"],
                    scheduled_for=next_meeting_date,
                    title=series["title"],
                    template_id=series.get("templateId"),
                    template_name=series.get("templateName", ""),
                    manager_notes=seeded["managerNotes"],
                    contractor_talking_points=seeded["contractorTalkingPoints"],
                    manager_metrics=seeded["managerMetrics"],
                    action_items=seeded.get("actionItems", []),
                    from_previous_meeting=carry_forward_items,
                    wins=[],
                )
            else:
                next_meeting_date = next_meeting["scheduledFor"]
                merged_previous = self._merge_previous_items(
                    next_meeting["fromPreviousMeeting"],
                    carry_forward_items,
                )
                self.repository.update_one_on_one_meeting(
                    int(next_meeting["id"]),
                    from_previous_meeting=merged_previous,
                )

            self.repository.update_one_on_one_series(
                series["id"],
                title=series["title"],
                cadence_days=series["cadenceDays"],
                agenda_reset_mode=series["agendaResetMode"],
                template_id=series.get("templateId"),
                next_meeting_date=next_meeting_date,
            )
            self._ensure_future_one_on_one_meetings(record_id, viewer_email=viewer_email)
        else:
            raise ValidationError("Unsupported 1:1 action.")

        refreshed_record = self._require_record(record_id)
        return self._build_snapshot(
            record=refreshed_record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )

    def _build_snapshot(self, *, record: Dict[str, Any], viewer_email: str, viewer_role: str) -> Dict[str, Any]:
        plan, plan_editable = self._resolve_plan(
            record=record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )
        one_on_ones = self._build_one_on_one_snapshot(
            record=record,
            viewer_email=viewer_email,
            viewer_role=viewer_role,
        )
        plan_tasks = plan["tasks"]
        task_map = {task["id"]: task for task in plan_tasks}
        plan_phases = [
            {
                "id": phase["id"],
                "label": phase["label"],
                "window": phase["window"],
                "summary": phase["summary"],
            }
            for phase in plan["phases"]
        ]
        record_id = int(record["id"])
        task_state_map = self.repository.get_task_state_map(record_id)
        access_state_map = self.repository.get_access_state_map(record_id)

        task_items = []
        for task in plan_tasks:
            state = task_state_map.get(task["id"], {})
            incomplete_dependencies = [
                dependency_id
                for dependency_id in task.get("dependency_ids", [])
                if dependency_id in task_map
                and not task_state_map.get(dependency_id, {}).get("completed", False)
            ]
            task_items.append(
                {
                    **task,
                    "completed": bool(state.get("completed", False)),
                    "note": state.get("note", ""),
                    "completedAt": state.get("completed_at", ""),
                    "updatedAt": state.get("updated_at", ""),
                    "updatedByRole": state.get("updated_by_role", ""),
                    "blocked": bool(incomplete_dependencies and not state.get("completed", False)),
                    "dependencyTitles": [task_map[task_id]["title"] for task_id in incomplete_dependencies],
                    "canToggle": viewer_role == "manager" or task["owner_role"] == viewer_role,
                    "status": self._task_status(
                        completed=bool(state.get("completed", False)),
                        has_blockers=bool(incomplete_dependencies),
                    ),
                }
            )

        access_items = []
        for bundle in ACCESS_BUNDLES:
            state = access_state_map.get(bundle["id"], {})
            access_items.append(
                {
                    **bundle,
                    "status": state.get("status", "not_requested"),
                    "note": state.get("note", ""),
                    "updatedAt": state.get("updated_at", ""),
                    "canEdit": viewer_role == "manager",
                }
            )

        phase_items = []
        for phase in plan_phases:
            phase_tasks = [task for task in task_items if task["phase_id"] == phase["id"]]
            owned_tasks = [task for task in phase_tasks if task["owner_role"] == viewer_role]
            phase_items.append(
                {
                    **phase,
                    "overallCompleted": sum(1 for task in phase_tasks if task["completed"]),
                    "overallTotal": len(phase_tasks),
                    "ownedCompleted": sum(1 for task in owned_tasks if task["completed"]),
                    "ownedTotal": len(owned_tasks),
                    "status": self._phase_status(phase_tasks),
                }
            )

        current_phase_id = self._current_phase_id(phase_items)
        my_tasks = [task for task in task_items if task["owner_role"] == viewer_role]
        other_tasks = [task for task in task_items if task["owner_role"] != viewer_role]
        access_summary = {
            "granted": sum(1 for item in access_items if item["status"] == "granted"),
            "requested": sum(1 for item in access_items if item["status"] == "requested"),
            "blocked": sum(1 for item in access_items if item["status"] == "blocked"),
            "total": len(access_items),
        }
        next_focus = next((task for task in task_items if not task["completed"]), None)
        manager_records: List[Dict[str, Any]] = []
        if viewer_role == "manager":
            manager_record_rows = self.repository.list_records_for_manager(
                self._normalized_email(viewer_email)
            )
            # Ensure current record is in the list (e.g. if it has no manager assigned yet)
            if not any(int(self._record_id(item)) == record_id for item in manager_record_rows):
                manager_record_rows = [record, *manager_record_rows]
            manager_records = [
                {
                    "id": self._record_id(item),
                    "contractorEmail": item.get("contractor_email") or item.get("contractorEmail") or "",
                    "contractorName": item.get("contractor_name") or item.get("contractorName") or "",
                    "managerEmail": item.get("manager_email") or item.get("managerEmail") or "",
                    "managerName": item.get("manager_name") or item.get("managerName") or "",
                    "startDate": item.get("start_date") or item.get("startDate") or "",
                    "timezone": item.get("timezone") or "",
                    "updatedAt": item.get("updated_at") or item.get("updatedAt") or "",
                }
                for item in manager_record_rows
            ]

        return {
            "viewer": {"email": viewer_email, "role": viewer_role},
            "record": {
                "id": record["id"],
                "contractorEmail": record["contractor_email"],
                "contractorName": record["contractor_name"],
                "managerEmail": record["manager_email"],
                "managerName": record["manager_name"],
                "startDate": record["start_date"],
                "timezone": record["timezone"],
                "createdAt": record["created_at"],
                "updatedAt": record["updated_at"],
            },
            "summary": {
                "currentPhaseId": current_phase_id,
                "myCompleted": sum(1 for task in my_tasks if task["completed"]),
                "myTotal": len(my_tasks),
                "overallCompleted": sum(1 for task in task_items if task["completed"]),
                "overallTotal": len(task_items),
                "otherPending": sum(1 for task in other_tasks if not task["completed"]),
                "blockedTasks": sum(1 for task in task_items if task["blocked"]),
                "nextFocus": next_focus["title"] if next_focus else "Onboarding complete",
                "access": access_summary,
            },
            "phases": phase_items,
            "tasks": task_items,
            "accessBundles": access_items,
            "managerRecords": manager_records,
            "planTemplate": {
                "id": plan["id"],
                "name": plan["name"],
                "department": plan["department"],
                "editable": plan_editable,
                "phases": plan["phases"],
            },
            "metrics": METRIC_TARGETS,
            "phoneMetrics": PHONE_METRICS,
            "qualitativeExpectations": QUALITATIVE_EXPECTATIONS,
            "resources": RESOURCES,
            "oneOnOnes": one_on_ones,
        }

    def _require_record(self, record_id: int) -> Dict[str, Any]:
        try:
            return self.repository.get_record_by_id(record_id)
        except KeyError as exc:
            raise NotFoundError(str(exc)) from exc

    def _ensure_record_access(self, record: Dict[str, Any], *, viewer_email: str, viewer_role: str) -> None:
        contractor_email = str(record.get("contractor_email", "")).strip().lower()
        manager_email = str(record.get("manager_email", "")).strip().lower()

        if viewer_role == "contractor" and contractor_email != viewer_email:
            raise PermissionDeniedError("Contractors can only access their own onboarding record.")
        if viewer_role == "manager" and manager_email and manager_email != viewer_email:
            raise PermissionDeniedError("Only the assigned manager can access this onboarding record.")

    def _ensure_manager_can_manage_record(self, record: Dict[str, Any], *, viewer_email: str) -> None:
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role="manager")
        assigned_manager_email = str(record.get("manager_email", "")).strip().lower()
        if assigned_manager_email and assigned_manager_email != viewer_email:
            raise PermissionDeniedError("Only the assigned manager can manage this onboarding record.")

    @staticmethod
    def _normalized_email(value: str) -> str:
        email = str(value).strip().lower()
        if not email or "@" not in email:
            raise ValidationError("Enter a valid work email.")
        return email

    @staticmethod
    def _normalized_role(value: str) -> str:
        role = str(value).strip().lower()
        if role not in ROLE_CHOICES:
            raise ValidationError("Role must be contractor or manager.")
        return role

    @staticmethod
    def _record_id(item: Dict[str, Any]) -> int:
        raw = item.get("id")
        if raw is None:
            raise ValueError("Record item missing id")
        return int(raw)

    def _resolve_plan(
        self,
        *,
        record: Dict[str, Any],
        viewer_email: str,
        viewer_role: str,
    ) -> tuple[Dict[str, Any], bool]:
        plan_owner_email = str(record.get("manager_email", "")).strip().lower()
        if not plan_owner_email and viewer_role == "manager":
            plan_owner_email = viewer_email

        if plan_owner_email:
            plan = self.repository.ensure_manager_plan(plan_owner_email)
        else:
            plan = self.repository.get_default_plan()

        editable = viewer_role == "manager" and plan_owner_email == viewer_email
        return plan, editable

    def _build_one_on_one_snapshot(
        self,
        *,
        record: Dict[str, Any],
        viewer_email: str,
        viewer_role: str,
    ) -> Dict[str, Any]:
        record_id = int(record["id"])
        series = self.repository.get_one_on_one_series(record_id)
        can_manage = viewer_role == "manager" and str(record.get("manager_email", "")).strip().lower() in {
            "",
            viewer_email,
        }
        templates = self.repository.list_one_on_one_templates(viewer_email) if viewer_role == "manager" else []

        if series is None:
            return {
                "canManage": can_manage,
                "series": None,
                "templates": templates,
                "currentMeetingId": None,
                "meetings": [],
            }

        manager_email = str(record.get("manager_email", "")).strip().lower() or viewer_email
        # Keep the active 1:1 aligned to the next upcoming scheduled meeting so labels stay date-aware.
        self._ensure_future_one_on_one_meetings(record_id, viewer_email=manager_email)
        series = self.repository.get_one_on_one_series(record_id)
        if series is None:
            return {
                "canManage": can_manage,
                "series": None,
                "templates": templates,
                "currentMeetingId": None,
                "meetings": [],
            }

        scheduled_meeting = self._current_scheduled_one_on_one_meeting(series["meetings"])
        current_meeting_id = (
            int(scheduled_meeting["id"])
            if scheduled_meeting is not None
            else (int(series["meetings"][-1]["id"]) if series["meetings"] else None)
        )

        meetings = [
            {
                **meeting,
                "isCurrent": current_meeting_id is not None and int(meeting["id"]) == current_meeting_id,
                "isPast": meeting["status"] in {"completed", "canceled"},
            }
            for meeting in series["meetings"]
        ]

        return {
            "canManage": can_manage,
            "series": {
                "id": series["id"],
                "title": series["title"],
                "cadenceDays": series["cadenceDays"],
                "agendaResetMode": series["agendaResetMode"],
                "templateId": series["templateId"],
                "templateName": series["templateName"],
                "nextMeetingDate": series["nextMeetingDate"],
            },
            "templates": templates,
            "currentMeetingId": current_meeting_id,
            "meetings": meetings,
        }

    def _sanitize_plan_payload(
        self,
        payload: Dict[str, Any],
        *,
        existing_plan: Dict[str, Any],
    ) -> Dict[str, Any]:
        raw_phases = payload.get("phases")
        if not isinstance(raw_phases, list) or not raw_phases:
            raise ValidationError("Add at least one onboarding stage.")

        phases: List[Dict[str, Any]] = []
        tasks: List[Dict[str, Any]] = []
        seen_phase_ids: set[str] = set()
        seen_task_ids: set[str] = set()

        for raw_phase in raw_phases:
            if not isinstance(raw_phase, dict):
                raise ValidationError("Each onboarding stage must be an object.")

            phase_id = str(raw_phase.get("id", "")).strip() or self._generated_id("phase")
            if phase_id in seen_phase_ids:
                raise ValidationError("Each onboarding stage must have a unique id.")
            seen_phase_ids.add(phase_id)

            label = str(raw_phase.get("label", "")).strip()
            if not label:
                raise ValidationError("Each onboarding stage needs a title.")

            phase = {
                "id": phase_id,
                "label": label,
                "window": str(raw_phase.get("window", "")).strip(),
                "summary": str(raw_phase.get("summary", "")).strip(),
            }
            phases.append(phase)

            raw_tasks = raw_phase.get("tasks", [])
            if not isinstance(raw_tasks, list):
                raise ValidationError("Stage tasks must be provided as a list.")

            for raw_task in raw_tasks:
                if not isinstance(raw_task, dict):
                    raise ValidationError("Each onboarding task must be an object.")

                task_id = str(raw_task.get("id", "")).strip() or self._generated_id("task")
                if task_id in seen_task_ids:
                    raise ValidationError("Each onboarding task must have a unique id.")
                seen_task_ids.add(task_id)

                title = str(raw_task.get("title", "")).strip()
                if not title:
                    raise ValidationError("Each onboarding task needs a title.")

                owner_role = self._normalized_role(
                    raw_task.get("ownerRole", raw_task.get("owner_role", "contractor"))
                )
                dependency_ids = raw_task.get(
                    "dependencyIds",
                    raw_task.get("dependency_ids", []),
                )
                if not isinstance(dependency_ids, list):
                    dependency_ids = []

                raw_group = raw_task.get("group", raw_task.get("groups", raw_task.get("labels", [])))
                if isinstance(raw_group, list):
                    group_list = [str(x).strip() for x in raw_group if str(x).strip()]
                else:
                    s = str(raw_group).strip()
                    group_list = [s] if s else []

                tasks.append(
                    {
                        "id": task_id,
                        "phase_id": phase_id,
                        "owner_role": owner_role,
                        "group": group_list,
                        "title": title,
                        "description": str(raw_task.get("description", "")).strip(),
                        "due_label": str(
                            raw_task.get("dueLabel", raw_task.get("due_label", phase["window"]))
                        ).strip(),
                        "dependency_ids": [
                            str(dependency_id).strip()
                            for dependency_id in dependency_ids
                            if str(dependency_id).strip()
                        ],
                        "source": "custom onboarding plan",
                    }
                )

        task_ids = {task["id"] for task in tasks}
        for task in tasks:
            deduped_dependencies: List[str] = []
            for dependency_id in task["dependency_ids"]:
                if dependency_id == task["id"] or dependency_id not in task_ids:
                    continue
                if dependency_id not in deduped_dependencies:
                    deduped_dependencies.append(dependency_id)
            task["dependency_ids"] = deduped_dependencies

        return {
            "name": str(payload.get("name", "")).strip() or existing_plan["name"],
            "department": str(payload.get("department", "")).strip(),
            "phases": phases,
            "tasks": tasks,
        }

    def _resolve_one_on_one_template(
        self,
        template_id: Any,
        *,
        viewer_email: str,
    ) -> Optional[Dict[str, Any]]:
        if template_id in (None, "", 0, "0"):
            return None
        try:
            normalized_id = int(template_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Choose a valid 1:1 template.") from exc

        template = self.repository.get_one_on_one_template(normalized_id)
        if template is None or template["ownerManagerEmail"] != viewer_email:
            raise NotFoundError(f"Unknown 1:1 template: {template_id}")
        return template

    def _seed_one_on_one_meeting_payload(
        self,
        template: Optional[Dict[str, Any]],
        *,
        agenda_reset_mode: str,
    ) -> Dict[str, List[Dict[str, Any]]]:
        if agenda_reset_mode == "clear" or template is None:
            return {
                "managerNotes": [],
                "contractorTalkingPoints": [],
                "managerMetrics": [],
                "actionItems": [],
            }
        return {
            "managerNotes": [
                {"id": self._generated_id("note"), "text": str(item.get("text", "")).strip(), "done": False}
                for item in template.get("managerNotes", [])
                if str(item.get("text", "")).strip()
            ],
            "contractorTalkingPoints": [
                {"id": self._generated_id("point"), "text": str(item.get("text", "")).strip(), "done": False}
                for item in template.get("contractorTalkingPoints", [])
                if str(item.get("text", "")).strip()
            ],
            "managerMetrics": [
                {
                    "id": self._generated_id("metric"),
                    "text": str(item.get("text", "")).strip(),
                    "url": str(item.get("url", "")).strip(),
                }
                for item in template.get("managerMetrics", [])
                if str(item.get("text", "")).strip()
            ],
            "actionItems": [
                {"id": self._generated_id("action"), "text": str(item.get("text", "")).strip(), "done": False}
                for item in template.get("actionItems", [])
                if str(item.get("text", "")).strip()
            ],
        }

    def _sanitize_one_on_one_note_items(
        self,
        raw_items: Any,
        *,
        field_label: str,
        prefix: str,
        allow_done: bool,
    ) -> List[Dict[str, Any]]:
        if not isinstance(raw_items, list):
            raise ValidationError(f"{field_label} must be a list.")
        items: List[Dict[str, Any]] = []
        for raw_item in raw_items:
            if not isinstance(raw_item, dict):
                raise ValidationError(f"{field_label} must contain objects.")
            text = str(raw_item.get("text", "")).strip()
            if not text:
                continue
            items.append(
                {
                    "id": str(raw_item.get("id", "")).strip() or self._generated_id(prefix),
                    "text": text,
                    "done": bool(raw_item.get("done", False)) if allow_done else False,
                }
            )
        return items

    def _sanitize_one_on_one_metric_items(
        self,
        raw_items: Any,
        *,
        field_label: str,
    ) -> List[Dict[str, Any]]:
        if not isinstance(raw_items, list):
            raise ValidationError(f"{field_label} must be a list.")
        items: List[Dict[str, Any]] = []
        for raw_item in raw_items:
            if not isinstance(raw_item, dict):
                raise ValidationError(f"{field_label} must contain objects.")
            text = str(raw_item.get("text", "")).strip()
            if not text:
                continue
            items.append(
                {
                    "id": str(raw_item.get("id", "")).strip() or self._generated_id("metric"),
                    "text": text,
                    "url": str(raw_item.get("url", "")).strip(),
                }
            )
        return items

    @staticmethod
    def _required_non_empty_text(value: Any, error_message: str) -> str:
        text = str(value).strip()
        if not text:
            raise ValidationError(error_message)
        return text

    @staticmethod
    def _toggle_one_on_one_item(
        items: List[Dict[str, Any]],
        *,
        item_id: str,
        done: bool,
    ) -> List[Dict[str, Any]]:
        if not item_id:
            raise ValidationError("Item id is required.")
        found = False
        next_items: List[Dict[str, Any]] = []
        for item in items:
            if item["id"] == item_id:
                next_items.append({**item, "done": done})
                found = True
            else:
                next_items.append(item)
        if not found:
            raise NotFoundError(f"Unknown item: {item_id}")
        return next_items

    @staticmethod
    def _remove_one_on_one_item(items: List[Dict[str, Any]], *, item_id: str) -> List[Dict[str, Any]]:
        if not item_id:
            raise ValidationError("Item id is required.")
        next_items = [item for item in items if item["id"] != item_id]
        if len(next_items) == len(items):
            raise NotFoundError(f"Unknown item: {item_id}")
        return next_items

    @staticmethod
    def _update_one_on_one_item_text(
        items: List[Dict[str, Any]],
        *,
        item_id: str,
        text: str,
    ) -> List[Dict[str, Any]]:
        if not item_id:
            raise ValidationError("Item id is required.")
        found = False
        next_items: List[Dict[str, Any]] = []
        for item in items:
            if item["id"] == item_id:
                next_items.append({**item, "text": text})
                found = True
            else:
                next_items.append(item)
        if not found:
            raise NotFoundError(f"Unknown item: {item_id}")
        return next_items

    @staticmethod
    def _collect_carry_forward_items(meeting: Dict[str, Any]) -> List[Dict[str, Any]]:
        collected: List[Dict[str, Any]] = []
        seen_texts: set[str] = set()

        def add_text(text: str) -> None:
            normalized = text.strip()
            if not normalized:
                return
            lowered = normalized.lower()
            if lowered in seen_texts:
                return
            seen_texts.add(lowered)
            collected.append({"id": "", "text": normalized})

        for item in meeting.get("managerNotes", []):
            if not item.get("done", False):
                add_text(str(item.get("text", "")))
        for item in meeting.get("contractorTalkingPoints", []):
            if not item.get("done", False):
                add_text(str(item.get("text", "")))
        for item in meeting.get("actionItems", []):
            if not item.get("done", False):
                add_text(str(item.get("text", "")))

        return [
            {"id": f"carry_{index + 1}_{uuid4().hex[:8]}", "text": item["text"]}
            for index, item in enumerate(collected)
        ]

    @staticmethod
    def _merge_previous_items(
        existing_items: List[Dict[str, Any]],
        additional_items: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        merged: List[Dict[str, Any]] = []
        seen_texts: set[str] = set()
        for item in [*existing_items, *additional_items]:
            text = str(item.get("text", "")).strip()
            if not text:
                continue
            lowered = text.lower()
            if lowered in seen_texts:
                continue
            seen_texts.add(lowered)
            merged.append(
                {
                    "id": str(item.get("id", "")).strip() or f"carry_{uuid4().hex[:8]}",
                    "text": text,
                }
            )
        return merged

    def _ensure_future_one_on_one_meetings(self, record_id: int, *, viewer_email: str) -> None:
        series = self.repository.get_one_on_one_series(record_id)
        if series is None:
            return

        scheduled_meetings = self._upcoming_scheduled_one_on_one_meetings(series["meetings"])
        minimum_scheduled_meetings = 3
        # Maintain a rolling buffer so the UI always has a few future meetings ready to select.
        while len(scheduled_meetings) < minimum_scheduled_meetings:
            template = self._resolve_one_on_one_template(series.get("templateId"), viewer_email=viewer_email)
            seeded = self._seed_one_on_one_meeting_payload(
                template,
                agenda_reset_mode=series["agendaResetMode"],
            )
            if scheduled_meetings:
                start_date = self._increment_iso_date(scheduled_meetings[-1]["scheduledFor"], series["cadenceDays"])
            elif series["meetings"]:
                latest_meeting = max(
                    series["meetings"],
                    key=lambda meeting: str(meeting.get("scheduledFor", "")),
                )
                # If the latest meeting is already in the past, roll forward from there until the next future slot.
                start_date = self._roll_forward_one_on_one_date(
                    self._increment_iso_date(latest_meeting["scheduledFor"], series["cadenceDays"]),
                    cadence_days=series["cadenceDays"],
                )
            else:
                start_date = self._roll_forward_one_on_one_date(
                    series["nextMeetingDate"],
                    cadence_days=series["cadenceDays"],
                )
            next_meeting_date = self._next_available_one_on_one_date(
                series["meetings"],
                start_date=start_date,
                cadence_days=series["cadenceDays"],
            )
            self.repository.create_one_on_one_meeting(
                series["id"],
                scheduled_for=next_meeting_date,
                title=series["title"],
                template_id=series.get("templateId"),
                template_name=series.get("templateName", ""),
                manager_notes=seeded["managerNotes"],
                contractor_talking_points=seeded["contractorTalkingPoints"],
                manager_metrics=seeded["managerMetrics"],
                action_items=seeded.get("actionItems", []),
                from_previous_meeting=[],
                wins=[],
            )
            series = self.repository.get_one_on_one_series(record_id)
            if series is None:
                return
            scheduled_meetings = self._upcoming_scheduled_one_on_one_meetings(series["meetings"])
        self._sync_one_on_one_series_next_date(record_id)

    def _sync_one_on_one_series_next_date(self, record_id: int) -> None:
        series = self.repository.get_one_on_one_series(record_id)
        if series is None:
            return
        next_meeting = self._current_scheduled_one_on_one_meeting(series["meetings"])
        next_meeting_date = next_meeting["scheduledFor"] if next_meeting is not None else ""
        if next_meeting_date == series["nextMeetingDate"]:
            return
        self.repository.update_one_on_one_series(
            series["id"],
            title=series["title"],
            cadence_days=series["cadenceDays"],
            agenda_reset_mode=series["agendaResetMode"],
            template_id=series.get("templateId"),
            next_meeting_date=next_meeting_date,
        )

    @staticmethod
    def _next_available_one_on_one_date(
        meetings: List[Dict[str, Any]],
        *,
        start_date: str,
        cadence_days: int,
    ) -> str:
        existing_dates = {str(meeting.get("scheduledFor", "")).strip() for meeting in meetings}
        candidate = start_date
        while candidate in existing_dates:
            candidate = OnboardingService._increment_iso_date(candidate, cadence_days)
        return candidate

    @staticmethod
    def _normalized_one_on_one_reset_mode(value: Any) -> str:
        mode = str(value).strip().lower()
        if mode not in ONE_ON_ONE_RESET_MODES:
            raise ValidationError("Agenda reset mode must be clear or template.")
        return mode

    @staticmethod
    def _normalized_iso_date(value: Any, *, field_label: str) -> str:
        raw_value = str(value).strip()
        if not raw_value:
            raise ValidationError(f"{field_label} is required.")
        try:
            return date.fromisoformat(raw_value).isoformat()
        except ValueError as exc:
            raise ValidationError(f"{field_label} must be a valid date.") from exc

    @staticmethod
    def _normalized_positive_int(value: Any, *, field_label: str) -> int:
        try:
            normalized = int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{field_label} must be a whole number.") from exc
        if normalized < 1 or normalized > 90:
            raise ValidationError(f"{field_label} must be between 1 and 90 days.")
        return normalized

    @staticmethod
    def _increment_iso_date(value: str, cadence_days: int) -> str:
        return (date.fromisoformat(value) + timedelta(days=cadence_days)).isoformat()

    @staticmethod
    def _today_iso_date() -> str:
        return date.today().isoformat()

    def _roll_forward_one_on_one_date(self, value: str, *, cadence_days: int) -> str:
        candidate = self._normalized_iso_date(value, field_label="Meeting date")
        today = self._today_iso_date()
        while candidate < today:
            candidate = self._increment_iso_date(candidate, cadence_days)
        return candidate

    def _upcoming_scheduled_one_on_one_meetings(
        self,
        meetings: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        today = self._today_iso_date()
        return [
            meeting
            for meeting in meetings
            if meeting["status"] == "scheduled" and str(meeting.get("scheduledFor", "")) >= today
        ]

    def _current_scheduled_one_on_one_meeting(
        self,
        meetings: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        upcoming_scheduled_meetings = self._upcoming_scheduled_one_on_one_meetings(meetings)
        if upcoming_scheduled_meetings:
            return upcoming_scheduled_meetings[0]
        scheduled_meetings = [meeting for meeting in meetings if meeting["status"] == "scheduled"]
        return scheduled_meetings[0] if scheduled_meetings else None

    def _require_manager_for_one_on_one(
        self,
        record: Dict[str, Any],
        *,
        viewer_email: str,
        viewer_role: str,
    ) -> None:
        if viewer_role != "manager":
            raise PermissionDeniedError("Only managers can edit that part of the 1:1.")
        self._ensure_manager_can_manage_record(record, viewer_email=viewer_email)

    def _require_contractor_for_one_on_one(
        self,
        record: Dict[str, Any],
        *,
        viewer_email: str,
        viewer_role: str,
    ) -> None:
        if viewer_role != "contractor":
            raise PermissionDeniedError("Only the contractor can edit that part of the 1:1.")
        self._ensure_record_access(record, viewer_email=viewer_email, viewer_role=viewer_role)

    @staticmethod
    def _generated_id(prefix: str) -> str:
        return f"{prefix}_{uuid4().hex[:10]}"

    @staticmethod
    def _task_status(*, completed: bool, has_blockers: bool) -> str:
        if completed:
            return "complete"
        if has_blockers:
            return "blocked"
        return "ready"

    @staticmethod
    def _phase_status(tasks: List[Dict[str, Any]]) -> str:
        if not tasks:
            return "not_started"
        completed_count = sum(1 for task in tasks if task["completed"])
        if completed_count == 0:
            return "not_started"
        if completed_count == len(tasks):
            return "complete"
        return "in_progress"

    @staticmethod
    def _current_phase_id(phases: List[Dict[str, Any]]) -> str:
        for phase in phases:
            if phase["overallCompleted"] < phase["overallTotal"]:
                return phase["id"]
        return phases[-1]["id"]
