export const LINE_NUMBER_MODES = {
  OFF: 0,
  ABSOLUTE: 1,
  RELATIVE: 2
}

export function normalizeLineNumberMode(value, fallback = LINE_NUMBER_MODES.ABSOLUTE) {
  const parsed = Number.parseInt(value, 10)
  if (parsed === LINE_NUMBER_MODES.OFF || parsed === LINE_NUMBER_MODES.ABSOLUTE || parsed === LINE_NUMBER_MODES.RELATIVE) {
    return parsed
  }
  return fallback
}

export function nextLineNumberMode(mode) {
  if (mode === LINE_NUMBER_MODES.OFF) return LINE_NUMBER_MODES.ABSOLUTE
  if (mode === LINE_NUMBER_MODES.ABSOLUTE) return LINE_NUMBER_MODES.RELATIVE
  return LINE_NUMBER_MODES.OFF
}

export function buildRelativeLineLabels(totalLines, cursorIndex) {
  const count = Math.max(1, totalLines || 0)
  const clampedCursor = Math.min(Math.max(cursorIndex, 0), count - 1)

  return Array.from({ length: count }, (_, index) => String(index - clampedCursor))
}

export function buildAbsoluteLineLabels(visualCountsPerLine) {
  const logicalCount = Math.max(1, visualCountsPerLine.length)
  const labels = []

  for (let i = 0; i < logicalCount; i++) {
    const visualCount = Math.max(1, visualCountsPerLine[i] || 0)
    labels.push(String(i + 1))
    for (let j = 1; j < visualCount; j++) {
      labels.push("")
    }
  }

  return labels
}
