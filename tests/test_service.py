from datetime import date, timedelta
import tempfile
import unittest
from pathlib import Path

from backend.repository import OnboardingRepository
from backend.service import OnboardingService, PermissionDeniedError


class OnboardingServiceTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        db_path = Path(self.temp_dir.name) / "onboarding.db"
        self.repository = OnboardingRepository(db_path)
        self.service = OnboardingService(self.repository)

    def test_resolve_session_creates_record_and_snapshot(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "jamie.contractor@example.com",
                "viewerRole": "contractor",
            }
        )

        self.assertEqual(snapshot["viewer"]["role"], "contractor")
        self.assertEqual(snapshot["record"]["contractorEmail"], "jamie.contractor@example.com")
        self.assertEqual(snapshot["summary"]["currentPhaseId"], "preboarding")
        self.assertEqual(len(snapshot["phases"]), 7)
        self.assertGreater(len(snapshot["tasks"]), 10)

    def test_manager_can_update_access_bundle(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
            }
        )

        updated = self.service.update_access(
            snapshot["record"]["id"],
            "core_access",
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "status": "granted",
            },
        )

        first_bundle = next(item for item in updated["accessBundles"] if item["id"] == "core_access")
        self.assertEqual(first_bundle["status"], "granted")
        self.assertEqual(updated["summary"]["access"]["granted"], 1)
        self.assertEqual(len(updated["managerRecords"]), 1)
        self.assertEqual(
            updated["managerRecords"][0]["contractorEmail"],
            "jamie.contractor@example.com",
        )

    def test_manager_snapshot_includes_all_assigned_contractors(self):
        self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )
        second = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "taylor.contractor@example.com",
                "contractorName": "Taylor Contractor",
            }
        )

        self.assertEqual(second["record"]["contractorEmail"], "taylor.contractor@example.com")
        self.assertEqual(
            [item["contractorEmail"] for item in second["managerRecords"]],
            [
                "jamie.contractor@example.com",
                "taylor.contractor@example.com",
            ],
        )

    def test_contractor_cannot_update_manager_owned_task(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "jamie.contractor@example.com",
                "viewerRole": "contractor",
            }
        )

        with self.assertRaises(PermissionDeniedError):
            self.service.update_task(
                snapshot["record"]["id"],
                "mgr_send_welcome_email",
                {
                    "viewerEmail": "jamie.contractor@example.com",
                "viewerRole": "contractor",
                "completed": True,
            },
        )

    def test_manager_can_customize_plan_for_their_records(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
            }
        )

        updated = self.service.update_plan(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "name": "Admissions Onboarding",
                "department": "Admissions",
                "phases": [
                    {
                        "label": "Pre-onboarding",
                        "window": "Before start",
                        "summary": "Handle setup before day one.",
                        "tasks": [
                            {
                                "title": "Send laptop checklist",
                                "ownerRole": "manager",
                                "group": "Readiness",
                                "description": "Share the hardware checklist and confirm delivery.",
                                "dueLabel": "Before start",
                            },
                            {
                                "title": "Confirm personal workspace",
                                "ownerRole": "contractor",
                                "group": "Readiness",
                                "description": "Make sure the desk and internet are ready.",
                                "dueLabel": "Before start",
                            },
                        ],
                    },
                    {
                        "label": "Week 1",
                        "window": "Days 1-5",
                        "summary": "Start shadowing and team introductions.",
                        "tasks": [
                            {
                                "title": "Attend admissions team shadow",
                                "ownerRole": "contractor",
                                "group": "Shadowing",
                                "description": "Join the first queue review and note follow-up questions.",
                                "dueLabel": "End of week 1",
                            }
                        ],
                    },
                ],
            },
        )

        self.assertEqual(updated["planTemplate"]["name"], "Admissions Onboarding")
        self.assertEqual(updated["planTemplate"]["department"], "Admissions")
        self.assertEqual([phase["label"] for phase in updated["phases"]], ["Pre-onboarding", "Week 1"])
        self.assertEqual(
            [task["title"] for task in updated["tasks"]],
            [
                "Send laptop checklist",
                "Confirm personal workspace",
                "Attend admissions team shadow",
            ],
        )
        self.assertEqual(updated["summary"]["overallTotal"], 3)

    def test_manager_can_schedule_one_on_one_and_contractor_can_see_it(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )

        template_snapshot = self.service.create_one_on_one_template(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "name": "Weekly coaching",
                "cadenceDays": 7,
                "agendaResetMode": "template",
                "managerNotes": [{"text": "Review weekly wins"}],
                "contractorTalkingPoints": [{"text": "Questions for support"}],
                "managerMetrics": [{"text": "QA dashboard", "url": "https://example.com/qa"}],
                "actionItems": [{"text": "Send weekly follow-up"}],
            },
        )
        template_id = next(
            template["id"]
            for template in template_snapshot["oneOnOnes"]["templates"]
            if template["name"] == "Weekly coaching"
        )

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": "2026-03-18",
                "cadenceDays": 7,
                "agendaResetMode": "template",
                "templateId": template_id,
            },
        )

        self.assertEqual(scheduled["oneOnOnes"]["series"]["title"], "Jamie weekly 1:1")
        self.assertEqual(scheduled["oneOnOnes"]["series"]["nextMeetingDate"], "2026-03-18")
        self.assertEqual(len(scheduled["oneOnOnes"]["meetings"]), 3)
        self.assertEqual(
            scheduled["oneOnOnes"]["meetings"][0]["managerNotes"][0]["text"],
            "Review weekly wins",
        )
        self.assertEqual(
            scheduled["oneOnOnes"]["meetings"][0]["actionItems"][0]["text"],
            "Send weekly follow-up",
        )
        self.assertEqual(scheduled["oneOnOnes"]["meetings"][1]["scheduledFor"], "2026-03-25")
        self.assertEqual(scheduled["oneOnOnes"]["meetings"][2]["scheduledFor"], "2026-04-01")

        contractor_view = self.service.resolve_session(
            {
                "viewerEmail": "jamie.contractor@example.com",
                "viewerRole": "contractor",
            }
        )

        self.assertEqual(contractor_view["oneOnOnes"]["series"]["title"], "Jamie weekly 1:1")
        self.assertEqual(contractor_view["oneOnOnes"]["meetings"][0]["scheduledFor"], "2026-03-18")
        self.assertEqual(contractor_view["oneOnOnes"]["meetings"][1]["scheduledFor"], "2026-03-25")
        self.assertEqual(contractor_view["oneOnOnes"]["meetings"][2]["scheduledFor"], "2026-04-01")
        self.assertEqual(
            contractor_view["oneOnOnes"]["meetings"][0]["contractorTalkingPoints"][0]["text"],
            "Questions for support",
        )

    def test_completing_one_on_one_creates_next_meeting_from_template_and_carry_over(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )

        template_snapshot = self.service.create_one_on_one_template(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "name": "Default weekly 1:1",
                "cadenceDays": 7,
                "agendaResetMode": "template",
                "managerNotes": [{"text": "Review weekly wins"}],
                "contractorTalkingPoints": [{"text": "Raise blockers"}],
                "managerMetrics": [{"text": "QA dashboard"}],
            },
        )
        template_id = next(
            template["id"]
            for template in template_snapshot["oneOnOnes"]["templates"]
            if template["name"] == "Default weekly 1:1"
        )

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": "2026-03-18",
                "cadenceDays": 7,
                "agendaResetMode": "template",
                "templateId": template_id,
            },
        )
        current_meeting_id = scheduled["oneOnOnes"]["currentMeetingId"]

        with_action_item = self.service.mutate_one_on_one_meeting(
            scheduled["record"]["id"],
            current_meeting_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "add-action-item",
                "text": "Share retro agenda",
            },
        )

        completed = self.service.mutate_one_on_one_meeting(
            with_action_item["record"]["id"],
            current_meeting_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "complete-and-schedule-next",
            },
        )

        meetings = completed["oneOnOnes"]["meetings"]
        self.assertEqual(len(meetings), 4)
        self.assertEqual(
            [meeting["status"] for meeting in meetings],
            ["completed", "scheduled", "scheduled", "scheduled"],
        )
        self.assertEqual(meetings[1]["scheduledFor"], "2026-03-25")
        self.assertEqual(meetings[2]["scheduledFor"], "2026-04-01")
        self.assertEqual(meetings[3]["scheduledFor"], "2026-04-08")
        self.assertEqual(meetings[1]["managerNotes"][0]["text"], "Review weekly wins")
        self.assertEqual(meetings[1]["contractorTalkingPoints"][0]["text"], "Raise blockers")
        self.assertEqual(meetings[1]["fromPreviousMeeting"][0]["text"], "Review weekly wins")
        self.assertIn(
            "Share retro agenda",
            [item["text"] for item in meetings[1]["fromPreviousMeeting"]],
        )

    def test_clear_reset_mode_creates_blank_next_agenda(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )

        template_snapshot = self.service.create_one_on_one_template(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "name": "Blank-on-next",
                "cadenceDays": 7,
                "agendaResetMode": "template",
                "managerNotes": [{"text": "Review wins"}],
                "contractorTalkingPoints": [{"text": "Raise blockers"}],
                "managerMetrics": [{"text": "QA dashboard"}],
            },
        )
        template_id = next(
            template["id"]
            for template in template_snapshot["oneOnOnes"]["templates"]
            if template["name"] == "Blank-on-next"
        )

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": "2026-03-18",
                "cadenceDays": 7,
                "agendaResetMode": "clear",
                "templateId": template_id,
            },
        )

        completed = self.service.mutate_one_on_one_meeting(
            scheduled["record"]["id"],
            scheduled["oneOnOnes"]["currentMeetingId"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "complete-and-schedule-next",
            },
        )

        next_meeting = completed["oneOnOnes"]["meetings"][1]
        self.assertEqual(next_meeting["scheduledFor"], "2026-03-25")
        self.assertEqual(next_meeting["managerNotes"], [])
        self.assertEqual(next_meeting["contractorTalkingPoints"], [])
        self.assertEqual(next_meeting["managerMetrics"], [])
        self.assertEqual(next_meeting["actionItems"], [])

    def test_manager_can_edit_and_delete_one_on_one_template(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
            }
        )

        created = self.service.create_one_on_one_template(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "name": "Weekly coaching",
                "cadenceDays": 7,
                "agendaResetMode": "template",
                "managerNotes": [{"text": "Review wins"}],
                "contractorTalkingPoints": [],
                "managerMetrics": [],
                "actionItems": [],
            },
        )
        template_id = created["oneOnOnes"]["templates"][0]["id"]

        updated = self.service.update_one_on_one_template(
            snapshot["record"]["id"],
            template_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "name": "Edited coaching",
                "cadenceDays": 10,
                "agendaResetMode": "clear",
                "managerNotes": [{"text": "Review blockers"}],
                "contractorTalkingPoints": [{"text": "Discuss support needed"}],
                "managerMetrics": [{"text": "QA dashboard"}],
                "actionItems": [{"text": "Send recap"}],
            },
        )

        self.assertEqual(updated["oneOnOnes"]["templates"][0]["name"], "Edited coaching")
        self.assertEqual(updated["oneOnOnes"]["templates"][0]["cadenceDays"], 10)
        self.assertEqual(updated["oneOnOnes"]["templates"][0]["actionItems"][0]["text"], "Send recap")

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": "2026-03-18",
                "cadenceDays": 10,
                "agendaResetMode": "clear",
                "templateId": template_id,
            },
        )

        deleted = self.service.delete_one_on_one_template(
            snapshot["record"]["id"],
            template_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
            },
        )

        self.assertEqual(deleted["oneOnOnes"]["templates"], [])
        self.assertIsNone(deleted["oneOnOnes"]["series"]["templateId"])
        self.assertEqual(deleted["oneOnOnes"]["series"]["templateName"], "")

        completed = self.service.mutate_one_on_one_meeting(
            snapshot["record"]["id"],
            scheduled["oneOnOnes"]["currentMeetingId"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "complete-and-schedule-next",
            },
        )
        self.assertEqual(
            [meeting["scheduledFor"] for meeting in completed["oneOnOnes"]["meetings"] if meeting["status"] == "scheduled"],
            ["2026-03-28", "2026-04-07", "2026-04-17"],
        )

    def test_manager_can_add_edit_wins_and_reschedule_meeting(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": "2026-03-18",
                "cadenceDays": 7,
                "agendaResetMode": "clear",
                "templateId": None,
            },
        )

        current_meeting_id = scheduled["oneOnOnes"]["currentMeetingId"]
        with_win = self.service.mutate_one_on_one_meeting(
            scheduled["record"]["id"],
            current_meeting_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "add-win",
                "text": "Handled first escalated ticket solo",
            },
        )
        win_id = with_win["oneOnOnes"]["meetings"][0]["wins"][0]["id"]

        updated = self.service.mutate_one_on_one_meeting(
            scheduled["record"]["id"],
            current_meeting_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "update-win",
                "itemId": win_id,
                "text": "Handled first escalated ticket independently",
            },
        )

        rescheduled = self.service.mutate_one_on_one_meeting(
            scheduled["record"]["id"],
            current_meeting_id,
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "update-meeting-date",
                "scheduledFor": "2026-03-19",
            },
        )

        self.assertEqual(
            updated["oneOnOnes"]["meetings"][0]["wins"][0]["text"],
            "Handled first escalated ticket independently",
        )
        self.assertEqual(rescheduled["oneOnOnes"]["series"]["nextMeetingDate"], "2026-03-19")
        self.assertEqual(rescheduled["oneOnOnes"]["meetings"][0]["scheduledFor"], "2026-03-19")

    def test_manager_can_cancel_meeting_and_buffer_remains_available(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": "2026-03-18",
                "cadenceDays": 7,
                "agendaResetMode": "clear",
                "templateId": None,
            },
        )

        canceled = self.service.mutate_one_on_one_meeting(
            scheduled["record"]["id"],
            scheduled["oneOnOnes"]["currentMeetingId"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "action": "cancel-meeting",
            },
        )

        meetings = canceled["oneOnOnes"]["meetings"]
        self.assertEqual(meetings[0]["status"], "canceled")
        self.assertEqual(canceled["oneOnOnes"]["series"]["nextMeetingDate"], "2026-03-25")
        self.assertEqual(
            [meeting["scheduledFor"] for meeting in meetings if meeting["status"] == "scheduled"],
            ["2026-03-25", "2026-04-01", "2026-04-08"],
        )

    def test_recurring_series_keeps_three_upcoming_meetings_when_older_meetings_exist(self):
        snapshot = self.service.resolve_session(
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "contractorEmail": "jamie.contractor@example.com",
                "contractorName": "Jamie Contractor",
            }
        )

        cadence_days = 7
        today = date.today()
        first_meeting_date = (today - timedelta(days=cadence_days * 2)).isoformat()
        today_meeting_date = today.isoformat()
        next_meeting_date = (today + timedelta(days=cadence_days)).isoformat()
        third_meeting_date = (today + timedelta(days=cadence_days * 2)).isoformat()

        scheduled = self.service.configure_one_on_one_series(
            snapshot["record"]["id"],
            {
                "viewerEmail": "ashley.manager@example.com",
                "viewerRole": "manager",
                "title": "Jamie weekly 1:1",
                "firstMeetingDate": first_meeting_date,
                "cadenceDays": cadence_days,
                "agendaResetMode": "clear",
                "templateId": None,
            },
        )

        meetings = scheduled["oneOnOnes"]["meetings"]
        self.assertEqual(meetings[0]["scheduledFor"], first_meeting_date)
        self.assertEqual(scheduled["oneOnOnes"]["series"]["nextMeetingDate"], today_meeting_date)
        self.assertEqual(scheduled["oneOnOnes"]["currentMeetingId"], meetings[1]["id"])
        self.assertEqual(
            [meeting["scheduledFor"] for meeting in meetings if meeting["status"] == "scheduled"],
            [first_meeting_date, today_meeting_date, next_meeting_date, third_meeting_date],
        )
        self.assertEqual(
            [meeting["scheduledFor"] for meeting in meetings if meeting["scheduledFor"] >= today_meeting_date],
            [today_meeting_date, next_meeting_date, third_meeting_date],
        )


if __name__ == "__main__":
    unittest.main()
