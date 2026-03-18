"""HTTP server for the onboarding portal."""

from __future__ import annotations

import json
import mimetypes
import re
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict
from urllib.parse import parse_qsl, urlparse

from .service import (
    NotFoundError,
    OnboardingService,
    PermissionDeniedError,
    ValidationError,
)


class OnboardingRequestHandler(BaseHTTPRequestHandler):
    service: OnboardingService
    static_dir: Path

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/bootstrap":
                self._write_json(HTTPStatus.OK, self.service.bootstrap_payload())
                return

            record_match = re.fullmatch(r"/api/records/(\d+)", parsed.path)
            if record_match:
                record_id = int(record_match.group(1))
                params = self._parse_query(parsed.query)
                payload = self.service.get_snapshot(
                    record_id,
                    viewer_email=params.get("viewerEmail", ""),
                    viewer_role=params.get("viewerRole", ""),
                )
                self._write_json(HTTPStatus.OK, payload)
                return

            if parsed.path.startswith("/api/"):
                self._write_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint."})
                return

            self._serve_static(parsed.path)
        except Exception as exc:  # pragma: no cover - exercised through HTTP
            self._handle_exception(exc)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/session":
                payload = self._read_json_body()
                response = self.service.resolve_session(payload)
                self._write_json(HTTPStatus.OK, response)
                return

            series_match = re.fullmatch(r"/api/records/(\d+)/one-on-ones/series", parsed.path)
            if series_match:
                payload = self._read_json_body()
                response = self.service.configure_one_on_one_series(
                    int(series_match.group(1)),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return

            template_match = re.fullmatch(r"/api/records/(\d+)/one-on-ones/templates", parsed.path)
            if template_match:
                payload = self._read_json_body()
                response = self.service.create_one_on_one_template(
                    int(template_match.group(1)),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return
            self._write_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint."})
        except Exception as exc:  # pragma: no cover - exercised through HTTP
            self._handle_exception(exc)

    def do_PATCH(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            payload = self._read_json_body()

            task_match = re.fullmatch(r"/api/records/(\d+)/tasks/([a-z0-9_]+)", parsed.path)
            if task_match:
                response = self.service.update_task(
                    int(task_match.group(1)),
                    task_match.group(2),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return

            access_match = re.fullmatch(r"/api/records/(\d+)/access/([a-z0-9_]+)", parsed.path)
            if access_match:
                response = self.service.update_access(
                    int(access_match.group(1)),
                    access_match.group(2),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return

            profile_match = re.fullmatch(r"/api/records/(\d+)/profile", parsed.path)
            if profile_match:
                response = self.service.update_profile(int(profile_match.group(1)), payload)
                self._write_json(HTTPStatus.OK, response)
                return

            plan_match = re.fullmatch(r"/api/records/(\d+)/plan", parsed.path)
            if plan_match:
                response = self.service.update_plan(int(plan_match.group(1)), payload)
                self._write_json(HTTPStatus.OK, response)
                return

            template_match = re.fullmatch(
                r"/api/records/(\d+)/one-on-ones/templates/(\d+)",
                parsed.path,
            )
            if template_match:
                response = self.service.update_one_on_one_template(
                    int(template_match.group(1)),
                    int(template_match.group(2)),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return

            meeting_match = re.fullmatch(
                r"/api/records/(\d+)/one-on-ones/meetings/(\d+)",
                parsed.path,
            )
            if meeting_match:
                response = self.service.mutate_one_on_one_meeting(
                    int(meeting_match.group(1)),
                    int(meeting_match.group(2)),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return

            self._write_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint."})
        except Exception as exc:  # pragma: no cover - exercised through HTTP
            self._handle_exception(exc)

    def do_DELETE(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            payload = self._read_json_body()

            template_match = re.fullmatch(
                r"/api/records/(\d+)/one-on-ones/templates/(\d+)",
                parsed.path,
            )
            if template_match:
                response = self.service.delete_one_on_one_template(
                    int(template_match.group(1)),
                    int(template_match.group(2)),
                    payload,
                )
                self._write_json(HTTPStatus.OK, response)
                return

            self._write_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint."})
        except Exception as exc:  # pragma: no cover - exercised through HTTP
            self._handle_exception(exc)

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return

    def _read_json_body(self) -> Dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        if not raw_body:
            return {}
        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise ValidationError("Request body must be valid JSON.") from exc

    def _serve_static(self, request_path: str) -> None:
        path = request_path or "/"
        if path == "/":
            target = self.static_dir / "index.html"
        else:
            target = (self.static_dir / path.lstrip("/")).resolve()
            if not str(target).startswith(str(self.static_dir.resolve())):
                self._write_json(HTTPStatus.FORBIDDEN, {"error": "Forbidden."})
                return
            if not target.exists() or not target.is_file():
                target = self.static_dir / "index.html"

        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        payload = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _write_json(self, status: HTTPStatus, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_exception(self, exc: Exception) -> None:
        if isinstance(exc, ValidationError):
            self._write_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        if isinstance(exc, PermissionDeniedError):
            self._write_json(HTTPStatus.FORBIDDEN, {"error": str(exc)})
            return
        if isinstance(exc, NotFoundError):
            self._write_json(HTTPStatus.NOT_FOUND, {"error": str(exc)})
            return
        self._write_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Internal server error."})

    @staticmethod
    def _parse_query(query: str) -> Dict[str, str]:
        return dict(parse_qsl(query, keep_blank_values=True))


def create_server(*, host: str, port: int, service: OnboardingService, static_dir: Path) -> ThreadingHTTPServer:
    handler_class = type(
        "ConfiguredOnboardingRequestHandler",
        (OnboardingRequestHandler,),
        {"service": service, "static_dir": Path(static_dir)},
    )
    return ThreadingHTTPServer((host, port), handler_class)
