"""Render and store the 1200x630 share card for one article.

Social crawlers (WhatsApp, Facebook, X) give a page only a couple of seconds to
produce og:image. Serving that from a runtime route means each crawler pays a
remote image fetch plus a sharp composite, and slow enough means the thumbnail
simply disappears. Pre-rendering to a static PNG removes the wait entirely.

Usage:
    python scripts/og-render.py                  # every published article
    python scripts/og-render.py --id 145         # one article
Requires: .env.local, Pillow, and the brand logo under public/images/.
"""

import argparse
import io
import json
import os
import pathlib
import sys
import urllib.request

try:
    from PIL import Image
except ImportError:
    sys.exit("Butuh Pillow: pip install Pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOGO_CANDIDATES = [
    ROOT / "public" / "images" / "logo-gentanusa-white.png",
    ROOT / "public" / "images" / "logo-gentanusa.png",
]
WIDTH, HEIGHT, BANNER = 1200, 630, 120
BANNER_BG = (15, 23, 42)
MIN_BYTES = 5000  # below this the composite fell back to a bare logo
BUCKET = "articles"  # the existing public bucket; no new bucket needed


def load_env() -> dict:
    env = dict(os.environ)
    path = ROOT / ".env.local"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if "=" in line and line.strip() and not line.startswith("#"):
                key, value = line.split("=", 1)
                env.setdefault(key.strip(), value.strip().strip('"'))
    return env


def og_object_name(title: str) -> str:
    """Storage key inside BUCKET — must stay byte-identical to ogHash() in lib/og.ts."""
    h = 0
    for char in title:
        h = ((h * 31) + ord(char)) & 0xFFFFFFFF
    return f"{BUCKET}/og-{h:x}.png"


def fetch_image(url: str, timeout: int = 45) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
        return Image.open(io.BytesIO(response.read())).convert("RGB")


def render_card(photo: Image.Image, logo: Image.Image) -> bytes:
    canvas = photo.resize((WIDTH, HEIGHT - BANNER), Image.LANCZOS)
    banner = Image.new("RGB", (WIDTH, BANNER), BANNER_BG)
    mark = logo.copy()
    mark.thumbnail((160, 160), Image.LANCZOS)
    banner.paste(mark, ((WIDTH - mark.width) // 2, (BANNER - mark.height) // 2))
    canvas.paste(banner, (0, HEIGHT - BANNER))
    out = io.BytesIO()
    canvas.save(out, format="PNG", optimize=True)
    return out.getvalue()


def upload(env: dict, name: str, data: bytes) -> str:
    request = urllib.request.Request(
        f"{env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/{name}",
        data=data,
        headers={
            "apikey": env["SUPABASE_SERVICE_KEY"],
            "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status not in (200, 201):
            raise RuntimeError(f"upload HTTP {response.status}")
    return f"{env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/public/{name}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", type=int, help="render a single article id")
    args = parser.parse_args()

    env = load_env()
    site = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://www.gentanusa.id").rstrip("/")
    logo_path = next((p for p in LOGO_CANDIDATES if p.exists()), None)
    if logo_path is None:
        sys.exit("Logo tidak ditemukan di public/images/")
    logo = Image.open(logo_path).convert("RGBA")

    base = env["NEXT_PUBLIC_SUPABASE_URL"]
    query = f"{base}/rest/v1/articles?select=id,title,image&author_slug=not.like.staging-*&order=id"
    if args.id:
        query += f"&id=eq.{args.id}"
    request = urllib.request.Request(query, headers={
        "apikey": env["SUPABASE_SERVICE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
    })
    articles = json.loads(urllib.request.urlopen(request, timeout=45).read())

    ok = failed = 0
    for art in articles:
        art_id, image = art["id"], art.get("image") or ""
        if not image:
            print(f"  {art_id:>4}  lewati (tidak ada gambar)")
            failed += 1
            continue
        source = image if image.startswith("http") else site + image
        try:
            data = render_card(fetch_image(source), logo)
            if len(data) < MIN_BYTES:
                raise RuntimeError(f"hasil terlalu kecil ({len(data)} byte)")
            print(f"  {art_id:>4}  OK  {len(data):>9,} byte  {upload(env, og_object_name(art['title']), data)}")
            ok += 1
        except Exception as exc:
            print(f"  {art_id:>4}  GAGAL  {exc.__class__.__name__}: {exc}")
            failed += 1

    print(f"\n{ok} berhasil, {failed} gagal")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
