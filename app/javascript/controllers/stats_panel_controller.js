import { Controller } from "@hotwired/stimulus"
import { calculateStats, formatFileSize, formatReadTime } from "lib/stats_utils"

// Stats Panel Controller
// Displays document statistics: word count, character count, file size, read time
// Listens for stats:update events with text content

export default class extends Controller {
  static targets = [
    "panel",
    "words",
    "chars",
    "size",
    "readTime",
    "linePosition"
  ]

  connect() {
    this.updateTimeout = null
  }

  disconnect() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }
  }

  // Show the stats panel
  show() {
    if (this.hasPanelTarget) {
      this.panelTarget.classList.remove("hidden")
    }
  }

  // Hide the stats panel
  hide() {
    if (this.hasPanelTarget) {
      this.panelTarget.classList.add("hidden")
    }
  }

  // Schedule a debounced stats update
  scheduleUpdate(text, cursorInfo) {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }
    this.updateTimeout = setTimeout(() => this.update(text, cursorInfo), 500)
  }

  // Update stats display with text content
  update(text, cursorInfo) {
    if (!this.hasPanelTarget) return

    const stats = calculateStats(text || "")

    if (this.hasWordsTarget) {
      this.wordsTarget.textContent = stats.wordCount.toLocaleString()
    }
    if (this.hasCharsTarget) {
      this.charsTarget.textContent = stats.charCount.toLocaleString()
    }
    if (this.hasSizeTarget) {
      this.sizeTarget.textContent = formatFileSize(stats.byteSize)
    }
    if (this.hasReadTimeTarget) {
      this.readTimeTarget.textContent = formatReadTime(stats.readTimeMinutes)
    }
    if (this.hasLinePositionTarget && cursorInfo) {
      this.linePositionTarget.textContent = `${cursorInfo.currentLine}/${cursorInfo.totalLines}`
    }
  }

  // Update just the line position (called on cursor movement)
  updateLinePosition(cursorInfo) {
    if (this.hasLinePositionTarget && cursorInfo) {
      this.linePositionTarget.textContent = `${cursorInfo.currentLine}/${cursorInfo.totalLines}`
    }
  }

  // Handle update event from app controller
  onUpdate(event) {
    const { text, cursorInfo, immediate } = event.detail || {}
    if (immediate) {
      this.update(text, cursorInfo)
    } else {
      this.scheduleUpdate(text, cursorInfo)
    }
  }
}
