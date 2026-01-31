/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import SyntaxHighlightController from "../../../app/javascript/controllers/syntax_highlight_controller.js"

describe("SyntaxHighlightController", () => {
  let application, controller, element

  beforeEach(() => {
    // Create a fresh DOM for each test
    document.body.innerHTML = `
      <div class="editor-highlight-wrapper" data-controller="syntax-highlight">
        <pre data-syntax-highlight-target="highlight" class="syntax-highlight-layer"></pre>
        <textarea data-syntax-highlight-target="textarea"
                  class="editor-textarea syntax-highlight-enabled"
                  style="font-size: 14px; line-height: 21px; padding: 16px;">
        </textarea>
      </div>
    `

    // Mock requestAnimationFrame to execute immediately
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(function (cb) {
      cb()
      return 1
    })
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(function () {})

    // Mock ResizeObserver
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    element = document.querySelector('[data-controller="syntax-highlight"]')
    application = Application.start()
    application.register("syntax-highlight", SyntaxHighlightController)

    return new Promise((resolve) => {
      setTimeout(() => {
        controller = application.getControllerForElementAndIdentifier(element, "syntax-highlight")
        resolve()
      }, 0)
    })
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  describe("connect()", () => {
    it("initializes with enabled by default", () => {
      expect(controller.enabledValue).toBe(true)
    })

    it("sets up the highlight layer", () => {
      expect(controller.hasHighlightTarget).toBe(true)
      expect(controller.hasTextareaTarget).toBe(true)
    })
  })

  describe("highlight()", () => {
    describe("headings", () => {
      it("highlights h1 headings", () => {
        const result = controller.highlight("# Hello World")
        expect(result).toContain('class="sh-heading sh-h1"')
        expect(result).toContain("# Hello World")
      })

      it("highlights h2 headings", () => {
        const result = controller.highlight("## Section")
        expect(result).toContain('class="sh-heading sh-h2"')
      })

      it("highlights h3 headings", () => {
        const result = controller.highlight("### Subsection")
        expect(result).toContain('class="sh-heading sh-h3"')
      })

      it("highlights h4 through h6 headings", () => {
        expect(controller.highlight("#### H4")).toContain("sh-h4")
        expect(controller.highlight("##### H5")).toContain("sh-h5")
        expect(controller.highlight("###### H6")).toContain("sh-h6")
      })

      it("does not highlight text without space after #", () => {
        const result = controller.highlight("#NoSpace")
        expect(result).not.toContain("sh-heading")
      })
    })

    describe("bold text", () => {
      it("highlights **bold** text", () => {
        const result = controller.highlight("Some **bold** text")
        expect(result).toContain('class="sh-bold"')
        expect(result).toContain("**bold**")
      })

      it("highlights __bold__ text", () => {
        const result = controller.highlight("Some __bold__ text")
        expect(result).toContain('class="sh-bold"')
      })
    })

    describe("italic text", () => {
      it("highlights *italic* text", () => {
        const result = controller.highlight("Some *italic* text")
        expect(result).toContain('class="sh-italic"')
      })

      it("highlights _italic_ text", () => {
        const result = controller.highlight("Some _italic_ text")
        expect(result).toContain('class="sh-italic"')
      })
    })

    describe("inline code", () => {
      it("highlights `inline code`", () => {
        const result = controller.highlight("Use `const x = 1` here")
        expect(result).toContain('class="sh-code"')
        expect(result).toContain("`const x = 1`")
      })
    })

    describe("code blocks", () => {
      it("highlights fenced code blocks", () => {
        const code = "```javascript\nconst x = 1;\n```"
        const result = controller.highlight(code)
        expect(result).toContain('class="sh-code"')
      })

      it("preserves code content without further highlighting", () => {
        const code = "```\n# Not a heading\n**not bold**\n```"
        const result = controller.highlight(code)
        // Should only have one sh-code class for the whole block
        expect(result.match(/sh-code/g).length).toBe(1)
      })
    })

    describe("links", () => {
      it("highlights markdown links", () => {
        const result = controller.highlight("Check [this link](https://example.com)")
        expect(result).toContain('class="sh-link"')
      })
    })

    describe("images", () => {
      it("highlights markdown images", () => {
        const result = controller.highlight("![alt text](image.png)")
        expect(result).toContain('class="sh-image"')
      })
    })

    describe("list markers", () => {
      it("highlights - list markers", () => {
        const result = controller.highlight("- Item 1")
        expect(result).toContain('class="sh-list-marker"')
        expect(result).toContain("-</span>")
      })

      it("highlights * list markers", () => {
        const result = controller.highlight("* Item 1")
        expect(result).toContain('class="sh-list-marker"')
      })

      it("highlights + list markers", () => {
        const result = controller.highlight("+ Item 1")
        expect(result).toContain('class="sh-list-marker"')
      })

      it("highlights numbered list markers", () => {
        const result = controller.highlight("1. First item")
        expect(result).toContain('class="sh-list-marker"')
        expect(result).toContain("1.</span>")
      })

      it("highlights indented list markers", () => {
        const result = controller.highlight("  - Nested item")
        expect(result).toContain('class="sh-list-marker"')
      })
    })

    describe("blockquotes", () => {
      it("highlights blockquotes", () => {
        const result = controller.highlight("> This is a quote")
        expect(result).toContain('class="sh-blockquote"')
      })
    })

    describe("strikethrough", () => {
      it("highlights ~~strikethrough~~ text", () => {
        const result = controller.highlight("This is ~~deleted~~ text")
        expect(result).toContain('class="sh-strikethrough"')
      })
    })

    describe("highlight markers", () => {
      it("highlights ==highlighted== text", () => {
        const result = controller.highlight("This is ==important== text")
        expect(result).toContain('class="sh-highlight"')
      })
    })

    describe("horizontal rules", () => {
      it("highlights --- horizontal rules", () => {
        const result = controller.highlight("---")
        expect(result).toContain('class="sh-hr"')
      })

      it("highlights *** horizontal rules", () => {
        const result = controller.highlight("***")
        expect(result).toContain('class="sh-hr"')
      })

      it("highlights ___ horizontal rules", () => {
        const result = controller.highlight("___")
        expect(result).toContain('class="sh-hr"')
      })
    })

    describe("HTML escaping", () => {
      it("escapes HTML in content", () => {
        const result = controller.highlight("<script>alert('xss')</script>")
        expect(result).toContain("&lt;script&gt;")
        expect(result).not.toContain("<script>")
      })

      it("escapes HTML in headings", () => {
        const result = controller.highlight("# <div>Heading</div>")
        expect(result).toContain("&lt;div&gt;")
      })
    })

    describe("empty content", () => {
      it("returns empty string for empty input", () => {
        expect(controller.highlight("")).toBe("")
      })

      it("returns empty string for null-ish input", () => {
        expect(controller.highlight(null)).toBe("")
        expect(controller.highlight(undefined)).toBe("")
      })
    })
  })

  describe("update()", () => {
    it("updates highlight layer with highlighted content", () => {
      controller.textareaTarget.value = "# Hello"
      controller.update()

      expect(controller.highlightTarget.innerHTML).toContain("sh-heading")
    })

    it("adds trailing newline to match textarea behavior", () => {
      controller.textareaTarget.value = "text"
      controller.update()

      expect(controller.highlightTarget.innerHTML.endsWith("\n")).toBe(true)
    })
  })

  describe("syncScroll()", () => {
    it("syncs scroll position to highlight layer", () => {
      controller.textareaTarget.scrollTop = 100
      controller.textareaTarget.scrollLeft = 50

      controller.syncScroll()

      expect(controller.highlightTarget.style.transform).toBe("translate(-50px, -100px)")
    })
  })

  describe("scheduleUpdate()", () => {
    it("calls update on next animation frame", () => {
      const updateSpy = vi.spyOn(controller, "update")

      controller.scheduleUpdate()

      expect(updateSpy).toHaveBeenCalled()
    })

    it("does nothing when disabled", () => {
      controller.enabledValue = false
      const updateSpy = vi.spyOn(controller, "update")

      controller.scheduleUpdate()

      expect(updateSpy).not.toHaveBeenCalled()
    })
  })

  describe("setEnabled()", () => {
    it("enables syntax highlighting", () => {
      controller.setEnabled(true)

      expect(controller.enabledValue).toBe(true)
      expect(controller.textareaTarget.classList.contains("syntax-highlight-enabled")).toBe(true)
    })

    it("disables syntax highlighting and clears highlight layer", () => {
      controller.highlightTarget.innerHTML = "some content"

      controller.setEnabled(false)

      expect(controller.enabledValue).toBe(false)
      expect(controller.textareaTarget.classList.contains("syntax-highlight-enabled")).toBe(false)
      expect(controller.highlightTarget.innerHTML).toBe("")
    })
  })

  describe("complex markdown", () => {
    it("handles multiple patterns on one line", () => {
      const result = controller.highlight("- **Bold** and *italic* in list")
      expect(result).toContain("sh-list-marker")
      expect(result).toContain("sh-bold")
      expect(result).toContain("sh-italic")
    })

    it("handles multiline content", () => {
      const content = `# Heading

Some **bold** text.

- List item 1
- List item 2

\`\`\`js
code
\`\`\``

      const result = controller.highlight(content)
      expect(result).toContain("sh-heading")
      expect(result).toContain("sh-bold")
      expect(result).toContain("sh-list-marker")
      expect(result).toContain("sh-code")
    })
  })
})
