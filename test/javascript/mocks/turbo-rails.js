// Mock for @hotwired/turbo-rails used in vitest
export const Turbo = {
  renderStreamMessage(html) {
    // In tests, parse and apply turbo stream updates to the DOM
    const template = document.createElement("template")
    template.innerHTML = html
    const streamElements = template.content.querySelectorAll("turbo-stream")
    for (const stream of streamElements) {
      const action = stream.getAttribute("action")
      const target = stream.getAttribute("target")
      const targetEl = document.getElementById(target)
      if (targetEl && action === "update") {
        targetEl.innerHTML = stream.querySelector("template")?.innerHTML || ""
      }
    }
  }
}
