import fs from "node:fs"
import path from "node:path"

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (p.endsWith(".tsx") && (p.includes("pages") || p.includes("components") || p.includes("views"))) {
      let c = fs.readFileSync(p, "utf8")
      if (c.startsWith('"use client"') || c.startsWith("'use client'")) continue
      if (/use(State|Effect|Callback|Memo|Context|Ref|Navigate|Location|Params|SearchParams)\b/.test(c)) {
        fs.writeFileSync(p, `"use client"\n\n${c}`)
      }
    }
  }
}

walk("src")
