// tooltipManager.js
export class TooltipManager {
  constructor(options = {}) {
    this.tooltip = null
    this.options = {
      position: 'top', // Can be 'top', 'bottom', 'left', 'right'
      offset: 8, // Distance from target element in pixels
      className: 'disabled-button-tooltip',
      ...options,
    }
    this.initialize()
  }

  initialize() {
    // Only create the tooltip once
    if (!document.getElementById('disabled-button-tooltip')) {
      // Create tooltip element once and add it to the document body
      this.tooltip = document.createElement('div')
      this.tooltip.id = 'disabled-button-tooltip'
      this.tooltip.className = this.options.className

      // Create content container
      const content = document.createElement('div')
      content.className = `${this.options.className}-content`
      this.tooltip.appendChild(content)

      // Add to body and hide initially
      document.body.appendChild(this.tooltip)

      // Handle window resize
      window.addEventListener('resize', () => {
        if (this.activeElement) {
          this.updatePosition(this.activeElement)
        }
      })

      // Handle scroll events
      window.addEventListener(
        'scroll',
        () => {
          if (this.activeElement) {
            this.updatePosition(this.activeElement)
          }
        },
        true
      ) // Use capture to get all scroll events
    } else {
      // If tooltip already exists, just get a reference to it
      this.tooltip = document.getElementById('disabled-button-tooltip')
    }
  }

  updatePosition(element) {
    const rect = element.getBoundingClientRect()
    const tooltipRect = this.tooltip.getBoundingClientRect()

    // Default position data
    let top, left

    // Position based on specified option
    switch (this.options.position) {
      case 'top':
        top = rect.top - tooltipRect.height - this.options.offset
        left = rect.left + (rect.width - tooltipRect.width) / 2
        this.tooltip.setAttribute('data-position', 'top')
        break

      case 'bottom':
        top = rect.bottom + this.options.offset
        left = rect.left + (rect.width - tooltipRect.width) / 2
        this.tooltip.setAttribute('data-position', 'bottom')
        break

      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2
        left = rect.left - tooltipRect.width - this.options.offset
        this.tooltip.setAttribute('data-position', 'left')
        break

      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2
        left = rect.right + this.options.offset
        this.tooltip.setAttribute('data-position', 'right')
        break

      default:
        top = rect.top - tooltipRect.height - this.options.offset
        left = rect.left + (rect.width - tooltipRect.width) / 2
        this.tooltip.setAttribute('data-position', 'top')
    }

    // Boundary checking to keep tooltip within viewport
    if (left < 0) left = 0
    if (top < 0) top = 0
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = window.innerHeight - tooltipRect.height
    }

    // Set position
    this.tooltip.style.top = `${top}px`
    this.tooltip.style.left = `${left}px`
  }

  show(message, element) {
    // Set content
    this.tooltip.querySelector(
      `.${this.options.className}-content`
    ).textContent = message

    // Save reference to active element for repositioning
    this.activeElement = element

    // Show tooltip
    this.tooltip.style.display = 'block'

    // Position tooltip
    this.updatePosition(element)
  }

  hide() {
    this.tooltip.style.display = 'none'
    this.activeElement = null
  }

  attachToElement(element, message, position) {
    // Allow overriding position on per-element basis
    const originalPosition = this.options.position

    element.addEventListener('mouseenter', () => {
      if (position) this.options.position = position
      this.show(message, element)
    })

    element.addEventListener('mouseleave', () => {
      this.hide()
      // Restore original position setting
      if (position) this.options.position = originalPosition
    })
  }

  // Method to change position setting globally
  setPosition(position) {
    this.options.position = position
    return this
  }

  // Method to change offset globally
  setOffset(offset) {
    this.options.offset = offset
    return this
  }
}

// Create a single instance
let instance = null
export function getTooltipManager(options) {
  if (!instance) {
    instance = new TooltipManager(options)
  } else if (options) {
    // Update options of existing instance
    instance.options = { ...instance.options, ...options }
  }
  return instance
}
