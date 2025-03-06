import { currentWebsiteDomain } from './domain-utils.js'
import { getTooltipManager } from './tooltips-exports.js'
import { addScrollToTopToSEOTool } from './scroll-to-top.js'

export function updateLinksUI(response) {
  if (!response || !response.metrics) {
    console.error('Invalid response format:', response)
    return
  }

  const { metrics } = response

  // Update metrics
  document.getElementById('totalLinks').textContent = metrics.total
  document.getElementById('uniqueLinks').textContent = metrics.unique
  document.getElementById('internalLinks').textContent = metrics.totalInternal
  document.getElementById('externalLinks').textContent = metrics.totalExternal

  // Add click event listeners to metric elements for scrolling
  // Call this after DOM is updated with link lists
  setupMetricScrolling()

  // Initialize the scroll to top button if it hasn't been done yet
  addScrollToTopToSEOTool()

  // Update link lists
  const internalList = document.getElementById('internalLinksList')
  const externalList = document.getElementById('externalLinksList')
  internalList.innerHTML = ''
  externalList.innerHTML = ''

  metrics.uniqueLinks.forEach((link) => {
    const linkElement = createLinkElement(link)
    if (link.isInternal) {
      internalList.appendChild(linkElement)
    } else {
      externalList.appendChild(linkElement)
    }
  })

  // Add export functionality
  setupExportButtons(metrics.uniqueLinks)
}

// New function to set up scrolling functionality
function setupMetricScrolling() {
  // Get individual metric elements by ID
  const internalLinksElement = document.getElementById('internalLinks')
  const externalLinksElement = document.getElementById('externalLinks')

  // Make internal links metric clickable
  if (internalLinksElement) {
    internalLinksElement.style.cursor = 'pointer'

    // Add click event listener
    internalLinksElement.addEventListener('click', () => {
      // Try multiple possible selectors for internal links section
      const internalSection =
        document.getElementById('internalLinksList') ||
        document.querySelector('.interne-links') ||
        document.querySelector('.internal-links') ||
        document.querySelector('[data-section="internal"]')

      if (internalSection) {
        // Scroll to the section
        internalSection.scrollIntoView({ behavior: 'smooth' })
      } else {
        console.error('Could not find internal links section to scroll to')
      }
    })

    // Add tooltip to indicate clickability
    const tooltipManager = getTooltipManager()
    tooltipManager.attachToElement(
      internalLinksElement,
      'Klik om naar interne links te scrollen'
    )
  }

  // Make external links metric clickable
  if (externalLinksElement) {
    externalLinksElement.style.cursor = 'pointer'

    // Add click event listener
    externalLinksElement.addEventListener('click', () => {
      // Try multiple possible selectors for external links section
      const externalSection =
        document.getElementById('externalLinksList') ||
        document.querySelector('.externe-links') ||
        document.querySelector('.external-links') ||
        document.querySelector('[data-section="external"]')

      if (externalSection) {
        // Scroll to the section
        externalSection.scrollIntoView({ behavior: 'smooth' })
      } else {
        console.error('Could not find external links section to scroll to')
      }
    })

    // Add tooltip to indicate clickability
    const tooltipManager = getTooltipManager()
    tooltipManager.attachToElement(
      externalLinksElement,
      'Klik om naar externe links te scrollen'
    )
  }
}

export function createLinkElement(link) {
  const div = document.createElement('div')
  div.className = 'link-item'

  // Handle undefined href
  if (link.href === 'Undefined (No href attribute)') {
    div.innerHTML = `
        <div class="undefined-link">Undefined (No href attribute)</div>
        <div class="link-anchor">Anchor: ${link.text || 'No text'}</div>
      `
  } else {
    div.innerHTML = `
        <a href="${link.href}" class="link-url" target="_blank">${link.href}</a>
        <div class="link-anchor">Anchor: ${link.text || 'No text'}</div>
      `
  }

  return div
}

export function setupExportButtons(links) {
  // Get tooltip manager instance
  const tooltipManager = getTooltipManager()

  // Remove any existing event listeners
  const exportIncompleteBtn = document.getElementById('exportIncomplete')
  const exportCompleteBtn = document.getElementById('exportComplete')
  const newExportIncompleteBtn = exportIncompleteBtn.cloneNode(true)
  const newExportCompleteBtn = exportCompleteBtn.cloneNode(true)

  exportIncompleteBtn.parentNode.replaceChild(
    newExportIncompleteBtn,
    exportIncompleteBtn
  )
  exportCompleteBtn.parentNode.replaceChild(
    newExportCompleteBtn,
    exportCompleteBtn
  )

  // Check if there are links with missing anchor text
  const incompleteLinks = links.filter(
    (link) => !link.text || link.text.trim() === ''
  )

  // Check if there are links with anchor text
  const completeLinks = links.filter(
    (link) => link.text && link.text.trim() !== ''
  )

  // Set up tooltip for incomplete links button
  if (incompleteLinks.length === 0) {
    newExportIncompleteBtn.classList.add('disabled')
    newExportIncompleteBtn.style.cursor = 'not-allowed'
    newExportIncompleteBtn.style.opacity = '0.6'

    // Attach tooltip to the disabled button
    tooltipManager.attachToElement(
      newExportIncompleteBtn,
      'Alle links hebben ankertekst.'
    )
  } else {
    newExportIncompleteBtn.addEventListener('click', () => {
      exportLinks(
        incompleteLinks,
        `${currentWebsiteDomain}_onvolledige-links.csv`
      )
    })
  }

  // Set up tooltip for complete links button
  if (completeLinks.length === 0) {
    newExportCompleteBtn.classList.add('disabled')
    newExportCompleteBtn.style.cursor = 'not-allowed'
    newExportCompleteBtn.style.opacity = '0.6'

    // Attach tooltip to the disabled button
    tooltipManager.attachToElement(
      newExportCompleteBtn,
      'Er zijn geen links met ankertekst gevonden. Controleer de onvolledige links om de navigatie te verbeteren.'
    )
  } else {
    newExportCompleteBtn.addEventListener('click', () => {
      exportLinks(completeLinks, `${currentWebsiteDomain}_volledige-links.csv`)
    })
  }
}

export function exportLinks(links, filename) {
  const csvContent = [
    ['URL', 'Anchor Text', 'Type', 'Rel'],
    ...links.map((link) => [
      link.href,
      link.text || '',
      link.isInternal ? 'Internal' : 'External',
      link.rel || '',
    ]),
  ]
    .map((row) => row.join(';'))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
