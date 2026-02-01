// CodeMirror Adapter - Provides textarea-like API for CodeMirror
// Used by find-replace, jump-to-line, and text-format controllers

/**
 * Create an adapter that makes CodeMirror look like a textarea
 * This allows existing controllers to work without modification
 * @param {Object} codemirrorController - The CodeMirror Stimulus controller
 * @returns {Object} - Textarea-compatible adapter
 */
export function createTextareaAdapter(codemirrorController) {
  if (!codemirrorController) return null

  return {
    get value() { return codemirrorController.getValue() },
    set value(text) { codemirrorController.setValue(text) },
    get selectionStart() { return codemirrorController.getSelection().from },
    get selectionEnd() { return codemirrorController.getSelection().to },
    setSelectionRange(from, to) { codemirrorController.setSelection(from, to) },
    focus() { codemirrorController.focus() },
    addEventListener(event, handler) {
      // The find_replace_controller listens for input events
      // We need to handle this via CodeMirror's event system
      if (event === "input") {
        this._inputHandler = handler
      }
    },
    removeEventListener(event, handler) {
      if (event === "input") {
        this._inputHandler = null
      }
    },
    dispatchEvent(event) {
      // Handle synthetic events
      if (event.type === "input" && this._inputHandler) {
        this._inputHandler(event)
      }
    }
  }
}

/**
 * Get editor content with fallback to textarea
 * @param {Object} codemirrorController - CodeMirror controller (may be null)
 * @param {HTMLTextAreaElement} textareaFallback - Fallback textarea element
 * @returns {string} - Editor content
 */
export function getEditorContent(codemirrorController, textareaFallback = null) {
  if (codemirrorController) {
    return codemirrorController.getValue()
  }
  if (textareaFallback) {
    return textareaFallback.value
  }
  return ""
}

/**
 * Get editor selection with fallback
 * @param {Object} codemirrorController - CodeMirror controller (may be null)
 * @returns {Object} - { from, to, text }
 */
export function getEditorSelection(codemirrorController) {
  if (codemirrorController) {
    return codemirrorController.getSelection()
  }
  return { from: 0, to: 0, text: "" }
}

/**
 * Get cursor position with fallback
 * @param {Object} codemirrorController - CodeMirror controller (may be null)
 * @returns {Object} - { line, column, offset }
 */
export function getCursorPosition(codemirrorController) {
  if (codemirrorController) {
    return codemirrorController.getCursorPosition()
  }
  return { line: 1, column: 1, offset: 0 }
}

/**
 * Get cursor info for stats/sync
 * @param {Object} codemirrorController - CodeMirror controller (may be null)
 * @returns {Object} - { currentLine, totalLines }
 */
export function getCursorInfo(codemirrorController) {
  if (codemirrorController) {
    return codemirrorController.getCursorInfo()
  }
  return { currentLine: 1, totalLines: 1 }
}
