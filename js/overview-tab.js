export async function updateOverviewUI(overview) {
  // SEO recommendation constants
  const SEO_LIMITS = {
    title: {
      min: 30,
      recommended: 50,
      max: 60,
    },
    description: {
      min: 120,
      recommended: 155,
      max: 160,
    },
  }

  // Helper function to validate and set appropriate class
  function validateCharacterCount(count, element, type) {
    element.textContent = `${count} tekens`

    // Remove any existing status classes
    element.classList.remove('count-good', 'count-warning', 'count-error')

    const limits = SEO_LIMITS[type]

    if (count >= limits.min && count <= limits.max) {
      // Within recommended range - green
      element.classList.add('count-good')
    } else if (count < limits.min) {
      // Below minimum - red
      element.classList.add('count-error')
    } else if (count > limits.max) {
      // Above maximum - red
      element.classList.add('count-error')
    }
  }

  // Update title section
  document.getElementById('page-title').textContent = overview.title.content
  const titleCountElement = document
    .querySelector('#page-title')
    .previousElementSibling.querySelector('.character-count')
  validateCharacterCount(overview.title.length, titleCountElement, 'title')

  // Update description section
  const descriptionElement = document.getElementById('page-description')
  descriptionElement.textContent = overview.description.content || 'Ontbreekt'

  // Mark missing descriptions with red text
  if (!overview.description.content) {
    descriptionElement.classList.add('missing')
  } else {
    descriptionElement.classList.remove('missing')
  }

  const descriptionCountElement = document
    .querySelector('#page-description')
    .previousElementSibling.querySelector('.character-count')
  validateCharacterCount(
    overview.description.length,
    descriptionCountElement,
    'description'
  )

  // Update URL section and make it clickable
  const urlElement = document.getElementById('page-url')
  urlElement.textContent = overview.url.current

  // Make URL clickable
  urlElement.classList.add('clickable-link')
  urlElement.addEventListener('click', () => {
    chrome.tabs.create({ url: overview.url.current })
  })

  const urlStatusElement = document
    .querySelector('#page-url')
    .previousElementSibling.querySelector('.meta-status')
  urlStatusElement.textContent = overview.url.isIndexable
    ? 'Indexeerbaar'
    : 'Niet-indexeerbaar'
  urlStatusElement.className = `meta-status ${
    overview.url.isIndexable ? 'indexable' : 'non-indexable'
  }`

  // Update canonical section and make it clickable
  const canonicalElement = document.getElementById('page-canonical')
  canonicalElement.textContent = overview.canonical.href

  // Make canonical link clickable
  if (overview.canonical.href) {
    canonicalElement.classList.add('clickable-link')
    canonicalElement.addEventListener('click', () => {
      chrome.tabs.create({ url: overview.canonical.href })
    })
  }

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
