import { Controller } from "@hotwired/stimulus"

// Help Controller
// Manages help and about dialogs with tabbed content

export default class extends Controller {
  static targets = [
    "helpDialog",
    "aboutDialog",
    "tabMarkdown",
    "tabShortcuts",
    "panelMarkdown",
    "panelShortcuts"
  ]

  connect() {
    // Setup click-outside-to-close for dialogs
    this.setupDialogClickOutside()
    this.currentTab = "markdown"
  }

  setupDialogClickOutside() {
    const dialogs = [this.helpDialogTarget, this.aboutDialogTarget].filter(d => d)

    dialogs.forEach(dialog => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          dialog.close()
        }
      })
    })
  }

  // Open help dialog
  openHelp() {
    if (this.hasHelpDialogTarget) {
      this.currentTab = "markdown"
      this.updateTabStyles()
      this.helpDialogTarget.showModal()
    }
  }

  // Switch tab from click event
  switchTab(event) {
    const tab = event.currentTarget.dataset.tab
    this.switchToTab(tab)
  }

  // Internal method to switch tabs by name
  switchToTab(tab) {
    this.currentTab = tab
    this.updateTabStyles()
  }

  // Update tab button and panel visibility
  updateTabStyles() {
    const activeClasses = "bg-[var(--theme-accent)] text-[var(--theme-accent-text)]"
    const inactiveClasses = "hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-muted)]"

    if (this.hasTabMarkdownTarget && this.hasTabShortcutsTarget) {
      // Update tab buttons
      if (this.currentTab === "markdown") {
        this.tabMarkdownTarget.className = `px-3 py-1 text-sm rounded-md ${activeClasses}`
        this.tabShortcutsTarget.className = `px-3 py-1 text-sm rounded-md ${inactiveClasses}`
      } else {
        this.tabMarkdownTarget.className = `px-3 py-1 text-sm rounded-md ${inactiveClasses}`
        this.tabShortcutsTarget.className = `px-3 py-1 text-sm rounded-md ${activeClasses}`
      }
    }

    // Update panels
    if (this.hasPanelMarkdownTarget) {
      this.panelMarkdownTarget.classList.toggle("hidden", this.currentTab !== "markdown")
    }
    if (this.hasPanelShortcutsTarget) {
      this.panelShortcutsTarget.classList.toggle("hidden", this.currentTab !== "shortcuts")
    }
  }

  // Get ordered list of tab names
  getTabOrder() {
    return ["markdown", "shortcuts"]
  }

  // Handle arrow key navigation on tab buttons
  onTabKeydown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return

    event.preventDefault()
    const tabs = this.getTabOrder()
    const currentIndex = tabs.indexOf(this.currentTab)

    let newIndex
    if (event.key === "ArrowRight") {
      newIndex = (currentIndex + 1) % tabs.length
    } else {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length
    }

    this.switchToTab(tabs[newIndex])
    this.focusTab(tabs[newIndex])
  }

  // Focus the tab button for a given tab name
  focusTab(tabName) {
    if (tabName === "markdown" && this.hasTabMarkdownTarget) {
      this.tabMarkdownTarget.focus()
    } else if (tabName === "shortcuts" && this.hasTabShortcutsTarget) {
      this.tabShortcutsTarget.focus()
    }
  }

  // Handle mouse wheel on tab bar to switch tabs
  onTabWheel(event) {
    event.preventDefault()
    const tabs = this.getTabOrder()
    const currentIndex = tabs.indexOf(this.currentTab)

    let newIndex
    if (event.deltaY > 0 || event.deltaX > 0) {
      // Scroll down/right -> next tab
      newIndex = (currentIndex + 1) % tabs.length
    } else {
      // Scroll up/left -> previous tab
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length
    }

    this.switchToTab(tabs[newIndex])
  }

  // Close help dialog
  closeHelp() {
    if (this.hasHelpDialogTarget) {
      this.helpDialogTarget.close()
    }
  }

  // Open about dialog
  openAbout() {
    if (this.hasAboutDialogTarget) {
      this.aboutDialogTarget.showModal()
    }
  }

  // Close about dialog
  closeAbout() {
    if (this.hasAboutDialogTarget) {
      this.aboutDialogTarget.close()
    }
  }

  // Handle escape key for closing dialogs
  onKeydown(event) {
    if (event.key === "Escape") {
      if (this.hasHelpDialogTarget && this.helpDialogTarget.open) {
        this.helpDialogTarget.close()
      }
      if (this.hasAboutDialogTarget && this.aboutDialogTarget.open) {
        this.aboutDialogTarget.close()
      }
    }
  }
}
