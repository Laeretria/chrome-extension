// Store the current domain globally so it's accessible to all export functions
let currentWebsiteDomain = ''

const tooltipData = {
  title: {
    text: 'This is what shows as the text in your browser tab, and often in your page headings in search results (sometimes Google rewrite them). The current maximum that will display fully on search results is around 65 characters, or 568 pixels.',
    link: 'https://kreatix.be/blog/meta-title-seo',
  },
  description: {
    text: "Meta descriptions summarize your page's content for search results. While not a direct ranking factor, a compelling description can improve click-through rates. Google may generate its own description instead of using yours.",
    link: 'https://kreatix.be/blog/meta-description-seo',
  },
  url: {
    text: 'Your page URL structure helps users and search engines understand what the page is about. A good URL is concise, descriptive, and contains relevant keywords.',
    link: 'https://kreatix.be/blog/url-structure-seo',
  },
  canonical: {
    text: 'The canonical tag tells search engines which version of a URL to index when there are multiple pages with similar content. It helps prevent duplicate content issues.',
    link: 'https://kreatix.be/blog/canonical-tags-seo',
  },
  robotsTag: {
    text: "The robots meta tag tells search engines whether to index your page and follow its links. Common values include 'index,follow', 'noindex,follow', and 'noindex,nofollow'.",
    link: 'https://kreatix.be/blog/robots-meta-tags',
  },
  xRobotsTag: {
    text: 'X-Robots-Tag is an HTTP header that provides the same directives as the robots meta tag, but can be applied to non-HTML documents like PDFs.',
    link: 'https://kreatix.be/blog/x-robots-tag',
  },
  wordCount: {
    text: "The total number of words on your page. While there's no perfect word count, comprehensive content tends to perform better in search results for informational queries.",
    link: 'https://kreatix.be/blog/content-length-seo',
  },
  language: {
    text: "The language declared for this page via the HTML lang attribute. This helps search engines understand the page's language.",
    link: 'https://kreatix.be/blog/language-settings-seo',
  },
}

// Function to extract domain name in a clean format for filenames
function getCleanDomainName(url) {
  try {
    const urlObj = new URL(url)
    // Remove www. prefix if present and get hostname
    let fullDomain = urlObj.hostname.replace(/^www\./, '')

    // Extract just the first part of the domain (before the first dot)
    let mainDomain = fullDomain.split('.')[0]

    return mainDomain
  } catch (error) {
    console.error('Error parsing URL:', error)
    return 'website' // Fallback name
  }
}

// Initialize current domain - call this early in your code
async function initCurrentDomain() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs && tabs[0] && tabs[0].url) {
      const url = tabs[0].url
      currentWebsiteDomain = getCleanDomainName(url)
      console.log('Current website domain:', currentWebsiteDomain)
    }
  } catch (error) {
    console.error('Error getting current domain:', error)
    currentWebsiteDomain = 'website' // Fallback
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  // Initialize current domain first
  await initCurrentDomain()

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

  // New code for sitemap functionality
  try {
    // Get the current tab's URL
    const chromeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    if (chromeTabs && chromeTabs[0] && chromeTabs[0].url) {
      const url = new URL(chromeTabs[0].url)
      const currentDomain = url.origin // This gets the protocol, hostname, and port

      // Setup the footer links with the current domain
      await setupFooterLinks(currentDomain)
    }
  } catch (error) {
    console.error('Error setting up footer links:', error)
  }

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
          setTimeout(setupTooltips, 200)
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

  // Update word count
  document.getElementById('word-count').textContent =
    overview.wordCount.toLocaleString()

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

// Function to set up all tooltips in the overview section
function setupTooltips() {
  // Add tooltips to meta items
  document.querySelectorAll('.meta-item .meta-header').forEach((header) => {
    const titleElement = header.querySelector('span')
    if (!titleElement) return

    const titleText = titleElement.textContent.trim().toLowerCase()

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

      // Set tag color based on heading level
      const colors = {
        1: '#e9f5ff', // Light blue
        2: '#e3f1e3', // Light green
        3: '#fff8e1', // Light yellow
        4: '#f3e5f5', // Light purple
        5: '#e8eaf6', // Light indigo
        6: '#fbe9e7', // Light orange
      }
      tagSpan.style.backgroundColor = colors[heading.level] || '#f5f5f5'

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

  // Add export button for headings
  const exportHeadingsButton = document.getElementById('exportHeadings')
  if (exportHeadingsButton) {
    // Remove any existing click handlers
    const newExportButton = exportHeadingsButton.cloneNode(true)
    exportHeadingsButton.parentNode.replaceChild(
      newExportButton,
      exportHeadingsButton
    )

    newExportButton.addEventListener('click', () => {
      exportHeadings(structure, `${currentWebsiteDomain}_headings.csv`)
    })
  }
}

function exportHeadings(headings, filename) {
  const csvContent = [
    ['Level', 'Text', 'ID', 'Classes', 'Is Navigation'],
    ...headings.map((heading) => [
      `H${heading.level}`,
      heading.text || '',
      heading.id || '',
      heading.classes || '',
      heading.isNavigation ? 'Yes' : 'No',
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

  newExportIncompleteBtn.addEventListener('click', () => {
    const incompleteImages = images.filter((img) => !img.alt || !img.title)
    exportImages(
      incompleteImages,
      `${currentWebsiteDomain}_incomplete-images.csv`
    )
  })

  newExportCompleteBtn.addEventListener('click', () => {
    const completeImages = images.filter((img) => img.alt && img.title)
    exportImages(completeImages, `${currentWebsiteDomain}_complete-images.csv`)
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

  newExportIncompleteBtn.addEventListener('click', () => {
    const incompleteLinks = links.filter(
      (link) => !link.text || link.text.trim() === ''
    )
    exportLinks(incompleteLinks, `${currentWebsiteDomain}_incomplete-links.csv`)
  })

  newExportCompleteBtn.addEventListener('click', () => {
    const completeLinks = links.filter(
      (link) => link.text && link.text.trim() !== ''
    )
    exportLinks(completeLinks, `${currentWebsiteDomain}_complete-links.csv`)
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

// Utility function to fetch robots.txt and extract sitemap URLs
async function getSitemapFromRobots(domain) {
  try {
    const response = await fetch(`${domain}/robots.txt`)
    const text = await response.text()

    // Look for Sitemap: directives in robots.txt
    const sitemapMatches = text.match(/^Sitemap:\s*(.+)$/gim)
    if (sitemapMatches && sitemapMatches.length > 0) {
      // Extract URLs from all Sitemap: directives
      return sitemapMatches.map((match) => {
        return match.replace(/^Sitemap:\s*/i, '').trim()
      })
    }

    return []
  } catch (error) {
    console.error('Error fetching robots.txt:', error)
    return []
  }
}

// Function to check if a URL exists (returns HTTP status)
async function checkUrlExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.status
  } catch (error) {
    console.error('Error checking URL:', error)
    return 404
  }
}

// Function to find working sitemap URL
async function findSitemapUrl(domain) {
  // First try to get sitemap from robots.txt
  const sitemapsFromRobots = await getSitemapFromRobots(domain)
  if (sitemapsFromRobots.length > 0) {
    // Return the first valid sitemap URL from robots.txt
    for (const url of sitemapsFromRobots) {
      const status = await checkUrlExists(url)
      if (status >= 200 && status < 400) {
        return url
      }
    }
  }

  // Get any sitemaps found in the page content via content script
  const sitemapsInPage = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getSitemapInfo' },
        (response) => {
          if (
            response &&
            response.foundSitemaps &&
            response.foundSitemaps.length > 0
          ) {
            resolve(response.foundSitemaps)
          } else {
            resolve([])
          }
        }
      )
    })
  })

  // Check each sitemap from the page
  for (const url of sitemapsInPage) {
    const status = await checkUrlExists(url)
    if (status >= 200 && status < 400) {
      return url
    }
  }

  // Common sitemap filename patterns to try
  const sitemapPatterns = [
    '/sitemap_index.xml',
    '/sitemap.xml',
    '/sitemap-index.xml',
    '/sitemapindex.xml',
    '/wp-sitemap.xml', // WordPress
    '/sitemap.php', // Some CMS systems
  ]

  // Check each pattern
  for (const pattern of sitemapPatterns) {
    const url = `${domain}${pattern}`
    const status = await checkUrlExists(url)
    if (status >= 200 && status < 400) {
      return url
    }
  }

  // Default fallback
  return `${domain}/sitemap.xml`
}

// Updated setupFooterLinks function
async function setupFooterLinks(currentDomain) {
  const robotsLink = document.getElementById('robotsLink')
  const sitemapLink = document.getElementById('sitemapLink')
  const sitemapLoader = document.getElementById('sitemapLoader')

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
    // Show loading indicator or disable link until we find the sitemap
    if (sitemapLoader) sitemapLoader.style.display = 'inline'
    sitemapLink.classList.add('loading')

    try {
      // Find the actual sitemap URL
      const sitemapUrl = await findSitemapUrl(currentDomain)

      // Update the link with the found URL
      sitemapLink.href = sitemapUrl
      console.log('Found sitemap URL:', sitemapUrl)

      sitemapLink.addEventListener('click', async (e) => {
        e.preventDefault()
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })
        chrome.tabs.create({
          url: sitemapUrl,
          index: tabs[0].index + 1,
        })
      })
    } catch (error) {
      console.error('Error finding sitemap:', error)
      // In case of error, set a default sitemap URL
      sitemapLink.href = `${currentDomain}/sitemap.xml`
    } finally {
      // Hide loader in all cases
      if (sitemapLoader) sitemapLoader.style.display = 'none'
      sitemapLink.classList.remove('loading')
    }
  }
}
