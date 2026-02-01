// Stats utility functions - Pure functions for document statistics
// Extracted for testability

// Reusable TextEncoder for efficient byte size calculation
const textEncoder = new TextEncoder()

/**
 * Calculate document statistics
 * Optimized to avoid creating large intermediate arrays for big documents
 * @param {string} text - Document text
 * @returns {object} - { wordCount, charCount, byteSize, readTimeMinutes }
 */
export function calculateStats(text) {
  if (!text) {
    return {
      wordCount: 0,
      charCount: 0,
      byteSize: 0,
      readTimeMinutes: 0
    }
  }

  // Word count - use match instead of split to avoid creating array
  // This is more memory efficient for large documents
  const wordMatches = text.match(/\S+/g)
  const wordCount = wordMatches ? wordMatches.length : 0

  // Character count
  const charCount = text.length

  // File size (bytes) - use TextEncoder instead of Blob for efficiency
  const byteSize = textEncoder.encode(text).length

  // Estimated reading time (average 200 words per minute)
  const wordsPerMinute = 200
  const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute)

  return {
    wordCount,
    charCount,
    byteSize,
    readTimeMinutes
  }
}

/**
 * Format read time for display
 * @param {number} minutes - Reading time in minutes
 * @returns {string} - Formatted read time string
 */
export function formatReadTime(minutes) {
  if (minutes <= 1) return "< 1 min"
  return `${minutes} min`
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Human-readable size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  // Show decimal only for KB and above, and only if meaningful
  if (i === 0) return `${bytes} B`
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`
}
