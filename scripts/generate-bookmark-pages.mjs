import { readFileSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"
import matter from "gray-matter"

const REFERENCES_DIR = "content/06-bookmarks/references"
const OUTPUT_DIR = "content/06-bookmarks"

const SOURCE_META = {
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

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildTable(items) {
  if (items.length === 0) return "<p><em>No entries yet.</em></p>"

  const rows = items
    .map((b) => {
      const title = b.url
        ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.title)}</a>`
        : esc(b.title)

      const type = b.type
        ? `<span class="bm-type">${esc(b.type)}</span>`
        : ""

      const tags = Array.isArray(b.tags)
        ? b.tags.map((t) => `<span class="bm-tag">${esc(t)}</span>`).join(" ")
        : ""

      const seen = b.seen
        ? `<span class="bm-seen bm-seen--yes" title="Seen">✓</span>`
        : `<span class="bm-seen bm-seen--no" title="Not seen">✗</span>`

      const date = `<span class="bm-date">${esc(b.date_saved ?? "")}</span>`

      const notes = b.description
        ? `<span class="bm-notes" title="${esc(b.description)}">${esc(b.description)}</span>`
        : ""

      return `    <tr>
      <td class="bm-title">${title}</td>
      <td>${type}</td>
      <td class="bm-tags">${tags}</td>
      <td class="bm-seen-cell">${seen}</td>
      <td>${date}</td>
      <td class="bm-notes-cell">${notes}</td>
    </tr>`
    })
    .join("\n")

  return `<table class="bookmark-table">
  <thead>
    <tr>
      <th>Title</th>
      <th>Type</th>
      <th>Tags</th>
      <th>Seen</th>
      <th>Saved</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`
}

function writePage(slug, title, items, showSource = false) {
  const table = buildTable(items)
  const count = `<p class="bm-count">${items.length} bookmark${items.length !== 1 ? "s" : ""}</p>`
  const content = `---
title: "${title}"
---

${count}

${table}
`
  writeFileSync(join(OUTPUT_DIR, `${slug}.md`), content)
  console.log(`  wrote ${slug}.md (${items.length} entries)`)
}

console.log("Generating bookmark pages...")
writePage("index", "Bookmarks", bookmarks, true)
for (const [source, meta] of Object.entries(SOURCE_META)) {
  const filtered = bookmarks.filter((b) => b.source === source)
  writePage(meta.file, meta.title, filtered)
}
console.log("Done.")
