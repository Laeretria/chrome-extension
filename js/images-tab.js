import { currentWebsiteDomain } from './domain-utils.js'
import { getTooltipManager } from './tooltips-exports.js'

export function updateImagesUI(response) {
  const { images, summary } = response
  // Update metrics
  document.getElementById('totalImages').textContent = summary.total
  document.getElementById('missingAlt').textContent = summary.missingAlt
  document.getElementById('missingTitle').textContent = summary.missingTitle

  // Setup highlight button
  setupHighlightButton(summary.missingAlt > 0)

  // Setup export buttons
  setupImageExportButtons(images)
}

// Add this new function for the highlight button functionality
function setupHighlightButton(hasMissingAlt) {
  const highlightBtn = document.getElementById('highlightMissingAlt')

  // If button doesn't exist, create it
  if (!highlightBtn) {
    console.error('Highlight button not found in the DOM')
    return
  }

  // Remove any existing event listeners
  const newHighlightBtn = highlightBtn.cloneNode(true)
  highlightBtn.parentNode.replaceChild(newHighlightBtn, highlightBtn)

  // Get tooltip manager instance
  const tooltipManager = getTooltipManager()

  // Disable button if there are no images missing alt text
  if (!hasMissingAlt) {
    newHighlightBtn.classList.add('disabled')
    newHighlightBtn.style.cursor = 'not-allowed'
    newHighlightBtn.style.opacity = '0.6'
    tooltipManager.attachToElement(
      newHighlightBtn,
      'Alle afbeeldingen hebben alt-tekst.'
    )
    return
  }

  // Variable to track highlight state
  let isHighlighted = false

  // Add click event listener
  newHighlightBtn.addEventListener('click', () => {
    isHighlighted = !isHighlighted

    // Send message to content script to toggle highlighting
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'highlightImagesWithNoAlt',
        highlight: isHighlighted,
      })
    })

    // Update button text based on state
    newHighlightBtn.textContent = isHighlighted
      ? 'Verwijder markering'
      : 'Markeer afbeeldingen zonder alt-tags'

    // Optional: change button style when active
    if (isHighlighted) {
      newHighlightBtn.classList.add('active-highlight')
    } else {
      newHighlightBtn.classList.remove('active-highlight')
    }
  })
}

export function setupImageExportButtons(images) {
  // Get tooltip manager instance
  const tooltipManager = getTooltipManager()

  // Remove any existing event listeners
  const exportIncompleteBtn = document.getElementById('exportIncompleteImages')
  const exportCompleteBtn = document.getElementById('exportCompleteImages')
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

  // Check if there are images with missing alt or title attributes
  const incompleteImages = images.filter((img) => !img.alt || !img.title)

  // Check if there are images with both alt and title attributes
  const completeImages = images.filter((img) => img.alt && img.title)

  // Set up tooltip for incomplete images button
  if (incompleteImages.length === 0) {
    newExportIncompleteBtn.classList.add('disabled')
    newExportIncompleteBtn.style.cursor = 'not-allowed'
    newExportIncompleteBtn.style.opacity = '0.6'
    // Attach tooltip to the disabled button
    tooltipManager.attachToElement(
      newExportIncompleteBtn,
      'Alle afbeeldingen hebben alt-tekst en titels.'
    )
  } else {
    newExportIncompleteBtn.addEventListener('click', () => {
      exportImages(
        incompleteImages,
        `${currentWebsiteDomain}_onvolledige-afbeeldingen.csv`
      )
    })
  }

  // Set up tooltip for complete images button
  if (completeImages.length === 0) {
    newExportCompleteBtn.classList.add('disabled')
    newExportCompleteBtn.style.cursor = 'not-allowed'
    newExportCompleteBtn.style.opacity = '0.6'
    // Attach tooltip to the disabled button
    tooltipManager.attachToElement(
      newExportCompleteBtn,
      'Er zijn geen afbeeldingen met zowel alt-tekst als titel. Controleer de onvolledige afbeeldingen om dit probleem op te lossen.'
    )
  } else {
    newExportCompleteBtn.addEventListener('click', () => {
      exportImages(
        completeImages,
        `${currentWebsiteDomain}_volledige-afbeeldingen.csv`
      )
    })
  }
}

export function exportImages(images, filename) {
  const csvContent = [
    ['Source', 'Alt Text', 'Title', 'Width', 'Height'],
    ...images.map((img) => [
      img.src,
      img.alt || '',
      img.title || '',
      img.width || '',
      img.height || '',
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
