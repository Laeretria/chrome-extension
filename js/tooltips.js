export const tooltipData = {
  title: {
    text: 'Dit is de tekst die wordt weergegeven in het browsertabblad en vaak in de koppen van zoekresultaten (soms herschrijft Google ze). De huidige maximale lengte die volledig wordt weergegeven in zoekresultaten is ongeveer 65 tekens of 568 pixels.',
    link: 'https://kreatix.be/blog/meta-title-seo',
  },
  description: {
    text: 'Een korte tekst die een pagina samenvat. Hoewel niet cruciaal, is een ideale lengte tussen de 70 en 155 tekens.',
    link: 'https://kreatix.be/blog/meta-description-seo',
  },
  url: {
    text: 'De URL van de pagina waarop je je momenteel bevindt. URL staat voor Uniform Resource Locator.',
    link: 'https://kreatix.be/blog/url-structure-seo',
  },
  canonical: {
    text: "Een canonical tag vertelt zoekmachines zoals Google wat de 'voorkeurs-' of 'hoofd-' URL van een pagina moet zijn.",
    link: 'https://kreatix.be/blog/canonical-tags-seo',
  },
  robotsTag: {
    text: "De robots-meta tag vertelt zoekmachines of ze je pagina moeten indexeren en de links moeten volgen. Veelvoorkomende waarden zijn 'index,follow', 'noindex,follow' en 'noindex,nofollow'.",
    link: 'https://kreatix.be/blog/robots-meta-tags',
  },
  xRobotsTag: {
    text: "De X-Robots-Tag is een HTTP-header die dezelfde richtlijnen biedt als de robots-meta tag, maar kan worden toegepast op niet-HTML-documenten zoals PDF's.",
    link: 'https://kreatix.be/blog/x-robots-tag',
  },
  wordCount: {
    text: 'Het totale aantal woorden op je pagina. Hoewel er geen perfect aantal woorden is, presteert uitgebreide content vaak beter in zoekresultaten voor informatieve zoekopdrachten.',
    link: 'https://kreatix.be/blog/content-length-seo',
  },
  language: {
    text: 'De opgegeven taal van de pagina.',
    link: 'https://kreatix.be/blog/language-settings-seo',
  },
  indexable: {
    text: 'Deze pagina kan worden geïndexeerd door zoekmachines zoals Google, wat betekent dat deze kan verschijnen in zoekresultaten.',
    link: 'https://kreatix.be/blog/indexing-seo',
  },
  nonIndexable: {
    text: 'Deze pagina kan niet worden geïndexeerd door zoekmachines en zal niet verschijnen in zoekresultaten.',
    link: 'https://kreatix.be/blog/noindex-seo',
  },
  selfReferencing: {
    text: 'De canonical URL verwijst naar dezelfde pagina, wat aangeeft dat dit de oorspronkelijke/hoofdversie van de content is.',
    link: 'https://kreatix.be/blog/canonical-tags-seo',
  },
  external: {
    text: 'De canonical URL verwijst naar een andere pagina, wat aangeeft dat dit niet de oorspronkelijke/hoofdversie van de content is.',
    link: 'https://kreatix.be/blog/canonical-tags-seo',
  },
  missingCanonical: {
    text: 'Er is geen canonical tag gevonden op deze pagina. Het toevoegen van een canonical tag helpt zoekmachines begrijpen welke URL de geprefereerde versie van deze pagina is.',
    link: 'https://kreatix.be/blog/canonical-tags-seo',
  },
}

// Improved helper function with better hover behavior
export function addTooltipToElement(element, tooltipInfo) {
  console.log('Adding tooltip to element:', element.textContent.trim())

  // First, check if tooltip already exists
  let nextSibling = element.nextSibling
  while (nextSibling) {
    if (
      nextSibling.classList &&
      nextSibling.classList.contains('tooltip-icon')
    ) {
      // Tooltip already exists, don't add another one
      return
    }
    nextSibling = nextSibling.nextSibling
  }

  // Create the tooltip icon
  const tooltipIcon = document.createElement('button')
  tooltipIcon.type = 'button'
  tooltipIcon.className = 'tooltip-icon'
  tooltipIcon.setAttribute('aria-label', 'More information')
  tooltipIcon.textContent = '?'

  // Position it after the element
  element.insertAdjacentElement('afterend', tooltipIcon)

  // Create a wrapper for the tooltip that will be appended to body
  const tooltipWrapper = document.createElement('div')
  tooltipWrapper.className = 'tooltip-wrapper'

  // Create the tooltip content container
  const tooltipContent = document.createElement('div')
  tooltipContent.className = 'tooltip-content'
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
  const tooltipId = 'tooltip-' + Date.now()
  tooltipIcon.setAttribute('data-tooltip-id', tooltipId)
  tooltipWrapper.setAttribute('data-tooltip-id', tooltipId)

  // Function to position the tooltip
  function positionTooltip() {
    const rect = tooltipIcon.getBoundingClientRect()

    // Position to the right of the icon by default
    tooltipWrapper.style.top = rect.top - 10 + 'px'
    tooltipWrapper.style.left = rect.right + 10 + 'px'

    // Remove the arrow-right class by default (arrow points left)
    tooltipContent.classList.remove('arrow-right')

    // Check if tooltip would extend beyond right edge of viewport
    const tooltipRect = tooltipContent.getBoundingClientRect()
    if (rect.right + 10 + tooltipRect.width > window.innerWidth) {
      // Position to the left of the icon if it would overflow
      tooltipWrapper.style.left = 'auto'
      tooltipWrapper.style.right = window.innerWidth - rect.left + 10 + 'px'

      // Add class to flip the arrow (arrow points right)
      tooltipContent.classList.add('arrow-right')
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

// Updated setupTooltips function to clean up previous tooltips properly
export function setupTooltips() {
  console.log('Setting up tooltips...')

  // Remove any existing tooltips to prevent duplicates
  document.querySelectorAll('.tooltip-icon').forEach((icon) => {
    const tooltipId = icon.getAttribute('data-tooltip-id')
    if (tooltipId) {
      const tooltipWrapper = document.querySelector(
        `.tooltip-wrapper[data-tooltip-id="${tooltipId}"]`
      )
      if (tooltipWrapper) {
        tooltipWrapper.remove()
      }
    }
    icon.remove()
  })

  // Add tooltips to meta items
  document.querySelectorAll('.meta-item .meta-header').forEach((header) => {
    const titleElement = header.querySelector('span')
    if (!titleElement) return

    const titleText = titleElement.textContent.trim().toLowerCase()
    console.log('Found meta header:', titleText)

    // Map titleText to tooltipData key
    let tooltipKey
    if (titleText.includes('titel')) tooltipKey = 'title'
    else if (titleText.includes('beschrijving')) tooltipKey = 'description'
    else if (titleText.includes('url')) tooltipKey = 'url'
    else if (titleText.includes('canonical')) tooltipKey = 'canonical'

    if (tooltipKey && tooltipData[tooltipKey]) {
      addTooltipToElement(titleElement, tooltipData[tooltipKey])
    }
  })

  // Add tooltips to info items
  document.querySelectorAll('.info-item .info-header').forEach((header) => {
    const titleElement = header.querySelector('span')
    if (!titleElement) return

    const titleText = titleElement.textContent.trim().toLowerCase()
    console.log('Found info header:', titleText)

    // Map titleText to tooltipData key
    let tooltipKey
    if (titleText.includes('robots tag')) tooltipKey = 'robotsTag'
    else if (titleText.includes('x-robots-tag')) tooltipKey = 'xRobotsTag'
    else if (titleText.includes('woorden')) tooltipKey = 'wordCount'
    else if (titleText.includes('taal')) tooltipKey = 'language'

    if (tooltipKey && tooltipData[tooltipKey]) {
      addTooltipToElement(titleElement, tooltipData[tooltipKey])
    }
  })

  console.log('Tooltip setup complete')
}
