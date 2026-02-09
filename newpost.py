from datetime import date, timedelta
from pathlib import Path

def get_available_filename(base_dir: Path, base_name: str, extension=".md"):
    """Returns a filename that doesn't already exist in base_dir.
    Appends numeric suffix if needed, like '_01'."""
    filename = f"{base_name}{extension}"
    filepath = base_dir / filename
    counter = 1
    while filepath.exists():
        suffix = f"_{counter:02}"
        filename = f"{base_name}{suffix}{extension}"
        filepath = base_dir / filename
        counter += 1
    return filename, filepath

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
        f.stem[:10] for f in base_dir.glob("*.md")
        if f.stem[:10].count("-") == 2
    ]
    return max((date.fromisoformat(d) for d in dates), default=None)

def create_blog_post(target_date: date, base_dir: Path):
    """Creates the markdown file for a specific date."""
    filename, filepath = get_available_filename(base_dir, target_date.isoformat())

    if filepath.exists():
        print(f"⚠️ File '{filename}' already exists. Skipping.")
        return

    content = f"""---
slug: {target_date.isoformat()}
title: {target_date.isoformat()}
authors: [artefaktas]
tags: [newpost]
---

{target_date.isoformat()}

<!-- truncate -->

# {target_date.isoformat()}

> TLDR;
> Šiandienos tema: {target_date.isoformat()}

Sveika, elektroerdve,



Iki sekančio susiskaitymo.

Šis ekranas trumpam išsijungia, bet kažkur įsijungia kitas.

> Artefaktas docs.

> Thinking out loud, responsibly.

> Artefaktas.eu is a personal digital garden exploring technology, creativity, and the craft of building things online. Posts range from reflections on blogging tools and web frameworks to thoughts on AI, productivity, and digital minimalism — always with a mix of humor, curiosity, and hands-on experimentation.

> About author: I’m a creator-blogger driven by curiosity, blending writing, art, music, code, and the elegance of math and physics into everything I do.
"""
    filepath.write_text(content, encoding="utf-8")
    print(f"✅ Blog post created: {filename} at {filepath.resolve()}")

def create_daily_blog_post():
    target_dir = Path("blog")
    target_dir.mkdir(parents=True, exist_ok=True)

    # Ask user if they want to fill skipped posts
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
        today_path = target_dir / f"{today.isoformat()}.md"
        if today_path.exists():
            print(f"🛑 Today’s post already exists. ({today_path.name})")
        else:
            create_blog_post(today, target_dir)

if __name__ == "__main__":
    create_daily_blog_post()
