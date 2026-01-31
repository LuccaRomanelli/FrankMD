import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dialog", "input", "status"]

  connect() {
    this.textareaRef = null
  }

  open(textarea) {
    this.textareaRef = textarea
    this.inputTarget.value = ""
    this.statusTarget.textContent = window.t("dialogs.jump_to_line.hint")
    this.dialogTarget.showModal()
    this.inputTarget.focus()
  }

  close() {
    this.dialogTarget.close()

    if (this.textareaRef) {
      requestAnimationFrame(() => {
        this.textareaRef.focus()
      })
    }
  }

  onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault()
      this.close()
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      this.jump()
    }
  }

  jump() {
    if (!this.textareaRef) return

    const rawValue = this.inputTarget.value.trim()
    if (!rawValue) return

    const totalLines = this.getTotalLines()
    const currentLine = this.getCurrentLine()
    const isRelative = rawValue.startsWith("+") || rawValue.startsWith("-")

    let targetLine
    if (isRelative) {
      const delta = Number.parseInt(rawValue, 10)
      if (Number.isNaN(delta)) return

      if (rawValue === "-1") {
        targetLine = totalLines
      } else {
        targetLine = currentLine + delta
      }
    } else {
      const absoluteLine = Number.parseInt(rawValue, 10)
      if (Number.isNaN(absoluteLine)) return
      targetLine = absoluteLine
    }

    targetLine = Math.max(1, Math.min(totalLines, targetLine))

    this.close()
    this.dispatch("jump", { detail: { lineNumber: targetLine } })
  }

  getCurrentLine() {
    const textBeforeCursor = this.textareaRef.value.substring(0, this.textareaRef.selectionStart)
    return textBeforeCursor.split("\n").length
  }

  getTotalLines() {
    return this.textareaRef.value.split("\n").length
  }
}
