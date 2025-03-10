import { currentWebsiteDomain } from './domain-utils.js'
import { getTooltipManager } from './tooltips-exports.js'

export function updateImagesUI(response) {
  const { images, summary } = response
  // Update metrics
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
      // Show images information when highlighted
      displayImagesInfo(imageInfoContainer, imagesWithNoAlt)
    } else {
      newHighlightBtn.classList.remove('active-highlight')
      // Hide images information when highlighting is removed
      imageInfoContainer.innerHTML = ''
      imageInfoContainer.style.display = 'none'
    }
  })
}

// Create a container for displaying image information
function createImageInfoContainer() {
  const container = document.createElement('div')
  container.id = 'imageInfoContainer'
  container.style.display = 'none'
  container.style.marginTop = '20px'
  container.style.width = '100%'
  container.style.clear = 'both'

  // Find the proper parent where we should insert the container
  // First, try to find the highlight button
  const highlightBtn = document.getElementById('highlightMissingAlt')

  if (highlightBtn) {
    // Find the parent container that should hold our image info
    // This is likely the metrics container or a parent div that contains the button
    let parentContainer = highlightBtn.parentNode

    // If the parent is just a div that holds the button, get its parent
    // Often buttons are in a button container, and we want to add after that container
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
function displayImagesInfo(container, imagesWithNoAlt) {
  if (!container || !imagesWithNoAlt || imagesWithNoAlt.length === 0) return

  container.innerHTML = ''
  container.style.display = 'block'

  // Create heading
  const heading = document.createElement('h3')
  heading.textContent = 'Afbeeldingen zonder alt-tekst'
  heading.style.fontSize = '16px'
  heading.style.marginBottom = '20px'
  heading.style.marginTop = '20px'
  heading.style.paddingLeft = '16px'
  container.appendChild(heading)

  // Create grid container
  const grid = document.createElement('div')
  grid.className = 'images-grid'
  grid.style.display = 'grid'
  grid.style.gridTemplateColumns = 'repeat(2, 1fr)'
  grid.style.gap = '20px'
  grid.style.marginTop = '10px'
  grid.style.margin = '16px'

  // Add each image to the grid
  imagesWithNoAlt.forEach((img) => {
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
