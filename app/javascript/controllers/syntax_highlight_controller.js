import { Controller } from "@hotwired/stimulus"

// Syntax Highlight Controller
// Provides markdown syntax highlighting in the editor textarea
// Uses a background overlay technique with transparent textarea text

export default class extends Controller {
  static targets = ["textarea", "highlight"]

  static values = {
    enabled: { type: Boolean, default: true }
  }

  connect() {
    this.updateHandle = null
    this.setupHighlightLayer()
    this.scheduleUpdate()
  }

  disconnect() {
    if (this.updateHandle) {
      cancelAnimationFrame(this.updateHandle)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }

  // Setup the highlight layer to match textarea styles
  setupHighlightLayer() {
    if (!this.hasHighlightTarget || !this.hasTextareaTarget) return

    this.syncStyles()

    // Observe textarea for style changes (font, size changes from customize dialog)
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.syncStyles()
        this.scheduleUpdate()
      })
      this.resizeObserver.observe(this.textareaTarget)
    }
  }

  // Sync highlight layer styles with textarea
  syncStyles() {
    if (!this.hasHighlightTarget || !this.hasTextareaTarget) return

    const textarea = this.textareaTarget
    const highlight = this.highlightTarget
    const style = window.getComputedStyle(textarea)

    // Copy font properties
    highlight.style.fontFamily = style.fontFamily
    highlight.style.fontSize = style.fontSize
    highlight.style.fontWeight = style.fontWeight
    highlight.style.lineHeight = style.lineHeight
    highlight.style.letterSpacing = style.letterSpacing
    highlight.style.tabSize = style.tabSize

    // Copy padding to match textarea exactly
    highlight.style.padding = style.padding

    // Copy text properties that affect layout
    highlight.style.whiteSpace = "pre-wrap"
    highlight.style.overflowWrap = "break-word"
    highlight.style.wordBreak = "break-word"
    highlight.style.boxSizing = "border-box"

    // Match the textarea dimensions exactly
    highlight.style.width = `${textarea.offsetWidth}px`
    highlight.style.minHeight = `${textarea.offsetHeight}px`
  }

  // Schedule an update on next animation frame (RAF debounce)
  scheduleUpdate() {
    if (!this.enabledValue) return
    if (!this.hasHighlightTarget || !this.hasTextareaTarget) return

    if (this.updateHandle) {
      cancelAnimationFrame(this.updateHandle)
    }

    this.updateHandle = requestAnimationFrame(() => {
      this.update()
    })
  }

  // Update the highlight layer content
  update() {
    if (!this.enabledValue) return
    if (!this.hasHighlightTarget || !this.hasTextareaTarget) return

    this.updateHandle = null

    // Sync styles in case textarea became visible or changed size
    this.syncStyles()

    const text = this.textareaTarget.value
    const highlighted = this.highlight(text)

    // Add trailing newline to ensure last line renders properly
    this.highlightTarget.innerHTML = highlighted + "\n"

    // Sync scroll position
    this.syncScroll()
  }

  // Sync scroll position between textarea and highlight layer
  syncScroll() {
    if (!this.hasHighlightTarget || !this.hasTextareaTarget) return

    const scrollTop = this.textareaTarget.scrollTop
    const scrollLeft = this.textareaTarget.scrollLeft
    this.highlightTarget.style.transform = `translate(-${scrollLeft}px, -${scrollTop}px)`
  }

  // Apply syntax highlighting to text, returning HTML
  highlight(text) {
    if (!text) return ""

    // Process code blocks first (to avoid highlighting markdown inside them)
    const codeBlocks = []
    let processedText = text.replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `\x00CODE${codeBlocks.length}\x00`
      codeBlocks.push(match)
      return placeholder
    })

    // Process inline code
    const inlineCode = []
    processedText = processedText.replace(/`[^`\n]+`/g, (match) => {
      const placeholder = `\x00INLINE${inlineCode.length}\x00`
      inlineCode.push(match)
      return placeholder
    })

    // Escape HTML in the text
    processedText = this.escapeHtml(processedText)

    // Apply syntax highlighting patterns
    processedText = this.highlightPatterns(processedText)

    // Restore inline code with highlighting
    inlineCode.forEach((code, i) => {
      const escapedCode = this.escapeHtml(code)
      const highlighted = `<span class="sh-code">${escapedCode}</span>`
      processedText = processedText.replace(`\x00INLINE${i}\x00`, highlighted)
    })

    // Restore code blocks with highlighting
    codeBlocks.forEach((block, i) => {
      const escapedBlock = this.escapeHtml(block)
      const highlighted = `<span class="sh-code">${escapedBlock}</span>`
      processedText = processedText.replace(`\x00CODE${i}\x00`, highlighted)
    })

    return processedText
  }

  // Apply markdown syntax highlighting patterns
  highlightPatterns(text) {
    // Process line by line for line-start patterns
    const lines = text.split("\n")
    const highlightedLines = lines.map(line => this.highlightLine(line))
    return highlightedLines.join("\n")
  }

  // Highlight a single line
  highlightLine(line) {
    // Headings: # to ######
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)[1].length
      return `<span class="sh-heading sh-h${level}">${line}</span>`
    }

    // Blockquotes: > text
    if (/^&gt;\s/.test(line)) {
      return `<span class="sh-blockquote">${line}</span>`
    }

    // List markers: -, *, +, or numbered (1.)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/)
    if (listMatch) {
      const indent = listMatch[1]
      const marker = listMatch[2]
      const rest = line.slice(listMatch[0].length)
      const highlightedRest = this.highlightInline(rest)
      return `${indent}<span class="sh-list-marker">${marker}</span> ${highlightedRest}`
    }

    // Horizontal rules
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      return `<span class="sh-hr">${line}</span>`
    }

    // Regular line - apply inline highlighting
    return this.highlightInline(line)
  }

  // Highlight inline patterns (bold, italic, links, etc.)
  highlightInline(text) {
    // Bold: **text** or __text__
    text = text.replace(/(\*\*|__)([^*_]+)\1/g, '<span class="sh-bold">$1$2$1</span>')

    // Italic: *text* or _text_ (not inside bold)
    text = text.replace(/(?<!\*|\w)(\*|_)([^*_\s][^*_]*[^*_\s]|[^*_\s])\1(?!\*|\w)/g, '<span class="sh-italic">$1$2$1</span>')

    // Strikethrough: ~~text~~
    text = text.replace(/(~~)([^~]+)\1/g, '<span class="sh-strikethrough">$1$2$1</span>')

    // Images: ![alt](url) - must come before links
    text = text.replace(/(!\[)([^\]]*)(\]\()([^)]+)(\))/g,
      '<span class="sh-image">$1$2$3$4$5</span>')

    // Links: [text](url) - after images to avoid double-matching
    text = text.replace(/(\[)([^\]]+)(\]\()([^)]+)(\))/g,
      '<span class="sh-link">$1$2$3$4$5</span>')

    // Highlight: ==text==
    text = text.replace(/(==)([^=]+)\1/g, '<span class="sh-highlight">$1$2$1</span>')

    return text
  }

  // Escape HTML special characters
  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  // Enable or disable syntax highlighting
  setEnabled(enabled) {
    this.enabledValue = enabled

    if (this.hasTextareaTarget) {
      this.textareaTarget.classList.toggle("syntax-highlight-enabled", enabled)
    }

    if (enabled) {
      this.scheduleUpdate()
    } else if (this.hasHighlightTarget) {
      this.highlightTarget.innerHTML = ""
    }
  }
}
