import { describe, it, expect } from "vitest"
import {
  findTableAtPosition,
  findCodeBlockAtPosition
} from "../../app/javascript/lib/markdown_utils.js"

describe("findTableAtPosition", () => {
  it("finds table when cursor is on table row", () => {
    const text = `Some text

| Name | Age |
| --- | --- |
| Alice | 30 |

More text`

    // Position in the middle of the table (on "| Alice |" line)
    const pos = text.indexOf("| Alice")
    const result = findTableAtPosition(text, pos)

    expect(result).not.toBeNull()
    expect(result.lines).toHaveLength(3)
    expect(result.lines[0]).toBe("| Name | Age |")
  })

  it("returns null when not in table", () => {
    const text = `Some text

| Name | Age |
| --- | --- |
| Alice | 30 |

More text`

    const pos = text.indexOf("Some text")
    const result = findTableAtPosition(text, pos)

    expect(result).toBeNull()
  })

  it("returns null for single-line table", () => {
    const text = "| Just | One | Line |"
    const result = findTableAtPosition(text, 5)

    expect(result).toBeNull()
  })

  it("includes correct start and end positions", () => {
    const text = `| A | B |
| - | - |
| 1 | 2 |`

    const result = findTableAtPosition(text, 5)

    expect(result.startPos).toBe(0)
    expect(result.endPos).toBe(text.length)
  })

  it("handles table at document start", () => {
    const text = `| Header |
| --- |
| Value |
Some other text`

    const result = findTableAtPosition(text, 0)

    expect(result).not.toBeNull()
    expect(result.startLine).toBe(0)
    expect(result.lines).toHaveLength(3)
  })

  it("handles table at document end", () => {
    const text = `Some text
| Header |
| --- |
| Value |`

    const result = findTableAtPosition(text, text.length - 1)

    expect(result).not.toBeNull()
    expect(result.lines).toHaveLength(3)
  })
})

describe("findCodeBlockAtPosition", () => {
  it("finds code block when cursor is inside", () => {
    const text = `Some text

\`\`\`javascript
const x = 1
\`\`\`

More text`

    const pos = text.indexOf("const x")
    const result = findCodeBlockAtPosition(text, pos)

    expect(result).not.toBeNull()
    expect(result.language).toBe("javascript")
    expect(result.content).toContain("const x = 1")
  })

  it("returns null when not in code block", () => {
    const text = `Some text

\`\`\`javascript
const x = 1
\`\`\`

More text`

    const pos = text.indexOf("Some text")
    const result = findCodeBlockAtPosition(text, pos)

    expect(result).toBeNull()
  })

  it("handles code block without language", () => {
    const text = `\`\`\`
plain code
\`\`\``

    const result = findCodeBlockAtPosition(text, 10)

    expect(result).not.toBeNull()
    expect(result.language).toBe("")
  })

  it("finds correct block with multiple code blocks", () => {
    const text = `\`\`\`javascript
first
\`\`\`

\`\`\`python
second
\`\`\``

    const pos = text.indexOf("second")
    const result = findCodeBlockAtPosition(text, pos)

    expect(result).not.toBeNull()
    expect(result.language).toBe("python")
  })
})

// Hugo slug and frontmatter generation is now handled server-side
// See test/services/hugo_service_test.rb for those tests
