document.addEventListener('DOMContentLoaded', function () {
  // Your existing tab code
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

  // Add logo click handler
  const logoLink = document.getElementById('logo-link')
  if (logoLink) {
    // Use a one-time event listener to prevent multiple tabs opening
    logoLink.addEventListener(
      'click',
      function logoClickHandler(e) {
        e.preventDefault()
        chrome.tabs.create({ url: 'https://kreatix.be' })
        // Remove the event listener to prevent duplicate clicks
        logoLink.removeEventListener('click', logoClickHandler)
      },
      { once: true }
    )
  }

  // Start with overview tab
  loadTabData('overview')
})

async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js'],
    })
  } catch (err) {}
}

async function loadTabData(tabName) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]

    if (!currentTab) {
      throw new Error('No active tab found')
    }

    await ensureContentScriptInjected(currentTab.id)
    await new Promise((resolve) => setTimeout(resolve, 100))

    let action
    switch (tabName) {
      case 'overview':
        action = 'getOverview'
        break
      case 'images':
        action = 'getImages'
        break
      case 'links':
        action = 'getLinks'
        break
      case 'headings':
        action = 'getHeadings'
        // Setup footer links with current domain
        const url = new URL(currentTab.url)
        setupFooterLinks(`${url.protocol}//${url.hostname}`)
        break
      default:
        action = 'getOverview'
    }

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, { action: action }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(response)
        }
      })
    })

    document.getElementById('loading').classList.add('hidden')

    switch (tabName) {
      case 'overview':
        if (response && response.overview) {
          updateOverviewUI(response.overview)
        }
        break
      case 'images':
        if (response && response.images) {
          updateImagesUI(response)
        }
        break
      case 'links':
        if (response) {
          updateLinksUI(response)
        }
        break
      case 'headings':
        if (response) {
          updateHeadingsUI(response)
        }
        break
    }
  } catch (error) {
    document.getElementById('loading').textContent =
      'Error loading data. Please refresh the page and try again.'
  }
}
async function updateOverviewUI(overview) {
  // Update title section
  document.getElementById('page-title').textContent = overview.title.content
  document
    .querySelector('#page-title')
    .previousElementSibling.querySelector(
      '.character-count'
    ).textContent = `${overview.title.length} tekens`

  // Update description section
  document.getElementById('page-description').textContent =
    overview.description.content || 'Ontbreekt'
  document
    .querySelector('#page-description')
    .previousElementSibling.querySelector(
      '.character-count'
    ).textContent = `${overview.description.length} tekens`

  // Update URL section
  document.getElementById('page-url').textContent = overview.url.current
  const urlStatusElement = document
    .querySelector('#page-url')
    .previousElementSibling.querySelector('.meta-status')
  urlStatusElement.textContent = overview.url.isIndexable
    ? 'Indexeerbaar'
    : 'Niet-indexeerbaar'
  urlStatusElement.className = `meta-status ${
    overview.url.isIndexable ? 'indexable' : 'non-indexable'
  }`

  // Update canonical section
  document.getElementById('page-canonical').textContent =
    overview.canonical.href
  const canonicalStatusElement = document
    .querySelector('#page-canonical')
    .previousElementSibling.querySelector('.meta-status')
  canonicalStatusElement.textContent = overview.canonical.isSelfReferencing
    ? 'Self-referencing'
    : 'Extern'
  canonicalStatusElement.className = `meta-status ${
    overview.canonical.isSelfReferencing ? 'self-referencing' : ''
  }`

  // Update robots tag
  document.getElementById('robots-tag').textContent =
    overview.robots.meta || 'Ontbreekt'
  if (!overview.robots.meta) {
    document.getElementById('robots-tag').classList.add('missing')
  }

  // Update keywords
  document.getElementById('keywords').textContent =
    overview.keywords || 'Ontbreekt'
  if (!overview.keywords) {
    document.getElementById('keywords').classList.add('missing')
  }

  // Update word count
  document.getElementById('word-count').textContent =
    overview.wordCount.toLocaleString()

  // Update publisher
  document.getElementById('publisher').textContent =
    overview.publisher || 'Ontbreekt'
  if (!overview.publisher) {
    document.getElementById('publisher').classList.add('missing')
  }

  // Update language
  document.getElementById('language').textContent =
    overview.language || 'Ontbreekt'
  if (!overview.language) {
    document.getElementById('language').classList.add('missing')
  }

  // Get headings data for the footer
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]

    const headingsResponse = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: 'getHeadings' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response)
          }
        }
      )
    })

    // Update heading counts in overview
    if (headingsResponse && headingsResponse.counts) {
      for (let i = 1; i <= 6; i++) {
        const countElement = document.getElementById(`overview-h${i}-count`)
        if (countElement) {
          countElement.textContent = headingsResponse.counts[`h${i}`] || 0
        }
      }

      // Update images and links counts
      document.getElementById('overview-images').textContent =
        headingsResponse.summary.totalImages || 0
      document.getElementById('overview-links').textContent =
        headingsResponse.summary.totalLinks || 0
    }

    // Setup footer links
    const url = new URL(currentTab.url)
    const domain = `${url.protocol}//${url.hostname}`

    const robotsLink = document.getElementById('overview-robotsLink')
    const sitemapLink = document.getElementById('overview-sitemapLink')

    if (robotsLink) {
      robotsLink.href = `${domain}/robots.txt`
      robotsLink.addEventListener('click', async (e) => {
        e.preventDefault()
        chrome.tabs.create({
          url: `${domain}/robots.txt`,
          index: currentTab.index + 1,
        })
      })
    }

    if (sitemapLink) {
      sitemapLink.href = `${domain}/sitemap_index.xml`
      sitemapLink.addEventListener('click', async (e) => {
        e.preventDefault()
        chrome.tabs.create({
          url: `${domain}/sitemap_index.xml`,
          index: currentTab.index + 1,
        })
      })
    }
  } catch (error) {
    console.error('Error updating overview footer:', error)
  }
}

function updateHeadingsUI(response) {
  const { counts, structure, summary } = response

  // Update heading count statistics
  for (let i = 1; i <= 6; i++) {
    const countElement = document.getElementById(`h${i}-count`)
    if (countElement) {
      countElement.textContent = counts[`h${i}`] || 0
    }

    // Also update the overview tab stats if they exist
    const overviewCountElement = document.getElementById(`overview-h${i}-count`)
    if (overviewCountElement) {
      overviewCountElement.textContent = counts[`h${i}`] || 0
    }
  }

  // Update images and links counts
  const linksElement = document.getElementById('headingsPageLinks')
  const imagesElement = document.getElementById('headingsPageImages')

  if (linksElement) linksElement.textContent = summary.totalLinks || 0
  if (imagesElement) imagesElement.textContent = summary.totalImages || 0

  // Update the headings structure list
  const structureList = document.getElementById('headingsStructure')
  if (structureList) {
    structureList.innerHTML = ''

    // Display all headings in DOM order with proper indentation
    structure.forEach((heading) => {
      const headingDiv = document.createElement('div')
      headingDiv.className = 'heading-item'
      headingDiv.setAttribute('data-level', heading.level)

      const tagSpan = document.createElement('span')
      tagSpan.className = 'heading-tag'
      tagSpan.textContent = `H${heading.level}`

      /*       // Set tag color based on heading level
      const colors = {
        1: '#e9f5ff', // Light blue
        2: '#e3f1e3', // Light green
        3: '#fff8e1', // Light yellow
        4: '#f3e5f5', // Light purple
        5: '#e8eaf6', // Light indigo
        6: '#fbe9e7', // Light orange
      }
      tagSpan.style.backgroundColor = colors[heading.level] || '#f5f5f5' */

      // Add navigation indicator if heading is part of navigation
      if (heading.isNavigation) {
        tagSpan.style.borderLeft = '3px solid #1448ff'
      }

      const textSpan = document.createElement('span')
      textSpan.className = 'heading-text'
      textSpan.textContent = heading.text

      headingDiv.appendChild(tagSpan)
      headingDiv.appendChild(textSpan)
      structureList.appendChild(headingDiv)
    })
  }

  // Update the copy button functionality
  const copyButton = document.getElementById('copyHeadings')
  if (copyButton) {
    // Remove any existing click handlers to prevent duplicates
    const newCopyButton = copyButton.cloneNode(true)
    copyButton.parentNode.replaceChild(newCopyButton, copyButton)

    newCopyButton.addEventListener('click', () => {
      // Format headings with perfect left alignment
      const headingsText = structure
        .map((heading) => {
          const tagPart = `H${heading.level}: `
          return tagPart + heading.text
        })
        .join('\n')

      navigator.clipboard.writeText(headingsText).then(() => {
        newCopyButton.textContent = 'Gekopieërd'
        setTimeout(() => {
          newCopyButton.textContent = 'Kopiëren'
        }, 2000)
      })
    })
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
      <a href="${link.href}" class="link-url" target="_blank">${link.href}</a>
      <div class="link-anchor">Anchor: ${link.text || 'No text'}</div>
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

function setupFooterLinks(currentDomain) {
  const robotsLink = document.getElementById('robotsLink')
  const sitemapLink = document.getElementById('sitemapLink')

  if (robotsLink) {
    robotsLink.href = `${currentDomain}/robots.txt`
    robotsLink.addEventListener('click', async (e) => {
      e.preventDefault()
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      chrome.tabs.create({
        url: `${currentDomain}/robots.txt`,
        index: tabs[0].index + 1,
      })
    })
  }

  if (sitemapLink) {
    sitemapLink.href = `${currentDomain}/sitemap_index.xml`
    sitemapLink.addEventListener('click', async (e) => {
      e.preventDefault()
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      chrome.tabs.create({
        url: `${currentDomain}/sitemap_index.xml`,
        index: tabs[0].index + 1,
      })
    })
  }
}
