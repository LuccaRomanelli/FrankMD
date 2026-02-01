/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  LINE_NUMBER_MODES,
  normalizeLineNumberMode,
  nextLineNumberMode,
  buildRelativeLineLabels,
  buildAbsoluteLineLabels
} from "../../../app/javascript/lib/line_numbers.js"

describe("line_numbers", () => {
  it("normalizes line number mode", () => {
    expect(normalizeLineNumberMode(undefined, LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.OFF)
    expect(normalizeLineNumberMode("1", LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
    expect(normalizeLineNumberMode(2, LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.RELATIVE)
  })

  it("cycles line number modes", () => {
    expect(nextLineNumberMode(LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
    expect(nextLineNumberMode(LINE_NUMBER_MODES.ABSOLUTE)).toBe(LINE_NUMBER_MODES.RELATIVE)
    expect(nextLineNumberMode(LINE_NUMBER_MODES.RELATIVE)).toBe(LINE_NUMBER_MODES.OFF)
  })

  it("builds absolute line labels with wrapped gaps", () => {
    expect(buildAbsoluteLineLabels([1, 3, 1])).toEqual(["1", "2", "", "", "3"])
  })

  it("builds relative line labels", () => {
    // 5 logical lines, each with 1 visual line, cursor at logical line 2
    expect(buildRelativeLineLabels([1, 1, 1, 1, 1], 2)).toEqual(["-2", "-1", "0", "1", "2"])
  })

  it("builds relative line labels with wrapped gaps", () => {
    // 3 logical lines: line 1 has 1 visual, line 2 has 3 visuals (wrapped), line 3 has 1 visual
    // Cursor at logical line 1
    expect(buildRelativeLineLabels([1, 3, 1], 1)).toEqual(["-1", "0", "", "", "1"])
  })

  it("clamps cursor index", () => {
    // 2 logical lines, cursor at logical line 10 (clamped to 1)
    expect(buildRelativeLineLabels([1, 1], 10)).toEqual(["-1", "0"])
  })
})
