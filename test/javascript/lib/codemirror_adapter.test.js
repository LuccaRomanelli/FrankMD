import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createTextareaAdapter,
  getEditorContent,
  getEditorSelection,
  getCursorPosition,
  getCursorInfo
} from "lib/codemirror_adapter"

describe("codemirror_adapter", () => {
  describe("createTextareaAdapter", () => {
    it("returns null when controller is null", () => {
      expect(createTextareaAdapter(null)).toBeNull()
    })

    it("returns null when controller is undefined", () => {
      expect(createTextareaAdapter(undefined)).toBeNull()
    })

    it("creates adapter with value getter", () => {
      const mockController = {
        getValue: vi.fn().mockReturnValue("test content")
      }

      const adapter = createTextareaAdapter(mockController)
      expect(adapter.value).toBe("test content")
      expect(mockController.getValue).toHaveBeenCalled()
    })

    it("creates adapter with value setter", () => {
      const mockController = {
        getValue: vi.fn(),
        setValue: vi.fn()
      }

      const adapter = createTextareaAdapter(mockController)
      adapter.value = "new content"
      expect(mockController.setValue).toHaveBeenCalledWith("new content")
    })

    it("creates adapter with selectionStart getter", () => {
      const mockController = {
        getValue: vi.fn(),
        getSelection: vi.fn().mockReturnValue({ from: 5, to: 10, text: "hello" })
      }

      const adapter = createTextareaAdapter(mockController)
      expect(adapter.selectionStart).toBe(5)
    })

    it("creates adapter with selectionEnd getter", () => {
      const mockController = {
        getValue: vi.fn(),
        getSelection: vi.fn().mockReturnValue({ from: 5, to: 10, text: "hello" })
      }

      const adapter = createTextareaAdapter(mockController)
      expect(adapter.selectionEnd).toBe(10)
    })

    it("creates adapter with setSelectionRange method", () => {
      const mockController = {
        getValue: vi.fn(),
        setSelection: vi.fn()
      }

      const adapter = createTextareaAdapter(mockController)
      adapter.setSelectionRange(3, 7)
      expect(mockController.setSelection).toHaveBeenCalledWith(3, 7)
    })

    it("creates adapter with focus method", () => {
      const mockController = {
        getValue: vi.fn(),
        focus: vi.fn()
      }

      const adapter = createTextareaAdapter(mockController)
      adapter.focus()
      expect(mockController.focus).toHaveBeenCalled()
    })

    it("handles addEventListener for input events", () => {
      const mockController = { getValue: vi.fn() }
      const adapter = createTextareaAdapter(mockController)
      const handler = vi.fn()

      adapter.addEventListener("input", handler)
      expect(adapter._inputHandler).toBe(handler)
    })

    it("handles removeEventListener for input events", () => {
      const mockController = { getValue: vi.fn() }
      const adapter = createTextareaAdapter(mockController)
      const handler = vi.fn()

      adapter.addEventListener("input", handler)
      adapter.removeEventListener("input", handler)
      expect(adapter._inputHandler).toBeNull()
    })

    it("dispatches input events to handler", () => {
      const mockController = { getValue: vi.fn() }
      const adapter = createTextareaAdapter(mockController)
      const handler = vi.fn()

      adapter.addEventListener("input", handler)
      const event = { type: "input" }
      adapter.dispatchEvent(event)

      expect(handler).toHaveBeenCalledWith(event)
    })

    it("ignores dispatch when no handler set", () => {
      const mockController = { getValue: vi.fn() }
      const adapter = createTextareaAdapter(mockController)

      // Should not throw
      adapter.dispatchEvent({ type: "input" })
    })
  })

  describe("getEditorContent", () => {
    it("returns content from controller when available", () => {
      const mockController = {
        getValue: vi.fn().mockReturnValue("controller content")
      }

      expect(getEditorContent(mockController)).toBe("controller content")
    })

    it("returns content from fallback textarea when controller is null", () => {
      const textarea = { value: "textarea content" }
      expect(getEditorContent(null, textarea)).toBe("textarea content")
    })

    it("returns empty string when both are null", () => {
      expect(getEditorContent(null, null)).toBe("")
    })

    it("prefers controller over fallback", () => {
      const mockController = {
        getValue: vi.fn().mockReturnValue("controller content")
      }
      const textarea = { value: "textarea content" }

      expect(getEditorContent(mockController, textarea)).toBe("controller content")
    })
  })

  describe("getEditorSelection", () => {
    it("returns selection from controller", () => {
      const mockController = {
        getSelection: vi.fn().mockReturnValue({ from: 10, to: 20, text: "selected" })
      }

      expect(getEditorSelection(mockController)).toEqual({
        from: 10,
        to: 20,
        text: "selected"
      })
    })

    it("returns default selection when controller is null", () => {
      expect(getEditorSelection(null)).toEqual({ from: 0, to: 0, text: "" })
    })
  })

  describe("getCursorPosition", () => {
    it("returns position from controller", () => {
      const mockController = {
        getCursorPosition: vi.fn().mockReturnValue({ line: 5, column: 10, offset: 45 })
      }

      expect(getCursorPosition(mockController)).toEqual({
        line: 5,
        column: 10,
        offset: 45
      })
    })

    it("returns default position when controller is null", () => {
      expect(getCursorPosition(null)).toEqual({ line: 1, column: 1, offset: 0 })
    })
  })

  describe("getCursorInfo", () => {
    it("returns cursor info from controller", () => {
      const mockController = {
        getCursorInfo: vi.fn().mockReturnValue({ currentLine: 7, totalLines: 100 })
      }

      expect(getCursorInfo(mockController)).toEqual({
        currentLine: 7,
        totalLines: 100
      })
    })

    it("returns default info when controller is null", () => {
      expect(getCursorInfo(null)).toEqual({ currentLine: 1, totalLines: 1 })
    })
  })
})
