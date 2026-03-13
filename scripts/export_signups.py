#!/usr/bin/env python3

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Any
from urllib import parse, request


DEFAULT_COLUMNS = [
    "id",
    "created_at",
    "full_name",
    "email",
    "phone",
    "tiktok",
    "instagram",
    "facebook",
    "x_profile",
    "source_language",
    "consent",
    "review_status",
]


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def fetch_rows(base_url: str, service_role_key: str, table: str) -> list[dict[str, Any]]:
    query = parse.urlencode(
        {
            "select": ",".join(DEFAULT_COLUMNS),
            "order": "created_at.desc",
        }
    )
    url = f"{base_url.rstrip('/')}/rest/v1/{table}?{query}"
    req = request.Request(
        url,
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Accept": "application/json",
        },
    )

    with request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))

    if not isinstance(data, list):
        raise SystemExit("Unexpected response from Supabase REST API")

    return data


def write_csv(rows: list[dict[str, Any]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=DEFAULT_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in DEFAULT_COLUMNS})


def main() -> None:
    base_url = require_env("SUPABASE_URL")
    service_role_key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    table = os.environ.get("SUPABASE_TABLE", "movement_signups").strip() or "movement_signups"
    output_csv = Path(os.environ.get("OUTPUT_CSV", "movement-signups.csv"))

    rows = fetch_rows(base_url, service_role_key, table)
    write_csv(rows, output_csv)
    print(f"Exported {len(rows)} rows to {output_csv}")


if __name__ == "__main__":
    main()
