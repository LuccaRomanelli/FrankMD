// Markdown utility functions - Pure functions for markdown analysis
// Extracted for testability

// Pre-compiled regex for validating markdown table separator rows (e.g. |---|---|)
const TABLE_SEPARATOR_RE = /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?\s*$/

/**
 * Find a markdown table at the given cursor position
 * @param {string} text - Full document text
 * @param {number} pos - Cursor position
 * @returns {object|null} - Table info with startPos, endPos, lines, or null if not in table
 */
export function findTableAtPosition(text, pos) {
  // Early-out: extract current line without splitting the entire document.
  // This makes the common case (cursor NOT in a table) nearly zero-cost.
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1
  const lineEnd = text.indexOf("\n", pos)
  const currentLineText = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd)

  if (!currentLineText.trimStart().startsWith("|")) {
    return null
  }

  // Only split when we know we're on a pipe-line
  const lines = text.split("\n")
  let offset = 0
  let currentLine = 0

  // Find which line the cursor is on
  for (let i = 0; i < lines.length; i++) {
    const end = offset + lines[i].length
    if (pos >= offset && pos <= end) {
      currentLine = i
      break
    }
    offset = end + 1 // +1 for newline
  }

  // Find table boundaries (search up and down for table rows)
  let startLine = currentLine
  let endLine = currentLine

  // Search upward
  while (startLine > 0 && lines[startLine - 1].trim().startsWith("|")) {
    startLine--
  }

  // Search downward
  while (endLine < lines.length - 1 && lines[endLine + 1].trim().startsWith("|")) {
    endLine++
  }

  // Need at least 2 lines (header + separator)
  if (endLine - startLine < 1) {
    return null
  }

  // Validate that the table contains a separator row (e.g. |---|---|)
  const tableLines = lines.slice(startLine, endLine + 1)
  if (!tableLines.some(l => TABLE_SEPARATOR_RE.test(l.trim()))) {
    return null
  }

  // Calculate positions
  let startPos = 0
  for (let i = 0; i < startLine; i++) {
    startPos += lines[i].length + 1
  }

  let endPos = startPos
  for (let i = startLine; i <= endLine; i++) {
    endPos += lines[i].length + 1
  }
  endPos-- // Remove trailing newline

  return {
    startLine,
    endLine,
    startPos,
    endPos,
    lines: tableLines
  }
}

/**
 * Find a fenced code block at the given cursor position
 * @param {string} text - Full document text
 * @param {number} pos - Cursor position
 * @returns {object|null} - Code block info with startPos, endPos, language, content, or null
 */
export function findCodeBlockAtPosition(text, pos) {
  // Find fenced code blocks using regex
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const startPos = match.index
    const endPos = match.index + match[0].length

    if (pos >= startPos && pos <= endPos) {
      return {
        startPos,
        endPos,
        language: match[1],
        content: match[2]
      }
    }
  }

  return null
}

