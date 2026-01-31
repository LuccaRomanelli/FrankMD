/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import JumpToLineController from "../../../app/javascript/controllers/jump_to_line_controller.js"

describe("JumpToLineController", () => {
  let application, controller, element

  beforeEach(() => {
    window.t = vi.fn((key) => key)

    document.body.innerHTML = `
      <div data-controller="jump-to-line">
        <dialog data-jump-to-line-target="dialog"></dialog>
        <input data-jump-to-line-target="input" type="text" />
        <div data-jump-to-line-target="status"></div>
      </div>
    `

    HTMLDialogElement.prototype.showModal = vi.fn(function () {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function () {
      this.open = false
    })

    element = document.querySelector('[data-controller="jump-to-line"]')
    application = Application.start()
    application.register("jump-to-line", JumpToLineController)

    return new Promise((resolve) => {
      setTimeout(() => {
        controller = application.getControllerForElementAndIdentifier(element, "jump-to-line")
        resolve()
      }, 0)
    })
  })

  afterEach(() => {
    application.stop()
    vi.restoreAllMocks()
  })

  const buildTextarea = () => {
    const textarea = document.createElement("textarea")
    textarea.value = "one\ntwo\nthree\nfour\nfive"
    textarea.selectionStart = textarea.value.indexOf("two")
    textarea.selectionEnd = textarea.selectionStart
    return textarea
  }

  it("treats plain number as absolute line", () => {
    const textarea = buildTextarea()
    controller.open(textarea)
    controller.inputTarget.value = "4"

    const dispatchSpy = vi.spyOn(controller, "dispatch")
    controller.jump()

    expect(dispatchSpy).toHaveBeenCalledWith("jump", { detail: { lineNumber: 4 } })
  })

  it("treats +N as relative forward", () => {
    const textarea = buildTextarea()
    controller.open(textarea)
    controller.inputTarget.value = "+2"

    const dispatchSpy = vi.spyOn(controller, "dispatch")
    controller.jump()

    expect(dispatchSpy).toHaveBeenCalledWith("jump", { detail: { lineNumber: 4 } })
  })

  it("treats -N as relative backward", () => {
    const textarea = buildTextarea()
    controller.open(textarea)
    controller.inputTarget.value = "-2"

    const dispatchSpy = vi.spyOn(controller, "dispatch")
    controller.jump()

    expect(dispatchSpy).toHaveBeenCalledWith("jump", { detail: { lineNumber: 1 } })
  })

  it("treats -1 as end of file", () => {
    const textarea = buildTextarea()
    controller.open(textarea)
    controller.inputTarget.value = "-1"

    const dispatchSpy = vi.spyOn(controller, "dispatch")
    controller.jump()

    expect(dispatchSpy).toHaveBeenCalledWith("jump", { detail: { lineNumber: 5 } })
  })

  it("clamps absolute lines within bounds", () => {
    const textarea = buildTextarea()
    controller.open(textarea)
    controller.inputTarget.value = "100"

    const dispatchSpy = vi.spyOn(controller, "dispatch")
    controller.jump()

    expect(dispatchSpy).toHaveBeenCalledWith("jump", { detail: { lineNumber: 5 } })
  })
})
