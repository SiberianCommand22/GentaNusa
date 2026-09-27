"""Validator regression check for prompt-leak patterns (added after article ID 145
shipped "Berikut ringkasannya dalam satu paragraf naratif:" into a public excerpt).

The 'must accept' fixture is fetched from a real production article rather than
hand-written, so the accept case stays honest as the validator changes.

Run: python scripts/validator-check.py     (needs .env.local; exits 2 if DB is down)
Exits 0 when every case gets the expected verdict. No test framework.
"""
import importlib.util
import json
import os
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("gen", ROOT / "scripts" / "auto-article-gen.py")
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

SOURCE = {"category": "Dunia"}
FIXTURE_ID = 131  # long-form article that passed the real validator in production


def load_env() -> dict:
    env = {}
    path = ROOT / ".env.local"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if "=" in line and line.strip() and not line.startswith("#"):
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"')
    return env


def real_article() -> dict:
    env = {**load_env(), **os.environ}
    headers = {
        "apikey": env["SUPABASE_SERVICE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_KEY']}",
    }
    url = f"{env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/articles?id=eq.{FIXTURE_ID}&select=title,excerpt,content"
    row = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=45).read())
    art = row[0]
    # Production rows predate the Markdown-subheading rule, so their subheads are bare
    # text. Mark them the way a current model would, to test the accept path fairly.
    body = []
    for part in art["content"]:
        text = str(part).strip()
        short = len(text) < 60 and not text.startswith(("•", "#"))
        body.append(f"# {text}" if short else text)
    return {"title": art["title"], "excerpt": art["excerpt"], "tags": [], "content": body}


def check(name, raw, expect_lolos, results):
    got = gen.validate_article(raw, SOURCE) is not None
    ok = got == expect_lolos
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name:<46} {'LOLOS' if got else 'DITOLAK'}")


def main() -> int:
    try:
        healthy = real_article()
    except Exception as exc:
        print(f"Fixture gagal dimuat ({exc.__class__.__name__}) — tidak bisa diverifikasi.")
        return 2

    leaked = [
        "Berikut ringkasannya dalam satu paragraf naratif: sebuah temuan.",
        "paragraf naratif",
        "Lengkapi tautan, tanggal akses, dan verifikasi angka sebelum publikasi.",
        "Butir bertanda REQUOTE wajib dikonfirmasi ke media asal sebelum kutipan langsung.",
    ]

    results = []
    check("artikel asli ID 131 (harus LOLOS)", healthy, True, results)
    for snippet in leaked:
        check(
            f"konten mengandung {snippet[:34]!r} (TOLAK)",
            {**healthy, "content": healthy["content"] + [snippet]},
            False,
            results,
        )
    check(
        "ekscerpt dibuka 'Berikut ringkasannya...' (TOLAK)",
        {**healthy, "excerpt": "Berikut ringkasannya dalam satu paragraf naratif: sebuah temuan."},
        False,
        results,
    )
    check("ekscerpt dibuka 'Tulis artikel...' (TOLAK)", {**healthy, "excerpt": "Tulis artikel berita tentang ekonomi."}, False, results)

    failed = results.count(False)
    print(f"\n{len(results) - failed}/{len(results)} lulus")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
