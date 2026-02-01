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

export function buildRelativeLineLabels(visualCountsPerLine, cursorLogicalIndex) {
  const logicalCount = Math.max(1, visualCountsPerLine.length)
  const clampedCursor = Math.min(Math.max(cursorLogicalIndex, 0), logicalCount - 1)
  const labels = []

  for (let i = 0; i < logicalCount; i++) {
    const visualCount = Math.max(1, visualCountsPerLine[i] || 0)
    // Show relative offset for the first visual line of each logical line
    labels.push(String(i - clampedCursor))
    // Add blank labels for wrapped portions
    for (let j = 1; j < visualCount; j++) {
      labels.push("")
    }
  }

  return labels
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
