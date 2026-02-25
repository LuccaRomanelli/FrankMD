// Markdown utility functions - Pure functions for markdown analysis
// Extracted for testability

/**
 * Find a markdown table at the given cursor position
 * @param {string} text - Full document text
 * @param {number} pos - Cursor position
 * @returns {object|null} - Table info with startPos, endPos, lines, or null if not in table
 */
export function findTableAtPosition(text, pos) {
  const lines = text.split("\n")
  let lineStart = 0
  let currentLine = 0

  // Find which line the cursor is on
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = lineStart + lines[i].length
    if (pos >= lineStart && pos <= lineEnd) {
      currentLine = i
      break
    }
    lineStart = lineEnd + 1 // +1 for newline
  }

  // Check if current line looks like a table row
  const line = lines[currentLine]
  if (!line || !line.trim().startsWith("|")) {
    return null
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
  const separatorPattern = /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?\s*$/
  const tableLines = lines.slice(startLine, endLine + 1)
  const hasSeparator = tableLines.some(l => separatorPattern.test(l.trim()))
  if (!hasSeparator) {
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
    lines: lines.slice(startLine, endLine + 1)
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

