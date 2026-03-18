"""Run the onboarding portal locally."""

from __future__ import annotations

import os
from pathlib import Path

from backend.http_app import create_server
from backend.repository import OnboardingRepository
from backend.service import OnboardingService


def main() -> None:
    project_root = Path(__file__).resolve().parent
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))

    repository = OnboardingRepository(project_root / "data" / "onboarding.db")
    service = OnboardingService(repository)
    server = create_server(
        host=host,
        port=port,
        service=service,
        static_dir=project_root / "onboarding-portal",
    )

    print(f"Serving onboarding portal at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
