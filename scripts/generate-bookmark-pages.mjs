import { readFileSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"
import matter from "gray-matter"

const REFERENCES_DIR = "content/06-bookmarks/references"
const OUTPUT_DIR = "content/06-bookmarks"

const SOURCE_META = {
  all: { title: "Bookmarks", file: "index" },
  blog: { title: "Blogs", file: "blogs" },
  hackernews: { title: "Hacker News", file: "hackernews" },
  reddit: { title: "Reddit", file: "reddit" },
  twitter: { title: "Twitter", file: "twitter" },
  youtube: { title: "YouTube", file: "youtube" },
}

// Read all bookmark entries
const files = readdirSync(REFERENCES_DIR).filter(
  (f) => f.endsWith(".md") && f !== "index.md",
)

const bookmarks = files
  .map((f) => {
    const raw = readFileSync(join(REFERENCES_DIR, f), "utf8")
    return matter(raw).data
  })
  .sort((a, b) => new Date(b.date_saved ?? 0) - new Date(a.date_saved ?? 0))

function buildTable(items) {
  if (items.length === 0) return "_No entries yet._\n"
  const header = `| Title | Type | Tags | Seen | Date Saved | Notes |\n|-------|------|------|------|------------|-------|\n`
  const rows = items
    .map((b) => {
      const title = b.url ? `[${b.title ?? ""}](${b.url})` : (b.title ?? "")
      const type = b.type ?? ""
      const tags = Array.isArray(b.tags) ? b.tags.join(", ") : (b.tags ?? "")
      const seen = b.seen ? "✓" : "✗"
      const date = b.date_saved ?? ""
      const notes = (b.description ?? "").replace(/\|/g, "\\|")
      return `| ${title} | ${type} | ${tags} | ${seen} | ${date} | ${notes} |`
    })
    .join("\n")
  return header + rows + "\n"
}

function writePage(slug, title, items) {
  const table = buildTable(items)
  const content = `---
title: "${title}"
---

# ${title}

${table}`
  writeFileSync(join(OUTPUT_DIR, `${slug}.md`), content)
  console.log(`  wrote ${slug}.md (${items.length} entries)`)
}

console.log("Generating bookmark pages...")
writePage("index", "Bookmarks", bookmarks)
for (const [source, meta] of Object.entries(SOURCE_META)) {
  if (source === "all") continue
  const filtered = bookmarks.filter((b) => b.source === source)
  writePage(meta.file, meta.title, filtered)
}
console.log("Done.")
