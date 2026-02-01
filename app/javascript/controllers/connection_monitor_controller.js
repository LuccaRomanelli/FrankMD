import { Controller } from "@hotwired/stimulus"

// Connection Monitor Controller
// Monitors server connectivity and prevents editing when offline to avoid data loss
// Polls /up endpoint every 5 seconds, shows warning banner and disables editor when offline

export default class extends Controller {
  static targets = ["banner", "textarea"]

  static values = {
    interval: { type: Number, default: 5000 },
    timeout: { type: Number, default: 3000 }
  }

  connect() {
    this.isOnline = true
    this.checkInProgress = false

    // Start monitoring
    this.startMonitoring()

    // Also listen for browser online/offline events as early warning
    this.boundOnline = () => this.checkConnection()
    this.boundOffline = () => this.handleOffline()
    window.addEventListener("online", this.boundOnline)
    window.addEventListener("offline", this.boundOffline)
  }

  disconnect() {
    this.stopMonitoring()
    window.removeEventListener("online", this.boundOnline)
    window.removeEventListener("offline", this.boundOffline)
  }

  startMonitoring() {
    // Initial check
    this.checkConnection()

    // Periodic checks
    this.monitorInterval = setInterval(() => {
      this.checkConnection()
    }, this.intervalValue)
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
  }

  async checkConnection() {
    // Avoid overlapping checks
    if (this.checkInProgress) return
    this.checkInProgress = true

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutValue)

      const response = await fetch("/up", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        this.handleOnline()
      } else {
        this.handleOffline()
      }
    } catch (error) {
      // Network error or timeout
      if (this.isOnline) {
        console.warn("[FrankMD] Connection to server lost. Disabling editor to prevent data loss.")
      }
      this.handleOffline()
    } finally {
      this.checkInProgress = false
    }
  }

  handleOnline() {
    if (this.isOnline) return // Already online

    console.info("[FrankMD] Connection restored. Editor re-enabled.")
    this.isOnline = true
    this.hideBanner()
    this.enableEditor()
    this.dispatch("online")
  }

  handleOffline() {
    if (!this.isOnline) return // Already offline

    this.isOnline = false
    this.showBanner()
    this.disableEditor()
    this.dispatch("offline")
  }

  showBanner() {
    if (this.hasBannerTarget) {
      this.bannerTarget.classList.remove("hidden")
    }
  }

  hideBanner() {
    if (this.hasBannerTarget) {
      this.bannerTarget.classList.add("hidden")
    }
  }

  disableEditor() {
    if (this.hasTextareaTarget) {
      this.textareaTarget.dataset.wasDisabled = this.textareaTarget.disabled
      this.textareaTarget.disabled = true
    }
  }

  enableEditor() {
    if (this.hasTextareaTarget) {
      // Only re-enable if it wasn't already disabled before we disabled it
      if (this.textareaTarget.dataset.wasDisabled !== "true") {
        this.textareaTarget.disabled = false
      }
      delete this.textareaTarget.dataset.wasDisabled
    }
  }

  // Manual retry button
  retry() {
    this.checkConnection()
  }
}
