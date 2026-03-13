import { readFileSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"
import matter from "gray-matter"

const REFERENCES_DIR = "content/06-bookmarks/references"
const OUTPUT_DIR = "content/06-bookmarks"

const SOURCE_META = {
  blog:        { title: "Blogs",        file: "blogs"       },
  hackernews:  { title: "Hacker News",  file: "hackernews"  },
  reddit:      { title: "Reddit",       file: "reddit"      },
  twitter:     { title: "Twitter",      file: "twitter"     },
  youtube:     { title: "YouTube",      file: "youtube"     },
}

const MAX_TAGS = 3

// ── helpers ───────────────────────────────────────────────────────────────────

function esc(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function fmtDate(val) {
  if (!val) return ""
  // gray-matter / js-yaml parses YYYY-MM-DD as a JS Date object
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).slice(0, 10)
}

// ── data ─────────────────────────────────────────────────────────────────────

const files = readdirSync(REFERENCES_DIR).filter(
  (f) => f.endsWith(".md") && f !== "index.md",
)

const bookmarks = files
  .map((f) => matter(readFileSync(join(REFERENCES_DIR, f), "utf8")).data)
  .sort((a, b) => {
    const da = a.date_saved instanceof Date ? a.date_saved : new Date(a.date_saved ?? 0)
    const db = b.date_saved instanceof Date ? b.date_saved : new Date(b.date_saved ?? 0)
    return db - da
  })

// ── table builder ─────────────────────────────────────────────────────────────

function buildTable(items) {
  if (items.length === 0) return `<p class="bm-empty">No entries yet.</p>`

  const rows = items.map((b) => {
    const title = b.url
      ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.title)}</a>`
      : esc(b.title ?? "")

    const type = b.type
      ? `<span class="bm-type">${esc(b.type)}</span>`
      : ""

    const rawTags = Array.isArray(b.tags) ? b.tags : []
    const shownTags = rawTags.slice(0, MAX_TAGS)
    const extraCount = rawTags.length - shownTags.length
    const tagBadges = shownTags.map((t) => `<span class="bm-tag">${esc(t)}</span>`).join("")
    const extraBadge = extraCount > 0 ? `<span class="bm-tag bm-tag--more">+${extraCount}</span>` : ""
    const tags = `<div class="bm-tags-wrap">${tagBadges}${extraBadge}</div>`

    const seen = b.seen
      ? `<span class="bm-seen bm-seen--yes" title="Seen">✓</span>`
      : `<span class="bm-seen bm-seen--no"  title="Not seen">–</span>`

    const date = `<span class="bm-date">${esc(fmtDate(b.date_saved))}</span>`

    const notes = b.description
      ? `<span class="bm-notes" title="${esc(b.description)}">${esc(b.description)}</span>`
      : ""

    return `    <tr>
      <td class="bm-col-title">${title}</td>
      <td class="bm-col-type">${type}</td>
      <td class="bm-col-tags">${tags}</td>
      <td class="bm-col-seen">${seen}</td>
      <td class="bm-col-date">${date}</td>
      <td class="bm-col-notes">${notes}</td>
    </tr>`
  }).join("\n")

  return `<div class="bookmark-table-wrapper">
<table class="bookmark-table">
  <colgroup>
    <col class="bm-w-title">
    <col class="bm-w-type">
    <col class="bm-w-tags">
    <col class="bm-w-seen">
    <col class="bm-w-date">
    <col class="bm-w-notes">
  </colgroup>
  <thead>
    <tr>
      <th>Title</th>
      <th>Type</th>
      <th>Tags</th>
      <th></th>
      <th>Saved</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>`
}

// ── write pages ───────────────────────────────────────────────────────────────

function writePage(slug, title, items) {
  const table = buildTable(items)
  const count = `<p class="bm-count">${items.length} bookmark${items.length !== 1 ? "s" : ""}</p>`
  writeFileSync(
    join(OUTPUT_DIR, `${slug}.md`),
    `---\ntitle: "${title}"\n---\n\n${count}\n\n${table}\n`,
  )
  console.log(`  wrote ${slug}.md (${items.length} entries)`)
}

console.log("Generating bookmark pages...")
writePage("index", "Bookmarks", bookmarks)
for (const [source, meta] of Object.entries(SOURCE_META)) {
  writePage(meta.file, meta.title, bookmarks.filter((b) => b.source === source))
}
console.log("Done.")
