from datetime import date, timedelta
from pathlib import Path


def get_incremented_filename(base_dir: Path, base_name: str, extension=".md"):
    """
    Returns a filename that increments with _1, _2, _3...
    if base_name.md already exists.
    """
    base_path = base_dir / f"{base_name}{extension}"

    if not base_path.exists():
        return base_path.name, base_path

    counter = 1
    while True:
        filename = f"{base_name}_{counter}{extension}"
        filepath = base_dir / filename
        if not filepath.exists():
            return filename, filepath
        counter += 1


def get_missing_date(base_dir: Path, start_date: date, end_date: date) -> date | None:
    """Returns the first missing date in a range, or None if all are present."""
    current = start_date
    while current <= end_date:
        if not (base_dir / f"{current.isoformat()}.md").exists():
            return current
        current += timedelta(days=1)
    return None


def get_last_post_date(base_dir: Path) -> date | None:
    """Returns the most recent post date found in the directory."""
    dates = [
        f.stem[:10]
        for f in base_dir.glob("*.md")
        if f.stem[:10].count("-") == 2
    ]
    return max((date.fromisoformat(d) for d in dates), default=None)


def create_blog_post(target_date: date, base_dir: Path):
    """Creates the markdown file for a specific date with increment support."""
    filename, filepath = get_incremented_filename(
        base_dir, target_date.isoformat()
    )

    content = f"""---
title: "{target_date.isoformat()}"
description: ""
pubDate: "{target_date.isoformat()}"
heroImage: "https://www.dropbox.com/scl/fi/ozwb8141r9p1gegm74zk1/artefaktas_eu.jpg?rlkey=kex3z13fdg0eciums3driexp7&st=73a95se8&dl=1"
---

# {target_date.isoformat()}

> TLDR;
> Šiandienos tema: 

Sveika, elektroerdve,



[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K06VU8Z)

Iki sekančio susiskaitymo.

Šis ekranas trumpam išsijungia, bet kažkur įsijungia kitas.

| #    | Žymos                			|
| ---- | ---------------------------------------|
|      | #post #artefaktas_eu #personal #opinion|

> Asmeninė nuomonė.

> Thinking out loud, responsibly.

> Artefaktas.eu is a personal digital garden exploring technology, creativity, and the craft of building things online. Posts range from reflections on blogging tools and web frameworks to thoughts on AI, productivity, and digital minimalism — always with a mix of humor, curiosity, and hands-on experimentation.

> Author: Artefaktas
> About author: I’m a creator-blogger driven by curiosity, blending writing, art, music, code, and the elegance of math and physics into everything I do.
"""

    # Atomic write: fails if file somehow appears between check and write
    with filepath.open("x", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Blog post created: {filename} at {filepath.resolve()}")


def create_daily_blog_post():
    target_dir = Path("../src/content/blog")
    target_dir.mkdir(parents=True, exist_ok=True)

    user_input = input("💬 Would you like to fill in skipped dates? (y/n): ").strip().lower()
    fill_skipped = user_input.startswith("y")

    today = date.today()

    if fill_skipped:
        last_date = get_last_post_date(target_dir)
        start_date = (last_date + timedelta(days=1)) if last_date else today - timedelta(days=7)
        missing = get_missing_date(target_dir, start_date, today)

        if missing:
            create_blog_post(missing, target_dir)
        else:
            print("✅ No missing posts. Everything’s up to date.")
    else:
        create_blog_post(today, target_dir)


if __name__ == "__main__":
    create_daily_blog_post()
