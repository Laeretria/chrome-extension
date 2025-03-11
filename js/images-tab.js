import { currentWebsiteDomain } from './domain-utils.js'
import { getTooltipManager } from './tooltips-exports.js'

export function updateImagesUI(response) {
  const { images, summary } = response
  // Update metrics - kept untouched as requested
  document.getElementById('totalImages').textContent = summary.total
  document.getElementById('missingAlt').textContent = summary.missingAlt
  document.getElementById('missingTitle').textContent = summary.missingTitle

  // Setup highlight button
  setupHighlightButton(
    summary.missingAlt > 0,
    images.filter((img) => !img.alt)
  )

  // Setup export buttons
  setupImageExportButtons(images)
}

// Enhanced function for the highlight button functionality
function setupHighlightButton(hasMissingAlt, imagesWithNoAlt) {
  const highlightBtn = document.getElementById('highlightMissingAlt')
  const imageInfoContainer =
    document.getElementById('imageInfoContainer') || createImageInfoContainer()

  // If button doesn't exist, create it
  if (!highlightBtn) {
    console.error('Highlight button not found in the DOM')
    return
  }

  // Create empty state container
  createEmptyStateContainer(hasMissingAlt, highlightBtn)

  // Check if we're using the cloned button in the empty state container
  const highlightBtnClone = document.getElementById('highlightMissingAltClone')

  // Use the clone if it exists, otherwise use the original
  const btnToUse = highlightBtnClone || highlightBtn

  // Remove any existing event listeners by cloning
  const newHighlightBtn = btnToUse.cloneNode(true)
  btnToUse.parentNode.replaceChild(newHighlightBtn, btnToUse)

  // If we're working with the clone, make sure it maintains the clone ID
  if (highlightBtnClone) {
    newHighlightBtn.id = 'highlightMissingAltClone'
  }

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
    console.log('Button clicked, highlight state:', isHighlighted)

    // Update button text and style immediately for better user feedback
    updateButtonState()

    // Send message to content script to toggle highlighting
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found')
        return
      }

      console.log('Sending highlight message to tab:', tabs[0].id)

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: 'highlightImagesWithNoAlt',
          highlight: isHighlighted,
        },
        function (response) {
          if (chrome.runtime.lastError) {
            console.error(
              'Error messaging content script:',
              chrome.runtime.lastError
            )
            // Reset button state if there was an error
            isHighlighted = !isHighlighted
            updateButtonState()
            return
          }

          console.log('Got response from content script:', response)

          // If we got a valid response with actual data
          if (response && response.images) {
            console.log('Displaying info for', response.images.length, 'images')
            // Update the images info with the ones that were actually highlighted
            if (isHighlighted) {
              displayImagesInfo(imageInfoContainer, response.images)
            } else {
              // Hide image info when highlighting is turned off
              imageInfoContainer.innerHTML = ''
              imageInfoContainer.style.display = 'none'
            }
          }
        }
      )
    })

    // Helper function to update button appearance
    function updateButtonState() {
      newHighlightBtn.textContent = isHighlighted
        ? 'Verwijder markering'
        : 'Markeer afbeeldingen'

      if (isHighlighted) {
        newHighlightBtn.classList.add('active-highlight')
      } else {
        newHighlightBtn.classList.remove('active-highlight')
        // Hide images information when highlighting is removed
        imageInfoContainer.innerHTML = ''
        imageInfoContainer.style.display = 'none'
      }
    }
  })
}

// Create empty state container with specified styling and content
function createEmptyStateContainer(hasMissingAlt, highlightBtn) {
  // Remove existing empty state container if it exists
  const existingContainer = document.getElementById(
    'images-empty-state-container'
  )
  if (existingContainer) {
    existingContainer.remove()
  }

  // Create the empty state container
  const emptyStateContainer = document.createElement('div')
  emptyStateContainer.id = 'images-empty-state-container'
  emptyStateContainer.className = 'empty-state-container'

  // Create title element (outside the notice box)
  const title = document.createElement('h3')
  title.className = 'empty-state-title'
  title.textContent = 'Markeer afbeeldingen zonder alt-tags'
  title.style.textAlign = 'center'
  title.style.marginBottom = '15px'

  // Add the title to the container
  emptyStateContainer.appendChild(title)

  // Create notice content (styled like preview-notice from social.js)
  const noticeContent = document.createElement('div')
  noticeContent.className = 'preview-notice'
  noticeContent.innerHTML = `
    <div class="preview-notice-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <div class="preview-notice-text">
      <p class="empty-state-description">
        Klik op de knop om afbeeldingen zonder alt-tags te markeren die zichtbaar zijn op de pagina.
      </p>
    </div>
  `

  emptyStateContainer.appendChild(noticeContent)

  // Find the best location to insert the empty state container
  const imagesTab = document.getElementById('images-tab')

  if (imagesTab) {
    // Try to find the structure list container
    const structureList =
      imagesTab.querySelector('.structure-list') ||
      imagesTab.querySelector('.tab-content') ||
      imagesTab

    // Append the empty state container to the structure list
    structureList.appendChild(emptyStateContainer)

    // If the highlight button exists
    if (highlightBtn) {
      // Clone the button to avoid any existing event handlers
      const buttonClone = highlightBtn.cloneNode(true)

      // Add the cloned button to the empty state container
      emptyStateContainer.appendChild(buttonClone)

      // Hide the original button (we'll keep it in the DOM to avoid other JS errors)
      highlightBtn.style.display = 'none'

      // Style the cloned button
      buttonClone.style.display = 'block'
      buttonClone.style.margin = '15px auto'
      buttonClone.id = 'highlightMissingAltClone'
    }
  }

  // Add necessary CSS for the empty state
  const style = document.createElement('style')
  style.textContent = `
    .empty-state-container {
      text-align: center;
      background: white;
      padding: 16px;
      border-radius: 8px;
      margin: 0px;
      border: 1px solid #eee;
    }
    
    .preview-notice {
      display: flex;
      align-items: center;
      background-color: #fff8e6;
      border-left: 4px solid #ffc107;
      padding: 10px 15px;
      border-radius: 8px;
      text-align: left;
    }
    
    .preview-notice-icon {
      margin-right: 10px;
      color: #ffc107;
      display: flex;
      align-items: center;
    }
    
    .empty-state-title {
      margin-bottom: 0.5rem;
      color: black;
      font-size: 16px;
      margin-top: 0px !important;
      padding: 0px !important;
      color: var(--title-color);
    }
    
    .empty-state-description {
      margin-bottom: 0;
      margin-top: 0 !important;
      color: #495057;
      line-height: 1.5;
      font-size: 14px;
      padding: 0 !important;
      font-family: 'Regola-Regular';
    }
  `

  document.head.appendChild(style)

  return emptyStateContainer
}

// Create a container for displaying image information
function createImageInfoContainer() {
  const container = document.createElement('div')
  container.id = 'imageInfoContainer'
  container.style.display = 'none'
  container.style.width = '100%'
  container.style.clear = 'both'

  // Find the proper parent where we should insert the container
  const highlightBtn = document.getElementById('highlightMissingAlt')

  if (highlightBtn) {
    // Find the parent container that should hold our image info
    let parentContainer = highlightBtn.parentNode

    // Navigate up to find appropriate container
    while (
      parentContainer &&
      parentContainer.tagName === 'DIV' &&
      parentContainer.children.length <= 2
    ) {
      if (parentContainer.parentNode) {
        parentContainer = parentContainer.parentNode
      } else {
        break
      }
    }

    // Insert the container after the parent container
    if (parentContainer && parentContainer.parentNode) {
      parentContainer.parentNode.insertBefore(
        container,
        parentContainer.nextSibling
      )
    } else {
      // Fallback: just insert after the button itself
      highlightBtn.parentNode.insertBefore(container, highlightBtn.nextSibling)
    }
  } else {
    // Fallback: add to the images tab content
    const imagesTab = document.getElementById('images-tab')
    if (imagesTab) {
      imagesTab.appendChild(container)
    }
  }

  return container
}

// Display information about images with no alt text in a grid layout
function displayImagesInfo(container, imagesWithoutAlt) {
  if (!container || !imagesWithoutAlt || imagesWithoutAlt.length === 0) return

  container.innerHTML = ''
  container.style.display = 'block'

  // Filter to show only visible images
  const visibleImagesWithoutAlt = imagesWithoutAlt.filter(
    (img) => img.isVisible !== false
  )

  // Create heading
  const heading = document.createElement('h3')
  heading.textContent = `Afbeeldingen zichtbaar  (${visibleImagesWithoutAlt.length})`
  heading.style.fontSize = '16px'
  heading.style.paddingLeft = '16px'
  container.appendChild(heading)

  heading.classList.add('custom-heading')

  // Create grid container
  const grid = document.createElement('div')
  grid.className = 'images-grid'
  grid.style.display = 'grid'
  grid.style.gridTemplateColumns = 'repeat(2, 1fr)'
  grid.style.gap = '20px'
  grid.style.marginTop = '10px'
  grid.style.margin = '16px'

  // Add only visible images to the grid
  visibleImagesWithoutAlt.forEach((img) => {
    const imgContainer = document.createElement('div')
    imgContainer.className = 'image-container'
    imgContainer.style.border = '1px solid #ddd'
    imgContainer.style.borderRadius = '8px'
    imgContainer.style.padding = '16px'
    imgContainer.style.backgroundColor = '#f9f9f9'
    imgContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'

    // Image container header - for filename
    const imgHeader = document.createElement('div')
    imgHeader.style.marginBottom = '12px'
    imgHeader.style.paddingBottom = '8px'
    imgHeader.style.fontSize = '14px'

    // Extract just the filename from the path
    const urlParts = img.src.split('/')
    const filename = urlParts[urlParts.length - 1]

    const filenameEl = document.createElement('strong')
    filenameEl.textContent = 'Bestand: '

    const filenameValue = document.createElement('span')
    filenameValue.textContent = filename
    filenameValue.style.wordBreak = 'break-all'

    imgHeader.appendChild(filenameEl)
    imgHeader.appendChild(filenameValue)

    // Create thumbnail container - to center the image
    const thumbnailContainer = document.createElement('div')
    thumbnailContainer.style.textAlign = 'center'
    thumbnailContainer.style.backgroundColor = '#fff'
    thumbnailContainer.style.height = '80px'
    thumbnailContainer.style.display = 'flex'
    thumbnailContainer.style.alignItems = 'center'
    thumbnailContainer.style.justifyContent = 'center'
    thumbnailContainer.style.marginBottom = '12px'
    thumbnailContainer.style.border = '1px solid #eee'
    thumbnailContainer.style.borderRadius = '4px'

    // Create thumbnail
    const thumbnail = document.createElement('img')
    thumbnail.src = img.src
    thumbnail.alt = 'Afbeelding zonder alt-tekst'
    thumbnail.style.maxWidth = '90%'
    thumbnail.style.maxHeight = '80px'
    thumbnail.style.objectFit = 'contain'

    thumbnailContainer.appendChild(thumbnail)

    // Create source info
    const sourceInfo = document.createElement('div')
    sourceInfo.className = 'image-source'
    sourceInfo.style.fontSize = '12px'
    sourceInfo.style.lineHeight = '1.6'

    // Create dimensions info if available
    if (img.width || img.height) {
      const dimensionsInfo = document.createElement('div')
      dimensionsInfo.className = 'image-dimensions'
      dimensionsInfo.style.marginBottom = '8px'

      const dimensionsLabel = document.createElement('strong')
      dimensionsLabel.textContent = 'Afmetingen: '

      const dimensionsValue = document.createElement('span')
      dimensionsValue.textContent = `${img.width || '?'}×${
        img.height || '?'
      } px`

      dimensionsInfo.appendChild(dimensionsLabel)
      dimensionsInfo.appendChild(dimensionsValue)
      sourceInfo.appendChild(dimensionsInfo)
    }

    // Create URL info
    const urlLabel = document.createElement('strong')
    urlLabel.textContent = 'Volledige URL: '

    const urlValue = document.createElement('span')
    urlValue.textContent = img.src
    urlValue.style.color = '#666'
    urlValue.style.fontSize = '10px'
    urlValue.style.wordBreak = 'break-all'
    urlValue.style.display = 'block'
    urlValue.style.marginTop = '4px'

    const urlContainer = document.createElement('div')
    urlContainer.appendChild(urlLabel)
    urlContainer.appendChild(urlValue)
    sourceInfo.appendChild(urlContainer)

    // Add elements to container
    imgContainer.appendChild(imgHeader)
    imgContainer.appendChild(thumbnailContainer)
    imgContainer.appendChild(sourceInfo)
    grid.appendChild(imgContainer)
  })

  container.appendChild(grid)
}

// Keep the original export functions exactly as they were
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
