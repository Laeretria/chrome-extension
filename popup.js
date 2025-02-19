document.addEventListener('DOMContentLoaded', function () {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab-button')
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')

      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active')
      })

      const tabId = `${tab.dataset.tab}-tab`
      document.getElementById(tabId).classList.add('active')

      loadTabData(tab.dataset.tab)
    })
  })

  // Initial load of image data
  loadTabData('images')
})

async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js'],
    })
    console.log('Content script injected successfully')
  } catch (err) {
    console.log(
      'Content script injection error (might already be injected):',
      err
    )
  }
}

async function loadTabData(tabName) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]

    if (!currentTab) {
      throw new Error('No active tab found')
    }

    // Ensure content script is injected
    await ensureContentScriptInjected(currentTab.id)

    // Wait a short moment to ensure content script is ready
    await new Promise((resolve) => setTimeout(resolve, 100))

    const action = tabName === 'images' ? 'getImages' : 'getLinks'

    // Send message with timeout
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, { action: action }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message sending error:', chrome.runtime.lastError)
          reject(chrome.runtime.lastError)
        } else {
          resolve(response)
        }
      })
    })

    document.getElementById('loading').classList.add('hidden')

    if (tabName === 'images' && response && response.images) {
      updateImagesUI(response.images)
    } else if (tabName === 'links' && response) {
      updateLinksUI(response)
    }
  } catch (error) {
    console.error('Error in loadTabData:', error)
    document.getElementById('loading').textContent =
      'Error loading data. Please refresh the page and try again.'
  }
}

function updateImagesUI(images) {
  const totalImages = images.length
  const missingAlt = images.filter((img) => !img.alt).length

  document.getElementById('totalImages').textContent = totalImages
  document.getElementById('missingAlt').textContent = missingAlt

  const imageDetails = document.getElementById('imageDetails')
  imageDetails.innerHTML = ''

  images.forEach((img, index) => {
    const imageInfo = document.createElement('div')
    imageInfo.className = 'image-info'
    imageInfo.innerHTML = `
            <h3>Afbeelding ${index + 1}</h3>
            <p>Source: ${img.src}</p>
            <p>Alt Text: ${
              img.alt || '<span class="warning">Ontbreekt!</span>'
            }</p>
            <p>Afmetingen: ${img.width}x${img.height}</p>
        `
    imageDetails.appendChild(imageInfo)
  })
}

function updateLinksUI(response) {
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

function createLinkElement(link) {
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
            <a href="${link.href}" class="link-url" target="_blank">${
      link.href
    }</a>
            <div class="link-anchor">Anchor: ${link.text || 'No text'}</div>
            ${link.rel ? `<span class="link-rel">${link.rel}</span>` : ''}
        `
  }

  return div
}

function setupExportButtons(links) {
  document.getElementById('exportIncomplete').addEventListener('click', () => {
    const incompleteLinks = links.filter(
      (link) => !link.text || link.text.trim() === ''
    )
    exportLinks(incompleteLinks, 'incomplete-links.csv')
  })

  document.getElementById('exportComplete').addEventListener('click', () => {
    const completeLinks = links.filter(
      (link) => link.text && link.text.trim() !== ''
    )
    exportLinks(completeLinks, 'complete-links.csv')
  })
}

function exportLinks(links, filename) {
  const csvContent = [
    ['URL', 'Anchor Text', 'Type', 'Rel'],
    ...links.map((link) => [
      link.href,
      link.text || '',
      link.isInternal ? 'Internal' : 'External',
      link.rel || '',
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
