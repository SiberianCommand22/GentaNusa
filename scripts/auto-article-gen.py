#!/usr/bin/env python3
"""
GentaNusa auto original article generator.

Fetches one real RSS item per local calendar day, rewrites it through
9Router/FREEMAX, and inserts it into Supabase as a GentaNusa original.
The state file prevents duplicate articles and repeated same-day runs.

Usage:
    python scripts/auto-article-gen.py
    python scripts/auto-article-gen.py --dry-run
"""

import argparse
import atexit
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "lib" / "data"
SOURCES_FILE = DATA_DIR / "sources.json"
STATE_FILE = DATA_DIR / "auto-original-state.json"
LOCK_FILE = DATA_DIR / "auto-original.lock"
LOG_FILE = DATA_DIR / "auto-original.log"
UA = "GentaNusaAuto/1.0 (+https://gentanusa.id/robots.txt)"
LLM_URL = "http://127.0.0.1:20128/v1/chat/completions"
LLM_MODEL = "FREEMAX"
SOURCE_TIMEOUT = 10
LLM_TIMEOUT = 60
MAX_LLM_ATTEMPTS = 5

DEFAULT_SOURCE_IDS = [
    "antara-terkini",
    "cnbc-indonesia",
    "cnn-indonesia",
    "antara-ekonomi",
]


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


def log(message: str) -> None:
    stamp = datetime.now().astimezone().isoformat(timespec="seconds")
    line = f"{stamp} {message}"
    print(line, flush=True)
    try:
        with LOG_FILE.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
    except OSError:
        pass


def acquire_lock() -> bool:
    """Prevent overlapping scheduler runs."""
    try:
        handle = LOCK_FILE.open("x", encoding="utf-8")
    except FileExistsError:
        stale = False
        try:
            stale = (datetime.now().timestamp() - LOCK_FILE.stat().st_mtime) > 1800
            if stale:
                LOCK_FILE.unlink()
        except OSError:
            pass
        if not stale:
            log("Proses otomatis lain masih berjalan; keluar")
            return False
        handle = LOCK_FILE.open("x", encoding="utf-8")
    handle.write(str(os.getpid()))
    handle.close()

    def release() -> None:
        try:
            if LOCK_FILE.exists() and LOCK_FILE.read_text(encoding="utf-8").strip() == str(os.getpid()):
                LOCK_FILE.unlink()
        except OSError:
            pass

    atexit.register(release)
    return True


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"lastRunDate": None, "processedLinks": [], "lastArticle": None}
    try:
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"lastRunDate": None, "processedLinks": [], "lastArticle": None}
    if not isinstance(state, dict):
        return {"lastRunDate": None, "processedLinks": [], "lastArticle": None}
    state.setdefault("lastRunDate", None)
    state.setdefault("processedLinks", [])
    state.setdefault("lastArticle", None)
    if not isinstance(state["processedLinks"], list):
        state["processedLinks"] = []
    return state


def save_state(state: dict) -> None:
    tmp = STATE_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(STATE_FILE)


def fetch_xml(url: str, retries: int = 1) -> str:
    last_error = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": UA,
                    "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
                },
            )
            with urllib.request.urlopen(request, timeout=SOURCE_TIMEOUT) as response:
                data = response.read()
            charset = response.headers.get_content_charset() or "utf-8"
            return data.decode(charset, errors="replace")
        except Exception as exc:  # network errors vary by provider
            last_error = exc
            if attempt + 1 < retries:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"gagal mengambil {url}: {last_error}")


def parse_rss_items(xml_text: str) -> list[dict[str, str]]:
    root = ET.fromstring(xml_text)
    items: list[dict[str, str]] = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        excerpt = (item.findtext("description") or item.findtext("summary") or "").strip()
        excerpt = re.sub(r"<[^>]+>", " ", excerpt)
        excerpt = re.sub(r"\s+", " ", excerpt).strip()
        items.append({"title": title, "link": link, "excerpt": excerpt[:500]})
    return items


def parse_llm_response(raw: str) -> str:
    """Parse plain JSON, OpenAI-compatible SSE, or JSON plus DONE marker."""
    plain = raw.split("data: [DONE]", 1)[0].strip()
    try:
        event = json.loads(plain)
        content = event.get("choices", [{}])[0].get("message", {}).get("content")
        if isinstance(content, str) and content.strip():
            return content
    except (json.JSONDecodeError, IndexError, TypeError):
        pass

    for line in raw.splitlines():
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if not payload or payload == "[DONE]":
            continue
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            continue
        content = event.get("choices", [{}])[0].get("message", {}).get("content")
        if isinstance(content, str) and content.strip():
            return content
    return ""


def extract_json_object(text: str) -> dict | None:
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            value = json.loads(match.group(0))
            return value if isinstance(value, dict) else None
        except json.JSONDecodeError:
            return None


def call_freemax(prompt: str) -> dict | None:
    payload = {
        "model": LLM_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "Anda jurnalis GentaNusa. Tulis artikel original berbahasa Indonesia, "
                    "gaya majalah, 3 paragraf. Gunakan hanya fakta yang diberikan; jangan "
                    "mengarang nama, angka, kejadian, atau kutipan. Output hanya JSON valid "
                    "dengan field title, excerpt, content (array 3 string), dan tags (array string)."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 1600,
    }
    request = urllib.request.Request(
        LLM_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {os.environ.get('HERMES_OPENAI_API_KEY', load_env_file(Path.home() / '.hermes' / '.env').get('OPENAI_API_KEY', ''))}",
        },
    )
    for attempt in range(MAX_LLM_ATTEMPTS):
        try:
            with urllib.request.urlopen(request, timeout=LLM_TIMEOUT) as response:
                raw = response.read().decode("utf-8", errors="replace")
            text = parse_llm_response(raw)
            candidate = extract_json_object(text) if text else None
            if candidate:
                return candidate
            log(f"FREEMAX attempt {attempt+1}: output tidak valid JSON")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:200]
            log(f"LLM HTTP {exc.code}: {detail}")
        except Exception as exc:
            log(f"LLM gagal attempt {attempt+1}: {exc}")
        if attempt + 1 < MAX_LLM_ATTEMPTS:
            time.sleep(2)
    return None


def category_names() -> set[str]:
    try:
        categories = json.loads((DATA_DIR / "categories.json").read_text(encoding="utf-8"))
        return {str(item["name"]) for item in categories if isinstance(item, dict) and item.get("name")}
    except Exception:
        return {"Politik", "Ekonomi", "Nasional", "Kesehatan", "Olahraga", "Teknologi", "Pendididikan", "Budaya", "Lingkungan", "Dunia"}


def validate_article(raw: dict, source: dict) -> dict | None:
    title = str(raw.get("title", "")).strip()
    excerpt = str(raw.get("excerpt", "")).strip()
    content = raw.get("content", [])
    tags = raw.get("tags", [])
    if not isinstance(content, list):
        return None
    content = [str(part).strip() for part in content if str(part).strip()]
    if not title or len(title) < 15 or len(excerpt) < 20 or len(content) < 3:
        return None
    if not isinstance(tags, list):
        tags = []
    tags = [str(tag).strip() for tag in tags if str(tag).strip()]
    requested_category = str(raw.get("category", "")).strip()
    names = category_names()
    category = next((name for name in names if name.lower() == requested_category.lower()), source.get("category") or "Nasional")
    return {
        "title": title,
        "excerpt": excerpt,
        "content": content,
        "tags": tags or [category],
        "category": category,
    }


def get_max_id(service_url: str, service_key: str) -> int:
    request = urllib.request.Request(
        f"{service_url}/rest/v1/articles?select=id&order=id.desc&limit=1",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        rows = json.loads(response.read().decode("utf-8"))
    return max((int(row["id"]) for row in rows), default=120)


def insert_article(service_url: str, service_key: str, article: dict) -> int:
    payload = {
        "id": article["id"],
        "title": article["title"],
        "category": article["category"],
        "excerpt": article["excerpt"],
        "date": article["date"],
        "author": "Redaksi GentaNusa",
        "author_slug": "redaksi-gentanusa",
        "author_role": "Jurnalis GentaNusa",
        "image": article.get("image") or "/images/placeholder-article.svg",
        "content": article["content"],
        "tags": article["tags"],
    }
    request = urllib.request.Request(
        f"{service_url}/rest/v1/articles",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:200]
        log(f"Supabase HTTP {exc.code}: {detail}")
        return exc.code
    except Exception as exc:
        log(f"Supabase gagal: {exc}")
        return 0


def existing_syndicated_links() -> set[str]:
    path = DATA_DIR / "syndicated.json"
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
        return {str(item["link"]) for item in items if isinstance(item, dict) and item.get("link")}
    except Exception:
        return set()


def selected_sources(configured: list[dict]) -> list[dict]:
    env_ids = os.environ.get("GENTANUSA_AUTO_SOURCES", "").split(",")
    wanted = [item.strip() for item in env_ids if item.strip()] or DEFAULT_SOURCE_IDS
    by_id = {str(item.get("id")): item for item in configured if isinstance(item, dict) and item.get("id")}
    return [by_id[item] for item in wanted if item in by_id]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="uji RSS dan FREEMAX tanpa menulis artikel")
    args = parser.parse_args()

    if not acquire_lock():
        return 0

    start_time = time.time()
    MAX_RUN_SECONDS = 120

    local_env = load_env_file(ROOT / ".env.local")
    service_url = local_env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = local_env.get("SUPABASE_SERVICE_KEY")
    if not service_url or not service_key:
        log("ERROR: env Supabase tidak lengkap")
        return 2

    try:
        configured = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
        sources = selected_sources(configured)
    except Exception as exc:
        log(f"ERROR: sumber RSS tidak dapat dibaca: {exc}")
        return 2
    if not sources:
        log("ERROR: tidak ada sumber RSS aktif")
        return 2

    state = load_state()
    today = datetime.now().astimezone().date().isoformat()
    processed = {str(link) for link in state.get("processedLinks", [])}
    processed.update(existing_syndicated_links())

    if state.get("lastRunDate") == today and not args.dry_run:
        last = state.get("lastArticle") or {}
        log(f"Sudah ada artikel otomatis hari {today}; tidak membuat duplikat. Terakhir: {last.get('title', '')}")
        return 0

    errors: list[str] = []
    attempted = 0
    for source in sources:
        if time.time() - start_time > MAX_RUN_SECONDS:
            errors.append("timeout global")
            break
        source_id = source.get("id", "unknown")
        try:
            xml_text = fetch_xml(str(source["url"]))
            items = parse_rss_items(xml_text)
        except Exception as exc:
            errors.append(f"{source_id}: {exc}")
            continue

        for item in items:
            if time.time() - start_time > MAX_RUN_SECONDS:
                errors.append("timeout global")
                break
            if item["link"] in processed:
                continue
            if len(item["title"]) < 20 or "iklan" in item["title"].lower():
                continue
            attempted += 1
            prompt = (
                f"Sumber: {source.get('name', source_id)} ({source.get('category', 'Umum')})\n"
                f"Judul asli: {item['title']}\n"
                f"Fakta/ringkasan: {item['excerpt']}\n"
                f"Link sumber: {item['link']}\n\n"
                "Tulis artikel original GentaNusa berdasarkan fakta di atas."
            )
            candidate = call_freemax(prompt)
            if not candidate:
                continue
            article = validate_article(candidate, source)
            if not article:
                log(f"Output FREEMAX tidak valid untuk {item['title'][:50]}")
                continue

            if args.dry_run:
                print("DRY-RUN candidate:")
                print(json.dumps({"title": article["title"], "category": article["category"], "paragraphs": len(article["content"]), "tags": article["tags"]}, ensure_ascii=False, indent=2))
                log(f"DRY-RUN berhasil: {article['title']}")
                return 0

            article_id = get_max_id(service_url, service_key) + 1
            article.update({
                "id": article_id,
                "date": today,
                "image": "/images/placeholder-article.svg",
            })
            status = insert_article(service_url, service_key, article)
            if status not in (200, 201, 204):
                errors.append(f"insert ID {article_id} status {status}")
                continue

            state["lastRunDate"] = today
            state["processedLinks"] = sorted(processed | {item["link"]})
            state["lastArticle"] = {
                "id": article_id,
                "title": article["title"],
                "sourceId": source_id,
                "sourceLink": item["link"],
                "date": today,
            }
            save_state(state)
            log(f"BERHASIL ID {article_id}: {article['title']}")
            return 0

    if attempted == 0:
        state["lastRunDate"] = today
        state["lastArticle"] = state.get("lastArticle") or {"reason": "tidak ada item baru"}
        save_state(state)
        log("Tidak ada item RSS baru yang layak hari ini")
        return 0

    log("Gagal membuat artikel hari ini: " + "; ".join(errors[-3:]))
    return 1


if __name__ == "__main__":
    sys.exit(main())
