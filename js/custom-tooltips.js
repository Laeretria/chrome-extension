// custom-tooltips.js - Modified version without inline styles
// This can be saved as a separate file

export function createCustomTooltip(element, tooltipInfo, tooltipType) {
  console.log(
    'Creating custom tooltip:',
    tooltipType,
    'for element:',
    element.textContent.trim()
  )

  // Create the tooltip icon
  const tooltipIcon = document.createElement('button')
  tooltipIcon.type = 'button'
  tooltipIcon.className = 'custom-tooltip-icon'

  // Add the tooltip type as a class instead of inline styles
  tooltipIcon.classList.add(`custom-tooltip-icon-${tooltipType}`)

  tooltipIcon.setAttribute('aria-label', 'More information')
  tooltipIcon.textContent = '?'

  // Store the tooltip type as a data attribute
  tooltipIcon.setAttribute('data-tooltip-type', tooltipType)

  // Position it after the element
  element.insertAdjacentElement('afterend', tooltipIcon)

  // Create a wrapper for the tooltip that will be appended to body
  const tooltipWrapper = document.createElement('div')
  tooltipWrapper.className = 'custom-tooltip-wrapper'

  // Add the tooltip type as a class to the wrapper
  tooltipWrapper.classList.add(`custom-tooltip-wrapper-${tooltipType}`)

  // Create the tooltip content container
  const tooltipContent = document.createElement('div')
  tooltipContent.className = 'custom-tooltip-content'

  // Add the tooltip type as a class to the content
  tooltipContent.classList.add(`custom-tooltip-content-${tooltipType}`)

  tooltipContent.textContent = tooltipInfo.text

  // Add "Learn more" link if provided
  if (tooltipInfo.link) {
    const learnMoreDiv = document.createElement('div')
    learnMoreDiv.className = 'learn-more'

    const link = document.createElement('a')
    link.href = tooltipInfo.link
    link.textContent = 'Leer meer'
    link.target = '_blank'

    learnMoreDiv.appendChild(link)
    tooltipContent.appendChild(learnMoreDiv)
  }

  // Add tooltip content to wrapper, and wrapper to body
  tooltipWrapper.appendChild(tooltipContent)
  document.body.appendChild(tooltipWrapper)

  // Add data attribute to link icon and wrapper
  const tooltipId = 'custom-tooltip-' + tooltipType + '-' + Date.now()
  tooltipIcon.setAttribute('data-tooltip-id', tooltipId)
  tooltipWrapper.setAttribute('data-tooltip-id', tooltipId)

  // Function to position the tooltip - UPDATED FOR LEFT SIDE DEFAULT
  function positionTooltip() {
    const rect = tooltipIcon.getBoundingClientRect()

    // For URL and canonical tooltips, position to the LEFT by default
    tooltipWrapper.style.top = rect.top - 10 + 'px'
    tooltipWrapper.style.left = 'auto' // Clear left position
    tooltipWrapper.style.right = window.innerWidth - rect.left + 10 + 'px'

    // Add arrow-right class by default for URL and canonical tooltips (arrow points right)
    tooltipContent.classList.add('arrow-right')

    // Check if tooltip would extend beyond LEFT edge of viewport
    const tooltipRect = tooltipContent.getBoundingClientRect()
    if (tooltipRect.left < 10) {
      // Position to the RIGHT of the icon if it would overflow on the left
      tooltipWrapper.style.left = rect.right + 10 + 'px'
      tooltipWrapper.style.right = 'auto'

      // Remove class to flip the arrow (arrow points left)
      tooltipContent.classList.remove('arrow-right')
    }
  }

  // Variables for hover management
  let hideTimeout
  let isHoveringIcon = false
  let isHoveringTooltip = false

  function showTooltip() {
    clearTimeout(hideTimeout)
    positionTooltip()
    tooltipWrapper.classList.add('active')
  }

  function hideTooltip() {
    // Only hide if neither the icon nor the tooltip is being hovered
    if (!isHoveringIcon && !isHoveringTooltip) {
      hideTimeout = setTimeout(() => {
        tooltipWrapper.classList.remove('active')
      }, 100)
    }
  }

  // Mouse events for icon
  tooltipIcon.addEventListener('mouseenter', function () {
    isHoveringIcon = true
    showTooltip()
  })

  tooltipIcon.addEventListener('mouseleave', function () {
    isHoveringIcon = false
    hideTooltip()
  })

  // Mouse events for tooltip content
  tooltipWrapper.addEventListener('mouseenter', function () {
    isHoveringTooltip = true
    showTooltip()
  })

  tooltipWrapper.addEventListener('mouseleave', function () {
    isHoveringTooltip = false
    hideTooltip()
  })

  // Add click event for mobile devices
  tooltipIcon.addEventListener('click', function (e) {
    e.preventDefault()
    e.stopPropagation()

    // If the tooltip is already active, we want to toggle it off
    if (tooltipWrapper.classList.contains('active')) {
      tooltipWrapper.classList.remove('active')
    } else {
      positionTooltip()
      tooltipWrapper.classList.add('active')
    }
  })

  // Close tooltip when clicking elsewhere on the page
  document.addEventListener('click', function (e) {
    if (!tooltipIcon.contains(e.target) && !tooltipWrapper.contains(e.target)) {
      tooltipWrapper.classList.remove('active')
    }
  })

  // Close tooltip when pressing Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      tooltipWrapper.classList.remove('active')
    }
  })

  // Update position on scroll or resize
  window.addEventListener(
    'scroll',
    function () {
      if (tooltipWrapper.classList.contains('active')) {
        positionTooltip()
      }
    },
    { passive: true }
  )

  window.addEventListener('resize', function () {
    if (tooltipWrapper.classList.contains('active')) {
      positionTooltip()
    }
  })

  return tooltipIcon
}

// Remove the addCustomTooltipStyles function, as styles will be in styles.css

// Usage of the custom tooltips
export function setupCustomTooltips() {
  // Remove any existing custom tooltips to prevent duplicates
  document.querySelectorAll('.custom-tooltip-icon').forEach((icon) => {
    const tooltipId = icon.getAttribute('data-tooltip-id')
    if (tooltipId) {
      const tooltipWrapper = document.querySelector(
        `.custom-tooltip-wrapper[data-tooltip-id="${tooltipId}"]`
      )
      if (tooltipWrapper) {
        tooltipWrapper.remove()
      }
    }
    icon.remove()
  })
}
