// Renders a plain-text product description while preserving
// paragraph breaks, section headings, and bullet lists.

interface Props { text: string }

// Strip leading bullet chars and invisible unicode (word-joiner U+2060, ZWNBS, etc.)
function stripBullet(line: string) {
  return line.replace(/^[⁠​﻿\s•●\-*]+/, '').trim()
}

function isBulletLine(line: string) {
  return /^[⁠​﻿\s]*[•●\-*]/.test(line)
}

export function DescriptionRenderer({ text }: Props) {
  // Split on one or more blank lines → array of blocks
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        if (!lines.length) return null

        const allBullets = lines.every(isBulletLine)
        const firstIsBullet = isBulletLine(lines[0])

        // ── Bullet list (with optional heading on first line) ──────────
        if (allBullets || (!firstIsBullet && lines.slice(1).every(isBulletLine))) {
          const heading = !firstIsBullet ? lines[0] : null
          const bulletLines = heading ? lines.slice(1) : lines

          return (
            <div key={bi} className="space-y-1.5">
              {heading && (
                <p className="font-medium text-foreground">{heading}</p>
              )}
              <ul className="space-y-1.5 text-muted-foreground">
                {bulletLines.map((line, li) => (
                  <li key={li} className="flex gap-2">
                    <span className="shrink-0 select-none">•</span>
                    <span>{stripBullet(line)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        // ── Short single line → section heading ────────────────────────
        if (lines.length === 1 && lines[0].length < 60) {
          return (
            <p key={bi} className="font-medium text-foreground">
              {lines[0]}
            </p>
          )
        }

        // ── Regular paragraph ──────────────────────────────────────────
        return (
          <p key={bi} className="text-muted-foreground">
            {lines.map((line, li) => (
              <span key={li}>
                {line}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
