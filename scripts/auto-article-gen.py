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
import difflib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "lib" / "data"
SOURCES_FILE = DATA_DIR / "sources.json"
STATE_FILE = DATA_DIR / "auto-original-state.json"
PENDING_FILE = DATA_DIR / "pending-articles.json"
LOCK_FILE = DATA_DIR / "auto-original.lock"
LOG_FILE = DATA_DIR / "auto-original.log"
UA = "GentaNusaAuto/1.0 (+https://gentanusa.id/robots.txt)"
LLM_URL = "http://127.0.0.1:20128/v1/chat/completions"
LLM_MODEL = "FREEMAX"
SOURCE_TIMEOUT = 10
LLM_TIMEOUT = 60
# 2 retries is enough: the scheduler has a whole day, and each extra attempt
# costs 60s of the global run budget for a model that usually fails the same way.
MAX_LLM_ATTEMPTS = 2

DEFAULT_SOURCE_IDS = [
    "antara-terkini",
    "cnbc-indonesia",
    "cnn-indonesia",
    "antara-ekonomi",
]

# Image generation via 9Router (local) with Pollinations.ai fallback
LLM_URL = "http://127.0.0.1:20128/v1/chat/completions"
IMAGE_URL = "http://127.0.0.1:20128/v1/images/generations"
IMAGE_MODEL = "cf/@cf/black-forest-labs/flux-2-klein-9b"
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"
POLLINATIONS_PARAMS = "width=1200&height=630&nologo=true&enhance=true&model=flux&private=true"


def get_9router_image_url(prompt: str, api_key: str, supabase_url: str, supabase_key: str) -> str | None:
    """Generate image via 9Router local Flux model, upload to Supabase Storage."""
    import uuid, base64
    payload = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "n": 1,
    }
    max_attempts = 3
    for attempt in range(max_attempts):
        request = urllib.request.Request(
            IMAGE_URL,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                b64data = result.get("data", [{}])[0].get("b64_json")
                if not b64data:
                    log(f"9Router image attempt {attempt+1}: no b64_json in response")
                    if attempt + 1 < max_attempts:
                        time.sleep(1)
                    continue
                img_data = base64.b64decode(b64data)
                if len(img_data) < 1000:
                    log(f"9Router image attempt {attempt+1}: too small ({len(img_data)} bytes)")
                    if attempt + 1 < max_attempts:
                        time.sleep(1)
                    continue
                log(f"9Router image success on attempt {attempt+1}")
                # Upload to Supabase Storage
                object_name = f"articles/{uuid.uuid4()}.jpg"
                upload_req = urllib.request.Request(
                    f"{supabase_url}/storage/v1/object/{object_name}",
                    data=img_data,
                    headers={
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "image/jpeg",
                        "Cache-Control": "public, max-age=31536000, immutable",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(upload_req, timeout=30) as upload_resp:
                    if upload_resp.status in (200, 201):
                        return f"{supabase_url}/storage/v1/object/public/{object_name}"
                log("9Router image: Supabase upload failed")
                return None
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:200]
            log(f"9Router image attempt {attempt+1}: HTTP {exc.code}: {detail}")
            if "flagged" in detail.lower() and attempt + 1 < max_attempts:
                time.sleep(1)
                continue
            return None
        except Exception as exc:
            log(f"9Router image error: {exc}")
            return None
    return None


def is_duplicate_title(title: str, existing_titles: list[str], threshold: float = 0.85) -> bool:
    """Check if title is too similar to existing articles."""
    title_lower = title.lower().strip()
    for existing in existing_titles:
        if not existing:
            continue
        ratio = difflib.SequenceMatcher(None, title_lower, existing.lower().strip()).ratio()
        if ratio >= threshold:
            return True
    return False


def get_existing_titles(service_url: str, service_key: str, limit: int = 100) -> list[str]:
    """Fetch recent article titles from Supabase for duplicate detection."""
    request = urllib.request.Request(
        f"{service_url}/rest/v1/articles?select=title&order=date.desc&limit={limit}",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            rows = json.loads(response.read().decode("utf-8"))
            return [str(row.get("title", "")) for row in rows if row.get("title")]
    except Exception:
        return []

def build_image_prompt(title: str, category: str, tags: list[str]) -> str:
    """Build a high-quality journalism-style prompt for image generation."""
    tag_str = ", ".join(tags[:3]) if tags else category
    
    # Category-specific visual style
    style_map = {
        "Nasional": "Indonesian news photography, realistic documentary style",
        "Internasional": "international news photography, wire service style",
        "Ekonomi": "business finance photography, trading floor or corporate setting",
        "Teknologi": "technology journalism photo, modern clean composition",
        "Olahraga": "sports photography, dynamic action shot, stadium lighting",
        "Hiburan": "entertainment journalism, red carpet or studio portrait style",
        "Kesehatan": "medical health photography, clinical or hospital setting",
        "Pendidikan": "education journalism, classroom or campus documentary",
        "Hukum": "legal court photography, judicial setting, gavel or bench",
        "Lainnya": "news photography, documentary style, professional journalism",
    }
    style = style_map.get(category, "news photography, documentary style, professional journalism")
    
    # Build detailed prompt
    prompt = (
        f"{title}. {style}. "
        f"Tags: {tag_str}. "
        f"Professional photojournalism, 16:9 aspect, "
        f"sharp focus, natural lighting, authentic moment, "
        f"high resolution, editorial quality, no watermark, no text"
    )
    return prompt[:300]  # Longer prompt for better results

def get_pollinations_image_url(prompt: str) -> str:
    """Generate Pollinations.ai image URL."""
    encoded = urllib.parse.quote(prompt)
    return f"{POLLINATIONS_BASE}/{encoded}?{POLLINATIONS_PARAMS}"


def parse_rss_date(pub_date: str) -> str | None:
    """Parse RFC 2822/822 pubDate to ISO YYYY-MM-DD."""
    if not pub_date:
        return None
    try:
        # Try RFC 2822 format: "Sat, 19 Sep 2026 10:30:00 +0700"
        dt = datetime.strptime(pub_date[:25], "%a, %d %b %Y %H:%M:%S")
        return dt.date().isoformat()
    except ValueError:
        pass
    try:
        # Try ISO format: "2026-09-19T10:30:00+07:00"
        dt = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
        return dt.date().isoformat()
    except ValueError:
        pass
    try:
        # Try common format: "19 Sep 2026 10:30:00"
        dt = datetime.strptime(pub_date[:20], "%d %b %Y %H:%M:%S")
        return dt.date().isoformat()
    except ValueError:
        pass
    return None


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
        # Clean HTML tags, images, attribution
        clean_excerpt = re.sub(r"<[^>]+>", " ", excerpt)
        clean_excerpt = re.sub(r"\s+", " ", clean_excerpt).strip()
        clean_excerpt = re.sub(r"\s*\(photo credit:.*?\)", "", clean_excerpt, flags=re.IGNORECASE)
        clean_excerpt = re.sub(r"\s*\(Genta Nusa\)", "", clean_excerpt, flags=re.IGNORECASE)
        clean_excerpt = re.sub(r"\s*\(Antara News\)", "", clean_excerpt, flags=re.IGNORECASE)
        pub_date = (item.findtext("pubDate") or item.findtext("pubdate") or item.findtext("published") or "").strip()
        items.append({"title": title, "link": link, "excerpt": clean_excerpt[:800], "pubDate": pub_date})
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
    if not text:
        return None
    # Strip markdown fences the model wraps JSON in (```json ... ```).
    fenced = re.findall(r"```(?:json)?\s*(.+?)```", text, re.DOTALL)
    # Reversed: the model often emits draft then revision, so the last block wins.
    candidates = list(reversed(fenced)) or [text]
    for blob in candidates:
        blob = blob.strip()
        try:
            value = json.loads(blob)
        except json.JSONDecodeError:
            # Model may return draft + revision in one reply; take the LAST
            # balanced object, not a greedy span that fuses them into invalid JSON.
            value = _last_json_object(blob)
        if isinstance(value, dict):
            return value
    return None


def _last_json_object(text: str) -> dict | None:
    depth = 0
    start = -1
    found: list[dict] = []
    in_string = False
    escaped = False
    for i, ch in enumerate(text):
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth:
                depth -= 1
                if depth == 0 and start != -1:
                    try:
                        value = json.loads(text[start : i + 1])
                        if isinstance(value, dict):
                            found.append(value)
                    except json.JSONDecodeError:
                        pass
                    start = -1
    return found[-1] if found else None


# Shared by both LLM paths (9Router local, Gemini direct) so the two never drift.
ARTICLE_SYSTEM_PROMPT = (
    "Anda jurnalis senior GentaNusa. Tulis artikel original berbahasa Indonesia, "
    "gaya majalah berita profesional (Kompas/Tempo), minimal 5 paragraf, idealnya 5-6 paragraf. "
    "Aturan ketat:\n"
    "1. HANYA gunakan fakta yang diberikan dalam prompt. JANGAN mengarang nama, angka, tanggal, kejadian, atau kutipan.\n"
    "2. Jika fakta tidak cukup untuk paragraf lengkap, kembangkan narasi dengan konteks umum tanpa menggunakan frasa klise.\n"
    "3. Gaya: objektif, netral, kalimat efektif, hindari kata-kata berlebihan.\n"
    "4. Paragraf 1 (Lead): Siapa, apa, kapan, di mana, mengapa — max 2 kalimat, minimal 80 karakter.\n"
    "5. Paragraf 2-3: Detail konteks, latar belakang, reaksi pihak terkait, minimal 100 karakter per paragraf.\n"
    "6. Paragraf 4: Dampak/lanjutan/ke depan, minimal 100 karakter.\n"
    "7. Paragraf 5-6 (opsional): Perspektif lebih luas atau konteks nasional.\n"
    "8. Output HANYA JSON valid dengan field: title, excerpt, content (array 5-6 string), tags (array 3-5 string), category (string).\n"
    "9. Title: informatif, max 80 karakter, tanpa clickbait.\n"
    "10. Excerpt: ringkasan 1-2 kalimat, max 200 karakter.\n"
    "11. Category: pilih HANYA dari: Politik, Ekonomi, Nasional, Kesehatan, Olahraga, Teknologi, Pendidikan, Budaya, Lingkungan, Dunia.\n"
    "12. SETIAP paragraf minimal 3 kalimat dan minimal 80 karakter untuk memastikan kedalaman artikel.\n"
    "13. Total artikel minimal 500 karakter untuk memastikan substansi.\n"
    "14. JANGAN menulis draft lalu revisi. Balas SATU objek JSON final saja, tanpa basa-basi, tanpa penutup, tanpa markdown fence.\n"
    "15. Output WAJIB 100% huruf Latin dan tanda baca Indonesia. JANGAN sisipkan karakter aksara lain di mana pun."
)

# Gemini 2.5 Flash is retired for new projects (API returns 404 and names
# gemini-3.8-flash as the successor). Point this at a live model or the whole
# cloud fallback silently dies.
#
# These are tried in order: 503 "high demand" hits one model for minutes at a
# time while the others stay healthy, so walking the list beats retrying one.
GEMINI_MODELS = [
    model
    for model in (os.environ.get("GEMINI_MODEL", ""), "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite-preview")
    if model
]
GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def gemini_api_key() -> str:
    """Key from env first, then .env.local — GitHub Actions injects it as a secret."""
    return (
        os.environ.get("GEMINI_API_KEY", "")
        or load_env_file(ROOT / ".env.local").get("GEMINI_API_KEY", "")
    )


def call_gemini_direct(prompt: str) -> dict | None:
    """Cloud fallback for when 9Router on localhost is not running (CI, laptop off).

    Same contract as call_freemax: returns a parsed JSON object or None.
    """
    api_key = gemini_api_key()
    if not api_key:
        return None
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": ARTICLE_SYSTEM_PROMPT + "\n\n" + prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 6000,
            "responseMimeType": "application/json",
        },
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    for model in GEMINI_MODELS:
        request = urllib.request.Request(
            f"{GEMINI_URL_BASE}/{model}:generateContent",
            data=body,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=LLM_TIMEOUT * 2) as response:
                data = json.loads(response.read().decode("utf-8", errors="replace"))
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            article = extract_json_object(text)
            if article:
                return article
            log(f"Gemini {model}: output tidak valid JSON")
        except Exception as exc:
            log(f"Gemini {model} gagal: {exc}")
    return None


def call_freemax(prompt: str) -> dict | None:
    api_key = os.environ.get('HERMES_OPENAI_API_KEY', load_env_file(Path.home() / '.hermes' / '.env').get('OPENAI_API_KEY', ''))
    payload = {
        "model": LLM_MODEL,
        "response_format": {"type": "json_object"},
        "stream": False,
        "messages": [
            {
                "role": "system",
                "content": ARTICLE_SYSTEM_PROMPT,
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        # Headroom: 6 paragraphs of Indonesian prose can exceed 3000 tokens and
        # truncate mid-JSON, which used to fail every parse attempt.
        "max_tokens": 6000,
    }
    for attempt in range(MAX_LLM_ATTEMPTS):
        request = urllib.request.Request(
            LLM_URL,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )
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
    # Require at least 3 paragraphs, each with at least 3 sentences (rough check)
    if not title or len(title) < 15 or len(excerpt) < 20 or len(content) < 3:
        return None
    shallow = [p for p in content if len(p) < 60]
    if len(shallow) > 1:
        return None
    # Require total content length >= 500 chars (prevents near-empty articles)
    total_content_len = sum(len(p) for p in content)
    if total_content_len < 500:
        return None
    if not isinstance(tags, list):
        tags = []
    tags = [str(tag).strip() for tag in tags if str(tag).strip()]
    # Reject model artifacts that pass length checks but are worthless as journalism.
    # Truncation leaves unfilled scaffolding; CJK noise means the model lost the thread.
    blob = " ".join([title, excerpt, *content]).lower()
    if "placeholder" in blob or "tbd" in blob or "lorem ipsum" in blob:
        return None
    if "informasi tidak tersedia" in blob:
        # If the model produced this filler disclaimer more than once, reject it.
        if blob.count("informasi tidak tersedia") > 1:
            return None
    if re.search(r"[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]", blob):
        # Zero tolerance for any CJK glyphs now.
        return None
    # Degenerate loop guard: the model repeating one word to fill space.
    words = blob.split()
    if len(words) >= 30 and len(set(words)) / len(words) < 0.25:
        return None
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


def check_existing_by_source_link(service_url: str, service_key: str, source_link: str) -> bool:
    """Cek apakah artikel dengan sourceLink ini sudah ada di Supabase."""
    if not source_link:
        return False
    request = urllib.request.Request(
        f"{service_url}/rest/v1/articles?sourceLink=eq.{urllib.parse.quote(source_link)}&select=id&limit=1",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            rows = json.loads(response.read().decode("utf-8"))
            return len(rows) > 0
    except Exception:
        return False


def get_max_id(service_url: str, service_key: str) -> int:
    request = urllib.request.Request(
        f"{service_url}/rest/v1/articles?select=id&order=id.desc&limit=1",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        rows = json.loads(response.read().decode("utf-8"))
    return max((int(row["id"]) for row in rows), default=120)


def insert_article(service_url: str, service_key: str, article: dict) -> int:
    # Remove id from payload - let Supabase auto-generate
    payload = {
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
            "Prefer": "return=representation",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status in (200, 201):
                result = json.loads(response.read().decode("utf-8"))
                if isinstance(result, list) and result:
                    return int(result[0].get("id", 0))
                elif isinstance(result, dict):
                    return int(result.get("id", 0))
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
    parser.add_argument("--save-pending", action="store_true", help="simpan ke pending review вместо langsung publish")
    args = parser.parse_args()

    if not acquire_lock():
        return 0

    start_time = time.time()
    # Must exceed LLM_TIMEOUT * MAX_LLM_ATTEMPTS for a single item, otherwise one
    # slow source burns the whole budget and the run ends with zero articles.
    MAX_RUN_SECONDS = 1800

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
            # Skip if already in Supabase (by sourceLink)
            if check_existing_by_source_link(service_url, service_key, item["link"]):
                processed.add(item["link"])
                continue
            # Fetch existing titles for duplicate detection
            existing_titles = get_existing_titles(service_url, service_key)
            if is_duplicate_title(item["title"], existing_titles):
                log(f"Skip judul mirip: {item['title'][:70]}")
                processed.add(item["link"])
                continue
            attempted += 1
            prompt = (
                f"Sumber: {source.get('name', source_id)} ({source.get('category', 'Umum')})\n"
                f"Judul asli: {item['title']}\n"
                f"Fakta/ringkasan: {item['excerpt']}\n"
                f"Link sumber: {item['link']}\n\n"
                "Tulis artikel original GentaNusa berdasarkan fakta di atas."
            )
            # 9Router on localhost first (free, unlimited); cloud Gemini covers the
            # cases it cannot: laptop off, router down, or model returning junk twice.
            candidate = call_freemax(prompt) or call_gemini_direct(prompt)
            if not candidate:
                continue
            article = validate_article(candidate, source)
            if not article:
                log(f"Output LLM tidak valid untuk {item['title'][:50]}")
                continue

            if args.dry_run:
                print("DRY-RUN candidate:")
                print(json.dumps({"title": article["title"], "category": article["category"], "paragraphs": len(article["content"]), "tags": article["tags"]}, ensure_ascii=False, indent=2))
                log(f"DRY-RUN berhasil: {article['title']}")
                return 0

            if not any(p.strip() for p in article.get("content", [])):
                log("DRY-RUN: konten semua kosong, skip")
                continue

            img_prompt = build_image_prompt(article["title"], article["category"], article["tags"])
            local_env = load_env_file(ROOT / ".env.local")
            hermes_env = load_env_file(Path.home() / ".hermes" / ".env")
            # Try 9Router with OPENAI_API_KEY (same key as text endpoint)
            api_key = os.environ.get("NINEROUTER_KEY") or local_env.get("NINEROUTER_KEY") or hermes_env.get("OPENAI_API_KEY", "")
            img_url = None
            if api_key:
                img_url = get_9router_image_url(img_prompt, api_key, service_url, service_key)
            if not img_url:
                img_url = get_pollinations_image_url(img_prompt)
                log("Using Pollinations.ai fallback for image")

            article_data = {
                **article,
                "date": parse_rss_date(item.get("pubDate", "")) or today,
                "image": img_url,
                "sourceId": source_id,
                "sourceLink": item["link"],
            }

            if args.save_pending:
                # Save to pending review (without ID)
                pending = load_pending_from_file()
                pending.append(article_data)
                save_pending_to_file(pending)
                state["lastRunDate"] = today
                state["processedLinks"] = sorted(processed | {item["link"]})
                state["lastArticle"] = {
                    "title": article["title"],
                    "sourceId": source_id,
                    "sourceLink": item["link"],
                    "date": today,
                    "status": "pending_review",
                }
                save_state(state)
                log(f"PENDING REVIEW: {article['title']}")
                return 0

            # Direct insert - let DB auto-generate ID
            new_id = insert_article(service_url, service_key, article_data)
            if not new_id or new_id <= 0:
                errors.append(f"insert status {new_id}")
                continue

            article_data["id"] = new_id
            state["lastRunDate"] = today
            state["processedLinks"] = sorted(processed | {item["link"]})
            state["lastArticle"] = {
                "id": new_id,
                "title": article["title"],
                "sourceId": source_id,
                "sourceLink": item["link"],
                "date": today,
            }
            save_state(state)
            log(f"BERHASIL ID {new_id}: {article['title']}")
            return 0

    if attempted == 0:
        state["lastRunDate"] = today
        state["lastArticle"] = state.get("lastArticle") or {"reason": "tidak ada item baru"}
        save_state(state)
        log("Tidak ada item RSS baru yang layak hari ini")
        return 0

    log("Gagal membuat artikel hari ini: " + "; ".join(errors[-3:]))
    return 1


def load_pending_from_file() -> list[dict]:
    if not PENDING_FILE.exists():
        return []
    try:
        data = json.loads(PENDING_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def save_pending_to_file(pending: list[dict]) -> None:
    tmp = PENDING_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(pending, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(PENDING_FILE)


if __name__ == "__main__":
    sys.exit(main())
