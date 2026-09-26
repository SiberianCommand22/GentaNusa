#!/usr/bin/env python3
"""
GentaNusa editorial review CLI.

Usage:
    python scripts/editorial-review.py list          # List pending articles
    python scripts/editorial-review.py approve <id>  # Approve and publish
    python scripts/editorial-review.py reject <id>   # Reject and delete
    python scripts/editorial-review.py show <id>     # Show article detail
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "lib" / "data"
PENDING_FILE = DATA_DIR / "pending-articles.json"

def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" not in line or line.lstrip().startswith("#"):
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values

def load_pending() -> list[dict]:
    if not PENDING_FILE.exists():
        return []
    try:
        data = json.loads(PENDING_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []

def save_pending(pending: list[dict]) -> None:
    tmp = PENDING_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(pending, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(PENDING_FILE)

def get_supabase_client():
    local_env = load_env_file(ROOT / ".env.local")
    service_url = local_env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = local_env.get("SUPABASE_SERVICE_KEY")
    if not service_url or not service_key:
        print("ERROR: env Supabase tidak lengkap")
        sys.exit(2)
    return service_url, service_key

def supabase_request(service_url: str, service_key: str, path: str, method: str = "GET", data: dict | None = None):
    url = f"{service_url}/rest/v1/{path}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if data is not None:
        headers["Prefer"] = "return=representation"
    req = urllib.request.Request(url, data=json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase HTTP {exc.code}: {detail}")

def list_pending() -> int:
    pending = load_pending()
    if not pending:
        print("Tidak ada artikel pending review")
        return 0
    for i, art in enumerate(pending):
        print(f"[{i}] ID:{art['id']} | {art['category']} | {art['title'][:70]}...")
        print(f"    Source: {art.get('sourceId', 'unknown')} | Link: {art.get('sourceLink', 'N/A')}")
        print()
    return 0

def show_pending(idx: int) -> int:
    pending = load_pending()
    if idx < 0 or idx >= len(pending):
        print("Index tidak valid")
        return 1
    art = pending[idx]
    print(json.dumps(art, ensure_ascii=False, indent=2))
    return 0

def approve(idx: int) -> int:
    pending = load_pending()
    if idx < 0 or idx >= len(pending):
        print("Index tidak valid")
        return 1
    art = pending.pop(idx)
    save_pending(pending)

    service_url, service_key = get_supabase_client()

    payload = {
        "title": art["title"],
        "category": art["category"],
        "excerpt": art["excerpt"],
        "date": art["date"],
        "author": "Redaksi GentaNusa",
        "author_slug": "redaksi-gentanusa",
        "author_role": "Jurnalis GentaNusa",
        "image": art.get("image") or "/images/placeholder-article.svg",
        "content": art["content"],
        "tags": art["tags"],
    }
    try:
        result = supabase_request(service_url, service_key, "articles", "POST", payload)
        new_id = None
        if isinstance(result, list) and result:
            new_id = result[0].get("id")
        elif isinstance(result, dict):
            new_id = result.get("id")
        print(f"BERHASIL publish ID {new_id}: {art['title']}")
        return 0
    except Exception as exc:
        print(f"GAGAL publish: {exc}")
        # Put back
        pending.append(art)
        save_pending(pending)
        return 1

def reject(idx: int) -> int:
    pending = load_pending()
    if idx < 0 or idx >= len(pending):
        print("Index tidak valid")
        return 1
    art = pending.pop(idx)
    save_pending(pending)
    print(f"DITOLAK: {art['title']}")
    return 0

def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="List pending articles")
    sp = sub.add_parser("show", help="Show article detail"); sp.add_argument("index", type=int)
    sp = sub.add_parser("approve", help="Approve and publish"); sp.add_argument("index", type=int)
    sp = sub.add_parser("reject", help="Reject and delete"); sp.add_argument("index", type=int)
    args = parser.parse_args()

    if args.cmd == "list":
        return list_pending()
    elif args.cmd == "show":
        return show_pending(args.index)
    elif args.cmd == "approve":
        return approve(args.index)
    elif args.cmd == "reject":
        return reject(args.index)
    return 1

if __name__ == "__main__":
    sys.exit(main())