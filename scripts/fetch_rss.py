"""
GentaNusa Syndication Bot
=====================

Narik judul + link + ringkasan dari RSS feed sumber (VOA, BBC Indonesia,
Antara), simpan ke lib/data/syndicated.json.

HANYA judul & tautan — bukan salinan isi artikel. Atribusi sumber wajib.
Jalankan:  python scripts/fetch_rss.py
Jadwal:     tiap 30 menit (via Task Scheduler / cron)
"""

import json
import os
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES_FILE = ROOT / "lib" / "data" / "sources.json"
OUT_FILE = ROOT / "lib" / "data" / "syndicated.json"
UA = "GentaNusaBot/1.0 (+https://gentanusa.id/robots.txt) -- syndication title+link, source attribution"

def fetch_xml(url: str, retries: int = 3) -> str:
    last_err = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8"})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            charset = r.headers.get_content_charset() or "utf-8"
            return data.decode(charset, errors="replace")
        except Exception as e:
            last_err = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"Gagal fetch {url}: {last_err}")
MAX_PER_SOURCE = 8
TOTAL_MAX = 30

def fetch_xml(url: str, retries: int = 3) -> str:
    last_err = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode("utf-8", errors="replace")
        except Exception as e:
            last_err = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"Gagal fetch {url}: {last_err}")

def parse_items(xml_str: str):
    ns = {"rss": "http://www.w3.org/2005/Atom"}
    root = ET.fromstring(xml_str)
    items = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        excerpt = (item.findtext("description") or "").strip()
        # buang tag HTML di description
        import re
        excerpt = re.sub(r"<[^>]+>", "", excerpt).strip()
        pub = (item.findtext("pubDate") or item.findtext("dc:date") or "").strip()
        items.append({"title": title, "link": link, "excerpt": excerpt[:240], "pubDate": pub})
    return items

def main():
    sources = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    all_items = []
    for src in sources:
        print(f"[{src['id']}] fetching {src['url']}")
        try:
            xml = fetch_xml(src["url"])
            items = parse_items(xml)[:MAX_PER_SOURCE]
            for it in items:
                all_items.append({
                    "id": f"{src['id']}-{it['link'][-20:]}",
                    "sourceId": src["id"],
                    "sourceName": src["name"],
                    "title": it["title"],
                    "excerpt": it["excerpt"],
                    "link": it["link"],
                    "category": src["category"],
                    "date": datetime.now(timezone.utc).isoformat(),
                })
            print(f"  -> {len(items)} item")
        except Exception as e:
            print(f"  !! {e}")
    all_items.sort(key=lambda x: x["date"], reverse=True)
    all_items = all_items[:TOTAL_MAX]
    OUT_FILE.write_text(json.dumps(all_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nTotal sindikasi: {len(all_items)} item -> {OUT_FILE.name}")

if __name__ == "__main__":
    main()
