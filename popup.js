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
      updateImagesUI(response) // Update images and summary
    } else if (tabName === 'links' && response) {
      updateLinksUI(response)
    }
  } catch (error) {
    console.error('Error in loadTabData:', error)
    document.getElementById('loading').textContent =
      'Error loading data. Please refresh the page and try again.'
  }
}

function updateImagesUI(response) {
  const { images, summary } = response

  // Update metrics
  document.getElementById('totalImages').textContent = summary.total
  document.getElementById('missingAlt').textContent = summary.missingAlt
  document.getElementById('missingTitle').textContent = summary.missingTitle

  // Setup export buttons
  setupImageExportButtons(images)
}

function setupImageExportButtons(images) {
  document
    .getElementById('exportIncompleteImages')
    .addEventListener('click', () => {
      const incompleteImages = images.filter((img) => !img.alt || !img.title)
      exportImages(incompleteImages, 'incomplete-images.csv')
    })

  document
    .getElementById('exportCompleteImages')
    .addEventListener('click', () => {
      const completeImages = images.filter((img) => img.alt && img.title)
      exportImages(completeImages, 'complete-images.csv')
    })
}

function exportImages(images, filename) {
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
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
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
